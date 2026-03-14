// Healthcare sector dashboard
import React from 'react';
import DocumentFeed from '@/components/DocumentFeed';
import SectorStatsBar from '@/components/SectorStatsBar';

const stats = { 'Active Laws': 14, 'Pending Tasks': 2, 'Upcoming Deadlines': 1 };

const Healthcare: React.FC = () => (
  <div className="p-6">
    <h1 className="font-mono text-2xl mb-2">Healthcare</h1>
    <SectorStatsBar stats={stats} />
    {/* Pre-filtered Live Feed: Labour + Environment + Corporate */}
    <DocumentFeed filters={{ category: ['labour', 'environment', 'corporate'] }} />
  </div>
);

export default Healthcare;
