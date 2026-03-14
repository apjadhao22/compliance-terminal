// VirtualizedList.tsx — react-virtual wrapper for large lists
import React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualizedList: React.FC<{ items: any[]; rowHeight: number; renderRow: (item: any, i: number) => React.ReactNode }> = ({ items, rowHeight, renderRow }) => {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
  });
  return (
    <div ref={parentRef} style={{ height: 600, overflow: 'auto' }}>
      <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            {renderRow(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VirtualizedList;
