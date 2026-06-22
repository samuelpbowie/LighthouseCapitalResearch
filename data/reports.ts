import oktaData from './okta_data.json';
import type { ModelData, FootballFieldRow } from '@/lib/modelTypes';

export type Rating = 'Buy' | 'Hold' | 'Sell';

export interface Report {
  ticker: string;
  exchange: string;
  name: string;
  rating: Rating;
  category: string;
  sector: string;
  industry: string;
  reportDate: string;
  summary: string;
  description: string;
  riskRating: string;
  horizon: string;
  updated: string;
  secFilingLabel: string;
  secFilingUrl: string;
  thesisParagraphs: string[];
  bullCase: string[];
  bearCase: string[];
  modelFileName: string;
}

export const reports: Report[] = [
  {
    ticker: 'OKTA',
    exchange: 'NASDAQ',
    name: 'Okta, Inc.',
    rating: 'Buy',
    category: 'Technology',
    sector: 'Information Technology',
    industry: 'Identity & Access Management',
    reportDate: 'March 2026',
    summary:
      'Best-of-breed independent identity platform with durable switching costs, an underpenetrated Customer Identity vector, and a compelling FCF inflection story.',
    description:
      'Identity and access management platform providing cloud-based workforce and customer identity solutions for humans and agentic AI.',
    riskRating: 'Medium',
    horizon: '12 Months',
    updated: 'Mar 18, 2026',
    secFilingLabel: 'FY2026 — Mar 05, 2026 ↗',
    secFilingUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=OKTA&type=10-K&dateb=&owner=include&count=10',
    thesisParagraphs: [
      'Okta has established itself as the enterprise authentication standard for organizations managing complex, multi-application IT environments. Its deeply embedded position across enterprise IT stacks represents a significant cost-switching moat, while the recently announced agentic authentication framework positions the company at the forefront of AI-era identity security — a critical consideration as zero-trust architecture becomes the baseline security requirement across industries.',
      'A turbulent period following the Auth0 acquisition and a 2023 security breach weighed on sentiment, but Okta quietly achieved GAAP profitability for the first time in its FY2026 annual filing (year ended January 31, 2026). We believe the market has not fully repriced the stock to reflect this fundamental inflection.',
      'Management has consistently issued conservative revenue guidance, which has been exceeded by 3–5% on a CAGR basis in each of the last three fiscal years. Even under a conservative base case of 9% revenue CAGR and a modest RPO growth assumption relative to recent history, the model generates compelling free cash flow — projected to ramp from $446M in FY2027 to $1.7B by FY2031. This trajectory is further supported by a net cash position of $2.2B and full debt retirement expected by FY2027, leaving Okta with significant capital return optionality and a clean balance sheet that peers trading at materially higher multiples envy.',
    ],
    bullCase: [
      "RPO CAGR of 12% drives revenue outperformance above management's 9% guidance, as stronger bookings momentum converts into subscription revenue for the following year.",
      'Prior year cRPO-to-current year revenue conversion ratio improves as contract structures shift and new deal origination increases, driving revenue recognition above the historical conversion rate.',
      'Professional services revenue declines as Okta transitions to third-party implementers — eliminating a negative-margin revenue segment in line with management guidance.',
      'Interest income yield expands 20bps on the existing $2.2B net cash position, contributing incrementally to EPS.',
    ],
    bearCase: [
      'RPO CAGR decelerates 25% below base to 7.5%, reflecting deal slippage or competitive displacement.',
      'cRPO-to-revenue conversion efficiency remains static.',
      'Professional services remain elevated at 2% of total revenue, sustaining negative margin drag.',
      'OpEx reduction velocity slows to half the base case rate, delaying margin expansion and reducing free cash flows.',
    ],
    modelFileName: 'Okta Model.xlsm',
  },
];

export function getReport(ticker: string): Report | undefined {
  return reports.find((r) => r.ticker.toLowerCase() === ticker.toLowerCase());
}

// Per-ticker model JSON, produced locally by scripts/extract_okta_data.py.
// Add an entry here when a new ticker's model is extracted.
const MODEL_DATA: Record<string, ModelData> = {
  OKTA: oktaData as unknown as ModelData,
};

export function getModelData(ticker: string): ModelData | undefined {
  return MODEL_DATA[ticker.toUpperCase()];
}

export function getPriceTargetRange(modelData: { footballField: FootballFieldRow[] }) {
  const est = modelData.footballField.find((d) => d.label === 'Estimate');
  if (!est || est.avg == null || est.high == null) return null;
  return { mid: Math.round(est.avg), high: Math.round(est.high) };
}
