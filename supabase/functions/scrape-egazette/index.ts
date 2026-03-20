import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jinaSearch, parseJinaSearchResults, jinaFetch, runPipeline, sleep, isAlreadyScraped, CORS_HEADERS } from "../_shared/pipeline.ts";

const SEARCH_QUERY = "India official gazette notification egazette.gov.in 2025";
const SOURCE_NAME = "eGazette of India";
const STATE = "central";
const DOC_TYPE = "gazette";

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
      try { rawText = (await jinaFetch(item.url)).slice(0, 8000); } catch (_e) {}
      await runPipeline({ title: item.title.slice(0, 200), url: item.url, rawText, sourceName: SOURCE_NAME, state: STATE, documentType: DOC_TYPE });
      processed++;
      await sleep(3500);
    }
    return new Response(JSON.stringify({ status: "ok", processed }), { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
  }
});
