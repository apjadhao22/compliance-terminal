import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { record } = await req.json();
    const doc = record;

    if (!doc) {
      return new Response(JSON.stringify({ error: 'No document record' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all liability profiles
    const { data: profiles } = await supabase.from('liability_profiles').select('*');
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ matched: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let matched = 0;
    const urgencyDelta: Record<string, number> = { critical: -5, high: -3, medium: -2 };

    for (const profile of profiles) {
      let isMatch = false;

      // Match by state
      if (doc.state && profile.states?.includes(doc.state)) isMatch = true;

      // Match by industry
      if (doc.affected_industries && profile.industry_type) {
        if (doc.affected_industries.includes(profile.industry_type)) isMatch = true;
      }

      // Match by headcount
      if (doc.affected_headcount_min != null && profile.headcount_bracket) {
        const bracketMap: Record<string, number> = {
          '1-10': 5, '11-50': 30, '51-200': 125, '201-500': 350, '500+': 750
        };
        const count = bracketMap[profile.headcount_bracket] || 0;
        if (count >= (doc.affected_headcount_min || 0)) isMatch = true;
      }

      // Match by category
      if (doc.category && profile.industry_type) isMatch = true;

      if (isMatch) {
        // Insert user alert
        await supabase.from('user_alerts').insert({
          user_id: profile.user_id,
          document_id: doc.id,
          alert_type: 'new_law',
          message: `New ${doc.urgency || 'medium'} priority: ${doc.title}`,
          channels: ['push'],
        });

        // Degrade health score
        const delta = urgencyDelta[doc.urgency || 'medium'] || -1;
        const newScore = Math.max(0, (profile.health_score || 100) + delta);
        await supabase.from('liability_profiles')
          .update({ health_score: newScore })
          .eq('id', profile.id);

        matched++;
      }
    }

    return new Response(JSON.stringify({ matched }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
