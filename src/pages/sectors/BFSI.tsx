// BFSI sector dashboard
import React from 'react';
import DocumentFeed from '@/components/DocumentFeed';
import SectorStatsBar from '@/components/SectorStatsBar';

const stats = { 'Active Laws': 13, 'Pending Tasks': 2, 'Upcoming Deadlines': 1 };

const BFSI: React.FC = () => (
  <div className="p-6">
    <h1 className="font-mono text-2xl mb-2">BFSI</h1>
    <SectorStatsBar stats={stats} />
    {/* Pre-filtered Live Feed: Corporate + Tax + Export */}
    <DocumentFeed filters={{ category: ['corporate', 'tax', 'export'] }} />
  </div>
);

export default BFSI;
