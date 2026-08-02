import type { StockRow, Pick, SectorPick, Sector, Pillars, Distress } from "./types";

const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/* Winsorized cross-sectional z-score. higherBetter flips sign so "better" is always +z.
   Outliers clipped to +/- w standard deviations (standard factor-model hygiene). */
function zs(vals: (number | null)[], higherBetter: boolean, w = 3): (number | null)[] {
  const nums = vals.filter((v): v is number => v != null && isFinite(v));
  if (nums.length < 2) return vals.map(() => null);
  const m = avg(nums);
  const sd = Math.sqrt(avg(nums.map(x => (x - m) ** 2))) || 1;
  return vals.map(v => (v == null || !isFinite(v)) ? null : clamp(((v - m) / sd) * (higherBetter ? 1 : -1), -w, w));
}
/* weighted mean of available z-components -> combined z (null-safe) */
function zblend(parts: [number | null, number][]): number | null {
  let s = 0, wsum = 0; for (const [v, wt] of parts) if (v != null) { s += v * wt; wsum += wt; }
  return wsum > 0 ? s / wsum : null;
}
const disp = (z: number | null) => z == null ? null : clamp(0.5 + z * 0.19, 0.02, 0.99); // z -> 0..1 for bars
const pctlOf = (sorted: number[], v: number) => { let i = 0; while (i < sorted.length && sorted[i] < v) i++; return sorted.length <= 1 ? 1 : i / (sorted.length - 1); };

/* Piotroski-style fundamental health (0-9). Simplified: uses current cross-sectional
   fundamentals (no prior-year statements available on the free tier). */
function fscore(r: StockRow): number {
  const v = r.val; let s = 0;
  if ((v.roic ?? v.roe ?? -1) > 0) s++;         // profitable on capital
  if ((v.fcfYield ?? -1) > 0) s++;              // positive free cash flow
  if ((v.netMargin ?? -1) > 0) s++;             // positive net margin
  if ((v.epsGrowth ?? -1) > 0) s++;             // earnings growing
  if ((v.revGrowth ?? -1) > 0) s++;             // revenue growing
  if ((v.debtEq ?? 999) < 100) s++;             // conservative leverage (<1x)
  if ((v.currentRatio ?? 0) > 1) s++;           // liquid
  if ((v.grossMargin ?? 0) > 25) s++;           // pricing power
  if ((v.intCoverage ?? 0) > 3) s++;            // comfortably covers interest
  return s;
}
/* Altman-style distress screen from leverage / coverage / liquidity / profitability. */
function distress(r: StockRow): Distress {
  const v = r.val; let risk = 0;
  if ((v.debtEq ?? 0) > 150) risk += 2; else if ((v.debtEq ?? 0) > 90) risk += 1;
  if ((v.intCoverage ?? 99) < 1.5) risk += 2; else if ((v.intCoverage ?? 99) < 3) risk += 1;
  if ((v.currentRatio ?? 9) < 1) risk += 1;
  if ((v.netMargin ?? 9) < 0) risk += 2;
  if ((v.fcfYield ?? 9) < 0) risk += 1;
  return risk >= 4 ? "High" : risk >= 2 ? "Medium" : "Low";
}

export function computeValue(rows: StockRow[]): {
  picks: Pick[]; sectorPicks: SectorPick[]; sectorPeg: Partial<Record<Sector, number | null>>;
} {
  // sector PEG + PEG-vs-sector
  const sectorPeg: Partial<Record<Sector, number | null>> = {};
  const bySec = new Map<Sector, StockRow[]>();
  for (const r of rows) { const a = bySec.get(r.sector) ?? []; a.push(r); bySec.set(r.sector, a); }
  for (const [sec, arr] of bySec) {
    const pegs = arr.map(r => r.val.peg).filter((v): v is number => v != null && v > 0 && v < 6);
    const m = avg(pegs); const sp = isFinite(m) ? Math.round(m * 100) / 100 : null;
    sectorPeg[sec] = sp;
    for (const r of arr) r.pegVsSector = (r.val.peg != null && sp) ? Math.round((r.val.peg / sp) * 100) / 100 : null;
  }

  const g = (f: (r: StockRow) => number | null) => rows.map(f);
  // factor z-scores (winsorized)
  const zPeg = zs(g(r => (r.val.peg && r.val.peg > 0 ? r.val.peg : null)), false);
  const zEv  = zs(g(r => (r.val.evEbitda && r.val.evEbitda > 0 ? r.val.evEbitda : null)), false);
  const zFcf = zs(g(r => r.val.fcfYield), true);
  const zPb  = zs(g(r => (r.val.pb && r.val.pb > 0 ? r.val.pb : null)), false);
  const zRoic = zs(g(r => (r.val.roic ?? r.val.roe)), true);
  const zNm  = zs(g(r => r.val.netMargin), true);
  const zGm  = zs(g(r => r.val.grossMargin), true);
  const zEps = zs(g(r => r.val.epsGrowth), true);
  const zRev = zs(g(r => r.val.revGrowth), true);
  const zMom = zs(g(r => { const ret = r.returns.annual ?? r.returns.ytd; return ret == null ? null : ret / Math.max(r.val.beta ?? 1, 0.6); }), true); // risk-adjusted momentum
  const zVol = zs(g(r => r.val.beta), false); // low-vol: lower beta better
  const zDe  = zs(g(r => r.val.debtEq), false);
  const zCr  = zs(g(r => (r.val.currentRatio && r.val.currentRatio < 6 ? r.val.currentRatio : null)), true);
  const zIc  = zs(g(r => r.val.intCoverage), true);

  const compZ: number[] = [];
  rows.forEach((r, i) => {
    const zValue   = zblend([[zPeg[i], 0.45], [zEv[i], 0.25], [zFcf[i], 0.18], [zPb[i], 0.12]]);
    const zQuality = zblend([[zRoic[i], 0.5], [zNm[i], 0.3], [zGm[i], 0.2]]);
    const zGrowth  = zblend([[zEps[i], 0.6], [zRev[i], 0.4]]);
    const zMoment  = zMom[i];
    const zLowVol  = zVol[i];
    const zSafety  = zblend([[zDe[i], 0.5], [zIc[i], 0.3], [zCr[i], 0.2]]);
    r.pillars = { value: disp(zValue), quality: disp(zQuality), growth: disp(zGrowth), momentum: disp(zMoment), lowVol: disp(zLowVol), safety: disp(zSafety) };
    const c = zblend([[zValue, 0.20], [zQuality, 0.18], [zGrowth, 0.15], [zMoment, 0.17], [zLowVol, 0.10], [zSafety, 0.20]]) ?? -9;
    compZ.push(c);
    r.fScore = fscore(r); r.distress = distress(r);
  });
  // composite z -> 0..100 via cross-sectional percentile (clean, comparable spread)
  const sortedC = compZ.filter(v => v > -9).slice().sort((a, b) => a - b);
  rows.forEach((r, i) => { r.valueScore = compZ[i] <= -9 ? null : Math.round(pctlOf(sortedC, compZ[i]) * 1000) / 10; });

  rows.forEach(r => {
    r.undervalued = !!(
      r.valueScore != null && r.valueScore >= 60 &&
      r.val.peg != null && r.val.peg > 0 && r.val.peg < 2.5 &&
      (r.pegVsSector == null || r.pegVsSector <= 1.05) &&
      r.val.epsGrowth != null && r.val.epsGrowth > 0 &&
      (r.fScore == null || r.fScore >= 5) &&
      r.distress !== "High"
    );
  });

  const picks: Pick[] = rows.filter(r => r.undervalued)
    .sort((a, b) => (b.valueScore! - a.valueScore!)).slice(0, 8)
    .map(r => ({
      sym: r.sym, name: r.name, sector: r.sector, tier: r.tier, valueScore: r.valueScore!, pillars: r.pillars, fScore: r.fScore, distress: r.distress,
      peg: r.val.peg, sectorPeg: sectorPeg[r.sector] ?? null, evEbitda: r.val.evEbitda, fcfYield: r.val.fcfYield,
      roic: r.val.roic ?? r.val.roe, netMargin: r.val.netMargin, debtEq: r.val.debtEq, epsGrowth: r.val.epsGrowth, beta: r.val.beta,
      discount: r.val.discount, ytd: r.returns.ytd,
    }));

  const raw = Array.from(bySec.entries()).map(([sector, arr]) => {
    const vs = arr.map(r => r.valueScore).filter((v): v is number => v != null);
    const mo = arr.map(r => r.returns.monthly).filter((v): v is number => v != null);
    return { sector, avgV: vs.length ? avg(vs) : 0, avgM: mo.length ? avg(mo) : 0, count: arr.length };
  });
  const ms = raw.map(r => r.avgM); const lo = Math.min(...ms, 0), hi = Math.max(...ms, 0.0001);
  const sectorPicks: SectorPick[] = raw.map(r => ({
    sector: r.sector, peg: sectorPeg[r.sector] ?? null, momentum: Math.round(r.avgM * 10) / 10, count: r.count,
    score: Math.round((0.65 * r.avgV + 0.35 * ((r.avgM - lo) / (hi - lo || 1)) * 100) * 10) / 10,
  })).sort((a, b) => b.score - a.score);

  return { picks, sectorPicks, sectorPeg };
}
