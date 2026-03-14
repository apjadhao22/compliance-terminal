import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Filter } from 'lucide-react';

interface FilterNode {
  label: string;
  key: string;
  children?: FilterNode[];
}

const FILTER_TREE: FilterNode[] = [
  {
    label: 'Category',
    key: 'category',
    children: [
      { label: 'Labour', key: 'labour' },
      { label: 'Tax', key: 'tax' },
      { label: 'GST', key: 'gst' },
      { label: 'Corporate', key: 'corporate' },
      { label: 'Environment', key: 'environment' },
      { label: 'FSSAI', key: 'fssai' },
      { label: 'Municipal', key: 'municipal' },
      { label: 'BFSI', key: 'bfsi' },
      { label: 'Export', key: 'export' },
    ],
  },
  {
    label: 'State / Jurisdiction',
    key: 'state',
    children: [
      { label: 'Central', key: 'central' },
      { label: 'Maharashtra', key: 'maharashtra' },
      { label: 'Karnataka', key: 'karnataka' },
      { label: 'Gujarat', key: 'gujarat' },
      { label: 'Tamil Nadu', key: 'tamil_nadu' },
      { label: 'Telangana', key: 'telangana' },
      { label: 'Andhra Pradesh', key: 'andhra_pradesh' },
    ],
  },
  {
    label: 'Urgency',
    key: 'urgency',
    children: [
      { label: '⚠ Critical', key: 'critical' },
      { label: '● High', key: 'high' },
      { label: '● Medium', key: 'medium' },
      { label: '● Low', key: 'low' },
    ],
  },
  {
    label: 'Document Type',
    key: 'doc_type',
    children: [
      { label: 'Act', key: 'act' },
      { label: 'Circular', key: 'circular' },
      { label: 'Order', key: 'order' },
      { label: 'GR', key: 'GR' },
      { label: 'Notification', key: 'notification' },
      { label: 'Gazette', key: 'gazette' },
      { label: 'Court Order', key: 'court_order' },
      { label: 'Rule', key: 'rule' },
      { label: 'Form', key: 'form' },
      { label: 'Directive', key: 'directive' },
    ],
  },
];

interface FilterSidebarProps {
  activeFilters: Record<string, string[]>;
  onFilterChange: (group: string, key: string) => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({ activeFilters, onFilterChange }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    category: true,
    state: true,
    urgency: true,
    doc_type: false,
  });

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="w-56 bg-card border-r border-border overflow-y-auto flex-shrink-0">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-mono font-bold text-primary">FILTERS</span>
      </div>

      <div className="p-2">
        {FILTER_TREE.map((group) => (
          <div key={group.key} className="mb-1">
            <button
              onClick={() => toggleExpand(group.key)}
              className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-mono text-foreground hover:bg-secondary rounded transition-colors"
            >
              {expanded[group.key] ? (
                <ChevronDown className="h-3 w-3 text-terminal-dim" />
              ) : (
                <ChevronRight className="h-3 w-3 text-terminal-dim" />
              )}
              {group.label}
            </button>

            {expanded[group.key] && group.children && (
              <div className="ml-4 space-y-0.5">
                {group.children.map((child) => {
                  const isActive = activeFilters[group.key]?.includes(child.key);
                  return (
                    <button
                      key={child.key}
                      onClick={() => onFilterChange(group.key, child.key)}
                      className={`block w-full text-left px-2 py-1 text-xs font-mono rounded transition-colors ${
                        isActive
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      {child.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};
