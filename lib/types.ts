export type Tier = "L" | "M" | "S";
export type Sector =
  | "Technology" | "Communication" | "Consumer & Retail"
  | "Financials" | "Healthcare" | "Industrials" | "Energy";
export type Stock = { sym: string; name: string; sector: Sector; tier: Tier };
export type StockRow = { sym: string; name: string; sector: Sector; tier: Tier; ytd: number | null };
export type SectorAgg = { name: Sector; avg: number; count: number };
export type MarketPayload = { stocks: StockRow[]; sectors: SectorAgg[]; source: "live" | "sample"; asOf: string };
export const TIER_NAME: Record<Tier, string> = { L: "Large cap", M: "Mid cap", S: "Small cap" };
