import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, differenceInHours, format } from 'date-fns';
import { AlertTriangle, Clock, Shield, Siren } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';

interface AlertDoc {
  id: string;
  title: string;
  urgency: string | null;
  deadline_date: string | null;
  source_name: string | null;
  published_at: string | null;
  category: string | null;
  document_type: string | null;
}

export const AlertPanel: React.FC = () => {
  const [docs, setDocs] = useState<AlertDoc[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('documents')
        .select('id, title, urgency, deadline_date, source_name, published_at, category, document_type')
        .or('urgency.eq.critical,urgency.eq.high')
        .order('urgency', { ascending: true })
        .order('deadline_date', { ascending: true })
        .limit(30);
      if (data) setDocs(data);
    };
    fetchAlerts();
  }, []);

  // Enforcement spike detection: 5+ from same source in 48h
  const enforcementSpike = useMemo(() => {
    const sourceCounts: Record<string, number> = {};
    const now = new Date();
    docs.forEach(d => {
      if (d.published_at && differenceInHours(now, new Date(d.published_at)) <= 48 && d.source_name) {
        sourceCounts[d.source_name] = (sourceCounts[d.source_name] || 0) + 1;
      }
    });
    return Object.entries(sourceCounts).find(([_, count]) => count >= 5);
  }, [docs]);

  const getUrgencyIcon = (urgency: string | null) => {
    if (urgency === 'critical') return <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />;
    return <Shield className="h-3.5 w-3.5 text-warning flex-shrink-0" />;
  };

  const getDaysRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 0) return <span className="text-destructive font-bold">{Math.abs(days)}d overdue</span>;
    if (days === 0) return <span className="text-destructive font-bold">TODAY</span>;
    if (days <= 7) return <span className="text-destructive">{days}d left</span>;
    if (days <= 30) return <span className="text-warning">{days}d left</span>;
    return <span className="text-terminal-dim">{days}d</span>;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0">
        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
        <span className="text-xs font-mono font-bold text-destructive">ALERTS</span>
        <span className="text-[10px] font-mono text-terminal-dim">{docs.length}</span>
      </div>

      {/* Enforcement spike banner */}
      {enforcementSpike && (
        <div className="mx-2 mt-2 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded flex items-center gap-2">
          <Siren className="h-4 w-4 text-destructive flex-shrink-0" />
          <div>
            <span className="text-[10px] font-mono font-bold text-destructive block">
              ⚠️ ENFORCEMENT DRIVE DETECTED
            </span>
            <span className="text-[9px] font-mono text-muted-foreground">
              {enforcementSpike[1]} documents from {enforcementSpike[0]} in last 48h
            </span>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {docs.map(doc => (
            <div
              key={doc.id}
              className={`px-2.5 py-2 rounded border transition-colors cursor-pointer ${
                doc.urgency === 'critical'
                  ? 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10'
                  : 'border-border bg-card hover:bg-secondary/50'
              }`}
            >
              <div className="flex items-start gap-2">
                {getUrgencyIcon(doc.urgency)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[9px] font-mono font-bold ${
                      doc.urgency === 'critical' ? 'text-destructive' : 'text-warning'
                    }`}>
                      {doc.urgency?.toUpperCase()}
                    </span>
                    {doc.document_type === 'court_order' && (
                      <span className="text-[9px] font-mono text-destructive">🔴 STAY</span>
                    )}
                  </div>
                  <h4 className="text-[11px] font-mono text-foreground line-clamp-2 leading-tight">
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] font-mono text-terminal-dim">{doc.source_name}</span>
                    {doc.deadline_date && (
                      <span className="flex items-center gap-0.5 text-[9px] font-mono">
                        <Clock className="h-2.5 w-2.5" />
                        {getDaysRemaining(doc.deadline_date)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
