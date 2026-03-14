import React, { useState, useMemo } from 'react';
import { LiabilityProfile, evaluateLaws, calculateMonthlyCost, getPenaltyExposure, getRegistrations, getLabourCodes, getMultiStateComparison, getComplianceDeadlines, LawEvaluation, CostLine, RegistrationItem } from '@/lib/compliance-rules';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, Cell } from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Check, X, AlertTriangle, Download, ExternalLink, Calendar, Shield, Scale, FileText, ArrowUpRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ComplianceReportProps {
  profile: LiabilityProfile;
}

export const ComplianceReport: React.FC<ComplianceReportProps> = ({ profile }) => {
  const [avgSalary, setAvgSalary] = useState(25000);
  const [regStatuses, setRegStatuses] = useState<Record<string, string>>({});

  const laws = useMemo(() => evaluateLaws(profile), [profile]);
  const costs = useMemo(() => calculateMonthlyCost(profile, avgSalary), [profile, avgSalary]);
  const penalties = useMemo(() => getPenaltyExposure(), []);
  const registrations = useMemo(() => getRegistrations(profile), [profile]);
  const labourCodes = useMemo(() => getLabourCodes(), []);
  const multiState = useMemo(() => getMultiStateComparison(), []);
  const deadlines = useMemo(() => getComplianceDeadlines(profile), [profile]);

  const totalMonthly = costs.reduce((s, c) => s + c.monthlyAmount, 0);
  const totalAnnual = totalMonthly * 12;

  const applicableCount = laws.filter(l => l.applicable === 'yes').length;
  const healthScore = Math.max(20, Math.min(100, 100 - (applicableCount > 15 ? 30 : applicableCount > 10 ? 20 : 10)));

  const forecastData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    cost: totalMonthly + (i % 3 === 0 ? Math.round(totalMonthly * 0.1) : 0), // quarterly bumps
  }));

  const riskLevel = applicableCount > 15 ? 'Critical' : applicableCount > 10 ? 'High' : applicableCount > 5 ? 'Medium' : 'Low';
  const riskColor = riskLevel === 'Critical' ? 'text-destructive' : riskLevel === 'High' ? 'text-warning' : riskLevel === 'Medium' ? 'text-terminal-cyan' : 'text-primary';

  const toggleRegStatus = (portal: string) => {
    setRegStatuses(prev => {
      const current = prev[portal] || 'not_yet';
      const next = current === 'not_yet' ? 'in_progress' : current === 'in_progress' ? 'registered' : 'not_yet';
      return { ...prev, [portal]: next };
    });
  };

  const getStatusIcon = (portal: string) => {
    const status = regStatuses[portal] || 'not_yet';
    if (status === 'registered') return <span className="text-primary">✅</span>;
    if (status === 'in_progress') return <span className="text-warning">🔄</span>;
    return <span className="text-destructive">❌</span>;
  };

  const generateICS = (d: typeof deadlines[0]) => {
    const ics = `BEGIN:VCALENDAR\nBEGIN:VEVENT\nSUMMARY:${d.obligation}\nDESCRIPTION:${d.act} - ${d.frequency}\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${d.obligation.replace(/\s+/g, '_')}.ics`; a.click();
  };

  const handleDownloadPDF = () => {
    // Generate a printable version
    window.print();
  };

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-5xl mx-auto p-6 space-y-6 print:p-2">
        {/* Report header */}
        <div className="bg-card border border-border rounded-lg p-4 print:border-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-mono font-bold text-primary glow-green">
                COMPLIANCE OBLIGATION REPORT
              </h1>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                {profile.companyName} — {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-[10px] font-mono text-terminal-dim mt-0.5">
                {profile.industryType} | {profile.headcountBracket} employees | {profile.states.join(', ')}
              </p>
            </div>
            <Button onClick={handleDownloadPDF} className="font-mono text-xs bg-primary text-primary-foreground print:hidden">
              <Download className="h-3.5 w-3.5 mr-1" /> Download Report
            </Button>
          </div>
        </div>

        {/* Section 1: Applicable Laws Matrix */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-mono font-bold text-primary mb-3 flex items-center gap-2">
            <Scale className="h-4 w-4" /> SECTION 1 — APPLICABLE LAWS MATRIX
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground">Act / Rule</th>
                  <th className="text-center py-2 px-2 text-muted-foreground w-20">Applicable</th>
                  <th className="text-left py-2 px-2 text-muted-foreground">Reason</th>
                  <th className="text-center py-2 px-2 text-muted-foreground w-20">Scope</th>
                  <th className="text-center py-2 px-2 text-muted-foreground w-16">Priority</th>
                  <th className="text-left py-2 px-2 text-muted-foreground">Register</th>
                </tr>
              </thead>
              <tbody>
                {laws.map((law, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="py-1.5 px-2 text-foreground">{law.act}</td>
                    <td className="py-1.5 px-2 text-center">
                      {law.applicable === 'yes' ? <Check className="h-4 w-4 text-primary mx-auto" /> :
                       law.applicable === 'no' ? <X className="h-4 w-4 text-destructive mx-auto" /> :
                       <AlertTriangle className="h-4 w-4 text-warning mx-auto" />}
                    </td>
                    <td className="py-1.5 px-2 text-muted-foreground">{law.reason}</td>
                    <td className="py-1.5 px-2 text-center text-terminal-dim">{law.jurisdiction}</td>
                    <td className="py-1.5 px-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        law.priority === 'High' ? 'bg-destructive/20 text-destructive' :
                        law.priority === 'Medium' ? 'bg-warning/20 text-warning' :
                        'bg-secondary text-muted-foreground'
                      }`}>{law.priority}</span>
                    </td>
                    <td className="py-1.5 px-2 text-terminal-dim text-[10px]">{law.register}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-4 text-[10px] font-mono text-muted-foreground">
            <span><Check className="h-3 w-3 text-primary inline" /> Applicable: {laws.filter(l => l.applicable === 'yes').length}</span>
            <span><X className="h-3 w-3 text-destructive inline" /> Not Applicable: {laws.filter(l => l.applicable === 'no').length}</span>
            <span><AlertTriangle className="h-3 w-3 text-warning inline" /> Conditional: {laws.filter(l => l.applicable === 'conditional').length}</span>
          </div>
        </section>

        {/* Section 2: Cost Estimator */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-mono font-bold text-primary mb-3 flex items-center gap-2">
            <span>💰</span> SECTION 2 — ESTIMATED MONTHLY STATUTORY LIABILITY
          </h2>
          <div className="mb-4">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-[10px] font-mono text-muted-foreground">AVG MONTHLY SALARY: ₹{avgSalary.toLocaleString()}</span>
            </div>
            <Slider value={[avgSalary]} onValueChange={v => setAvgSalary(v[0])} min={10000} max={100000} step={1000} className="max-w-md" />
          </div>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground">Item</th>
                  <th className="text-center py-2 px-2 text-muted-foreground">Rate</th>
                  <th className="text-right py-2 px-2 text-muted-foreground">Monthly (₹)</th>
                  <th className="text-right py-2 px-2 text-muted-foreground">Annual (₹)</th>
                </tr>
              </thead>
              <tbody>
                {costs.map((c, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-1.5 px-2 text-foreground">{c.item}</td>
                    <td className="py-1.5 px-2 text-center text-terminal-dim">{c.rate}</td>
                    <td className="py-1.5 px-2 text-right text-warning">₹{c.monthlyAmount.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right text-terminal-dim">₹{c.annual.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-primary/30 font-bold">
                  <td className="py-2 px-2 text-primary" colSpan={2}>TOTAL ESTIMATED LIABILITY</td>
                  <td className="py-2 px-2 text-right text-primary">₹{totalMonthly.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-primary">₹{totalAnnual.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <span className="text-[10px] font-mono text-muted-foreground mb-2 block">12-MONTH COST FORECAST</span>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={forecastData}>
                <XAxis dataKey="month" tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'hsl(215, 14%, 50%)' }} />
                <YAxis tick={{ fontSize: 9, fontFamily: 'var(--font-mono)', fill: 'hsl(215, 14%, 50%)' }} width={50} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: 'hsl(215, 22%, 11%)', border: '1px solid hsl(215, 19%, 20%)', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                  formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Cost']} />
                <Bar dataKey="cost" fill="hsl(38, 92%, 50%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Section 3: Registration Checklist */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-mono font-bold text-primary mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" /> SECTION 3 — REGISTRATION OBLIGATIONS
          </h2>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground">Portal</th>
                <th className="text-center py-2 px-2 text-muted-foreground">Link</th>
                <th className="text-center py-2 px-2 text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {registrations.filter(r => r.applicable).map((r, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="py-1.5 px-2 text-foreground">{r.portal}</td>
                  <td className="py-1.5 px-2 text-center">
                    {r.url !== '#' && (
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-terminal-cyan hover:underline inline-flex items-center gap-0.5">
                        Visit <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <button onClick={() => toggleRegStatus(r.portal)} className="hover:opacity-80">
                      {getStatusIcon(r.portal)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Section 4: Compliance Calendar */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-mono font-bold text-primary mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> SECTION 4 — COMPLIANCE CALENDAR
          </h2>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground">Obligation</th>
                <th className="text-center py-2 px-2 text-muted-foreground">Frequency</th>
                <th className="text-left py-2 px-2 text-muted-foreground">Due</th>
                <th className="text-left py-2 px-2 text-muted-foreground">Act</th>
                <th className="text-center py-2 px-2 text-muted-foreground print:hidden">📅</th>
              </tr>
            </thead>
            <tbody>
              {deadlines.map((d, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1.5 px-2 text-foreground">{d.obligation}</td>
                  <td className="py-1.5 px-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                      d.frequency === 'Monthly' ? 'bg-warning/20 text-warning' :
                      d.frequency === 'Quarterly' ? 'bg-terminal-cyan/20 text-terminal-cyan' :
                      'bg-secondary text-muted-foreground'
                    }`}>{d.frequency}</span>
                  </td>
                  <td className="py-1.5 px-2 text-terminal-dim">{d.dueDay}</td>
                  <td className="py-1.5 px-2 text-muted-foreground">{d.act}</td>
                  <td className="py-1.5 px-2 text-center print:hidden">
                    <button onClick={() => generateICS(d)} className="text-terminal-cyan hover:text-primary text-[10px]">
                      Add to Cal
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Section 5: Penalty Exposure */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-mono font-bold text-primary mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> SECTION 5 — PENALTY EXPOSURE
          </h2>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2 text-muted-foreground">Act</th>
                <th className="text-left py-2 px-2 text-muted-foreground">Key Obligation</th>
                <th className="text-left py-2 px-2 text-muted-foreground">Penalty for Default</th>
                <th className="text-center py-2 px-2 text-muted-foreground">Frequency</th>
              </tr>
            </thead>
            <tbody>
              {penalties.map((p, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-1.5 px-2 text-foreground">{p.act}</td>
                  <td className="py-1.5 px-2 text-muted-foreground">{p.obligation}</td>
                  <td className="py-1.5 px-2 text-destructive">{p.penalty}</td>
                  <td className="py-1.5 px-2 text-center text-terminal-dim">{p.frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground">RISK LEVEL:</span>
            <span className={`text-sm font-mono font-bold ${riskColor}`}>{riskLevel.toUpperCase()}</span>
            <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden max-w-xs">
              <div className={`h-full rounded-full ${
                riskLevel === 'Critical' ? 'bg-destructive' : riskLevel === 'High' ? 'bg-warning' : riskLevel === 'Medium' ? 'bg-terminal-cyan' : 'bg-primary'
              }`} style={{ width: `${riskLevel === 'Critical' ? 100 : riskLevel === 'High' ? 75 : riskLevel === 'Medium' ? 50 : 25}%` }} />
            </div>
          </div>
        </section>

        {/* Section 6: Health Score */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-mono font-bold text-primary mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" /> SECTION 6 — COMPLIANCE HEALTH SCORE
          </h2>
          <div className="flex items-center gap-8">
            <div className="w-40 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" startAngle={180} endAngle={0} data={[{ value: healthScore, fill: healthScore >= 80 ? 'hsl(142, 71%, 45%)' : healthScore >= 50 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 72%, 51%)' }]}>
                  <RadialBar dataKey="value" cornerRadius={4} background={{ fill: 'hsl(215, 19%, 16%)' }}>
                    {[{ value: healthScore }].map((_, i) => (
                      <Cell key={i} fill={healthScore >= 80 ? 'hsl(142, 71%, 45%)' : healthScore >= 50 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 72%, 51%)'} />
                    ))}
                  </RadialBar>
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="text-center -mt-12">
                <span className={`text-2xl font-mono font-bold ${healthScore >= 80 ? 'text-primary' : healthScore >= 50 ? 'text-warning' : 'text-destructive'}`}>
                  {healthScore}
                </span>
                <span className="text-[10px] font-mono text-terminal-dim block">/100</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {[
                { label: 'Labour', score: Math.min(100, healthScore + 5) },
                { label: 'Tax', score: Math.min(100, healthScore + 10) },
                { label: 'Corporate', score: Math.min(100, healthScore - 5) },
                { label: 'Environmental', score: Math.min(100, healthScore + 15) },
                { label: 'Municipal', score: Math.min(100, healthScore) },
              ].map(cat => (
                <div key={cat.label} className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-muted-foreground w-24">{cat.label}</span>
                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${cat.score >= 80 ? 'bg-primary' : cat.score >= 50 ? 'bg-warning' : 'bg-destructive'}`}
                      style={{ width: `${cat.score}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-terminal-dim w-8">{cat.score}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 7: Labour Codes */}
        <section className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-mono font-bold text-primary mb-3">SECTION 7 — NEW LABOUR CODES IMPACT</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {labourCodes.map((code, i) => (
              <div key={i} className="border border-border rounded p-3 bg-secondary/20">
                <h4 className="text-xs font-mono font-bold text-foreground mb-2">{code.name}</h4>
                <div className="flex flex-wrap gap-1 mb-2">
                  {profile.states.slice(0, 3).map(state => {
                    const stateKey = state.toLowerCase().replace(/\s+/g, '_');
                    const status = code.status[stateKey] || 'Not Notified';
                    return (
                      <span key={state} className={`px-1.5 py-0.5 text-[9px] font-mono rounded ${
                        status === 'Notified' ? 'bg-primary/20 text-primary' :
                        status === 'Partial' ? 'bg-warning/20 text-warning' :
                        'bg-secondary text-muted-foreground'
                      }`}>{state}: {status}</span>
                    );
                  })}
                </div>
                <div className="text-[10px] font-mono text-terminal-dim mb-1">{code.effectiveDate}</div>
                <ul className="space-y-0.5">
                  {code.keyChanges.map((c, j) => (
                    <li key={j} className="text-[10px] font-mono text-muted-foreground">• {c}</li>
                  ))}
                </ul>
                <div className="mt-2 text-[10px] font-mono text-warning font-bold">{code.estimatedImpact}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 8: Multi-State Comparison */}
        {profile.states.length >= 2 && (
          <section className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-sm font-mono font-bold text-primary mb-3">SECTION 8 — MULTI-STATE COMPARISON</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-border">
                    {multiState.headers.map((h, i) => (
                      <th key={i} className={`py-2 px-2 text-muted-foreground ${i === 0 ? 'text-left' : 'text-center'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {multiState.rows.map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {row.map((cell, j) => (
                        <td key={j} className={`py-1.5 px-2 ${j === 0 ? 'text-foreground' : 'text-center text-terminal-dim'}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </ScrollArea>
  );
};
