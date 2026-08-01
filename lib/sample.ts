import { UNIVERSE } from "./universe";
import { computeValue } from "./value";
import type { MarketPayload, StockRow } from "./types";

/* Deterministic, clearly-labeled sample data so the app is explorable with no key.
   Roughly mirrors 2026's shape (semis strong, some software weak) and includes
   plausible valuation fields so the value screen has something to rank. Never real. */
function mulberry32(a: number) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const seed = (s: string) => [...s].reduce((a, c) => a + c.charCodeAt(0), 7);
const NEG = new Set(["INTU", "BSX", "LULU", "FSLY", "ROKU"]);

export function sampleMarket(): MarketPayload {
  const rows: StockRow[] = UNIVERSE.map((s) => {
    const r = mulberry32(seed(s.sym));
    let ytd: number;
    if (s.sector === "Technology") ytd = 30 + r() * 160;
    else if (s.sector === "Energy") ytd = 8 + r() * 42;
    else if (s.sector === "Industrials") ytd = 5 + r() * 40;
    else ytd = r() * 30 - 4;
    if (NEG.has(s.sym)) ytd = -(15 + r() * 40);
    const rnd = () => r();
    const roe = 6 + rnd() * 30;
    const pe = NEG.has(s.sym) ? 40 + rnd() * 40 : 10 + rnd() * 28;
    const discount = Math.round((NEG.has(s.sym) ? 20 + rnd() * 40 : rnd() * 30) * 10) / 10;
    return {
      ...s,
      returns: {
        daily: Math.round((rnd() * 6 - 3) * 100) / 100,
        weekly: Math.round((rnd() * 12 - 5) * 10) / 10,
        monthly: Math.round((ytd / 6 + rnd() * 10 - 5) * 10) / 10,
        ytd: Math.round(ytd * 10) / 10,
        annual: Math.round((ytd * 1.4 + rnd() * 20 - 10) * 10) / 10,
      },
      val: {
        pe: Math.round(pe * 10) / 10, pb: Math.round((1 + rnd() * 8) * 10) / 10,
        ps: Math.round((0.8 + rnd() * 9) * 10) / 10, roe: Math.round(roe * 10) / 10,
        price: null, high52: null, discount,
      },
      valueScore: null, undervalued: false,
    };
  });
  const { picks, sectorPicks } = computeValue(rows);
  return { stocks: rows, picks, sectorPicks, marketTone: 0, source: "sample", asOf: new Date().toISOString() };
}
