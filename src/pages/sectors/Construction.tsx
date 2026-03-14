// Construction sector dashboard
import React from 'react';
import DocumentFeed from '@/components/DocumentFeed';
import SectorStatsBar from '@/components/SectorStatsBar';

const stats = { 'Active Laws': 15, 'Pending Tasks': 5, 'Upcoming Deadlines': 2 };

const Construction: React.FC = () => (
  <div className="p-6">
    <h1 className="font-mono text-2xl mb-2">Construction</h1>
    <SectorStatsBar stats={stats} />
    {/* Pre-filtered Live Feed: Labour + Environment + Municipal */}
    <DocumentFeed filters={{ category: ['labour', 'environment', 'municipal'] }} />
  </div>
);

export default Construction;
