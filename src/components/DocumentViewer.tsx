import React, { useEffect, useState } from 'react';
import type { Database } from '@/integrations/supabase/types';
import { format, differenceInDays } from 'date-fns';
import { X, Download, Bookmark, FileText, Globe, ArrowLeftRight, Shield } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAuth, useRequireAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Document = Database['public']['Tables']['documents']['Row'];

interface DocumentViewerProps {
  document: Document | null;
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onClose }) => {
  const [showOriginal, setShowOriginal] = useState(false);
  const [relatedDocs, setRelatedDocs] = useState<Document[]>([]);
  const { user } = useAuth();
  const { requireAuth } = useRequireAuth();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (!document) return;
    const fetchRelated = async () => {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('category', document.category!)
        .neq('id', document.id)
        .order('published_at', { ascending: false })
        .limit(5);
      if (data) setRelatedDocs(data);
    };
    fetchRelated();
  }, [document]);

  if (!document) return null;

  const isNonEnglish = document.original_language && document.original_language !== 'English';
  const daysToDeadline = document.deadline_date
    ? differenceInDays(new Date(document.deadline_date), new Date())
    : null;

  const getConfidenceBadge = (conf: string | null) => {
    switch (conf) {
      case 'high': return 'bg-primary/20 text-primary border-primary/30';
      case 'medium': return 'bg-warning/20 text-warning border-warning/30';
      case 'low': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  };

  const handleBookmark = () => {
    requireAuth(async () => {
      try {
        await supabase.from('user_watchlist').insert({
          user_id: user!.id,
          document_id: document.id,
        });
        toast.success('Added to watchlist');
      } catch {
        toast.error('Already in watchlist');
      }
    });
  };

  const urgencyStyle = (() => {
    switch (document.urgency) {
      case 'critical': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'high': return 'bg-warning/20 text-warning border-warning/30';
      case 'medium': return 'bg-accent/20 text-accent border-accent/30';
      default: return 'bg-secondary text-muted-foreground border-border';
    }
  })();

  return (
    <>
      <div className="fixed inset-0 bg-background/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-card border-l border-border z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded border ${urgencyStyle}`}>
                {document.urgency?.toUpperCase()}
              </span>
              <span className="text-[10px] font-mono text-terminal-cyan uppercase">{document.category}</span>
              <span className="text-[10px] font-mono text-terminal-dim">{document.document_type?.toUpperCase()}</span>
              <span className="text-[10px] font-mono text-terminal-dim">[{document.state?.replace('_', ' ').toUpperCase()}]</span>
              {document.source_name && (
                <span className="text-[10px] font-mono text-terminal-dim">— {document.source_name}</span>
              )}
            </div>
            <h2 className="text-base font-mono font-bold text-foreground leading-tight">{document.title}</h2>
            <div className="flex items-center gap-4 mt-2">
              {document.impact_score && (
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-terminal-dim" />
                  <span className="text-[10px] font-mono text-muted-foreground">Impact: {document.impact_score}/10</span>
                </div>
              )}
              {document.published_at && (
                <span className="text-[10px] font-mono text-terminal-dim">
                  Published: {format(new Date(document.published_at), 'dd MMM yyyy')}
                </span>
              )}
              {daysToDeadline !== null && (
                <span className={`text-[10px] font-mono font-bold ${daysToDeadline <= 7 ? 'text-destructive' : 'text-warning'}`}>
                  ⏰ {daysToDeadline >= 0 ? `${daysToDeadline} days left` : `${Math.abs(daysToDeadline)} days overdue`}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* AI Summary */}
            {document.ai_summary && (
              <div className="bg-secondary/50 border border-border rounded p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-primary">🤖 AI SUMMARY</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{document.ai_summary}</p>
              </div>
            )}

            {/* Tags */}
            <div className="space-y-2">
              {document.affected_industries && document.affected_industries.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] font-mono text-terminal-dim mr-1">Industries:</span>
                  {document.affected_industries.map(ind => (
                    <span key={ind} className="px-1.5 py-0.5 text-[10px] font-mono bg-secondary text-muted-foreground rounded">
                      {ind}
                    </span>
                  ))}
                </div>
              )}
              {document.tags && document.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] font-mono text-terminal-dim mr-1">Tags:</span>
                  {document.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 text-[10px] font-mono bg-primary/10 text-primary rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              {(document.affected_headcount_min || document.affected_headcount_max) && (
                <div className="text-[10px] font-mono text-terminal-dim">
                  Headcount: {document.affected_headcount_min || 0} — {document.affected_headcount_max?.toLocaleString() || '∞'} employees
                </div>
              )}
              {document.effective_date && (
                <div className="text-[10px] font-mono text-terminal-dim">
                  Effective: {format(new Date(document.effective_date), 'dd MMM yyyy')}
                </div>
              )}
              {document.deadline_date && (
                <div className="text-[10px] font-mono text-warning">
                  Deadline: {format(new Date(document.deadline_date), 'dd MMM yyyy')}
                </div>
              )}
            </div>

            {/* Translation toggle for non-English */}
            {isNonEnglish && (
              <div className="border border-border rounded overflow-hidden">
                <div className="flex items-center justify-between bg-secondary/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-terminal-cyan" />
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Original: {document.original_language}
                    </span>
                    {document.translation_confidence && (
                      <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border ${getConfidenceBadge(document.translation_confidence)}`}>
                        {document.translation_confidence.toUpperCase()} CONFIDENCE
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="flex items-center gap-1 text-[10px] font-mono text-primary hover:text-primary/80"
                  >
                    <ArrowLeftRight className="h-3 w-3" />
                    {showOriginal ? 'View Translation' : 'View Original'}
                  </button>
                </div>
                <div className="p-3 grid grid-cols-1 gap-3">
                  {showOriginal && document.original_text && (
                    <div>
                      <span className="text-[9px] font-mono text-terminal-dim mb-1 block">ORIGINAL ({document.original_language})</span>
                      <p className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                        {document.original_text}
                      </p>
                    </div>
                  )}
                  {!showOriginal && document.translated_text && (
                    <div>
                      <span className="text-[9px] font-mono text-terminal-dim mb-1 block">ENGLISH TRANSLATION</span>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                        {document.translated_text}
                      </p>
                    </div>
                  )}
                  {!document.translated_text && !document.original_text && (
                    <p className="text-sm text-muted-foreground italic">No full text available</p>
                  )}
                </div>
              </div>
            )}

            {/* Amendment diff view */}
            {document.is_amendment && (
              <div className="border border-border rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-3.5 w-3.5 text-warning" />
                  <span className="text-[10px] font-mono font-bold text-warning">📄 AMENDMENT</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  This is an amendment to a previous document. Diff view will be available when original text data is populated.
                </p>
              </div>
            )}

            {/* Related Documents */}
            {relatedDocs.length > 0 && (
              <div className="border-t border-border pt-3">
                <span className="text-[10px] font-mono font-bold text-primary mb-2 block">RELATED DOCUMENTS</span>
                <div className="space-y-1">
                  {relatedDocs.map(rd => (
                    <div key={rd.id} className="px-2 py-1.5 bg-secondary/30 rounded text-xs font-mono text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                      <span className="text-terminal-dim">[{rd.state?.replace('_', ' ').toUpperCase()}]</span>{' '}
                      {rd.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center gap-2 p-3 border-t border-border flex-shrink-0">
          {document.source_url && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-mono border-border hover:border-primary hover:text-primary"
              onClick={() => window.open(document.source_url!, '_blank')}
            >
              <Download className="h-3 w-3 mr-1" />
              Source
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-mono border-border hover:border-warning hover:text-warning"
            onClick={handleBookmark}
          >
            <Bookmark className="h-3 w-3 mr-1" />
            Bookmark
          </Button>
        </div>
      </div>
    </>
  );
};
