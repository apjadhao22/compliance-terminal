// Supabase Edge Function: ai-summarization
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are a compliance expert. Read this Indian government document and return a JSON object with exactly these fields:
- "summary": a 3-sentence plain-English summary (string)
- "affected_industries": list of affected industries (array of strings)
- "urgency": urgency level, one of: critical, high, medium, low (string)
- "impact_score": impact score from 1 to 10 (number)
- "affected_headcount_min": minimum headcount this applies to, use -1 for universal (number)
- "affected_headcount_max": maximum headcount this applies to, use -1 for universal (number)

Return only valid JSON, no markdown, no extra text.`;

async function summarizeDocument(text: string) {
  const apiKey = Deno.env.get("GOOGLE_AI_API_KEY")!;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\n" + text }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024
        },
      }),
    }
  );

  const data = await res.json();

  // Validate Gemini response structure
  const part = data.candidates?.[0]?.content?.parts?.[0];
  if (!part || typeof part.text !== "string") {
    throw new Error(`Gemini format error: ${JSON.stringify(data)}`);
  }

  let content = part.text;

  // Strip markdown fences if present
  content = content.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();

  // Try parsing JSON; if it fails, show exactly what failed
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`JSON parse failed: ${(e as Error).message}. Raw: "${content}"`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS_HEADERS });
  }

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'text' parameter" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }

    const summary = await summarizeDocument(text);
    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("ai-summarization error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }
});
