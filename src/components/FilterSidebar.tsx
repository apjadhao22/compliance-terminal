import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Filter, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';

interface FilterNode {
  label: string;
  key: string;
  filterGroup: string;
  filterValue: string;
  children?: FilterNode[];
}

const SUBCATEGORIES = ['Labour', 'Tax', 'GST', 'Corporate', 'Environment', 'FSSAI', 'Municipal', 'BFSI', 'Export'];

const buildStateNode = (label: string, key: string): FilterNode => ({
  label,
  key,
  filterGroup: 'state',
  filterValue: key,
  children: SUBCATEGORIES.map(sc => ({
    label: sc,
    key: `${key}_${sc.toLowerCase()}`,
    filterGroup: 'category',
    filterValue: sc.toLowerCase(),
  })),
});

const FILTER_TREE: FilterNode[] = [
  {
    label: 'Central',
    key: 'central',
    filterGroup: 'state',
    filterValue: 'central',
    children: SUBCATEGORIES.map(sc => ({
      label: sc,
      key: `central_${sc.toLowerCase()}`,
      filterGroup: 'category',
      filterValue: sc.toLowerCase(),
    })),
  },
  buildStateNode('Maharashtra', 'maharashtra'),
  buildStateNode('Karnataka', 'karnataka'),
  buildStateNode('Gujarat', 'gujarat'),
  buildStateNode('Tamil Nadu', 'tamil_nadu'),
  buildStateNode('Telangana', 'telangana'),
  buildStateNode('Andhra Pradesh', 'andhra_pradesh'),
  {
    label: 'Judiciary',
    key: 'judiciary',
    filterGroup: 'doc_type',
    filterValue: 'court_order',
    children: [
      { label: 'Supreme Court', key: 'sc', filterGroup: 'doc_type', filterValue: 'court_order' },
      { label: 'High Courts', key: 'hc', filterGroup: 'doc_type', filterValue: 'court_order' },
      { label: 'NCLT', key: 'nclt', filterGroup: 'doc_type', filterValue: 'court_order' },
      { label: 'NGT', key: 'ngt', filterGroup: 'doc_type', filterValue: 'court_order' },
      { label: 'Labour Court', key: 'lc', filterGroup: 'doc_type', filterValue: 'court_order' },
    ],
  },
];

interface FilterSidebarProps {
  activeFilters: Record<string, string[]>;
  onFilterChange: (group: string, key: string) => void;
  onSearch: (query: string) => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ activeFilters, onFilterChange, onSearch }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ central: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});
  const [impactRange, setImpactRange] = useState<number[]>([1, 10]);

  // Fetch counts
  useEffect(() => {
    const fetchCounts = async () => {
      const { data } = await supabase
        .from('documents')
        .select('category, state, document_type');
      if (!data) return;

      const counts: Record<string, number> = {};
      data.forEach(d => {
        if (d.category) counts[d.category] = (counts[d.category] || 0) + 1;
        if (d.state) counts[d.state] = (counts[d.state] || 0) + 1;
        if (d.document_type) counts[d.document_type] = (counts[d.document_type] || 0) + 1;
      });
      setDocCounts(counts);
    };
    fetchCounts();
  }, []);

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const getCount = (node: FilterNode): number => {
    return docCounts[node.filterValue] || 0;
  };

  const renderNode = (node: FilterNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded[node.key];
    const isActive = activeFilters[node.filterGroup]?.includes(node.filterValue);
    const count = getCount(node);

    return (
      <div key={node.key}>
        <button
          onClick={() => {
            if (hasChildren) toggleExpand(node.key);
            onFilterChange(node.filterGroup, node.filterValue);
          }}
          className={`flex items-center gap-1 w-full px-2 py-1 text-xs font-mono rounded transition-colors ${
            isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {hasChildren && (
            isExpanded
              ? <ChevronDown className="h-3 w-3 text-terminal-dim flex-shrink-0" />
              : <ChevronRight className="h-3 w-3 text-terminal-dim flex-shrink-0" />
          )}
          {!hasChildren && <span className="w-3 flex-shrink-0" />}
          <span className="flex-1 text-left truncate">{node.label}</span>
          {count > 0 && (
            <span className="text-[9px] font-mono text-terminal-dim bg-secondary px-1 rounded flex-shrink-0">{count}</span>
          )}
        </button>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-56 bg-card border-r border-border flex flex-col flex-shrink-0">
      {/* Search */}
      <div className="p-2 border-b border-border">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-terminal-dim" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="h-7 pl-7 pr-7 text-xs font-mono bg-secondary border-border"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); onSearch(''); }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="h-3 w-3 text-terminal-dim hover:text-foreground" />
            </button>
          )}
        </form>
      </div>

      {/* Filter header */}
      <div className="p-2 border-b border-border flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-mono font-bold text-primary">JURISDICTION TREE</span>
      </div>

      {/* Tree */}
      <ScrollArea className="flex-1">
        <div className="p-1 space-y-0.5">
          {FILTER_TREE.map(node => renderNode(node))}
        </div>
      </ScrollArea>

      {/* Impact score slider */}
      <div className="p-3 border-t border-border">
        <span className="text-[10px] font-mono text-muted-foreground block mb-2">IMPACT SCORE</span>
        <Slider
          value={impactRange}
          onValueChange={setImpactRange}
          min={1}
          max={10}
          step={1}
          className="mb-1"
        />
        <div className="flex justify-between text-[9px] font-mono text-terminal-dim">
          <span>{impactRange[0]}</span>
          <span>{impactRange[1]}</span>
        </div>
      </div>
    </aside>
  );
};
