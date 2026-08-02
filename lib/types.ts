export type Tier = "L" | "M" | "S";
export type Sector =
  | "Technology" | "Communication" | "Consumer & Retail"
  | "Financials" | "Healthcare" | "Industrials" | "Energy";
export type Period = "daily" | "weekly" | "monthly" | "ytd" | "annual";
export type Returns = Record<Period, number | null>;

export type Valuation = {
  pe: number | null; pb: number | null; ps: number | null; peg: number | null; evEbitda: number | null; fcfYield: number | null;
  epsGrowth: number | null; revGrowth: number | null;
  roic: number | null; roe: number | null; netMargin: number | null; grossMargin: number | null;
  debtEq: number | null; currentRatio: number | null; intCoverage: number | null;
  beta: number | null; divYield: number | null; price: number | null; high52: number | null; low52: number | null; discount: number | null;
};
export type Pillars = { value: number | null; quality: number | null; growth: number | null; momentum: number | null; lowVol: number | null; safety: number | null };
export type Distress = "Low" | "Medium" | "High";

export type Stock = { sym: string; name: string; sector: Sector; tier: Tier };
export type StockRow = Stock & {
  returns: Returns; val: Valuation; pillars: Pillars;
  valueScore: number | null; pegVsSector: number | null; fScore: number | null; distress: Distress | null; undervalued: boolean;
};

export type Pick = Stock & {
  valueScore: number; pillars: Pillars; fScore: number | null; distress: Distress | null;
  peg: number | null; sectorPeg: number | null; evEbitda: number | null; fcfYield: number | null;
  roic: number | null; netMargin: number | null; debtEq: number | null; epsGrowth: number | null; beta: number | null;
  discount: number | null; ytd: number | null;
};
export type SectorPick = { sector: Sector; score: number; peg: number | null; momentum: number; count: number };

export type Enrichment = {
  sym: string; newsLabel: "Positive" | "Neutral" | "Negative" | "No recent news";
  newsScore: number; headlines: number; analystBuyPct: number | null; analystTotal: number | null;
};

export type MarketPayload = {
  stocks: StockRow[]; picks: Pick[]; sectorPicks: SectorPick[];
  sectorPeg: Partial<Record<Sector, number | null>>; source: "live" | "sample"; asOf: string;
};

export const PERIODS: { key: Period; label: string }[] = [
  { key: "daily", label: "Daily" }, { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" }, { key: "ytd", label: "YTD" }, { key: "annual", label: "1-Year" },
];
export const TIER_NAME: Record<Tier, string> = { L: "Large cap", M: "Mid cap", S: "Small cap" };
export const PILLAR_LABELS: { key: keyof Pillars; label: string }[] = [
  { key: "value", label: "Value" }, { key: "quality", label: "Quality" }, { key: "growth", label: "Growth" },
  { key: "momentum", label: "Momentum" }, { key: "lowVol", label: "Low-Vol" }, { key: "safety", label: "Safety" },
];
