import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanColumnProps {
  id: string;
  label: string;
  color: string;
  count: number;
  children: React.ReactNode;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, label, color, count, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`w-72 flex flex-col bg-card border rounded transition-colors ${
        isOver ? 'border-primary/50 bg-primary/5' : 'border-border'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
        <span className={`text-[10px] font-mono font-bold ${color}`}>{label}</span>
        <span className="text-[10px] font-mono text-terminal-dim bg-secondary px-1.5 py-0.5 rounded">{count}</span>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2 min-h-[100px]">
          {children}
        </div>
      </ScrollArea>
    </div>
  );
};
