// Supabase Edge Function: anomaly-detector
// Phase 5: Enforcement spike detection (6-hour cron)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Use RPC to get per-source document counts over the last 48 hours
    const { data: sourceCounts, error: rpcErr } = await supabase.rpc('get_source_counts_since', { hours_back: 48 });
    if (rpcErr) {
      return new Response(
        JSON.stringify({ error: rpcErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let spikesDetected = 0;

    for (const row of (sourceCounts ?? [])) {
      if ((row.count ?? 0) >= 5) {
        await supabase.from('user_alerts').insert({
          alert_type: 'enforcement_spike',
          message: `Enforcement Drive Detected: ${row.source} published ${row.count} docs in 48h`,
          channels: ['push'],
          is_read: false,
        });
        spikesDetected++;
      }
    }

    return new Response(
      JSON.stringify({ status: 'ok', spikes_detected: spikesDetected }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
