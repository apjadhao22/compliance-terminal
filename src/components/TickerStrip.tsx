import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

interface TickerDoc {
  title: string;
  urgency: string | null;
  category: string | null;
  state: string | null;
  published_at: string | null;
}

export const TickerStrip: React.FC = () => {
  const [docs, setDocs] = useState<TickerDoc[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      const { data } = await supabase
        .from('documents')
        .select('title, urgency, category, state, published_at')
        .order('published_at', { ascending: false })
        .limit(20);
      if (data) setDocs(data);
    };
    fetchDocs();
  }, []);

  const getUrgencyColor = (urgency: string | null) => {
    switch (urgency) {
      case 'critical': return 'text-destructive glow-amber';
      case 'high': return 'text-warning';
      case 'medium': return 'text-terminal-cyan';
      default: return 'text-terminal-dim';
    }
  };

  if (docs.length === 0) return null;

  const tickerContent = docs.map((doc, i) => (
    <span key={i} className="inline-flex items-center gap-2 mx-6 whitespace-nowrap">
      <span className={`text-xs font-mono uppercase font-bold ${getUrgencyColor(doc.urgency)}`}>
        {doc.urgency === 'critical' ? '⚠' : '●'} {doc.category}
      </span>
      <span className="text-xs font-mono text-foreground">{doc.title}</span>
      <span className="text-xs font-mono text-terminal-dim">
        [{doc.state?.replace('_', ' ').toUpperCase()}]
      </span>
    </span>
  ));

  return (
    <div className="w-full bg-secondary/50 border-b border-border overflow-hidden h-7 flex items-center">
      <div className="animate-ticker flex">
        {tickerContent}
        {tickerContent}
      </div>
    </div>
  );
};
