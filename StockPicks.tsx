import { NextResponse } from "next/server";
import { UNIVERSE } from "@/lib/universe";
import { getMetric, getQuote, hasKey, pick, mapLimit } from "@/lib/finnhub";
import { computeValue } from "@/lib/value";
import { sampleMarket } from "@/lib/sample";
import type { MarketPayload, StockRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasKey()) return NextResponse.json(sampleMarket());

  const rows: StockRow[] = await mapLimit(UNIVERSE, 6, async (s) => {
    const [m, q] = await Promise.all([getMetric(s.sym), getQuote(s.sym)]);
    const mm = m?.metric;
    const price = typeof q?.c === "number" ? q!.c : null;
    const high52 = pick(mm, ["52WeekHigh"]);
    const discount = price != null && high52 && high52 > 0 ? Math.round((1 - price / high52) * 1000) / 10 : null;
    return {
      ...s,
      returns: {
        daily: typeof q?.dp === "number" ? Math.round(q!.dp! * 100) / 100 : null,
        weekly: pick(mm, ["5DayPriceReturnDaily"]),
        monthly: pick(mm, ["monthToDatePriceReturnDaily", "26WeekPriceReturnDaily"]),
        ytd: pick(mm, ["yearToDatePriceReturnDaily"]),
        annual: pick(mm, ["52WeekPriceReturnDaily"]),
      },
      val: {
        pe: pick(mm, ["peTTM", "peBasicExclExtraTTM", "peExclExtraTTM", "peNormalizedAnnual"]),
        pb: pick(mm, ["pbTTM", "pbAnnual", "pbQuarterly"]),
        ps: pick(mm, ["psTTM", "psAnnual"]),
        roe: pick(mm, ["roeTTM", "roeRfy", "roeAnnual"]),
        price, high52, discount,
      },
      valueScore: null, undervalued: false,
    };
  });

  const { picks, sectorPicks } = computeValue(rows);
  const payload: MarketPayload = { stocks: rows, picks, sectorPicks, marketTone: 0, source: "live", asOf: new Date().toISOString() };
  return NextResponse.json(payload);
}
