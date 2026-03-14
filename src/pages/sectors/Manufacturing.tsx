// Manufacturing sector dashboard
import React from 'react';
import DocumentFeed from '@/components/DocumentFeed';
import SectorStatsBar from '@/components/SectorStatsBar';

const stats = { 'Active Laws': 18, 'Pending Tasks': 4, 'Upcoming Deadlines': 2 };

const Manufacturing: React.FC = () => (
  <div className="p-6">
    <h1 className="font-mono text-2xl mb-2">Manufacturing / Factories</h1>
    <SectorStatsBar stats={stats} />
    {/* Pre-filtered Live Feed: Labour + Environment + FSSAI */}
    <DocumentFeed filters={{ category: ['labour', 'environment', 'fssai'] }} />
  </div>
);

export default Manufacturing;
