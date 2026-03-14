import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Check, CheckCheck, AlertTriangle, Shield, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface Alert {
  id: string;
  alert_type: string | null;
  message: string | null;
  is_read: boolean | null;
  created_at: string | null;
  document_id: string | null;
}

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = alerts.filter(a => !a.is_read).length;

  useEffect(() => {
    if (!user) return;

    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('user_alerts')
        .select('id, alert_type, message, is_read, created_at, document_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (data) setAlerts(data);
    };

    fetchAlerts();

    // Realtime subscription
    const channel = supabase
      .channel('user-alerts-bell')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_alerts',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newAlert = payload.new as Alert;
        setAlerts(prev => [newAlert, ...prev.slice(0, 29)]);

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Compliance Alert', { body: newAlert.message || 'New alert', icon: '/favicon.ico' });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('user_alerts').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
  };

  const markRead = async (id: string) => {
    await supabase.from('user_alerts').update({ is_read: true }).eq('id', id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
  };

  const getAlertIcon = (type: string | null) => {
    switch (type) {
      case 'deadline': return <Clock className="h-3 w-3 text-warning flex-shrink-0" />;
      case 'court_order': return <AlertTriangle className="h-3 w-3 text-destructive flex-shrink-0" />;
      default: return <Shield className="h-3 w-3 text-primary flex-shrink-0" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[9px] font-mono font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-card border border-border rounded shadow-lg z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-mono font-bold text-foreground">NOTIFICATIONS</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[10px] font-mono text-primary hover:text-primary/80 flex items-center gap-1">
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <ScrollArea className="max-h-80">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-terminal-dim">No notifications</div>
            ) : (
              <div className="p-1">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => markRead(alert.id)}
                    className={`flex items-start gap-2 px-2.5 py-2 rounded cursor-pointer transition-colors ${
                      !alert.is_read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-secondary/50'
                    }`}
                  >
                    {getAlertIcon(alert.alert_type)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-mono leading-tight ${!alert.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {alert.message}
                      </p>
                      <span className="text-[9px] font-mono text-terminal-dim">
                        {alert.created_at ? formatDistanceToNow(new Date(alert.created_at), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    {!alert.is_read && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
