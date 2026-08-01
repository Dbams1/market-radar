export type Tier = "L" | "M" | "S";
export type Sector =
  | "Technology" | "Communication" | "Consumer & Retail"
  | "Financials" | "Healthcare" | "Industrials" | "Energy";
export type Period = "daily" | "weekly" | "monthly" | "ytd" | "annual";

export type Returns = Record<Period, number | null>;
export type Valuation = {
  pe: number | null; pb: number | null; ps: number | null; roe: number | null;
  price: number | null; high52: number | null; discount: number | null; // discount = % below 52w high
};
export type Stock = { sym: string; name: string; sector: Sector; tier: Tier };
export type StockRow = Stock & { returns: Returns; val: Valuation; valueScore: number | null; undervalued: boolean };

export type Pick = {
  sym: string; name: string; sector: Sector; tier: Tier; valueScore: number;
  pe: number | null; pb: number | null; roe: number | null; discount: number | null; ytd: number | null;
};
export type SectorPick = { sector: Sector; score: number; momentum: number; count: number };

export type MarketPayload = {
  stocks: StockRow[]; picks: Pick[]; sectorPicks: SectorPick[];
  marketTone: number; source: "live" | "sample"; asOf: string;
};

export const PERIODS: { key: Period; label: string }[] = [
  { key: "daily", label: "Daily" }, { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" }, { key: "ytd", label: "YTD" }, { key: "annual", label: "1-Year" },
];
export const TIER_NAME: Record<Tier, string> = { L: "Large cap", M: "Mid cap", S: "Small cap" };
