import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { ArrowUpRight, Clock, AlertTriangle, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Document = Database['public']['Tables']['documents']['Row'];

const CATEGORY_FILTERS = ['All', 'Labour', 'Tax', 'GST', 'Corporate', 'Environment', 'Municipal', 'Court Orders'];
const STATE_PILLS = [
  { label: 'Central', value: 'central' },
  { label: 'MH', value: 'maharashtra' },
  { label: 'KA', value: 'karnataka' },
  { label: 'GJ', value: 'gujarat' },
  { label: 'TN', value: 'tamil_nadu' },
  { label: 'TS', value: 'telangana' },
  { label: 'AP', value: 'andhra_pradesh' },
];

interface DocumentFeedProps {
  filters: Record<string, string[]>;
  onDocumentClick: (doc: Document) => void;
}

export const DocumentFeed: React.FC<DocumentFeedProps> = ({ filters, onDocumentClick }) => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeStates, setActiveStates] = useState<string[]>([]);
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 20;

  const buildQuery = useCallback((offset: number) => {
    let query = supabase
      .from('documents')
      .select('*')
      .order('published_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    // Apply sidebar filters
    if (filters.category?.length) {
      query = query.in('category', filters.category);
    } else if (activeCategory !== 'All') {
      if (activeCategory === 'Court Orders') {
        query = query.eq('document_type', 'court_order');
      } else {
        query = query.eq('category', activeCategory.toLowerCase());
      }
    }

    const stateFilters = filters.state?.length ? filters.state : activeStates;
    if (stateFilters.length) {
      query = query.in('state', stateFilters);
    }
    if (filters.urgency?.length) {
      query = query.in('urgency', filters.urgency);
    }
    if (filters.doc_type?.length) {
      query = query.in('document_type', filters.doc_type);
    }

    return query;
  }, [filters, activeCategory, activeStates]);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    const { data } = await buildQuery(0);
    if (data) {
      setDocs(data);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [buildQuery]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('documents-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'documents' }, (payload) => {
        setDocs(prev => [payload.new as Document, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const { data } = await buildQuery(docs.length);
    if (data) {
      setDocs(prev => [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    }
    setLoadingMore(false);
  };

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      loadMore();
    }
  }, [docs.length, loadingMore, hasMore]);

  const toggleState = (state: string) => {
    setActiveStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  const getUrgencyStyle = (urgency: string | null) => {
    switch (urgency) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'high': return 'bg-warning/20 text-warning border-warning/30';
      case 'medium': return 'bg-accent/20 text-accent border-accent/30';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  };

  const getImpactDots = (score: number | null) => {
    if (!score) return null;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i < score
                ? score >= 8 ? 'bg-destructive' : score >= 5 ? 'bg-warning' : 'bg-primary'
                : 'bg-secondary'
            }`}
          />
        ))}
        <span className="text-[9px] font-mono text-terminal-dim ml-1">{score}</span>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filter bar */}
      <div className="px-3 pt-2 pb-1 border-b border-border space-y-1.5 flex-shrink-0">
        <div className="flex items-center gap-1 flex-wrap">
          {CATEGORY_FILTERS.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                activeCategory === cat
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {STATE_PILLS.map(s => (
            <button
              key={s.value}
              onClick={() => toggleState(s.value)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                activeStates.includes(s.value)
                  ? 'bg-terminal-cyan/20 text-terminal-cyan border border-terminal-cyan/30'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 flex-shrink-0">
        <span className="text-xs font-mono font-bold text-primary glow-green">LIVE FEED</span>
        <span className="text-xs font-mono text-terminal-dim">{docs.length} docs</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] font-mono text-primary">REALTIME</span>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-primary font-mono text-sm animate-pulse">Loading feed...</div>
        </div>
      ) : (
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {docs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onDocumentClick(doc)}
              className="group px-3 py-2.5 border border-border rounded bg-card hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border ${getUrgencyStyle(doc.urgency)}`}>
                      {doc.urgency === 'critical' && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
                      {doc.urgency?.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono text-terminal-cyan uppercase">{doc.category}</span>
                    <span className="text-[10px] font-mono text-terminal-dim">{doc.document_type?.toUpperCase()}</span>
                    <span className="text-[10px] font-mono text-terminal-dim">[{doc.state?.replace('_', ' ').toUpperCase()}]</span>
                    {(doc as any).predictive_tag === 'Likely to change soon' && (
                      <span className="ml-1 inline-flex items-center">
                        <span className="w-2 h-2 rounded-full bg-warning animate-pulse shadow-glow-amber mr-1" title="Likely to change soon" />
                        <span className="text-[9px] font-mono text-warning">Likely to change</span>
                      </span>
                    )}
                    {doc.source_name && (
                      <span className="text-[10px] font-mono text-terminal-dim">— {doc.source_name}</span>
                    )}
                    {user && doc.affected_industries && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-warning bg-warning/10 rounded border border-warning/20">
                        <Zap className="h-2.5 w-2.5" />
                        Affects you
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-mono text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {doc.title}
                  </h3>
                  {doc.ai_summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.ai_summary}</p>
                  )}
                  <div className="flex items-center gap-4 mt-1.5">
                    {getImpactDots(doc.impact_score)}
                    {doc.published_at && (
                      <span className="text-[10px] font-mono text-terminal-dim">
                        {format(new Date(doc.published_at), 'dd MMM yyyy')}
                      </span>
                    )}
                    {doc.deadline_date && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-warning">
                        <Clock className="h-2.5 w-2.5" />
                        Due: {format(new Date(doc.deadline_date), 'dd MMM')}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-terminal-dim group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </div>
            </div>
          ))}
          {loadingMore && (
            <div className="py-3 text-center text-xs font-mono text-primary animate-pulse">Loading more...</div>
          )}
          {!hasMore && docs.length > 0 && (
            <div className="py-3 text-center text-[10px] font-mono text-terminal-dim">— END OF FEED —</div>
          )}
        </div>
      )}
    </div>
  );
};
