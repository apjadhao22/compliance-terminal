// Food & Beverage sector dashboard
import React from 'react';
import DocumentFeed from '@/components/DocumentFeed';
import SectorStatsBar from '@/components/SectorStatsBar';

const stats = { 'Active Laws': 10, 'Pending Tasks': 3, 'Upcoming Deadlines': 1 };

const Food: React.FC = () => (
  <div className="p-6">
    <h1 className="font-mono text-2xl mb-2">Food & Beverage</h1>
    <SectorStatsBar stats={stats} />
    {/* Pre-filtered Live Feed: FSSAI + Labour + Municipal */}
    <DocumentFeed filters={{ category: ['fssai', 'labour', 'municipal'] }} />
  </div>
);

export default Food;
