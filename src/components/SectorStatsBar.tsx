// SectorStatsBar.tsx — Quick stats bar for sector dashboards
import React from 'react';

const SectorStatsBar: React.FC<{ stats: Record<string, string | number> }> = ({ stats }) => (
  <div className="flex gap-4 bg-secondary/30 border border-border rounded p-2 mb-4">
    {Object.entries(stats).map(([label, value]) => (
      <div key={label} className="flex flex-col items-center">
        <span className="text-xs font-mono text-terminal-dim">{label}</span>
        <span className="text-lg font-mono font-bold text-primary">{value}</span>
      </div>
    ))}
  </div>
);

export default SectorStatsBar;
