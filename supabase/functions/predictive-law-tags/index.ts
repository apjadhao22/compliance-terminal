// Supabase Edge Function: predictive-law-tags
// Phase 5: Predictive Law Change Tags (weekly cron)
// Do not modify previous phases

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async () => {
  // 1. Get all acts
  const { data: acts, error: actsError } = await supabase.from('documents').select('act_name').neq('act_name', null).group('act_name');
  if (actsError) return new Response(JSON.stringify({ error: actsError.message }), { status: 500 });

  for (const act of acts) {
    // 2. Count amendments in last 12 months
    const { count, error } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('act_name', act.act_name)
      .eq('is_amendment', true)
      .gte('published_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
    if (error) continue;
    if ((count ?? 0) >= 3) {
      // 3. Tag all documents of this act
      await supabase.from('documents').update({ predictive_tag: 'Likely to change soon' }).eq('act_name', act.act_name);
    }
  }
  return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } });
});
