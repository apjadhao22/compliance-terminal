import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type Document = Database['public']['Tables']['documents']['Row'];

export const StatsPanel: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      const { data } = await supabase.from('documents').select('category, urgency, state, impact_score');
      if (data) setDocs(data);
    };
    fetchDocs();
  }, []);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    docs.forEach((d) => {
      if (d.category) counts[d.category] = (counts[d.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [docs]);

  const urgencyData = useMemo(() => {
    const counts: Record<string, number> = {};
    docs.forEach((d) => {
      if (d.urgency) counts[d.urgency] = (counts[d.urgency] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [docs]);

  const URGENCY_COLORS: Record<string, string> = {
    critical: 'hsl(0, 72%, 51%)',
    high: 'hsl(38, 92%, 50%)',
    medium: 'hsl(187, 80%, 48%)',
    low: 'hsl(215, 14%, 35%)',
  };

  const avgImpact = docs.length
    ? (docs.reduce((sum, d) => sum + (d.impact_score || 0), 0) / docs.length).toFixed(1)
    : '0';

  return (
    <div className="bg-card border border-border rounded p-3 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono font-bold text-primary glow-green">OVERVIEW</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-secondary rounded p-2 text-center">
          <div className="text-lg font-mono font-bold text-primary">{docs.length}</div>
          <div className="text-[10px] font-mono text-muted-foreground">DOCUMENTS</div>
        </div>
        <div className="bg-secondary rounded p-2 text-center">
          <div className="text-lg font-mono font-bold text-warning">
            {docs.filter((d) => d.urgency === 'critical').length}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">CRITICAL</div>
        </div>
        <div className="bg-secondary rounded p-2 text-center">
          <div className="text-lg font-mono font-bold text-terminal-cyan">{avgImpact}</div>
          <div className="text-[10px] font-mono text-muted-foreground">AVG IMPACT</div>
        </div>
      </div>

      {/* Category bar chart */}
      <div>
        <span className="text-[10px] font-mono text-muted-foreground mb-2 block">BY CATEGORY</span>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={categoryData}>
            <XAxis dataKey="name" tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'hsl(215, 14%, 50%)' }} />
            <YAxis tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'hsl(215, 14%, 50%)' }} width={20} />
            <Tooltip
              contentStyle={{
                background: 'hsl(215, 22%, 11%)',
                border: '1px solid hsl(215, 19%, 20%)',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
              }}
            />
            <Bar dataKey="value" fill="hsl(142, 71%, 45%)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Urgency pie chart */}
      <div>
        <span className="text-[10px] font-mono text-muted-foreground mb-2 block">BY URGENCY</span>
        <ResponsiveContainer width="100%" height={100}>
          <PieChart>
            <Pie
              data={urgencyData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={40}
              innerRadius={20}
              strokeWidth={0}
            >
              {urgencyData.map((entry) => (
                <Cell key={entry.name} fill={URGENCY_COLORS[entry.name] || '#666'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'hsl(215, 22%, 11%)',
                border: '1px solid hsl(215, 19%, 20%)',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-3 mt-1">
          {urgencyData.map((entry) => (
            <span key={entry.name} className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
              <span className="w-2 h-2 rounded-full" style={{ background: URGENCY_COLORS[entry.name] }} />
              {entry.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
