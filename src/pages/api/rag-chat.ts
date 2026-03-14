// API route: /api/rag-chat
// Phase 5: RAG backend for compliance chatbot
// Do not modify previous phases

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SYSTEM_PROMPT = `You are a compliance expert assistant for Indian businesses. Answer questions based on the provided document context. Always cite the exact Act name, Section number, and source. If the user is logged in, personalize answers based on their company profile. Never fabricate legal information.`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query, user } = req.body;
  // 1. Generate embedding for query
  const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: query,
    })
  });
  const embeddingData = await embeddingRes.json();
  const queryEmbedding = embeddingData.data[0].embedding;
  // 2. Vector similarity search (pgvector)
  const { data: docs } = await supabase.rpc('match_documents_by_embedding', {
    query_embedding: queryEmbedding,
    match_threshold: 0.78,
    match_count: 5,
  });
  // 3. Prepare context
  const context = docs.map((d: any) => d.text).join('\n---\n');
  // 4. Call OpenAI with context
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Context:\n${context}\n\nUser: ${query}${user ? `\nProfile: ${JSON.stringify(user.liabilityProfile)}` : ''}` },
  ];
  const answerRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages,
      temperature: 0.2,
      max_tokens: 512,
    })
  });
  const answerData = await answerRes.json();
  res.status(200).json({
    answer: answerData.choices[0].message.content,
    sources: docs.map((d: any) => ({ title: d.title, url: d.source_url })),
  });
}
