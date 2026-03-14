
-- Notification preferences table
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email_enabled boolean DEFAULT false,
  whatsapp_enabled boolean DEFAULT false,
  push_enabled boolean DEFAULT false,
  weekly_digest boolean DEFAULT true,
  new_law_alert boolean DEFAULT true,
  deadline_30d boolean DEFAULT true,
  deadline_7d boolean DEFAULT true,
  deadline_1d boolean DEFAULT true,
  court_order_flash boolean DEFAULT true,
  spike_alert boolean DEFAULT true,
  liability_change_alert boolean DEFAULT true,
  urgency_threshold text DEFAULT 'all',
  quiet_hours_start time DEFAULT '22:00',
  quiet_hours_end time DEFAULT '06:00',
  daily_cap integer DEFAULT 20,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prefs" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prefs" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prefs" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prefs" ON public.notification_preferences FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for evidence files
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', true);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload evidence" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'evidence');
CREATE POLICY "Users can view own evidence" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'evidence');
CREATE POLICY "Users can delete own evidence" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'evidence');

-- Enable realtime for user_alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_alerts;
