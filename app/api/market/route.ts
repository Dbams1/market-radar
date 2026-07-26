import { NextResponse } from "next/server";
import { UNIVERSE } from "@/lib/universe";
import { getMetric, hasKey, pick, mapLimit } from "@/lib/finnhub";
import { sampleMarket, aggregate } from "@/lib/sample";
import type { MarketPayload, StockRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasKey()) return NextResponse.json(sampleMarket());
  const stocks: StockRow[] = await mapLimit(UNIVERSE, 6, async (s) => {
    const m = await getMetric(s.sym);
    const ytd = pick(m?.metric, ["yearToDatePriceReturnDaily", "ytdPriceReturnDaily"]);
    return { sym: s.sym, name: s.name, sector: s.sector, tier: s.tier, ytd };
  });
  const payload: MarketPayload = {
    stocks,
    sectors: aggregate(stocks),
    source: "live",
    asOf: new Date().toISOString(),
  };
  return NextResponse.json(payload);
}
