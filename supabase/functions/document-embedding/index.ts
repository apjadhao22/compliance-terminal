// Supabase Edge Function: document-embedding
// Phase 5: Generate and store OpenAI embeddings for RAG chatbot
// Do not modify previous phases

import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENAI_API_KEY = Deno.env.get('VITE_OPENAI_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function generateEmbedding(text: string) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    })
  });
  const data = await res.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  const { document_id, text } = await req.json();
  const embedding = await generateEmbedding(text);
  await supabase.from('documents').update({ embedding }).eq('id', document_id);
  return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } });
});
