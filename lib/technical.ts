import type { StockRow, Sector, Tier } from "./types";

export type Trend = "Uptrend" | "Downtrend" | "Mixed";
export type TechRow = {
  sym: string; name: string; sector: Sector; tier: Tier;
  techScore: number; rs: number; trend: Trend; momentum: number | null;
  rangePos: number | null; distHigh: number | null; beta: number | null;
  weekly: number | null; monthly: number | null; annual: number | null;
};

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
function percentiles(vals: (number | null)[]): (number | null)[] {
  const idx = vals.map((v, i) => [v, i] as const).filter(([v]) => v != null && isFinite(v as number));
  const sorted = idx.slice().sort((a, b) => (a[0] as number) - (b[0] as number));
  const out: (number | null)[] = vals.map(() => null); const n = sorted.length;
  sorted.forEach(([, i], r) => { out[i] = n <= 1 ? 1 : r / (n - 1); });
  return out;
}
function momComposite(r: StockRow): number | null {
  const parts: [number | null, number][] = [[r.returns.weekly, 0.15], [r.returns.monthly, 0.25], [r.returns.ytd, 0.3], [r.returns.annual, 0.3]];
  let s = 0, w = 0; for (const [v, wt] of parts) if (v != null) { s += v * wt; w += wt; }
  return w > 0 ? s / w : null;
}
function trendOf(r: StockRow): Trend {
  const shortT = r.returns.weekly ?? r.returns.monthly;
  const midT = r.returns.monthly ?? r.returns.ytd;
  const longT = r.returns.annual ?? r.returns.ytd;
  const sigs = [shortT, midT, longT].filter((v): v is number => v != null);
  if (sigs.length < 2) return "Mixed";
  if (sigs.every(v => v > 0)) return "Uptrend";
  if (sigs.every(v => v < 0)) return "Downtrend";
  return "Mixed";
}

export function computeTechnicals(rows: StockRow[]): { rows: TechRow[]; leaders: TechRow[]; rsLeaders: TechRow[] } {
  const moms = rows.map(momComposite);
  const rsPct = percentiles(moms);
  const techRows: TechRow[] = rows.map((r, i) => {
    const rs = rsPct[i] == null ? 50 : Math.round(1 + rsPct[i]! * 98); // 1..99
    const trend = trendOf(r);
    const { price, high52, low52, discount, beta } = r.val;
    const rangePos = (price != null && high52 != null && low52 != null && high52 > low52)
      ? Math.round(clamp((price - low52) / (high52 - low52), 0, 1) * 100) : null;
    const trendScore = trend === "Uptrend" ? 1 : trend === "Mixed" ? 0.5 : 0;
    const techScore = Math.round((0.5 * (rs / 99) + 0.3 * trendScore + 0.2 * ((rangePos ?? 50) / 100)) * 1000) / 10;
    return {
      sym: r.sym, name: r.name, sector: r.sector, tier: r.tier,
      techScore, rs, trend, momentum: moms[i] == null ? null : Math.round(moms[i]! * 10) / 10,
      rangePos, distHigh: discount, beta,
      weekly: r.returns.weekly, monthly: r.returns.monthly, annual: r.returns.annual,
    };
  });
  const leaders = techRows.filter(t => t.trend !== "Downtrend").sort((a, b) => b.techScore - a.techScore).slice(0, 8);
  const rsLeaders = techRows.slice().sort((a, b) => b.rs - a.rs).slice(0, 7);
  return { rows: techRows, leaders, rsLeaders };
}
