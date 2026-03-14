import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface TickerDoc {
  title: string;
  source_name: string | null;
  document_type: string | null;
  published_at: string | null;
  is_amendment: boolean | null;
  urgency: string | null;
}

const getDocTypeColor = (docType: string | null, isAmendment: boolean | null) => {
  if (isAmendment) return 'text-destructive';
  switch (docType) {
    case 'act': return 'text-destructive';
    case 'circular': case 'order': return 'text-warning';
    case 'court_order': return 'text-terminal-cyan';
    case 'directive': case 'notification':
      return 'text-warning';
    default: return 'text-primary';
  }
};

const getDocTypeLabel = (docType: string | null, isAmendment: boolean | null) => {
  if (isAmendment) return '🔴 AMENDMENT';
  switch (docType) {
    case 'court_order': return '⚖ COURT ORDER';
    case 'act': return '📜 ACT';
    case 'circular': return '📋 CIRCULAR';
    case 'order': return '📋 ORDER';
    case 'GR': return '📋 GR';
    case 'notification': return '🔔 NOTIFICATION';
    case 'gazette': return '📰 GAZETTE';
    case 'rule': return '📐 RULE';
    case 'directive': return '⚠ DIRECTIVE';
    default: return docType?.toUpperCase() || '';
  }
};

export const TickerStrip: React.FC = () => {
  const [docs, setDocs] = useState<TickerDoc[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchDocs = async () => {
    const { data } = await supabase
      .from('documents')
      .select('title, source_name, document_type, published_at, is_amendment, urgency')
      .order('published_at', { ascending: false })
      .limit(50);
    if (data) setDocs(data);
  };

  useEffect(() => {
    fetchDocs();
    const interval = setInterval(fetchDocs, 5 * 60 * 1000); // 5 min refresh
    return () => clearInterval(interval);
  }, []);

  if (docs.length === 0) return null;

  const tickerItems = docs.map((doc, i) => (
    <span key={i} className="inline-flex items-center gap-2 mx-8 whitespace-nowrap">
      <span className="text-[10px] font-mono text-terminal-dim">
        {doc.source_name || 'GOV'}
      </span>
      <span className={`text-[10px] font-mono font-bold ${getDocTypeColor(doc.document_type, doc.is_amendment)}`}>
        {getDocTypeLabel(doc.document_type, doc.is_amendment)}
      </span>
      <span className="text-xs font-mono text-foreground">{doc.title}</span>
      <span className="text-[10px] font-mono text-terminal-dim">
        {doc.published_at ? format(new Date(doc.published_at), 'dd MMM') : ''}
      </span>
    </span>
  ));

  return (
    <div
      className="w-full bg-secondary/50 border-b border-border overflow-hidden h-7 flex items-center"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={containerRef}
        className="flex"
        style={{
          animation: 'ticker-scroll 120s linear infinite',
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {tickerItems}
        {tickerItems}
      </div>
    </div>
  );
};
