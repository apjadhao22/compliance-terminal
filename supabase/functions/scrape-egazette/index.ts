// Supabase Edge Function: scrape-egazette
// Phase 5: Scraping Pipeline for eGazette of India
// Do not modify previous phases

import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';
import playwright from 'playwright';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper: Check if document already exists
async function isAlreadyScraped(url: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('documents')
    .select('id')
    .eq('source_url', url)
    .maybeSingle();
  return !!data;
}

// Helper: Insert new document
async function insertDocument(doc: any) {
  await supabase.from('documents').insert([doc]);
}

// Main scraping logic
async function scrapeEgazette() {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://egazette.gov.in/');
  // Example: Selectors and logic will need to be customized for real site structure
  const links = await page.$$eval('a', as => as.map(a => ({ href: a.href, text: a.textContent })));
  for (const link of links) {
    if (!link.href || !link.text) continue;
    if (await isAlreadyScraped(link.href)) continue;
    await page.goto(link.href);
    const fullText = await page.evaluate(() => document.body.innerText);
    // 3. Detect language & translate
    const translationRes = await fetch('http://localhost:54321/functions/v1/translation-pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: fullText })
    });
    const translation = await translationRes.json();
    // 4. AI summarization
    const aiRes = await fetch('http://localhost:54321/functions/v1/ai-summarization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: translation.translated })
    });
    const ai = await aiRes.json();
    // 5. Embedding
    const embedRes = await fetch('http://localhost:54321/functions/v1/document-embedding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: null, text: translation.translated })
    });
    const embedding = (await embedRes.json()).embedding;
    // 6. Auto-tag (call auto-impact-tagger if needed)
    // Parse AI summary JSON
    let aiData = {};
    try { aiData = JSON.parse(ai.summary); } catch {}
    const doc = {
      title: link.text.trim().slice(0, 200),
      source_url: link.href,
      original_text: fullText,
      translated_text: translation.translated,
      translation_confidence: translation.confidence > 0.9 ? 'high' : translation.confidence > 0.7 ? 'medium' : 'low',
      ai_summary: aiData["1"] || '',
      affected_industries: aiData["2"] ? aiData["2"].split(',').map((s: string) => s.trim()) : [],
      urgency: aiData["3"] || 'medium',
      impact_score: aiData["4"] ? parseInt(aiData["4"], 10) : 5,
      affected_headcount_min: aiData["5"] && Array.isArray(aiData["5"]) ? aiData["5"][0] : -1,
      affected_headcount_max: aiData["5"] && Array.isArray(aiData["5"]) ? aiData["5"][1] : -1,
      embedding,
      published_at: new Date().toISOString(),
      state: 'central',
      category: 'labour', // or infer from AI/category logic
    };
    await insertDocument(doc);
    // Optionally call auto-impact-tagger here if more tagging needed
    // 8. Trigger match-documents-to-profiles webhook
    await fetch('http://localhost:54321/functions/v1/match-documents-to-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_url: link.href })
    });
  }
  await browser.close();
}

serve(async (req) => {
  await scrapeEgazette();
  return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } });
});
