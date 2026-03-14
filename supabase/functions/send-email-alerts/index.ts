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

    // Get unread alerts where email channel is enabled
    const { data: alerts } = await supabase
      .from('user_alerts')
      .select('*, user_profiles!user_alerts_user_id_fkey(email, full_name)')
      .eq('is_read', false)
      .limit(50);

    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;
    const resendKey = Deno.env.get('RESEND_API_KEY');

    for (const alert of alerts) {
      // Check user notification preferences
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', alert.user_id)
        .single();

      if (!prefs?.email_enabled) continue;

      // Check quiet hours
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (prefs.quiet_hours_start && prefs.quiet_hours_end) {
        const start = prefs.quiet_hours_start;
        const end = prefs.quiet_hours_end;
        if (start < end) {
          if (currentTime >= start && currentTime <= end) continue;
        } else {
          if (currentTime >= start || currentTime <= end) continue;
        }
      }

      const email = (alert as any).user_profiles?.email;
      if (!email || !resendKey) continue;

      // Get document details for summary
      let docSummary = '';
      if (alert.document_id) {
        const { data: doc } = await supabase.from('documents').select('ai_summary, title, urgency').eq('id', alert.document_id).single();
        if (doc) docSummary = doc.ai_summary || doc.title;
      }

      // Send via Resend
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Compliance Terminal <alerts@complianceterminal.app>',
            to: email,
            subject: `⚠️ ${alert.message}`,
            html: `
              <div style="background:#0d1117;color:#c9d1d9;padding:24px;font-family:monospace;border:1px solid #30363d;border-radius:4px;">
                <h2 style="color:#3fb950;margin:0 0 16px 0;">COMPLIANCE TERMINAL</h2>
                <div style="background:#161b22;padding:16px;border-radius:4px;border-left:3px solid #f0883e;">
                  <p style="margin:0 0 8px 0;color:#f0883e;font-weight:bold;">${alert.message}</p>
                  <p style="margin:0;color:#8b949e;font-size:13px;">${docSummary}</p>
                </div>
                <a href="https://complianceterminal.app" style="display:inline-block;margin-top:16px;padding:8px 16px;background:#3fb950;color:#0d1117;text-decoration:none;border-radius:4px;font-weight:bold;">View on Dashboard</a>
              </div>`,
          }),
        });
        sent++;
      } catch (e) {
        console.error('Resend error:', e);
      }

      // Mark channels updated
      await supabase.from('user_alerts')
        .update({ channels: [...(alert.channels || []), 'email_sent'] })
        .eq('id', alert.id);
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
