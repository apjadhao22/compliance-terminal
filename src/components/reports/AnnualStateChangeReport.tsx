// AnnualStateChangeReport.tsx — PDF for public state/FY report
import React from 'react';
// import { PDFDownloadLink, Document, Page, Text } from '@react-pdf/renderer';

const AnnualStateChangeReport: React.FC = () => {
  // TODO: State/FY selector, fetch docs, group by category, AI summaries
  return (
    <div className="mb-6">
      <h2 className="font-mono text-lg mb-2">Annual State Change Report</h2>
      {/* <PDFDownloadLink document={<MyPDF />} fileName="state-change-report.pdf"> */}
      <button className="bg-primary text-black px-3 py-1 rounded font-mono">Download PDF</button>
      {/* </PDFDownloadLink> */}
    </div>
  );
};

export default AnnualStateChangeReport;
