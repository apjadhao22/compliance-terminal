// Compliance rules engine — evaluates applicable laws based on business profile

export interface LiabilityProfile {
  companyName: string;
  industryType: string;
  inSez: boolean;
  headcountBracket: string;
  contractWorkerBracket: string;
  workforceNature: string[];
  employsWomen: boolean;
  hasCanteen: boolean;
  states: string[];
  primaryCity: string;
  multipleLocations: boolean;
}

export interface LawEvaluation {
  act: string;
  applicable: 'yes' | 'no' | 'conditional';
  reason: string;
  jurisdiction: 'Central' | 'State';
  priority: 'High' | 'Medium' | 'Low';
  register: string;
}

export interface CostLine {
  item: string;
  rate: string;
  monthlyAmount: number;
  annual: number;
}

export interface PenaltyRow {
  act: string;
  obligation: string;
  penalty: string;
  frequency: string;
}

export interface RegistrationItem {
  portal: string;
  url: string;
  status: 'registered' | 'not_yet' | 'in_progress';
  applicable: boolean;
}

export interface LabourCodeCard {
  name: string;
  status: Record<string, string>;
  effectiveDate: string;
  keyChanges: string[];
  estimatedImpact: string;
}

const getMinHeadcount = (bracket: string): number => {
  const map: Record<string, number> = { '1-9': 1, '10-19': 10, '20-49': 20, '50-99': 50, '100-299': 100, '300+': 300 };
  return map[bracket] || 0;
};

const getMinContractWorkers = (bracket: string): number => {
  const map: Record<string, number> = { '0': 0, '1-19': 1, '20-49': 20, '50+': 50 };
  return map[bracket] || 0;
};

export const evaluateLaws = (profile: LiabilityProfile): LawEvaluation[] => {
  const hc = getMinHeadcount(profile.headcountBracket);
  const cw = getMinContractWorkers(profile.contractWorkerBracket);
  const isFactory = profile.industryType.toLowerCase().includes('factory') || profile.industryType.toLowerCase().includes('manufacturing');
  const isConstruction = profile.industryType.toLowerCase().includes('construction');
  const isFood = profile.industryType.toLowerCase().includes('food') || profile.industryType.toLowerCase().includes('restaurant');
  const isHealthcare = profile.industryType.toLowerCase().includes('healthcare') || profile.industryType.toLowerCase().includes('hospital');
  const hasApprentices = profile.workforceNature.includes('Apprentice');
  const ptStates = ['maharashtra', 'karnataka', 'tamil_nadu', 'telangana', 'andhra_pradesh'];
  const statesLower = profile.states.map(s => s.toLowerCase().replace(/\s+/g, '_'));

  const laws: LawEvaluation[] = [
    {
      act: 'EPF & MP Act 1952',
      applicable: hc >= 20 ? 'yes' : 'no',
      reason: hc >= 20 ? `${hc}+ employees — threshold is 20` : `Below 20 employee threshold (${hc})`,
      jurisdiction: 'Central', priority: 'High', register: 'EPF Register, Nomination Forms',
    },
    {
      act: 'ESI Act 1948',
      applicable: hc >= 10 ? 'yes' : 'no',
      reason: hc >= 10 ? `${hc}+ employees — threshold is 10` : `Below 10 employee threshold (${hc})`,
      jurisdiction: 'Central', priority: 'High', register: 'ESI Register, Accident Book',
    },
    {
      act: 'Maternity Benefit Act 1961',
      applicable: profile.employsWomen ? 'yes' : 'no',
      reason: profile.employsWomen ? 'Women employees present' : 'No women employees reported',
      jurisdiction: 'Central', priority: 'High', register: 'Maternity Benefit Register',
    },
    {
      act: 'Contract Labour Act 1970',
      applicable: cw >= 20 ? 'yes' : cw > 0 ? 'conditional' : 'no',
      reason: cw >= 20 ? `${cw}+ contract workers — threshold is 20` : cw > 0 ? 'Below 20 but contract workers present' : 'No contract workers',
      jurisdiction: 'Central', priority: 'High', register: 'Contract Labour Register, Form XII',
    },
    {
      act: 'Payment of Gratuity Act 1972',
      applicable: hc >= 10 ? 'yes' : 'no',
      reason: hc >= 10 ? `${hc}+ employees — threshold is 10` : `Below 10 employee threshold (${hc})`,
      jurisdiction: 'Central', priority: 'High', register: 'Gratuity Nomination Form F',
    },
    {
      act: 'Factories Act 1948',
      applicable: isFactory ? 'yes' : 'no',
      reason: isFactory ? 'Manufacturing/factory establishment' : 'Not a manufacturing/factory unit',
      jurisdiction: 'Central', priority: 'High', register: 'Factory License, Accident Register, OT Register',
    },
    {
      act: 'POSH Act 2013',
      applicable: hc >= 10 ? 'yes' : 'no',
      reason: hc >= 10 ? `${hc}+ employees — IC committee required` : `Below 10 employee threshold`,
      jurisdiction: 'Central', priority: 'High', register: 'IC Committee Records, Annual Report',
    },
    {
      act: 'Payment of Bonus Act 1965',
      applicable: hc >= 20 ? 'yes' : 'no',
      reason: hc >= 20 ? `${hc}+ employees — threshold is 20` : `Below 20 employee threshold`,
      jurisdiction: 'Central', priority: 'Medium', register: 'Bonus Register Form D',
    },
    {
      act: 'Minimum Wages Act 1948',
      applicable: 'yes',
      reason: 'Universal — applies to all employers',
      jurisdiction: 'Central', priority: 'High', register: 'Wage Register, Muster Roll',
    },
    {
      act: 'Payment of Wages Act 1936',
      applicable: 'yes',
      reason: 'Universal — applies to all employers',
      jurisdiction: 'Central', priority: 'Medium', register: 'Wage Slip Register',
    },
    {
      act: 'Industrial Employment (Standing Orders) Act 1946',
      applicable: hc >= 300 ? 'yes' : hc >= 100 ? 'conditional' : 'no',
      reason: hc >= 300 ? `${hc}+ employees — model standing orders apply` : hc >= 100 ? 'May apply in some states at 100+' : 'Below threshold',
      jurisdiction: 'Central', priority: 'Medium', register: 'Certified Standing Orders',
    },
    {
      act: 'BOCW Act 1996',
      applicable: isConstruction ? 'yes' : 'no',
      reason: isConstruction ? 'Construction/infrastructure establishment' : 'Not a construction establishment',
      jurisdiction: 'Central', priority: 'High', register: 'BOCW Registration, Cess Records',
    },
    ...statesLower.map(state => ({
      act: `Shops & Establishments Act (${state.replace('_', ' ')})`,
      applicable: 'yes' as const,
      reason: `Operating in ${state.replace('_', ' ')}`,
      jurisdiction: 'State' as const, priority: 'Medium' as const, register: 'S&E Registration Certificate',
    })),
    ...statesLower.filter(s => ptStates.includes(s)).map(state => ({
      act: `Professional Tax (${state.replace('_', ' ')})`,
      applicable: 'yes' as const,
      reason: `PT applicable in ${state.replace('_', ' ')}`,
      jurisdiction: 'State' as const, priority: 'Medium' as const, register: 'PT Registration, Monthly Challans',
    })),
    ...statesLower.map(state => ({
      act: `Labour Welfare Fund (${state.replace('_', ' ')})`,
      applicable: 'conditional' as const,
      reason: `LWF varies by state — check ${state.replace('_', ' ')} rules`,
      jurisdiction: 'State' as const, priority: 'Low' as const, register: 'LWF Contribution Records',
    })),
    {
      act: 'Apprentices Act 1961',
      applicable: hasApprentices ? 'yes' : 'no',
      reason: hasApprentices ? 'Apprentices in workforce' : 'No apprentices reported',
      jurisdiction: 'Central', priority: 'Low', register: 'Apprenticeship Register',
    },
    {
      act: 'FSSAI Registration/License',
      applicable: isFood ? 'yes' : 'no',
      reason: isFood ? 'Food & beverage establishment' : 'Not a food business',
      jurisdiction: 'Central', priority: 'High', register: 'FSSAI License',
    },
    {
      act: 'Clinical Establishments Act',
      applicable: isHealthcare ? 'yes' : 'no',
      reason: isHealthcare ? 'Healthcare/hospital establishment' : 'Not a healthcare facility',
      jurisdiction: 'Central', priority: 'High', register: 'Clinical Registration Certificate',
    },
  ];

  return laws;
};

export const calculateMonthlyCost = (profile: LiabilityProfile, avgSalary: number): CostLine[] => {
  const hc = getMinHeadcount(profile.headcountBracket);
  const basic = avgSalary * 0.5; // 50% of gross
  const lines: CostLine[] = [];

  if (hc >= 20) {
    const epfAmount = Math.round(basic * 0.12 * hc);
    lines.push({ item: 'EPF Employer Share (12% of Basic)', rate: '12%', monthlyAmount: epfAmount, annual: epfAmount * 12 });
    const adminCharge = Math.round(basic * 0.005 * hc);
    lines.push({ item: 'EPF Admin Charges', rate: '0.50%', monthlyAmount: adminCharge, annual: adminCharge * 12 });
  }

  if (hc >= 10) {
    const esiAmount = Math.round(avgSalary * 0.0325 * hc);
    lines.push({ item: 'ESI Employer Share (3.25% of Gross)', rate: '3.25%', monthlyAmount: esiAmount, annual: esiAmount * 12 });
  }

  const ptStates = profile.states.filter(s =>
    ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Andhra Pradesh'].includes(s)
  );
  if (ptStates.length > 0) {
    const ptPerEmployee = 200; // avg
    const ptAmount = ptPerEmployee * hc;
    lines.push({ item: `Professional Tax (${ptStates.join(', ')})`, rate: 'Slab', monthlyAmount: ptAmount, annual: ptAmount * 12 });
  }

  const lwfAmount = Math.round(36 * hc / 6); // ₹36/half-year = ₹6/month
  lines.push({ item: 'Labour Welfare Fund', rate: '₹36/half-year', monthlyAmount: lwfAmount, annual: lwfAmount * 12 });

  if (hc >= 10) {
    const gratuityAmount = Math.round(basic * 0.0481 * hc);
    lines.push({ item: 'Gratuity Provisioning (4.81% of Basic)', rate: '4.81%', monthlyAmount: gratuityAmount, annual: gratuityAmount * 12 });
  }

  return lines;
};

export const getPenaltyExposure = (): PenaltyRow[] => [
  { act: 'EPF Act', obligation: 'Monthly ECR filing', penalty: '5–25% damages + ₹5,000', frequency: 'Per month delay' },
  { act: 'ESI Act', obligation: 'Half-yearly return', penalty: '₹5,000 + prosecution', frequency: 'Per instance' },
  { act: 'Factories Act', obligation: 'Annual Return', penalty: '₹2,00,000 + imprisonment', frequency: 'Per instance' },
  { act: 'POSH Act', obligation: 'IC Committee not formed', penalty: '₹50,000', frequency: 'Per instance' },
  { act: 'Minimum Wages Act', obligation: 'Underpayment of wages', penalty: '₹50,000 or imprisonment up to 5 years', frequency: 'Per instance' },
  { act: 'Payment of Bonus', obligation: 'Non-payment of bonus', penalty: '₹1,000 or imprisonment up to 6 months', frequency: 'Per instance' },
  { act: 'Contract Labour Act', obligation: 'Operating without license', penalty: '₹50,000 + 3 years imprisonment', frequency: 'Per instance' },
  { act: 'Gratuity Act', obligation: 'Non-payment of gratuity', penalty: '₹10,000 or imprisonment up to 2 years', frequency: 'Per instance' },
  { act: 'Shops & Establishments', obligation: 'Operating without registration', penalty: '₹5,000–₹25,000', frequency: 'Per instance' },
  { act: 'Professional Tax', obligation: 'Non-registration/non-payment', penalty: '₹5 per day + 10% penalty', frequency: 'Per day' },
];

export const getRegistrations = (profile: LiabilityProfile): RegistrationItem[] => {
  const hc = getMinHeadcount(profile.headcountBracket);
  const isFood = profile.industryType.toLowerCase().includes('food');

  return [
    { portal: 'EPFO', url: 'https://unifiedportal-emp.epfindia.gov.in', status: 'not_yet', applicable: hc >= 20 },
    { portal: 'ESIC', url: 'https://esic.in', status: 'not_yet', applicable: hc >= 10 },
    { portal: 'Shram Suvidha Portal', url: 'https://shramsuvidha.gov.in', status: 'not_yet', applicable: true },
    { portal: 'GST Registration', url: 'https://gst.gov.in', status: 'not_yet', applicable: true },
    { portal: 'MCA21/ROC', url: 'https://mca.gov.in', status: 'not_yet', applicable: true },
    { portal: 'FSSAI', url: 'https://fssai.gov.in', status: 'not_yet', applicable: isFood },
    ...profile.states.map(state => ({
      portal: `${state} Labour Dept`,
      url: '#',
      status: 'not_yet' as const,
      applicable: true,
    })),
    ...profile.states.filter(s =>
      ['Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Andhra Pradesh'].includes(s)
    ).map(state => ({
      portal: `PT Registration (${state})`,
      url: '#',
      status: 'not_yet' as const,
      applicable: true,
    })),
    ...profile.states.map(state => ({
      portal: `LWF (${state})`,
      url: '#',
      status: 'not_yet' as const,
      applicable: true,
    })),
  ];
};

export const getLabourCodes = (): LabourCodeCard[] => [
  {
    name: 'Code on Wages, 2019',
    status: { central: 'Notified', maharashtra: 'Not Notified', karnataka: 'Partial', gujarat: 'Not Notified', tamil_nadu: 'Not Notified', telangana: 'Not Notified' },
    effectiveDate: 'TBD — Rules pending',
    keyChanges: [
      'Single definition of "wages" — impacts PF, gratuity, bonus calculations',
      'Floor wage set by Central Government — states cannot go below',
      'Equal remuneration provisions now part of wages code',
    ],
    estimatedImpact: '₹ Impact: 5–15% increase in statutory wage costs',
  },
  {
    name: 'Industrial Relations Code, 2020',
    status: { central: 'Notified', maharashtra: 'Not Notified', karnataka: 'Not Notified', gujarat: 'Partial', tamil_nadu: 'Not Notified', telangana: 'Not Notified' },
    effectiveDate: 'TBD — Rules pending',
    keyChanges: [
      'Standing orders threshold raised to 300 workers (from 100)',
      'Compulsory 60-day strike/lockout notice for all establishments',
      'Fixed-term employment recognized — equal benefits as permanent',
    ],
    estimatedImpact: '₹ Impact: Reduced compliance cost for mid-size firms',
  },
  {
    name: 'Code on Social Security, 2020',
    status: { central: 'Notified', maharashtra: 'Partial', karnataka: 'Not Notified', gujarat: 'Not Notified', tamil_nadu: 'Not Notified', telangana: 'Not Notified' },
    effectiveDate: 'TBD — Rules pending',
    keyChanges: [
      'Gig and platform workers brought under social security net',
      'ESIC coverage extended to all establishments (no threshold)',
      'Aadhaar mandatory for availing benefits',
    ],
    estimatedImpact: '₹ Impact: 3–8% increase in employer contributions for gig-heavy firms',
  },
  {
    name: 'OSH Code, 2020',
    status: { central: 'Notified', maharashtra: 'Not Notified', karnataka: 'Not Notified', gujarat: 'Not Notified', tamil_nadu: 'Not Notified', telangana: 'Not Notified' },
    effectiveDate: 'TBD — Rules pending',
    keyChanges: [
      'Single license for factories, contractors, beedi, plantations',
      'Women allowed in all establishments including night shifts',
      'Annual health checkup mandatory for hazardous processes',
    ],
    estimatedImpact: '₹ Impact: Reduced compliance overhead, single-window clearance',
  },
];

export const getMultiStateComparison = () => ({
  headers: ['Obligation', 'Maharashtra', 'Karnataka', 'Gujarat', 'Tamil Nadu', 'Telangana', 'Andhra Pradesh'],
  rows: [
    ['Min. Wage (unskilled/month)', '₹13,750', '₹13,000', '₹12,200', '₹12,500', '₹12,600', '₹12,100'],
    ['Professional Tax (max/yr)', '₹2,500', '₹2,400', 'Nil', '₹2,400', '₹2,400', '₹2,500'],
    ['LWF (employer/yr)', '₹36', '₹40', '₹12', '₹10', '₹10', '₹Nil'],
    ['Shops Act weekly off', 'Sunday', 'Sunday', 'Sunday', 'Sunday', 'Sunday', 'Sunday'],
    ['Working hours/week', '48', '48', '48', '48', '48', '48'],
    ['OT Rate', '2x', '2x', '2x', '2x', '2x', '2x'],
    ['Shops Act renewal', 'Annual', 'Annual', '5-yearly', 'Annual', 'Annual', 'Annual'],
    ['PT deduction frequency', 'Monthly', 'Monthly', 'N/A', 'Half-yearly', 'Monthly', 'Monthly'],
  ],
});

export const getComplianceDeadlines = (profile: LiabilityProfile) => {
  const hc = getMinHeadcount(profile.headcountBracket);
  const deadlines: { obligation: string; frequency: string; dueDay: string; act: string }[] = [];

  if (hc >= 20) {
    deadlines.push({ obligation: 'EPF ECR Filing', frequency: 'Monthly', dueDay: '15th of following month', act: 'EPF Act' });
    deadlines.push({ obligation: 'EPF Annual Return (Form 3A/6A)', frequency: 'Annual', dueDay: '30th April', act: 'EPF Act' });
  }
  if (hc >= 10) {
    deadlines.push({ obligation: 'ESI Contribution', frequency: 'Monthly', dueDay: '15th of following month', act: 'ESI Act' });
    deadlines.push({ obligation: 'ESI Half-Yearly Return', frequency: 'Half-yearly', dueDay: '12th May / 11th Nov', act: 'ESI Act' });
  }
  deadlines.push({ obligation: 'TDS Return (24Q)', frequency: 'Quarterly', dueDay: '31st of following month', act: 'Income Tax Act' });
  deadlines.push({ obligation: 'GST GSTR-1', frequency: 'Monthly', dueDay: '11th of following month', act: 'GST Act' });
  deadlines.push({ obligation: 'GST GSTR-3B', frequency: 'Monthly', dueDay: '20th of following month', act: 'GST Act' });

  profile.states.forEach(state => {
    if (['Maharashtra'].includes(state)) {
      deadlines.push({ obligation: `PT Return (${state})`, frequency: 'Monthly', dueDay: 'Last day of month', act: 'PT Act' });
    }
    deadlines.push({ obligation: `Annual Return under S&E Act (${state})`, frequency: 'Annual', dueDay: '30th January', act: 'Shops & Establishments' });
  });

  if (hc >= 20) {
    deadlines.push({ obligation: 'Payment of Bonus', frequency: 'Annual', dueDay: 'Within 8 months of close of accounting year', act: 'Bonus Act' });
  }

  deadlines.push({ obligation: 'POSH Annual Report', frequency: 'Annual', dueDay: '31st January', act: 'POSH Act' });

  return deadlines;
};

export const INDIAN_STATES_FULL = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'
];

export const INDUSTRY_TYPES = [
  'Factory / Manufacturing',
  'Shop & Commercial Establishment',
  'IT / ITES / Software',
  'Construction / Infrastructure',
  'Food & Beverage / Restaurant',
  'Healthcare / Hospital / Clinic',
  'BFSI',
  'Retail / E-commerce',
  'NGO / Trust / Section 8',
  'Educational Institution',
  'Other',
];

export const HEADCOUNT_OPTIONS = ['1-9', '10-19', '20-49', '50-99', '100-299', '300+'];
export const CONTRACT_OPTIONS = ['0', '1-19', '20-49', '50+'];
export const WORKFORCE_NATURE_OPTIONS = ['Permanent', 'Contractual', 'Gig', 'Apprentice', 'Mixed'];
