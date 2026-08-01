import { NextResponse } from "next/server";
import { getGeneralNews, hasKey } from "@/lib/finnhub";
import { scoreText, aggregate, labelFor } from "@/lib/sentiment";

export const dynamic = "force-dynamic";

const SAMPLE = [
  { source:"Bloomberg", headline:"Stocks rally as inflation cools and earnings beat estimates" },
  { source:"Reuters", headline:"Chipmakers surge on record AI data-center demand" },
  { source:"CNBC", headline:"Fed signals patience; markets climb on rate-cut optimism" },
  { source:"MarketWatch", headline:"Software names slump on AI-disruption fears" },
  { source:"Reuters", headline:"Energy shares fall as crude drops on demand worries" },
  { source:"Bloomberg", headline:"Memory stocks tumble in sharp semiconductor selloff" },
  { source:"CNBC", headline:"Retail sales rebound, lifting consumer stocks" },
  { source:"Reuters", headline:"Investors weigh recession fears against solid jobs data" },
];

export async function GET() {
  const raw = hasKey() ? await getGeneralNews() : null;
  const now = Math.floor(Date.now()/1000);
  const list = (raw && raw.length)
    ? raw.slice(0,40).map(n => ({ source:n.source, headline:n.headline, url:n.url, datetime:n.datetime, score: scoreText(`${n.headline} ${n.summary??""}`) }))
    : SAMPLE.map((n,i) => ({ ...n, url:"#", datetime: now - i*1800, score: scoreText(n.headline) }));
  list.sort((a,b)=>b.datetime-a.datetime);
  const agg = aggregate(list.map(i=>i.score));
  return NextResponse.json({
    signal: agg.signal, label: labelFor(agg.signal), confidence: agg.confidence, counts: agg.counts,
    items: list, source: (raw && raw.length) ? "live" : "sample", asOf: new Date().toISOString(),
  });
}
