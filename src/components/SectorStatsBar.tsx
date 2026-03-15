import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SectorStatsBarProps {
  categories: string[];
}

const SectorStatsBar: React.FC<SectorStatsBarProps> = ({ categories }) => {
  const [stats, setStats] = useState<Record<string, number>>({
    'Active Laws': 0,
    'This Month': 0,
    'Critical': 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const catFilter = categories.map(c => `category.eq.${c}`).join(',');
      
      const [totalRes, recentRes, criticalRes] = await Promise.all([
        supabase.from('documents').select('id', { count: 'exact', head: true }).or(catFilter),
        supabase.from('documents').select('id', { count: 'exact', head: true }).or(catFilter)
          .gte('published_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('documents').select('id', { count: 'exact', head: true }).or(catFilter)
          .eq('urgency', 'critical'),
      ]);

      setStats({
        'Active Laws': totalRes.count ?? 0,
        'This Month': recentRes.count ?? 0,
        'Critical': criticalRes.count ?? 0,
      });
    };
    fetchStats();
  }, [categories]);

  return (
    <div className="flex gap-4 bg-secondary/30 border border-border rounded p-2 mb-4">
      {Object.entries(stats).map(([label, value]) => (
        <div key={label} className="flex flex-col items-center">
          <span className="text-xs font-mono text-muted-foreground">{label}</span>
          <span className="text-lg font-mono font-bold text-primary">{value}</span>
        </div>
      ))}
    </div>
  );
};

export default SectorStatsBar;
