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

    const today = new Date();
    const offsets = [30, 7, 1];
    const prefKeys = ['deadline_30d', 'deadline_7d', 'deadline_1d'] as const;
    let created = 0;

    for (let i = 0; i < offsets.length; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + offsets[i]);
      const dateStr = targetDate.toISOString().split('T')[0];

      // Find documents with this deadline
      const { data: docs } = await supabase
        .from('documents')
        .select('id, title, urgency, state, affected_industries')
        .eq('deadline_date', dateStr);

      if (!docs || docs.length === 0) continue;

      // Get all liability profiles
      const { data: profiles } = await supabase.from('liability_profiles').select('*');
      if (!profiles) continue;

      for (const doc of docs) {
        for (const profile of profiles) {
          // Check match
          let isMatch = false;
          if (doc.state && profile.states?.includes(doc.state)) isMatch = true;
          if (doc.affected_industries && profile.industry_type && doc.affected_industries.includes(profile.industry_type)) isMatch = true;
          if (!isMatch) continue;

          // Check user preferences
          const { data: prefs } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', profile.user_id)
            .single();

          const prefKey = prefKeys[i];
          if (prefs && !prefs[prefKey]) continue;

          // Create alert
          const channels = ['push'];
          if (prefs?.email_enabled) channels.push('email');
          if (prefs?.whatsapp_enabled) channels.push('whatsapp');

          await supabase.from('user_alerts').insert({
            user_id: profile.user_id,
            document_id: doc.id,
            alert_type: 'deadline',
            message: `⏰ ${offsets[i]} day${offsets[i] > 1 ? 's' : ''} until deadline: ${doc.title}`,
            channels,
          });
          created++;
        }
      }
    }

    return new Response(JSON.stringify({ created }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
