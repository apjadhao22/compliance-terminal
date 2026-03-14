import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Download } from 'lucide-react';

const PENALTY_LAWS = [
  {
    act: 'EPF Act',
    section: 'Section 14B',
    basePerDay: 0,
    basePenalty: 5000,
    damagesRate: 0.15, // 15% avg
    description: 'Damages at 5% to 25% of arrears + ₹5,000 fine',
    prosecutionRisk: 'Medium',
  },
  {
    act: 'ESI Act',
    section: 'Section 85',
    basePerDay: 0,
    basePenalty: 5000,
    damagesRate: 0.12,
    description: '₹5,000 fine + prosecution + double contribution',
    prosecutionRisk: 'High',
  },
  {
    act: 'Factories Act',
    section: 'Section 92',
    basePerDay: 1000,
    basePenalty: 200000,
    damagesRate: 0,
    description: '₹2,00,000 + imprisonment up to 2 years',
    prosecutionRisk: 'High',
  },
  {
    act: 'POSH Act',
    section: 'Section 26',
    basePerDay: 0,
    basePenalty: 50000,
    damagesRate: 0,
    description: '₹50,000 fine; repeat offence: double + license cancellation',
    prosecutionRisk: 'Medium',
  },
  {
    act: 'Minimum Wages Act',
    section: 'Section 22',
    basePerDay: 0,
    basePenalty: 50000,
    damagesRate: 0,
    description: '₹50,000 or imprisonment up to 5 years or both',
    prosecutionRisk: 'High',
  },
  {
    act: 'Contract Labour Act',
    section: 'Section 23',
    basePerDay: 0,
    basePenalty: 50000,
    damagesRate: 0,
    description: '₹50,000 + imprisonment up to 3 years',
    prosecutionRisk: 'High',
  },
  {
    act: 'Payment of Gratuity',
    section: 'Section 9',
    basePerDay: 0,
    basePenalty: 10000,
    damagesRate: 0.10,
    description: '₹10,000 or imprisonment up to 2 years or both',
    prosecutionRisk: 'Medium',
  },
  {
    act: 'Professional Tax',
    section: 'State PT Act',
    basePerDay: 5,
    basePenalty: 0,
    damagesRate: 0.10,
    description: '₹5/day penalty + 10% of amount due',
    prosecutionRisk: 'Low',
  },
];

export const PenaltyCalculator: React.FC = () => {
  const [selectedLaw, setSelectedLaw] = useState(PENALTY_LAWS[0].act);
  const [daysNonCompliance, setDaysNonCompliance] = useState(30);
  const [headcount, setHeadcount] = useState(50);
  const [avgSalary, setAvgSalary] = useState(25000);

  const law = PENALTY_LAWS.find(l => l.act === selectedLaw)!;

  const monthlyContribution = avgSalary * 0.12 * headcount; // PF-like
  const arrears = Math.round((monthlyContribution / 30) * daysNonCompliance);
  const penalty = law.basePenalty + (law.basePerDay * daysNonCompliance);
  const damages = Math.round(arrears * law.damagesRate);
  const interest = Math.round(arrears * 0.12 * (daysNonCompliance / 365)); // 12% annual
  const totalExposure = penalty + damages + interest;

  const prosecutionColor = law.prosecutionRisk === 'High' ? 'text-destructive' : law.prosecutionRisk === 'Medium' ? 'text-warning' : 'text-primary';

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-sm font-mono font-bold text-primary mb-4 flex items-center gap-2">
          <span>🧮</span> PENALTY CALCULATOR
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label className="text-xs font-mono text-muted-foreground">SELECT LAW</Label>
            <Select value={selectedLaw} onValueChange={setSelectedLaw}>
              <SelectTrigger className="bg-secondary border-border font-mono text-sm mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PENALTY_LAWS.map(l => <SelectItem key={l.act} value={l.act}>{l.act}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-mono text-muted-foreground">DAYS OF NON-COMPLIANCE</Label>
            <Input type="number" value={daysNonCompliance} onChange={e => setDaysNonCompliance(Number(e.target.value))}
              className="bg-secondary border-border font-mono text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs font-mono text-muted-foreground">HEADCOUNT</Label>
            <Input type="number" value={headcount} onChange={e => setHeadcount(Number(e.target.value))}
              className="bg-secondary border-border font-mono text-sm mt-1" />
          </div>
          <div>
            <Label className="text-xs font-mono text-muted-foreground">AVG MONTHLY SALARY (₹)</Label>
            <Slider value={[avgSalary]} onValueChange={v => setAvgSalary(v[0])} min={10000} max={100000} step={1000} className="mt-3" />
            <div className="text-right text-[10px] font-mono text-terminal-dim mt-1">₹{avgSalary.toLocaleString()}</div>
          </div>
        </div>

        {/* Results */}
        <div className="border border-border rounded p-4 bg-secondary/20 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-xs font-mono font-bold text-warning">CALCULATED PENALTY EXPOSURE</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-card rounded p-3 text-center border border-border">
              <div className="text-lg font-mono font-bold text-destructive">₹{penalty.toLocaleString()}</div>
              <div className="text-[9px] font-mono text-muted-foreground">PENALTY</div>
            </div>
            <div className="bg-card rounded p-3 text-center border border-border">
              <div className="text-lg font-mono font-bold text-warning">₹{damages.toLocaleString()}</div>
              <div className="text-[9px] font-mono text-muted-foreground">DAMAGES</div>
            </div>
            <div className="bg-card rounded p-3 text-center border border-border">
              <div className="text-lg font-mono font-bold text-terminal-cyan">₹{interest.toLocaleString()}</div>
              <div className="text-[9px] font-mono text-muted-foreground">INTEREST</div>
            </div>
            <div className="bg-card rounded p-3 text-center border border-primary/30">
              <div className="text-lg font-mono font-bold text-primary">₹{totalExposure.toLocaleString()}</div>
              <div className="text-[9px] font-mono text-muted-foreground">TOTAL EXPOSURE</div>
            </div>
          </div>

          <div className="mt-3 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Prosecution Risk:</span>
              <span className={`font-bold ${prosecutionColor}`}>{law.prosecutionRisk}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Penalty Clause:</span>
              <span className="text-terminal-cyan">{law.section}</span>
            </div>
            <div className="border-t border-border pt-2 text-muted-foreground">
              {law.description}
            </div>
          </div>
        </div>

        <div className="mt-4 print:hidden">
          <Button onClick={() => window.print()} variant="outline" className="font-mono text-xs border-border">
            <Download className="h-3.5 w-3.5 mr-1" /> Save as PDF
          </Button>
        </div>
      </div>
    </div>
  );
};
