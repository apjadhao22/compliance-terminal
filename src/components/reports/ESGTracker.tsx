// ESGTracker.tsx — ESG/BRSR compliance tracker + PDF
import React from 'react';
// import { PDFDownloadLink, Document, Page, Text } from '@react-pdf/renderer';

const ESGTracker: React.FC = () => {
  // TODO: Fetch ESG/BRSR data, obligations, evidence, PDF
  return (
    <div className="mb-6">
      <h2 className="font-mono text-lg mb-2">ESG / BRSR Compliance Tracker</h2>
      <table className="w-full text-xs font-mono border border-border rounded mb-2">
        <thead>
          <tr className="bg-secondary/30">
            <th>Obligation</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Evidence?</th>
          </tr>
        </thead>
        <tbody>
          {/* TODO: Map obligations */}
        </tbody>
      </table>
      {/* <PDFDownloadLink document={<MyPDF />} fileName="esg-compliance.pdf"> */}
      <button className="bg-primary text-black px-3 py-1 rounded font-mono">Download PDF</button>
      {/* </PDFDownloadLink> */}
    </div>
  );
};

export default ESGTracker;
