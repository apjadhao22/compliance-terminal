// ComplianceStatusReport.tsx — PDF for logged-in user
import React from 'react';
// import { PDFDownloadLink, Document, Page, Text } from '@react-pdf/renderer';

const ComplianceStatusReport: React.FC = () => {
  // TODO: Fetch user/company data, health score, laws, tasks, deadlines, liability
  return (
    <div className="mb-6">
      <h2 className="font-mono text-lg mb-2">Compliance Status Report</h2>
      {/* <PDFDownloadLink document={<MyPDF />} fileName="compliance-status.pdf"> */}
      <button className="bg-primary text-black px-3 py-1 rounded font-mono">Download PDF</button>
      {/* </PDFDownloadLink> */}
    </div>
  );
};

export default ComplianceStatusReport;
