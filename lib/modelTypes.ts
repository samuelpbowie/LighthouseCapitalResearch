export interface ScenarioSeries {
  Base?: (number | null)[];
  Pessimistic?: (number | null)[];
  Optimistic?: (number | null)[];
  'Weighted Average'?: (number | null)[];
}

export interface CompRow {
  name: string;
  ticker: string;
  fileDate: string | null;
  price: number | null;
  shares: number | null;
  netDebt: number | null;
  revenue: number | null;
  ebitda: number | null;
  mktCap: number | null;
  ev: number | null;
  evRev: number | null;
  evEbitda: number | null;
  pe: number | null;
}

export interface FootballFieldRow {
  label: string;
  dataType: string;
  low: number | null;
  avg: number | null;
  high: number | null;
}

export interface ModelData {
  generatedAt: string;
  currentPrice: number | null;
  years: string[];
  metrics: {
    Revenue: ScenarioSeries;
    RevenueCagr: ScenarioSeries;
    EBITDA: ScenarioSeries;
    EBITDAMargin: ScenarioSeries;
    EPS: ScenarioSeries;
    FCF: ScenarioSeries;
    FCFMargin: ScenarioSeries;
  };
  incomeStatement: {
    GrossProfit: ScenarioSeries;
    GrossMargin: ScenarioSeries;
    OperatingMargin: ScenarioSeries;
    NetIncome: ScenarioSeries;
    NetMargin: ScenarioSeries;
  };
  dcf: {
    waccLabels: string[];
    waccValues: (number | null)[];
    waccLabelsWA: string[];
    waccValuesWA: (number | null)[];
    impliedPrices: Record<string, number | null>;
    enterpriseValue: Record<string, number | null>;
    sensitivity: Record<string, { tgr: number | null; prices: (number | null)[] }[]>;
    assumptions: {
      wacc: number | null;
      tgr: number | null;
      beta: number | null;
      riskFreeRate: number | null;
      erp: number | null;
    };
  };
  footballField: FootballFieldRow[];
  comps: CompRow[];
}
