// ReportDownloadButton.tsx — Wrapper for PDF download links
import React from 'react';

const ReportDownloadButton: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button className="bg-primary text-black px-3 py-1 rounded font-mono" onClick={onClick}>{label}</button>
);

export default ReportDownloadButton;
