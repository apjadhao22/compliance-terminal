import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, isWithinInterval } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];

const CATEGORY_COLORS: Record<string, string> = {
  labour: 'bg-primary', tax: 'bg-warning', gst: 'bg-terminal-cyan', corporate: 'bg-accent',
  environment: 'bg-emerald-500', fssai: 'bg-orange-400', municipal: 'bg-violet-400', bfsi: 'bg-blue-400', export: 'bg-rose-400',
};

interface ComplianceCalendarProps {
  onDocumentClick: (doc: Document) => void;
}

export const ComplianceCalendar: React.FC<ComplianceCalendarProps> = ({ onDocumentClick }) => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [zoom, setZoom] = useState<'week' | 'month' | 'quarter'>('month');

  useEffect(() => {
    const fetchDocs = async () => {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .or('deadline_date.not.is.null,effective_date.not.is.null')
        .order('deadline_date', { ascending: true });
      if (data) setDocs(data);
    };
    fetchDocs();
  }, []);

  const { timeSlots, items } = useMemo(() => {
    const now = new Date();
    const slots: { start: Date; end: Date; label: string }[] = [];

    if (zoom === 'week') {
      for (let i = -1; i < 8; i++) {
        const s = startOfWeek(addDays(now, i * 7));
        const e = endOfWeek(addDays(now, i * 7));
        slots.push({ start: s, end: e, label: format(s, 'dd MMM') });
      }
    } else if (zoom === 'month') {
      for (let i = -1; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        slots.push({ start: startOfMonth(d), end: endOfMonth(d), label: format(d, 'MMM yyyy') });
      }
    } else {
      for (let i = -1; i < 4; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i * 3, 1);
        slots.push({ start: startOfQuarter(d), end: endOfQuarter(d), label: `Q${Math.floor(d.getMonth() / 3) + 1} ${format(d, 'yyyy')}` });
      }
    }

    const items = docs.map(doc => {
      const date = doc.deadline_date ? new Date(doc.deadline_date) : doc.effective_date ? new Date(doc.effective_date) : null;
      if (!date) return null;

      const daysLeft = differenceInDays(date, now);
      const slotIdx = slots.findIndex(s => isWithinInterval(date, { start: s.start, end: s.end }));
      if (slotIdx === -1) return null;

      return { doc, date, daysLeft, slotIdx, isDeadline: !!doc.deadline_date };
    }).filter(Boolean) as { doc: Document; date: Date; daysLeft: number; slotIdx: number; isDeadline: boolean }[];

    return { timeSlots: slots, items };
  }, [docs, zoom]);

  return (
    <div className="bg-card border border-border rounded p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-bold text-primary glow-green">COMPLIANCE CALENDAR</span>
        <div className="flex gap-1">
          {(['week', 'month', 'quarter'] as const).map(z => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors uppercase ${
                zoom === z ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Time slots header */}
          <div className="flex border-b border-border mb-2">
            {timeSlots.map((slot, i) => (
              <div key={i} className="flex-1 text-center text-[10px] font-mono text-muted-foreground py-1 border-r border-border last:border-r-0">
                {slot.label}
              </div>
            ))}
          </div>

          {/* Items in Gantt rows */}
          <div className="relative" style={{ minHeight: `${Math.max(80, items.length * 24)}px` }}>
            {items.map((item, idx) => {
              const left = `${(item.slotIdx / timeSlots.length) * 100}%`;
              const width = `${(1 / timeSlots.length) * 100}%`;
              const top = `${(idx % 10) * 24}px`;
              const catColor = CATEGORY_COLORS[item.doc.category || ''] || 'bg-muted';

              return (
                <Tooltip key={item.doc.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onDocumentClick(item.doc)}
                      className={`absolute h-5 rounded-sm ${catColor} hover:brightness-125 transition-all flex items-center px-1 overflow-hidden`}
                      style={{ left, width: `calc(${width} - 4px)`, top, maxWidth: '200px' }}
                    >
                      <span className="text-[8px] font-mono text-primary-foreground truncate font-bold">
                        {item.doc.title}
                      </span>
                      {item.daysLeft >= 0 && item.daysLeft <= 7 && (
                        <span className="ml-1 px-1 py-0 text-[7px] font-mono font-bold bg-destructive text-destructive-foreground rounded flex-shrink-0">
                          {item.daysLeft}d
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-card border-border text-xs font-mono max-w-sm">
                    <div className="font-bold text-foreground">{item.doc.title}</div>
                    <div className="text-terminal-dim">{item.doc.document_type?.toUpperCase()} — {item.doc.source_name}</div>
                    <div className="text-muted-foreground mt-1">
                      {item.isDeadline ? '⏰ Deadline' : '📅 Effective'}: {format(item.date, 'dd MMM yyyy')}
                    </div>
                    {item.daysLeft >= 0 && (
                      <div className={`mt-0.5 ${item.daysLeft <= 7 ? 'text-destructive font-bold' : 'text-warning'}`}>
                        {item.daysLeft === 0 ? '🔴 TODAY' : `${item.daysLeft} days left`}
                      </div>
                    )}
                    {item.daysLeft < 0 && (
                      <div className="text-destructive mt-0.5">{Math.abs(item.daysLeft)} days overdue</div>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
