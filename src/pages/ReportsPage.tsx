// ReportsPage.tsx — Main reporting module page
import React from 'react';
import ComplianceStatusReport from '@/components/reports/ComplianceStatusReport';
import AnnualStateChangeReport from '@/components/reports/AnnualStateChangeReport';
import ComplianceCostForecast from '@/components/reports/ComplianceCostForecast';
import ESGTracker from '@/components/reports/ESGTracker';

const ReportsPage: React.FC = () => (
  <div className="p-6">
    <h1 className="font-mono text-2xl mb-4">Reports</h1>
    <ComplianceStatusReport />
    <AnnualStateChangeReport />
    <ComplianceCostForecast />
    <ESGTracker />
  </div>
);

export default ReportsPage;
