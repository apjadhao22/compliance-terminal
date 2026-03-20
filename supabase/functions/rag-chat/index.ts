// Supabase Edge Function: rag-chat
// RAG backend for compliance chatbot using Jina AI embeddings and OpenRouter chat

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const SYSTEM_PROMPT =
  "You are a compliance expert assistant for Indian businesses. Answer questions based on the provided document context. Always cite the exact Act name, Section number, and source. Never fabricate legal information.";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, userId } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Missing required field: query" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1 — Query embedding via Jina AI
    const jinaRes = await fetch("https://api.jina.ai/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("JINA_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "jina-embeddings-v3",
        input: [query],
      }),
    });

    if (!jinaRes.ok) {
      const err = await jinaRes.text();
      throw new Error(`Jina embedding failed (${jinaRes.status}): ${err}`);
    }

    const jinaData = await jinaRes.json();
    const queryEmbedding = jinaData.data[0].embedding;

    // Step 2 — Vector search via Supabase RPC
    const { data: docs, error: rpcError } = await supabase.rpc(
      "match_documents_by_embedding",
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.78,
        match_count: 5,
      }
    );

    if (rpcError) {
      throw new Error(`Vector search failed: ${rpcError.message}`);
    }

    const context = (docs ?? []).map((d: any) => d.text).join("\n---\n");

    // Step 3 — Generate answer via OpenRouter
    const openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENROUTER_API_KEY")}`,
        "HTTP-Referer": "https://compliance-terminal.app",
        "X-Title": "ComplianceTerminal",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Context:\n${context}\n\n---\n\nQuestion: ${query}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 512,
      }),
    });

    if (!openrouterRes.ok) {
      const err = await openrouterRes.text();
      throw new Error(`OpenRouter chat failed (${openrouterRes.status}): ${err}`);
    }

    const openrouterData = await openrouterRes.json();
    const answer = openrouterData.choices[0].message.content;

    const sources = (docs ?? []).map((d: any) => ({
      title: d.title,
      url: d.source_url,
    }));

    return new Response(
      JSON.stringify({ answer, sources }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("rag-chat error:", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
