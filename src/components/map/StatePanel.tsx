// StatePanel.tsx — Right panel for state/city info
import React from 'react';

interface StatePanelProps {
  state?: string;
  city?: string;
  onClose: () => void;
}

const StatePanel: React.FC<StatePanelProps> = ({ state, city, onClose }) => {
  // TODO: Fetch and display state/city info, active laws, docs, wage/PT/LWF, deadlines, etc.
  return (
    <div className="w-[400px] max-w-full bg-card border-l border-border p-4 h-full overflow-y-auto fixed right-0 top-0 z-40 shadow-2xl">
      <button className="absolute top-2 right-2 text-lg" onClick={onClose}>×</button>
      <h2 className="font-mono text-xl mb-2">{state ? `State: ${state}` : `City: ${city}`}</h2>
      {/* TODO: Render all required state/city info here */}
      <div className="space-y-2">
        {/* Active laws count, latest docs, wage/PT/LWF, deadlines, etc. */}
      </div>
    </div>
  );
};

export default StatePanel;
