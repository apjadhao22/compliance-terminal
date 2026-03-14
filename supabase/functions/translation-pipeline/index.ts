// Supabase Edge Function: translation-pipeline
// Phase 5: Translation Engine using Google Cloud Translation API
// Do not modify previous phases

import { serve } from 'std/server';

const GOOGLE_API_KEY = Deno.env.get('VITE_GOOGLE_TRANSLATE_API_KEY')!;

async function detectLanguage(text: string) {
  const res = await fetch(`https://translation.googleapis.com/language/translate/v2/detect?key=${GOOGLE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text })
  });
  const data = await res.json();
  return data.data.detections[0][0];
}

async function translateText(text: string, source: string, target = 'en') {
  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source, target, format: 'text' })
  });
  const data = await res.json();
  return data.data.translations[0].translatedText;
}

// Legal glossary override (do not translate these terms)
const LEGAL_TERMS = [
  'सरकारी राजपत्र', 'अधिसूचना', 'परिपत्र', 'ಸರ್ಕಾರಿ ಗೆಜೆಟ್', // Add more per language
];

function overrideLegalTerms(text: string): string {
  for (const term of LEGAL_TERMS) {
    text = text.replace(new RegExp(term, 'g'), term);
  }
  return text;
}

serve(async (req) => {
  const { text } = await req.json();
  const detection = await detectLanguage(text);
  let translated = text;
  let confidence = detection.confidence;
  if (detection.language !== 'en') {
    translated = await translateText(text, detection.language, 'en');
    translated = overrideLegalTerms(translated);
  }
  return new Response(JSON.stringify({
    detected_language: detection.language,
    confidence,
    translated,
  }), { headers: { 'Content-Type': 'application/json' } });
});
