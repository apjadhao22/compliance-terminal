import React, { useState, useCallback, useEffect } from 'react';
import { Header } from '@/components/Header';
import { TickerStrip } from '@/components/TickerStrip';
import { FilterSidebar } from '@/components/FilterSidebar';
import { DocumentFeed } from '@/components/DocumentFeed';
import { StatsPanel } from '@/components/StatsPanel';
import { AuthModal } from '@/components/AuthModal';

const KEYBOARD_MAP: Record<string, string> = {
  l: '/',
  t: '/',
  s: '/',
  m: '/map',
};

const Index: React.FC = () => {
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  const handleFilterChange = useCallback((group: string, key: string) => {
    setFilters((prev) => {
      const current = prev[group] || [];
      const updated = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key];
      return { ...prev, [group]: updated };
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (KEYBOARD_MAP[key]) {
        // handled at router level for navigation
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <TickerStrip />
      <AuthModal />

      <div className="flex flex-1 overflow-hidden">
        <FilterSidebar activeFilters={filters} onFilterChange={handleFilterChange} />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Main feed */}
          <DocumentFeed filters={filters} />

          {/* Stats panel */}
          <div className="hidden lg:block w-72 border-l border-border overflow-y-auto p-3">
            <StatsPanel />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="h-6 bg-card border-t border-border flex items-center px-4 gap-6">
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
