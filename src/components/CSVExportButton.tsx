// CSVExportButton.tsx — Export visible data as CSV
import React from 'react';

function toCSV(rows: any[], columns: string[]): string {
  const header = columns.join(',');
  const body = rows.map(row => columns.map(col => JSON.stringify(row[col] ?? '')).join(',')).join('\n');
  return header + '\n' + body;
}

const CSVExportButton: React.FC<{ data: any[]; columns: string[]; section: string }> = ({ data, columns, section }) => {
  const handleExport = () => {
    const csv = toCSV(data, columns);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-terminal-${section}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button className="bg-terminal-cyan text-black px-2 py-1 rounded font-mono text-xs" onClick={handleExport}>
      Export CSV
    </button>
  );
};

export default CSVExportButton;
