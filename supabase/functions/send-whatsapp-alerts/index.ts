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

    const { data: alerts } = await supabase
      .from('user_alerts')
      .select('*, user_profiles!user_alerts_user_id_fkey(phone, full_name)')
      .eq('is_read', false)
      .limit(50);

    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;
    const waToken = Deno.env.get('WHATSAPP_API_TOKEN');
    const waPhoneId = Deno.env.get('WHATSAPP_PHONE_ID');

    for (const alert of alerts) {
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('whatsapp_enabled')
        .eq('user_id', alert.user_id)
        .single();

      if (!prefs?.whatsapp_enabled) continue;

      const phone = (alert as any).user_profiles?.phone;
      if (!phone || !waToken || !waPhoneId) continue;

      // Get doc details
      let docTitle = alert.message || '';
      let source = '';
      if (alert.document_id) {
        const { data: doc } = await supabase.from('documents').select('title, source_name, ai_summary').eq('id', alert.document_id).single();
        if (doc) { docTitle = doc.title; source = doc.source_name || ''; }
      }

      try {
        await fetch(`https://graph.facebook.com/v18.0/${waPhoneId}/messages`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${waToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: {
              body: `*[COMPLIANCE ALERT]*\n\n📋 ${docTitle}\n📌 Source: ${source}\n📅 ${new Date().toLocaleDateString('en-IN')}\n\n${alert.message}\n\n🔗 View: https://complianceterminal.app`
            }
          }),
        });
        sent++;
      } catch (e) {
        console.error('WhatsApp error:', e);
      }

      await supabase.from('user_alerts')
        .update({ channels: [...(alert.channels || []), 'whatsapp_sent'] })
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
