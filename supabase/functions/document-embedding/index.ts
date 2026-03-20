// Supabase Edge Function: document-embedding
// Generates embeddings via Jina AI and stores them in the documents table

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function generateEmbedding(text: string): Promise<number[]> {
  const key = Deno.env.get("JINA_API_KEY");
  if (!key) throw new Error("JINA_API_KEY is not set");

  const res = await fetch("https://api.jina.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "jina-embeddings-v3",
      input: [text],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Jina AI error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const { document_id, text } = await req.json();

    if (!document_id || !text) {
      return new Response(
        JSON.stringify({ error: "document_id and text are required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const embedding = await generateEmbedding(text);

    const { error } = await supabase
      .from("documents")
      .update({ embedding })
      .eq("id", document_id);

    if (error) throw new Error(`Supabase update error: ${error.message}`);

    return new Response(
      JSON.stringify({ status: "ok" }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
