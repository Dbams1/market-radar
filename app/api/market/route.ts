import { NextResponse } from "next/server";
import { UNIVERSE } from "@/lib/universe";
import { getMetric, getQuote, hasKey, pick, mapLimit } from "@/lib/finnhub";
import { computeValue } from "@/lib/value";
import { sampleMarket } from "@/lib/sample";
import type { MarketPayload, StockRow, Valuation } from "@/lib/types";

export const dynamic = "force-dynamic";

function buildVal(mm: Record<string, number | null> | undefined, price: number | null): Valuation {
  const pe = pick(mm, ["peTTM", "peBasicExclExtraTTM", "peExclExtraTTM", "peNormalizedAnnual"]);
  const epsGrowth = pick(mm, ["epsGrowthTTMYoy", "epsGrowth5Y", "epsGrowth3Y"]);
  let peg = pick(mm, ["pegTTM", "pegRatioTTM"]);
  if (peg == null && pe != null && pe > 0 && epsGrowth != null && epsGrowth > 5) peg = Math.round((pe / epsGrowth) * 100) / 100;
  const pfcf = pick(mm, ["pfcfShareTTM", "currentEv/freeCashFlowTTM"]);
  const fcfYield = pfcf && pfcf > 0 ? Math.round((100 / pfcf) * 10) / 10 : null;
  let debtEq = pick(mm, ["totalDebt/totalEquityQuarterly", "totalDebt/totalEquityAnnual", "longTermDebt/equityQuarterly", "longTermDebt/equityAnnual"]);
  if (debtEq != null && debtEq < 10) debtEq = Math.round(debtEq * 100); // normalize ratio -> %
  const high52 = pick(mm, ["52WeekHigh"]); const low52 = pick(mm, ["52WeekLow"]);
  const discount = price != null && high52 && high52 > 0 ? Math.round((1 - price / high52) * 1000) / 10 : null;
  return {
    pe, pb: pick(mm, ["pbTTM", "pbAnnual", "pbQuarterly"]), ps: pick(mm, ["psTTM", "psAnnual"]), peg,
    evEbitda: pick(mm, ["evEbitdaTTM", "currentEv/ebitdaTTM", "evToEbitdaTTM"]), fcfYield,
    epsGrowth, revGrowth: pick(mm, ["revenueGrowthTTMYoy", "revenueGrowth5Y", "revenueGrowth3Y"]),
    roic: pick(mm, ["roiTTM", "roiAnnual"]), roe: pick(mm, ["roeTTM", "roeRfy", "roeAnnual"]),
    netMargin: pick(mm, ["netProfitMarginTTM", "netProfitMarginAnnual"]), grossMargin: pick(mm, ["grossMarginTTM", "grossMarginAnnual"]),
    debtEq, currentRatio: pick(mm, ["currentRatioQuarterly", "currentRatioAnnual"]), intCoverage: pick(mm, ["netInterestCoverageTTM", "netInterestCoverageAnnual"]),
    beta: pick(mm, ["beta"]), divYield: pick(mm, ["dividendYieldIndicatedAnnual", "currentDividendYieldTTM"]),
    price, high52, low52, discount,
  };
}

export async function GET() {
  if (!hasKey()) return NextResponse.json(sampleMarket());

  const rows: StockRow[] = await mapLimit(UNIVERSE, 6, async (s) => {
    const [m, q] = await Promise.all([getMetric(s.sym), getQuote(s.sym)]);
    const mm = m?.metric; const price = typeof q?.c === "number" ? q!.c : null;
    return {
      ...s,
      returns: {
        daily: typeof q?.dp === "number" ? Math.round(q!.dp! * 100) / 100 : null,
        weekly: pick(mm, ["5DayPriceReturnDaily"]),
        monthly: pick(mm, ["monthToDatePriceReturnDaily", "26WeekPriceReturnDaily"]),
        ytd: pick(mm, ["yearToDatePriceReturnDaily"]),
        annual: pick(mm, ["52WeekPriceReturnDaily"]),
      },
      val: buildVal(mm, price),
      pillars: { value: null, quality: null, growth: null, momentum: null, lowVol: null, safety: null },
      valueScore: null, pegVsSector: null, fScore: null, distress: null, undervalued: false,
    };
  });

  const { picks, sectorPicks, sectorPeg } = computeValue(rows);
  const payload: MarketPayload = { stocks: rows, picks, sectorPicks, sectorPeg, source: "live", asOf: new Date().toISOString() };
  return NextResponse.json(payload);
}
