import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { ArrowUpRight, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentFeedProps {
  filters: Record<string, string[]>;
}

export const DocumentFeed: React.FC<DocumentFeedProps> = ({ filters }) => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      let query = supabase
        .from('documents')
        .select('*')
        .order('published_at', { ascending: false });

      if (filters.category?.length) {
        query = query.in('category', filters.category);
      }
      if (filters.state?.length) {
        query = query.in('state', filters.state);
      }
      if (filters.urgency?.length) {
        query = query.in('urgency', filters.urgency);
      }
      if (filters.doc_type?.length) {
        query = query.in('document_type', filters.doc_type);
      }

      const { data } = await query.limit(50);
      if (data) setDocs(data);
      setLoading(false);
    };
    fetchDocs();
  }, [filters]);

  const getUrgencyStyle = (urgency: string | null) => {
    switch (urgency) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'high': return 'bg-warning/20 text-warning border-warning/30';
      case 'medium': return 'bg-accent/20 text-accent border-accent/30';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  };

  const getImpactBar = (score: number | null) => {
    if (!score) return null;
    const width = (score / 10) * 100;
    const color = score >= 8 ? 'bg-destructive' : score >= 5 ? 'bg-warning' : 'bg-primary';
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className={`h-full ${color} rounded-full`} style={{ width: `${width}%` }} />
        </div>
        <span className="text-xs font-mono text-terminal-dim">{score}/10</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-primary font-mono text-sm animate-pulse">Loading feed...</div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-1">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border mb-2">
          <span className="text-xs font-mono font-bold text-primary glow-green">
            DOCUMENT FEED
          </span>
          <span className="text-xs font-mono text-terminal-dim">
            {docs.length} results
          </span>
        </div>

        {docs.map((doc) => (
          <div
            key={doc.id}
            className="group px-3 py-2.5 border border-border rounded bg-card hover:bg-secondary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border ${getUrgencyStyle(doc.urgency)}`}>
                    {doc.urgency === 'critical' && <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />}
                    {doc.urgency?.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-terminal-cyan uppercase">
                    {doc.category}
                  </span>
                  <span className="text-[10px] font-mono text-terminal-dim">
                    {doc.document_type?.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-terminal-dim">
                    [{doc.state?.replace('_', ' ').toUpperCase()}]
                  </span>
                </div>
                <h3 className="text-sm font-mono text-foreground group-hover:text-primary transition-colors truncate">
                  {doc.title}
                </h3>
                {doc.ai_summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.ai_summary}</p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  {getImpactBar(doc.impact_score)}
                  {doc.effective_date && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-terminal-dim">
                      <Clock className="h-2.5 w-2.5" />
                      Eff: {format(new Date(doc.effective_date), 'dd MMM yyyy')}
                    </span>
                  )}
                  {doc.deadline_date && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-warning">
                      <Clock className="h-2.5 w-2.5" />
                      Due: {format(new Date(doc.deadline_date), 'dd MMM yyyy')}
                    </span>
                  )}
                </div>
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {doc.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 text-[10px] font-mono bg-secondary text-muted-foreground rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <ArrowUpRight className="h-4 w-4 text-terminal-dim group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
