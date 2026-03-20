import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

export const OPENROUTER_HEADERS: Record<string, string> = {
  "Authorization": "Bearer " + Deno.env.get("OPENROUTER_API_KEY"),
  "HTTP-Referer": "https://compliance-terminal.app",
  "X-Title": "ComplianceTerminal",
  "Content-Type": "application/json",
};

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export async function callEdgeFunction(name: string, body: any): Promise<any> {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/${name}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return response.json();
}

export async function isAlreadyScraped(url: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("documents")
    .select("id")
    .eq("source_url", url)
    .limit(1);
  if (error) return false;
  return data !== null && data.length > 0;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Jina Reader ───────────────────────────────────────────────────────────────

export async function jinaFetch(url: string): Promise<string> {
  const jinaKey = Deno.env.get("JINA_API_KEY") ?? "";
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: {
      "Authorization": `Bearer ${jinaKey}`,
      "Accept": "text/plain",
      "X-Return-Format": "markdown",
    },
  });
  if (!res.ok) throw new Error(`Jina fetch failed ${res.status} for ${url}`);
  return res.text();
}

// Jina Search API — returns results in format:
// [N] Title: TITLE
// [N] URL Source: URL
// [N] Description: TEXT
// Use when listing pages are JS-rendered and jinaFetch returns empty content
export async function jinaSearch(query: string): Promise<string> {
  const jinaKey = Deno.env.get("JINA_API_KEY") ?? "";
  const res = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
    headers: {
      "Authorization": `Bearer ${jinaKey}`,
      "Accept": "text/plain",
      "X-Return-Format": "markdown",
    },
  });
  if (!res.ok) throw new Error(`Jina search failed ${res.status}`);
  return res.text();
}

// Parse Jina Search results into structured objects
export function parseJinaSearchResults(md: string): Array<{ title: string; url: string; description: string }> {
  const results: Array<{ title: string; url: string; description: string }> = [];
  const blocks = md.split(/(?=\[\d+\] Title:)/);
  for (const block of blocks) {
    const titleMatch = /Title:\s*(.+)/i.exec(block);
    const urlMatch = /URL Source:\s*(https?:\/\/\S+)/i.exec(block);
    const descMatch = /Description:\s*(.+)/i.exec(block);
    if (titleMatch && urlMatch) {
      results.push({
        title: titleMatch[1].trim(),
        url: urlMatch[1].trim(),
        description: descMatch ? descMatch[1].trim() : "",
      });
    }
  }
  return results;
}

// ── RSS Utilities ─────────────────────────────────────────────────────────────

export interface RssItem {
  title: string;
  url: string;
  description: string;
  pubDate: string;
}

function extractTag(block: string, tag: string): string {
  // Try CDATA: <tag><![CDATA[...]]></tag>
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i").exec(block);
  if (cdata) return cdata[1].trim();
  // Plain: <tag>...</tag>
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(block);
  return plain ? plain[1].trim() : "";
}

export async function fetchPibRssItems(filterKeywords: string[] = []): Promise<RssItem[]> {
  const res = await fetch("https://pib.gov.in/newsite/rssenglish.aspx", {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ComplianceBot/1.0)" },
  });
  const xml = await res.text();

  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const url = extractTag(block, "link");
    const description = extractTag(block, "description");
    const pubDate = extractTag(block, "pubDate");
    if (!title || !url) continue;
    items.push({ title, url, description, pubDate });
  }

  if (filterKeywords.length === 0) return items;
  const lower = filterKeywords.map((k) => k.toLowerCase());
  return items.filter((item) => {
    const text = `${item.title} ${item.description}`.toLowerCase();
    return lower.some((kw) => text.includes(kw));
  });
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

export async function runPipeline(params: {
  title: string;
  url: string;
  rawText: string;
  sourceName: string;
  state: string;
  documentType: string;
}): Promise<void> {
  const { title, url, rawText, sourceName, state, documentType } = params;

  // Step a: Translate
  const translationResult = await callEdgeFunction("translation-pipeline", { text: rawText });
  const translated: string = translationResult.translated;

  // Step b: Summarize
  const summarizationResult = await callEdgeFunction("ai-summarization", { text: translated });
  const summary = summarizationResult.summary;

  // Step c: Parse summary JSON safely
  let summaryObj: any = {};
  try {
    summaryObj = typeof summary === "string" ? JSON.parse(summary) : (summary ?? {});
    if (!summaryObj || typeof summaryObj !== "object") summaryObj = {};
  } catch (_e) {
    summaryObj = {};
  }

  // Step d & e: Insert into documents table
  const { data: inserted, error: insertError } = await supabase
    .from("documents")
    .insert({
      title,
      source_url: url,
      original_text: rawText,
      translated_text: translated,
      source_name: sourceName,
      state,
      document_type: documentType,
      ai_summary: summaryObj.summary || "",
      affected_industries: summaryObj.affected_industries || [],
      urgency: summaryObj.urgency || "medium",
      impact_score: summaryObj.impact_score || 5,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Failed to insert document:", insertError);
    return;
  }

  const insertedId = inserted.id;

  // Step f: Generate embedding
  await callEdgeFunction("document-embedding", { document_id: insertedId, text: translated });

  // Step g: Match to profiles
  await callEdgeFunction("match-documents-to-profiles", { document_url: url });
}
