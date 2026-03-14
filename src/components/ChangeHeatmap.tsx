import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, isWithinInterval, startOfDay } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const CATEGORIES = ['labour', 'tax', 'gst', 'corporate', 'environment', 'fssai', 'municipal', 'bfsi', 'export'];
const CATEGORY_LABELS: Record<string, string> = {
  labour: 'Labour', tax: 'Tax', gst: 'GST', corporate: 'Corporate',
  environment: 'Environment', fssai: 'FSSAI', municipal: 'Municipal', bfsi: 'BFSI', export: 'Export',
};

interface HeatmapDoc {
  category: string | null;
  published_at: string | null;
  title: string;
}

interface ChangeHeatmapProps {
  onCellClick: (category: string, startDate: Date, endDate: Date) => void;
}

export const ChangeHeatmap: React.FC<ChangeHeatmapProps> = ({ onCellClick }) => {
  const [docs, setDocs] = useState<HeatmapDoc[]>([]);
  const [timeRange, setTimeRange] = useState<30 | 90 | 365>(30);

  useEffect(() => {
    const fetchDocs = async () => {
      const { data } = await supabase
        .from('documents')
        .select('category, published_at, title')
        .gte('published_at', subDays(new Date(), 365).toISOString())
        .order('published_at', { ascending: false });
      if (data) setDocs(data);
    };
    fetchDocs();
  }, []);

  const { grid, columns } = useMemo(() => {
    const now = new Date();
    const numCols = timeRange <= 30 ? 30 : timeRange <= 90 ? 18 : 12;
    const daysPerCol = Math.floor(timeRange / numCols);

    const columns: { start: Date; end: Date; label: string }[] = [];
    for (let i = numCols - 1; i >= 0; i--) {
      const start = startOfDay(subDays(now, (i + 1) * daysPerCol));
      const end = startOfDay(subDays(now, i * daysPerCol));
      columns.push({
        start,
        end,
        label: timeRange <= 30 ? format(start, 'dd') : timeRange <= 90 ? format(start, 'dd MMM') : format(start, 'MMM'),
      });
    }

    const grid: { count: number; titles: string[] }[][] = CATEGORIES.map(cat =>
      columns.map(col => {
        const matching = docs.filter(d =>
          d.category === cat &&
          d.published_at &&
          isWithinInterval(new Date(d.published_at), { start: col.start, end: col.end })
        );
        return { count: matching.length, titles: matching.slice(0, 3).map(d => d.title) };
      })
    );

    return { grid, columns };
  }, [docs, timeRange]);

  const maxCount = Math.max(1, ...grid.flat().map(c => c.count));

  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-secondary/30';
    const intensity = count / maxCount;
    if (intensity > 0.7) return 'bg-destructive/80';
    if (intensity > 0.4) return 'bg-warning/60';
    if (intensity > 0.2) return 'bg-warning/30';
    return 'bg-primary/30';
  };

  return (
    <div className="bg-card border border-border rounded p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-bold text-primary glow-green">CHANGE HEATMAP</span>
        <div className="flex gap-1">
          {([30, 90, 365] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                timeRange === range
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {range}D
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Column headers */}
          <div className="flex mb-1" style={{ paddingLeft: '80px' }}>
            {columns.map((col, i) => (
              <div key={i} className="flex-1 text-center text-[8px] font-mono text-terminal-dim truncate">
                {i % (timeRange <= 30 ? 5 : timeRange <= 90 ? 3 : 1) === 0 ? col.label : ''}
              </div>
            ))}
          </div>

          {/* Rows */}
          {CATEGORIES.map((cat, rowIdx) => (
            <div key={cat} className="flex items-center mb-0.5">
              <div className="w-20 text-[10px] font-mono text-muted-foreground truncate pr-2 text-right flex-shrink-0">
                {CATEGORY_LABELS[cat]}
              </div>
              <div className="flex flex-1 gap-0.5">
                {grid[rowIdx].map((cell, colIdx) => (
                  <Tooltip key={colIdx}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onCellClick(cat, columns[colIdx].start, columns[colIdx].end)}
                        className={`flex-1 h-5 rounded-sm ${getCellColor(cell.count)} hover:ring-1 hover:ring-primary/50 transition-all`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-card border-border text-xs font-mono max-w-xs">
                      <div className="text-primary font-bold">{cell.count} document{cell.count !== 1 ? 's' : ''}</div>
                      <div className="text-terminal-dim">{CATEGORY_LABELS[cat]} — {columns[colIdx].label}</div>
                      {cell.titles.length > 0 && (
                        <ul className="mt-1 space-y-0.5 text-muted-foreground">
                          {cell.titles.map((t, i) => (
                            <li key={i} className="truncate">• {t}</li>
                          ))}
                        </ul>
                      )}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-2">
        <span className="text-[8px] font-mono text-terminal-dim">Less</span>
        {['bg-secondary/30', 'bg-primary/30', 'bg-warning/30', 'bg-warning/60', 'bg-destructive/80'].map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-[8px] font-mono text-terminal-dim">More</span>
      </div>
    </div>
  );
};
