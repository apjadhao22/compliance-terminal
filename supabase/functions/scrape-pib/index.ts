import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jinaSearch, jinaFetch, runPipeline, sleep, isAlreadyScraped, CORS_HEADERS } from "../_shared/pipeline.ts";

const SEARCH_QUERY = "site:pib.gov.in labour employment EPF ESI GST tax compliance wage factory 2025";

// Parse Jina Search results format:
// [N] Title: TITLE
// [N] URL Source: URL
// [N] Description: TEXT
function parseJinaSearchResults(md: string): Array<{ title: string; url: string; description: string }> {
  const results: Array<{ title: string; url: string; description: string }> = [];
  // Split by result blocks — each starts with [N]
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: CORS_HEADERS });
  try {
    const searchMd = await jinaSearch(SEARCH_QUERY);
    const results = parseJinaSearchResults(searchMd);

    const seen = new Set<string>();
    const unique = results.filter(r => { if (seen.has(r.url)) return false; seen.add(r.url); return true; });
    const toProcess = unique.slice(0, 10);
    let processed = 0;

    for (const item of toProcess) {
      if (await isAlreadyScraped(item.url)) continue;
      let rawText = item.description || item.title;
      try { rawText = (await jinaFetch(item.url)).slice(0, 8000); } catch (_e) { /* use description */ }
      await runPipeline({
        title: item.title.slice(0, 200),
        url: item.url,
        rawText,
        sourceName: "PIB",
        state: "central",
        documentType: "press_release",
      });
      processed++;
      await sleep(3500);
    }

    return new Response(JSON.stringify({ status: "ok", processed }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }
});
