// IT/ITES sector dashboard
import React from 'react';
import DocumentFeed from '@/components/DocumentFeed';
import SectorStatsBar from '@/components/SectorStatsBar';

const stats = { 'Active Laws': 12, 'Pending Tasks': 2, 'Upcoming Deadlines': 1 };

const IT: React.FC = () => (
  <div className="p-6">
    <h1 className="font-mono text-2xl mb-2">IT / ITES</h1>
    <SectorStatsBar stats={stats} />
    {/* Pre-filtered Live Feed: Labour + Tax + Corporate */}
    <DocumentFeed filters={{ category: ['labour', 'tax', 'corporate'] }} />
  </div>
);

export default IT;
