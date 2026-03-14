// LandmarkJudgmentLibrary.tsx — Searchable cards for landmark judgments
import React, { useState } from 'react';

const MOCK_JUDGMENTS = [
  { title: 'Vishaka v. State of Rajasthan', takeaway: 'Established POSH Act framework for sexual harassment at workplace.', link: '#' },
  { title: 'EPF v. Exide Industries', takeaway: 'Clarified PF applicability on allowances.', link: '#' },
  // ...more
];

const LandmarkJudgmentLibrary: React.FC = () => {
  const [search, setSearch] = useState('');
  const filtered = MOCK_JUDGMENTS.filter(j => j.title.toLowerCase().includes(search.toLowerCase()) || j.takeaway.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="p-4">
      <h3 className="font-mono text-lg mb-2">Landmark Judgments</h3>
      <input
        className="w-full mb-3 px-2 py-1 border border-border rounded font-mono text-xs"
        placeholder="Search judgments..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((j, i) => (
          <div key={i} className="bg-secondary/20 border border-border rounded p-3">
            <div className="font-mono font-bold text-primary mb-1">{j.title}</div>
            <div className="text-xs text-muted-foreground mb-2">{j.takeaway}</div>
            <a href={j.link} className="text-xs text-primary underline">Read more</a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LandmarkJudgmentLibrary;
