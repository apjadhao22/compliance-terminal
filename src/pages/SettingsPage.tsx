import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { AuthModal } from '@/components/AuthModal';
import { useAuth, useRequireAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Bell, Eye, Lock, User, Save, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { requireAuth } = useRequireAuth();

  const [profile, setProfile] = useState({ full_name: '', email: '', phone: '', company_name: '', primary_state: '' });
  const [prefs, setPrefs] = useState({
    email_enabled: false, whatsapp_enabled: false, push_enabled: false,
    weekly_digest: true, new_law_alert: true,
    deadline_30d: true, deadline_7d: true, deadline_1d: true,
    court_order_flash: true, spike_alert: true, liability_change_alert: true,
    urgency_threshold: 'all', quiet_hours_start: '22:00', quiet_hours_end: '06:00', daily_cap: 20,
  });
  const [keywords, setKeywords] = useState<{ id: string; keyword: string }[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!user) requireAuth(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
      if (p) setProfile({ full_name: p.full_name || '', email: p.email || '', phone: p.phone || '', company_name: p.company_name || '', primary_state: p.primary_state || '' });

      const { data: n } = await supabase.from('notification_preferences').select('*').eq('user_id', user.id).single();
      if (n) {
        setPrefs({
          email_enabled: n.email_enabled ?? false, whatsapp_enabled: n.whatsapp_enabled ?? false, push_enabled: n.push_enabled ?? false,
          weekly_digest: n.weekly_digest ?? true, new_law_alert: n.new_law_alert ?? true,
          deadline_30d: n.deadline_30d ?? true, deadline_7d: n.deadline_7d ?? true, deadline_1d: n.deadline_1d ?? true,
          court_order_flash: n.court_order_flash ?? true, spike_alert: n.spike_alert ?? true, liability_change_alert: n.liability_change_alert ?? true,
          urgency_threshold: n.urgency_threshold || 'all', quiet_hours_start: n.quiet_hours_start || '22:00', quiet_hours_end: n.quiet_hours_end || '06:00',
          daily_cap: n.daily_cap ?? 20,
        });
      }

      const { data: kw } = await supabase.from('keyword_watches').select('id, keyword').eq('user_id', user.id);
      if (kw) setKeywords(kw);
    };
    load();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('user_profiles').update(profile).eq('id', user.id);
    toast({ title: 'Profile saved' });
    setSaving(false);
  };

  const savePrefs = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('notification_preferences').upsert({ user_id: user.id, ...prefs } as any, { onConflict: 'user_id' });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Notification preferences saved' });
    setSaving(false);
  };

  const addKeyword = async () => {
    if (!user || !newKeyword.trim()) return;
    const { data, error } = await supabase.from('keyword_watches').insert({ user_id: user.id, keyword: newKeyword.trim() }).select().single();
    if (data) { setKeywords(prev => [...prev, data]); setNewKeyword(''); }
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
  };

  const removeKeyword = async (id: string) => {
    await supabase.from('keyword_watches').delete().eq('id', id);
    setKeywords(prev => prev.filter(k => k.id !== id));
  };

  const requestPushPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setPrefs(p => ({ ...p, push_enabled: true }));
        toast({ title: 'Push notifications enabled' });
      } else {
        toast({ title: 'Permission denied', variant: 'destructive' });
      }
    }
  };

  if (!user) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header /><AuthModal />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-16 w-16 text-primary mx-auto mb-4 opacity-50" />
            <h1 className="text-xl font-mono font-bold text-primary glow-green mb-2">SETTINGS</h1>
            <div className="flex items-center gap-2 justify-center text-sm text-warning font-mono">
              <AlertTriangle className="h-4 w-4" /> Login required
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header /><AuthModal />
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-lg font-mono font-bold text-primary glow-green mb-6">⚙ ACCOUNT SETTINGS</h1>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="bg-card border border-border w-full justify-start gap-1 h-10">
              <TabsTrigger value="profile" className="font-mono text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><User className="h-3 w-3 mr-1" />Profile</TabsTrigger>
              <TabsTrigger value="notifications" className="font-mono text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><Bell className="h-3 w-3 mr-1" />Notifications</TabsTrigger>
              <TabsTrigger value="watchlist" className="font-mono text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><Eye className="h-3 w-3 mr-1" />Watchlist</TabsTrigger>
              <TabsTrigger value="security" className="font-mono text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary"><Lock className="h-3 w-3 mr-1" />Security</TabsTrigger>
            </TabsList>

            {/* PROFILE TAB */}
            <TabsContent value="profile" className="mt-4 space-y-4">
              <div className="bg-card border border-border rounded p-4 space-y-4">
                <h2 className="text-sm font-mono font-bold text-foreground">Profile Information</h2>
                {[
                  { label: 'Full Name', key: 'full_name' as const },
                  { label: 'Email', key: 'email' as const },
                  { label: 'Phone (with country code)', key: 'phone' as const },
                  { label: 'Company Name', key: 'company_name' as const },
                  { label: 'Primary State', key: 'primary_state' as const },
                ].map(f => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-xs font-mono text-muted-foreground">{f.label}</Label>
                    <Input value={profile[f.key]} onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))} className="font-mono text-xs bg-secondary border-border" />
                  </div>
                ))}
                <Button onClick={saveProfile} disabled={saving} size="sm" className="font-mono text-xs">
                  <Save className="h-3 w-3 mr-1" />{saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </TabsContent>

            {/* NOTIFICATIONS TAB */}
            <TabsContent value="notifications" className="mt-4 space-y-4">
              <div className="bg-card border border-border rounded p-4 space-y-5">
                <h2 className="text-sm font-mono font-bold text-foreground">Channels</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Email (Resend)', key: 'email_enabled' as const },
                    { label: 'WhatsApp', key: 'whatsapp_enabled' as const },
                    { label: 'In-app Push', key: 'push_enabled' as const, action: requestPushPermission },
                  ].map(ch => (
                    <div key={ch.key} className="flex items-center justify-between">
                      <Label className="text-xs font-mono text-muted-foreground">{ch.label}</Label>
                      <Switch checked={prefs[ch.key]} onCheckedChange={(v) => {
                        if (ch.action && v) ch.action();
                        setPrefs(p => ({ ...p, [ch.key]: v }));
                      }} />
                    </div>
                  ))}
                </div>

                <h2 className="text-sm font-mono font-bold text-foreground pt-3 border-t border-border">Alert Types</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Weekly Digest (every Monday)', key: 'weekly_digest' as const },
                    { label: 'New applicable law alert', key: 'new_law_alert' as const },
                    { label: 'Deadline countdown — 30 days', key: 'deadline_30d' as const },
                    { label: 'Deadline countdown — 7 days', key: 'deadline_7d' as const },
                    { label: 'Deadline countdown — 1 day', key: 'deadline_1d' as const },
                    { label: 'Court order / stay order flash', key: 'court_order_flash' as const },
                    { label: 'Regulatory activity spike', key: 'spike_alert' as const },
                    { label: 'Liability profile change (₹ delta)', key: 'liability_change_alert' as const },
                  ].map(at => (
                    <div key={at.key} className="flex items-center justify-between">
                      <Label className="text-xs font-mono text-muted-foreground">{at.label}</Label>
                      <Switch checked={prefs[at.key]} onCheckedChange={(v) => setPrefs(p => ({ ...p, [at.key]: v }))} />
                    </div>
                  ))}
                </div>

                <h2 className="text-sm font-mono font-bold text-foreground pt-3 border-t border-border">Thresholds</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-mono text-muted-foreground">Urgency Threshold</Label>
                    <Select value={prefs.urgency_threshold} onValueChange={(v) => setPrefs(p => ({ ...p, urgency_threshold: v }))}>
                      <SelectTrigger className="w-40 font-mono text-xs bg-secondary"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical only</SelectItem>
                        <SelectItem value="high">High & above</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-mono text-muted-foreground">Quiet Hours</Label>
                    <div className="flex items-center gap-2">
                      <Input type="time" value={prefs.quiet_hours_start} onChange={e => setPrefs(p => ({ ...p, quiet_hours_start: e.target.value }))} className="w-28 font-mono text-xs bg-secondary" />
                      <span className="text-xs font-mono text-muted-foreground">to</span>
                      <Input type="time" value={prefs.quiet_hours_end} onChange={e => setPrefs(p => ({ ...p, quiet_hours_end: e.target.value }))} className="w-28 font-mono text-xs bg-secondary" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-mono text-muted-foreground">Daily Cap</Label>
                    <Select value={String(prefs.daily_cap)} onValueChange={(v) => setPrefs(p => ({ ...p, daily_cap: parseInt(v) }))}>
                      <SelectTrigger className="w-28 font-mono text-xs bg-secondary"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="999">Unlimited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={savePrefs} disabled={saving} size="sm" className="font-mono text-xs">
                  <Save className="h-3 w-3 mr-1" />{saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </TabsContent>

            {/* WATCHLIST TAB */}
            <TabsContent value="watchlist" className="mt-4 space-y-4">
              <div className="bg-card border border-border rounded p-4 space-y-4">
                <h2 className="text-sm font-mono font-bold text-foreground">Keyword Watches</h2>
                <p className="text-[10px] font-mono text-muted-foreground">Get alerted when new documents match your keywords</p>
                <div className="flex gap-2">
                  <Input value={newKeyword} onChange={e => setNewKeyword(e.target.value)} placeholder="e.g. POSH, minimum wage, EPF..." className="font-mono text-xs bg-secondary" onKeyDown={e => e.key === 'Enter' && addKeyword()} />
                  <Button onClick={addKeyword} size="sm" className="font-mono text-xs"><Plus className="h-3 w-3 mr-1" />Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {keywords.map(kw => (
                    <Badge key={kw.id} variant="secondary" className="font-mono text-xs gap-1 cursor-pointer hover:bg-destructive/20" onClick={() => removeKeyword(kw.id)}>
                      {kw.keyword} <Trash2 className="h-2.5 w-2.5" />
                    </Badge>
                  ))}
                  {keywords.length === 0 && <span className="text-[10px] font-mono text-terminal-dim">No keywords added</span>}
                </div>
              </div>
            </TabsContent>

            {/* SECURITY TAB */}
            <TabsContent value="security" className="mt-4 space-y-4">
              <div className="bg-card border border-border rounded p-4 space-y-4">
                <h2 className="text-sm font-mono font-bold text-foreground">Security</h2>
                <div className="space-y-2">
                  <p className="text-xs font-mono text-muted-foreground">Email: {user.email}</p>
                  <p className="text-xs font-mono text-muted-foreground">User ID: {user.id.slice(0, 8)}…</p>
                  <p className="text-xs font-mono text-muted-foreground">Last sign-in: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
                </div>
                <Button variant="outline" size="sm" className="font-mono text-xs" onClick={async () => {
                  await supabase.auth.resetPasswordForEmail(user.email || '');
                  toast({ title: 'Password reset email sent' });
                }}>
                  <Lock className="h-3 w-3 mr-1" /> Reset Password
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
