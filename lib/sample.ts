import { UNIVERSE } from "./universe";
import { computeValue } from "./value";
import type { MarketPayload, StockRow } from "./types";

function mulberry32(a: number) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const seed = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 7);
const WEAK = new Set(["INTU", "BSX", "LULU", "FSLY", "ROKU"]);
const r1 = (x: number) => Math.round(x * 10) / 10;

/* Deterministic, clearly-labeled sample data so the app is fully explorable with no key. Never real. */
export function sampleMarket(): MarketPayload {
  const rows: StockRow[] = UNIVERSE.map((s) => {
    const rng = mulberry32(seed(s.sym)); const r = () => rng();
    let ytd: number;
    if (s.sector === "Technology") ytd = 30 + r() * 150; else if (s.sector === "Energy") ytd = 8 + r() * 40;
    else if (s.sector === "Industrials") ytd = 5 + r() * 40; else ytd = r() * 30 - 4;
    if (WEAK.has(s.sym)) ytd = -(15 + r() * 40);
    const growth = WEAK.has(s.sym) ? -8 + r() * 14 : 6 + r() * 34;      // eps growth %
    const pe = WEAK.has(s.sym) ? 38 + r() * 45 : 11 + r() * 26;
    const peg = growth > 3 ? r1(pe / growth) : null;
    const roe = 6 + r() * 30, roic = roe * (0.6 + r() * 0.3);
    const discount = r1(WEAK.has(s.sym) ? 20 + r() * 40 : r() * 30);
    const price = r1(40 + r() * 460);
    const high52 = r1(price / (1 - discount / 100));
    const low52 = r1(price * (0.55 + r() * 0.3));
    return {
      ...s,
      returns: {
        daily: r1(r() * 6 - 3), weekly: r1(r() * 12 - 5), monthly: r1(ytd / 6 + r() * 10 - 5),
        ytd: r1(ytd), annual: r1(ytd * 1.4 + r() * 20 - 10),
      },
      val: {
        pe: r1(pe), pb: r1(1 + r() * 8), ps: r1(0.8 + r() * 9), peg,
        evEbitda: r1(6 + r() * 22), fcfYield: r1((WEAK.has(s.sym) ? 0.5 : 2) + r() * 6),
        epsGrowth: r1(growth), revGrowth: r1((WEAK.has(s.sym) ? -4 : 4) + r() * 22),
        roic: r1(roic), roe: r1(roe), netMargin: r1((WEAK.has(s.sym) ? 2 : 8) + r() * 24), grossMargin: r1(30 + r() * 50),
        debtEq: Math.round(r() * 210), currentRatio: r1(0.9 + r() * 2.4), intCoverage: r1(2 + r() * 18),
        beta: r1(0.6 + r() * 1.2), divYield: r1(r() * 3),
        price, high52, low52, discount,
      },
      pillars: { value: null, quality: null, growth: null, momentum: null, lowVol: null, safety: null },
      valueScore: null, pegVsSector: null, fScore: null, distress: null, undervalued: false,
    };
  });
  const { picks, sectorPicks, sectorPeg } = computeValue(rows);
  return { stocks: rows, picks, sectorPicks, sectorPeg, source: "sample", asOf: new Date().toISOString() };
}
