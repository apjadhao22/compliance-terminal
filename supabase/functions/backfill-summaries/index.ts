import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function callSummarize(text: string): Promise<any> {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-summarization`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  try {
    const { data: emptyDocs, error } = await supabase
      .from("documents")
      .select("id, translated_text")
      .eq("ai_summary", "");  // ← fixed: empty string match

    if (error) throw new Error(`DB fetch error: ${JSON.stringify(error)}`);

    const total = emptyDocs.length;
    let updated = 0;
    let failed = 0;

    for (const doc of emptyDocs) {
      const text = doc.translated_text || "";
      if (!text) { failed++; continue; }

      const result = await callSummarize(text);
      const s = result?.summary;

      if (!s || !s.summary) { failed++; continue; }

      const { error: updateError } = await supabase
        .from("documents")
        .update({
          ai_summary: s.summary || "",
          affected_industries: s.affected_industries || [],
          urgency: s.urgency || "medium",
          impact_score: s.impact_score || 5,
        })
        .eq("id", doc.id);

      if (updateError) { failed++; continue; }
      updated++;
    }

    return new Response(
      JSON.stringify({ total, updated, failed }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
