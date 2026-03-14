// Supabase Edge Function: ai-summarization
// Phase 5: AI Summarization Pipeline (OpenAI/DeepSeek)
// Do not modify previous phases

import { serve } from 'std/server';

const OPENAI_API_KEY = Deno.env.get('VITE_OPENAI_API_KEY')!;

const SYSTEM_PROMPT = `You are a compliance expert. Read this Indian government document and generate: 1) A 3-sentence plain-English summary, 2) A comma-separated list of affected industries, 3) The urgency level (critical/high/medium/low), 4) An impact score 1–10, 5) The minimum and maximum headcount this applies to (-1 for universal). Return as JSON.`;

async function summarizeDocument(text: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
      max_tokens: 512,
    })
  });
  const data = await res.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  const { text } = await req.json();
  const summary = await summarizeDocument(text);
  return new Response(JSON.stringify({ summary }), { headers: { 'Content-Type': 'application/json' } });
});
