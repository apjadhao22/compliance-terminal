// Supabase Edge Function: rag-chat
// Phase 5: RAG backend for compliance chatbot (Deno/Supabase Edge Function)
// Do not modify previous phases

import { serve } from "std/server";

const SYSTEM_PROMPT = `You are a compliance expert assistant for Indian businesses. Answer questions based on the provided document context. Always cite the exact Act name, Section number, and source. If the user is logged in, personalize answers based on their company profile. Never fabricate legal information.`;

serve(async (req) => {
  const { query, userId } = await req.json();
  const OPENAI_API_KEY = Deno.env.get("VITE_OPENAI_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  // 1. Generate embedding for query
  const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: query,
    }),
  });
  const embeddingData = await embeddingRes.json();
  const queryEmbedding = embeddingData.data[0].embedding;

  // 2. Vector similarity search (pgvector via Supabase HTTP RPC)
  const matchRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_documents_by_embedding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      query_embedding: queryEmbedding,
      match_threshold: 0.78,
      match_count: 5,
    }),
  });
  const docs = await matchRes.json();
  const context = docs.map((d: any) => d.text).join("\n---\n");

  // 3. Call OpenAI with context
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: `Context:\n${context}\n\nUser: ${query}${userId ? `\nProfile: ${userId}` : ''}` },
  ];
  const answerRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages,
      temperature: 0.2,
      max_tokens: 512,
    }),
  });
  const answerData = await answerRes.json();
  return new Response(JSON.stringify({
    answer: answerData.choices[0].message.content,
    sources: docs.map((d: any) => ({ title: d.title, url: d.source_url })),
  }), {
    headers: { "Content-Type": "application/json" },
  });
});
