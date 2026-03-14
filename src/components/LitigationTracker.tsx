// LitigationTracker.tsx — Litigation tracker panel for dashboard
import React, { useState } from 'react';

const MOCK_CASES = [
  { court: 'Supreme Court', title: 'ABC v. Union of India', date: '2026-02-10', summary: 'Landmark ruling on PF applicability.', status: 'Decided', impact: 'High', link: '#' },
  { court: 'Bombay High Court', title: 'XYZ Ltd. v. State of Maharashtra', date: '2026-01-15', summary: 'Stay on Shops Act amendment.', status: 'Stayed', impact: 'Medium', link: '#' },
  // ...more cases
];

const LitigationTracker: React.FC = () => {
  const [filter, setFilter] = useState({ court: '', category: '', state: '', dateRange: '' });
  // TODO: Add filtering logic, fetch real data
  const hasStay = MOCK_CASES.some(c => c.status === 'Stayed');

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">⚖️</span>
        <h2 className="font-mono text-xl">Court Orders</h2>
      </div>
      {hasStay && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive font-mono px-3 py-2 rounded mb-3">
          ⛔ [Law Name] currently under stay — verify before compliance action
        </div>
      )}
      <table className="w-full text-xs font-mono border border-border rounded mb-4">
        <thead>
          <tr className="bg-secondary/30">
            <th className="p-2">Court</th>
            <th>Case Title</th>
            <th>Date</th>
            <th>Summary</th>
            <th>Status</th>
            <th>Impact</th>
            <th>Link</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_CASES.map((c, i) => (
            <tr key={i} className="border-t border-border">
              <td className="p-2">{c.court}</td>
              <td>{c.title}</td>
              <td>{c.date}</td>
              <td>{c.summary}</td>
              <td>{c.status}</td>
              <td>{c.impact}</td>
              <td><a href={c.link} className="text-primary underline">View</a></td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* TODO: Add filters, highlight rows for logged-in users */}
    </div>
  );
};

export default LitigationTracker;
