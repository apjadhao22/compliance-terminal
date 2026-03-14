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

    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!resendKey) {
      return new Response(JSON.stringify({ error: 'No Resend API key' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all users with weekly digest enabled
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('weekly_digest', true)
      .eq('email_enabled', true);

    if (!prefs || prefs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let sent = 0;

    for (const pref of prefs) {
      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('email, full_name')
        .eq('id', pref.user_id)
        .single();

      if (!profile?.email) continue;

      // Get user's liability profile for matching
      const { data: liability } = await supabase
        .from('liability_profiles')
        .select('states, industry_type')
        .eq('user_id', pref.user_id)
        .single();

      // Get recent documents
      let query = supabase.from('documents')
        .select('title, urgency, category, state, source_name, published_at, ai_summary')
        .gte('published_at', weekAgo)
        .order('urgency', { ascending: true })
        .limit(20);

      if (liability?.states?.length) {
        query = query.in('state', liability.states);
      }

      const { data: docs } = await query;
      if (!docs || docs.length === 0) continue;

      const docRows = docs.map(d => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #30363d;color:${d.urgency === 'critical' ? '#f85149' : d.urgency === 'high' ? '#f0883e' : '#c9d1d9'}">${d.urgency?.toUpperCase() || 'MEDIUM'}</td>
          <td style="padding:8px;border-bottom:1px solid #30363d;">${d.title}</td>
          <td style="padding:8px;border-bottom:1px solid #30363d;color:#8b949e">${d.source_name || ''}</td>
        </tr>`).join('');

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Compliance Terminal <digest@complianceterminal.app>',
            to: profile.email,
            subject: `📊 Weekly Compliance Digest — ${docs.length} updates`,
            html: `
              <div style="background:#0d1117;color:#c9d1d9;padding:24px;font-family:monospace;">
                <h2 style="color:#3fb950;">WEEKLY COMPLIANCE DIGEST</h2>
                <p style="color:#8b949e;">${docs.length} regulatory changes this week</p>
                <table style="width:100%;border-collapse:collapse;margin-top:16px;">
                  <thead><tr>
                    <th style="padding:8px;border-bottom:2px solid #30363d;text-align:left;color:#3fb950;">Priority</th>
                    <th style="padding:8px;border-bottom:2px solid #30363d;text-align:left;color:#3fb950;">Title</th>
                    <th style="padding:8px;border-bottom:2px solid #30363d;text-align:left;color:#3fb950;">Source</th>
                  </tr></thead>
                  <tbody>${docRows}</tbody>
                </table>
                <a href="https://complianceterminal.app" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#3fb950;color:#0d1117;text-decoration:none;border-radius:4px;font-weight:bold;">View Dashboard</a>
              </div>`,
          }),
        });
        sent++;
      } catch (e) {
        console.error('Digest email error:', e);
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
