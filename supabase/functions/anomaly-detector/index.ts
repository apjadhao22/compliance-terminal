// Supabase Edge Function: anomaly-detector
// Phase 5: Enforcement spike detection (6-hour cron)
// Do not modify previous phases

import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async () => {
  // 1. Get all sources
  const { data: sources, error: srcErr } = await supabase.from('documents').select('source').neq('source', null).group('source');
  if (srcErr) return new Response(JSON.stringify({ error: srcErr.message }), { status: 500 });

  for (const src of sources) {
    // 2. Count documents per source in last 48h
    const { count, error } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('source', src.source)
      .gte('published_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());
    if (error) continue;
    if ((count ?? 0) >= 5) {
      // 3. Insert special alert in user_alerts
      await supabase.from('user_alerts').insert({
        alert_type: 'enforcement_spike',
        message: `Enforcement Drive Detected: ${src.source} published ${count} docs in 48h`,
        channels: ['push'],
        is_read: false,
      });
    }
  }
  return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } });
});
