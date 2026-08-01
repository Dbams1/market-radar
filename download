import type { StockRow, Pick, SectorPick, Sector } from "./types";

// Percentile rank in [0,1]; 1 = "best". lowerBetter inverts (cheap = best).
function pranks(vals: (number | null)[], lowerBetter: boolean): (number | null)[] {
  const idx = vals.map((v, i) => [v, i] as const).filter(([v]) => typeof v === "number" && isFinite(v as number));
  const sorted = idx.slice().sort((a, b) => (a[0] as number) - (b[0] as number));
  const out: (number | null)[] = vals.map(() => null);
  const n = sorted.length;
  sorted.forEach(([, i], rank) => {
    const p = n <= 1 ? 1 : rank / (n - 1);   // 0..1 ascending (small value -> 0)
    out[i] = lowerBetter ? 1 - p : p;
  });
  return out;
}

/* Transparent composite value score. Rewards cheap multiples (P/E, P/B, P/S),
   quality (ROE) and a discount to the 52-week high. Score 0-100. */
export function computeValue(rows: StockRow[]): { picks: Pick[]; sectorPicks: SectorPick[] } {
  const pe = pranks(rows.map(r => (r.val.pe && r.val.pe > 0 ? r.val.pe : null)), true);
  const pb = pranks(rows.map(r => (r.val.pb && r.val.pb > 0 ? r.val.pb : null)), true);
  const ps = pranks(rows.map(r => (r.val.ps && r.val.ps > 0 ? r.val.ps : null)), true);
  const roe = pranks(rows.map(r => r.val.roe), false);
  const disc = pranks(rows.map(r => r.val.discount), false);

  rows.forEach((r, i) => {
    const parts: [number | null, number][] = [[pe[i], 0.30], [pb[i], 0.24], [ps[i], 0.16], [roe[i], 0.16], [disc[i], 0.14]];
    let sum = 0, wsum = 0;
    for (const [v, w] of parts) if (v != null) { sum += v * w; wsum += w; }
    r.valueScore = wsum > 0 ? Math.round((sum / wsum) * 1000) / 10 : null;
    // "undervalued": genuinely cheap + profitable + off its highs
    r.undervalued = !!(r.valueScore != null && r.valueScore >= 58
      && r.val.pe != null && r.val.pe > 0 && r.val.pe < 45
      && r.val.roe != null && r.val.roe > 5
      && r.val.discount != null && r.val.discount > 3);
  });

  const picks: Pick[] = rows.filter(r => r.undervalued)
    .sort((a, b) => (b.valueScore! - a.valueScore!))
    .slice(0, 8)
    .map(r => ({ sym: r.sym, name: r.name, sector: r.sector, tier: r.tier, valueScore: r.valueScore!,
      pe: r.val.pe, pb: r.val.pb, roe: r.val.roe, discount: r.val.discount, ytd: r.returns.ytd }));

  // sector recommendation = blend of average value score and recent momentum (monthly return)
  const bySec = new Map<Sector, StockRow[]>();
  for (const r of rows) { const a = bySec.get(r.sector) ?? []; a.push(r); bySec.set(r.sector, a); }
  const raw = Array.from(bySec.entries()).map(([sector, arr]) => {
    const vs = arr.map(r => r.valueScore).filter((v): v is number => v != null);
    const mo = arr.map(r => r.returns.monthly).filter((v): v is number => v != null);
    const avgV = vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : 0;
    const avgM = mo.length ? mo.reduce((a, b) => a + b, 0) / mo.length : 0;
    return { sector, avgV, avgM, count: arr.length };
  });
  const ms = raw.map(r => r.avgM);
  const lo = Math.min(...ms, 0), hi = Math.max(...ms, 0.0001);
  const sectorPicks: SectorPick[] = raw.map(r => ({
    sector: r.sector, momentum: Math.round(r.avgM * 10) / 10, count: r.count,
    score: Math.round((0.6 * r.avgV + 0.4 * ((r.avgM - lo) / (hi - lo || 1)) * 100) * 10) / 10,
  })).sort((a, b) => b.score - a.score);

  return { picks, sectorPicks };
}
