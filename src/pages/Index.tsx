import React, { useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { TickerStrip } from '@/components/TickerStrip';
import { FilterSidebar } from '@/components/FilterSidebar';
import { DocumentFeed } from '@/components/DocumentFeed';
import { ChangeHeatmap } from '@/components/ChangeHeatmap';
import { ComplianceCalendar } from '@/components/ComplianceCalendar';
import { AlertPanel } from '@/components/AlertPanel';
import { DocumentViewer } from '@/components/DocumentViewer';
import { AuthModal } from '@/components/AuthModal';
import type { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];

const Index: React.FC = () => {
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleFilterChange = useCallback((group: string, key: string) => {
    setFilters((prev) => {
      const current = prev[group] || [];
      const updated = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key];
      return { ...prev, [group]: updated };
    });
  }, []);

  const handleHeatmapClick = useCallback((category: string, _start: Date, _end: Date) => {
    setFilters(prev => ({ ...prev, category: [category] }));
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // Search is applied via filters — for now we pass it through
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <TickerStrip />
      <AuthModal />
      <DocumentViewer document={selectedDoc} onClose={() => setSelectedDoc(null)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — filter tree + search */}
        <FilterSidebar activeFilters={filters} onFilterChange={handleFilterChange} onSearch={handleSearch} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {/* Live feed — left panel */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
              <DocumentFeed filters={filters} onDocumentClick={setSelectedDoc} />
            </div>

            {/* Centre + right panels */}
            <div className="hidden lg:flex flex-col w-[420px] overflow-hidden">
              {/* Heatmap — centre panel */}
              <div className="border-b border-border overflow-y-auto p-2" style={{ maxHeight: '280px' }}>
                <ChangeHeatmap onCellClick={handleHeatmapClick} />
              </div>

              {/* Alert panel — right panel */}
              <div className="flex-1 overflow-hidden">
                <AlertPanel />
              </div>
            </div>
          </div>

          {/* Calendar — bottom panel */}
          <div className="border-t border-border overflow-y-auto" style={{ maxHeight: '240px' }}>
            <div className="p-2">
              <ComplianceCalendar onDocumentClick={setSelectedDoc} />
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="h-6 bg-card border-t border-border flex items-center px-4 gap-6 flex-shrink-0">
        <span className="text-[10px] font-mono text-primary">● LIVE</span>
        <span className="text-[10px] font-mono text-terminal-dim">
          SHORTCUTS: [L]abour [T]ax [A]lerts [C]alculator [M]ap [S]earch [K]anban
        </span>
        <span className="text-[10px] font-mono text-terminal-dim ml-auto">
          COMPLIANCE TERMINAL v1.0 — {new Date().toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default Index;
