import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isLikelyEnglish(text: string): boolean {
  let asciiChars = 0;
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) < 128) {
      asciiChars++;
    }
  }
  return asciiChars / text.length > 0.90;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'text' field in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isLikelyEnglish(text)) {
      return new Response(
        JSON.stringify({ translated: text, detected_language: "en", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://compliance-terminal.app",
        "X-Title": "ComplianceTerminal",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen3-4b:free",
        messages: [
          {
            role: "system",
            content: "You are a translation assistant. Translate the user's text to English. Return ONLY the translated text with no commentary, explanations, or additional text.",
          },
          {
            role: "user",
            content: text,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return new Response(
        JSON.stringify({ error: "OpenRouter API error", details: errorBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const translated = data.choices?.[0]?.message?.content?.trim() ?? "";

    return new Response(
      JSON.stringify({ translated, detected_language: "auto-detected" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
