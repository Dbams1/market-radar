import { NextResponse } from "next/server";
import { collectNews, type NewsItem, type Category } from "@/lib/news";
import { scoreText, aggregate, labelFor } from "@/lib/sentiment";

export const dynamic = "force-dynamic";

const SAMPLE: Omit<NewsItem, "url" | "datetime">[] = [
  { source: "Reuters", category: "Markets", headline: "Stocks rally as earnings beat and inflation cools" },
  { source: "Federal Reserve", category: "Fed", headline: "Fed holds rates steady, signals patience on future cuts" },
  { source: "CNBC", category: "Macro", headline: "Jobs report resilient as treasury yields ease" },
  { source: "BBC Business", category: "Global", headline: "Global markets climb on trade-deal optimism" },
  { source: "Bloomberg", category: "Markets", headline: "Chipmakers surge on record AI data-center demand" },
  { source: "MarketWatch", category: "Markets", headline: "Software names slump on AI-disruption fears" },
  { source: "CNN Business", category: "Macro", headline: "Sticky inflation and recession fears weigh on sentiment" },
  { source: "Reuters", category: "Global", headline: "Energy shares fall as crude drops on demand worries" },
  { source: "Federal Reserve", category: "Fed", headline: "FOMC minutes show officials split on timing of rate cuts" },
  { source: "BBC Business", category: "Global", headline: "European shares steady as tariffs and geopolitics loom" },
];
const CATS: Category[] = ["Markets", "Fed", "Macro", "Global"];

export async function GET() {
  let { items, sources, live } = await collectNews();
  let usedSample = false;
  if (!live) {
    usedSample = true; const now = Math.floor(Date.now() / 1000);
    items = SAMPLE.map((s, i) => ({ ...s, url: "#", datetime: now - i * 1500 }));
    sources = [{ name: "Sample feed", ok: true, count: items.length }];
  }
  const scored = items.slice(0, 60).map(n => ({ ...n, score: scoreText(n.headline) }));
  const agg = aggregate(scored.map(i => i.score));
  const categories = CATS.map(key => {
    const arr = scored.filter(i => i.category === key); const a = aggregate(arr.map(i => i.score));
    return { key, signal: a.signal, label: labelFor(a.signal), count: arr.length };
  }).filter(c => c.count > 0);

  return NextResponse.json({
    signal: agg.signal, label: labelFor(agg.signal), confidence: agg.confidence, counts: agg.counts,
    items: scored, categories, sources, source: usedSample ? "sample" : "live", asOf: new Date().toISOString(),
  });
}
