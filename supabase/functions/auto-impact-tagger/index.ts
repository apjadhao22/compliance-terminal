// Supabase Edge Function: auto-impact-tagger
// Phase 5: Auto-Impact Tagger (part of scraping pipeline)
// Do not modify previous phases

import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  const { document_id, affected_headcount_min, affected_headcount_max, industry_tags, compliance_deadline, state } = await req.json();
  await supabase.from('documents').update({
    affected_headcount_min,
    affected_headcount_max,
    industry_tags,
    compliance_deadline,
    state,
  }).eq('id', document_id);
  return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } });
});
