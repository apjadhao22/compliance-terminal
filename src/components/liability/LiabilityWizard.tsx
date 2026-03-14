import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronRight, ChevronLeft, Check, Zap, Building2, Users, MapPin, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  LiabilityProfile,
  INDUSTRY_TYPES,
  HEADCOUNT_OPTIONS,
  CONTRACT_OPTIONS,
  WORKFORCE_NATURE_OPTIONS,
  INDIAN_STATES_FULL,
} from '@/lib/compliance-rules';

interface LiabilityWizardProps {
  onComplete: (profile: LiabilityProfile) => void;
}

const STEPS = [
  { title: 'Business Profile', icon: Building2 },
  { title: 'Workforce', icon: Users },
  { title: 'Geography', icon: MapPin },
  { title: 'Review & Generate', icon: FileCheck },
];

export const LiabilityWizard: React.FC<LiabilityWizardProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<LiabilityProfile>({
    companyName: user?.user_metadata?.company_name || '',
    industryType: '',
    inSez: false,
    headcountBracket: '',
    contractWorkerBracket: '0',
    workforceNature: [],
    employsWomen: false,
    hasCanteen: false,
    states: [],
    primaryCity: '',
    multipleLocations: false,
  });

  const update = (key: keyof LiabilityProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const toggleWorkforce = (nature: string) => {
    setProfile(prev => ({
      ...prev,
      workforceNature: prev.workforceNature.includes(nature)
        ? prev.workforceNature.filter(n => n !== nature)
        : [...prev.workforceNature, nature],
    }));
  };

  const toggleState = (state: string) => {
    setProfile(prev => ({
      ...prev,
      states: prev.states.includes(state)
        ? prev.states.filter(s => s !== state)
        : [...prev.states, state],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return profile.industryType !== '';
      case 1: return profile.headcountBracket !== '' && profile.workforceNature.length > 0;
      case 2: return profile.states.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('liability_profiles').upsert({
        user_id: user!.id,
        industry_type: profile.industryType,
        headcount_bracket: profile.headcountBracket,
        contract_worker_bracket: profile.contractWorkerBracket,
        workforce_nature: profile.workforceNature.join(', '),
        employs_women: profile.employsWomen,
        has_canteen: profile.hasCanteen,
        in_sez: profile.inSez,
        states: profile.states,
        primary_city: profile.primaryCity,
        multiple_locations: profile.multipleLocations,
      });
      if (error) throw error;

      // Also update company name in user_profiles
      await supabase.from('user_profiles').update({
        company_name: profile.companyName,
      }).eq('id', user!.id);

      toast.success('Profile saved!');
      onComplete(profile);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const ButtonSelector = ({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) => (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-4 py-2 text-xs font-mono rounded border transition-all ${
            value === opt
              ? 'bg-primary/20 text-primary border-primary/50 ring-1 ring-primary/30'
              : 'bg-secondary text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                i < step ? 'bg-primary border-primary text-primary-foreground'
                : i === step ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-terminal-dim'
              }`}>
                {i < step ? <Check className="h-5 w-5" /> : <s.icon className="h-4 w-4" />}
              </div>
              <span className={`text-[10px] font-mono ${i <= step ? 'text-primary' : 'text-terminal-dim'}`}>
                {s.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-primary' : 'bg-border'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-card border border-border rounded-lg p-6 min-h-[320px]">
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-mono font-bold text-primary glow-green">BUSINESS PROFILE</h3>
            <div>
              <Label className="text-xs font-mono text-muted-foreground">COMPANY NAME</Label>
              <Input value={profile.companyName} onChange={e => update('companyName', e.target.value)}
                className="bg-secondary border-border font-mono text-sm mt-1" placeholder="Your Company Pvt Ltd" />
            </div>
            <div>
              <Label className="text-xs font-mono text-muted-foreground">INDUSTRY / ESTABLISHMENT TYPE</Label>
              <Select value={profile.industryType} onValueChange={v => update('industryType', v)}>
                <SelectTrigger className="bg-secondary border-border font-mono text-sm mt-1">
                  <SelectValue placeholder="Select industry type" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono text-muted-foreground">OPERATING IN SEZ / MIDC / EXPORT ZONE?</Label>
              <Switch checked={profile.inSez} onCheckedChange={v => update('inSez', v)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h3 className="text-sm font-mono font-bold text-primary glow-green">WORKFORCE</h3>
            <div>
              <Label className="text-xs font-mono text-muted-foreground mb-2 block">TOTAL HEADCOUNT</Label>
              <ButtonSelector options={HEADCOUNT_OPTIONS} value={profile.headcountBracket} onChange={v => update('headcountBracket', v)} />
            </div>
            <div>
              <Label className="text-xs font-mono text-muted-foreground mb-2 block">CONTRACT WORKERS</Label>
              <ButtonSelector options={CONTRACT_OPTIONS} value={profile.contractWorkerBracket} onChange={v => update('contractWorkerBracket', v)} />
            </div>
            <div>
              <Label className="text-xs font-mono text-muted-foreground mb-2 block">NATURE OF WORKFORCE (multi-select)</Label>
              <div className="flex flex-wrap gap-2">
                {WORKFORCE_NATURE_OPTIONS.map(n => (
                  <button key={n} onClick={() => toggleWorkforce(n)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-full border transition-all ${
                      profile.workforceNature.includes(n)
                        ? 'bg-terminal-cyan/20 text-terminal-cyan border-terminal-cyan/50'
                        : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-8">
              <div className="flex items-center gap-3">
                <Label className="text-xs font-mono text-muted-foreground">EMPLOYS WOMEN?</Label>
                <Switch checked={profile.employsWomen} onCheckedChange={v => update('employsWomen', v)} />
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-xs font-mono text-muted-foreground">CANTEEN / HOSTEL?</Label>
                <Switch checked={profile.hasCanteen} onCheckedChange={v => update('hasCanteen', v)} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-mono font-bold text-primary glow-green">GEOGRAPHY</h3>
            <div>
              <Label className="text-xs font-mono text-muted-foreground mb-2 block">STATES OF OPERATION (click to select)</Label>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {INDIAN_STATES_FULL.map(state => (
                  <button key={state} onClick={() => toggleState(state)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-all ${
                      profile.states.includes(state)
                        ? 'bg-primary/20 text-primary border-primary/50'
                        : 'bg-secondary text-muted-foreground border-border hover:text-foreground'
                    }`}>
                    {state}
                  </button>
                ))}
              </div>
              {profile.states.length > 0 && (
                <div className="mt-2 text-[10px] font-mono text-terminal-cyan">
                  Selected: {profile.states.join(', ')}
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs font-mono text-muted-foreground">PRIMARY CITY</Label>
              <Input value={profile.primaryCity} onChange={e => update('primaryCity', e.target.value)}
                className="bg-secondary border-border font-mono text-sm mt-1" placeholder="Mumbai" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono text-muted-foreground">MULTIPLE LOCATIONS?</Label>
              <Switch checked={profile.multipleLocations} onCheckedChange={v => update('multipleLocations', v)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-mono font-bold text-primary glow-green">REVIEW YOUR PROFILE</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Company', profile.companyName || '—'],
                ['Industry', profile.industryType || '—'],
                ['SEZ/MIDC', profile.inSez ? 'Yes' : 'No'],
                ['Headcount', profile.headcountBracket || '—'],
                ['Contract Workers', profile.contractWorkerBracket || '—'],
                ['Workforce', profile.workforceNature.join(', ') || '—'],
                ['Women Employed', profile.employsWomen ? 'Yes' : 'No'],
                ['Canteen/Hostel', profile.hasCanteen ? 'Yes' : 'No'],
                ['States', profile.states.join(', ') || '—'],
                ['City', profile.primaryCity || '—'],
                ['Multi-location', profile.multipleLocations ? 'Yes' : 'No'],
              ].map(([label, value]) => (
                <div key={label} className="bg-secondary/50 rounded p-2">
                  <div className="text-[9px] font-mono text-terminal-dim">{label}</div>
                  <div className="text-xs font-mono text-foreground truncate">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 0}
          className="font-mono text-xs border-border">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>

        {step < 3 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
            className="font-mono text-xs bg-primary text-primary-foreground">
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={saving}
            className="font-mono text-xs bg-warning text-warning-foreground hover:bg-warning/90 px-6">
            <Zap className="h-4 w-4 mr-1" />
            {saving ? 'Generating...' : '⚡ Generate My Compliance Report'}
          </Button>
        )}
      </div>
    </div>
  );
};
