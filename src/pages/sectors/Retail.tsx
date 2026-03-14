// Retail sector dashboard
import React from 'react';
import DocumentFeed from '@/components/DocumentFeed';
import SectorStatsBar from '@/components/SectorStatsBar';

const stats = { 'Active Laws': 11, 'Pending Tasks': 3, 'Upcoming Deadlines': 1 };

const Retail: React.FC = () => (
  <div className="p-6">
    <h1 className="font-mono text-2xl mb-2">Retail</h1>
    <SectorStatsBar stats={stats} />
    {/* Pre-filtered Live Feed: Tax + Labour + Municipal */}
    <DocumentFeed filters={{ category: ['tax', 'labour', 'municipal'] }} />
  </div>
);

export default Retail;
