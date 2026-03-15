import React, { useState } from 'react';
import { DocumentFeed } from '@/components/DocumentFeed';
import { DocumentViewer } from '@/components/DocumentViewer';
import SectorStatsBar from '@/components/SectorStatsBar';
import type { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];

const CATEGORIES = ['labour', 'environment', 'corporate'];

const Healthcare: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  return (
    <div className="p-6">
      <h1 className="font-mono text-2xl mb-2">Healthcare</h1>
      <SectorStatsBar categories={CATEGORIES} />
      <DocumentFeed filters={{ category: CATEGORIES }} onDocumentClick={setSelectedDoc} />
      <DocumentViewer document={selectedDoc} onClose={() => setSelectedDoc(null)} />
    </div>
  );
};

export default Healthcare;
