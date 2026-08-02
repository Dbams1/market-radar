import { NextResponse } from "next/server";
import { getCompanyNews, getRecommendation, hasKey, mapLimit } from "@/lib/finnhub";
import type { Enrichment } from "@/lib/types";

export const dynamic = "force-dynamic";
const POS = ["beat","beats","surge","surged","record","strong","growth","upgrade","raise","raised","outperform","gains","profit","bullish","tops","jumps","soars","expands","wins","approval","rally"];
const NEG = ["miss","missed","fall","falls","drop","plunge","cut","cuts","downgrade","weak","loss","losses","lawsuit","probe","warning","decline","slumps","bearish","recall","halts","layoffs","fraud"];
function scoreHeadlines(text: string) {
  const t = text.toLowerCase(); let s = 0;
  for (const w of POS) if (t.includes(w)) s++;
  for (const w of NEG) if (t.includes(w)) s--;
  return s;
}

export async function GET(req: Request) {
  const syms = (new URL(req.url).searchParams.get("syms") || "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 12);
  if (!hasKey() || syms.length === 0) {
    // deterministic sample enrichment so no-key mode still renders
    const out: Enrichment[] = syms.map((sym, i) => ({ sym, newsLabel: (i % 3 === 0 ? "Positive" : i % 3 === 1 ? "Neutral" : "Negative"),
      newsScore: [2, 0, -1][i % 3], headlines: 6 + (i % 4), analystBuyPct: 55 + (i * 7) % 40, analystTotal: 12 + (i % 6) }));
    return NextResponse.json(out);
  }
  const out: Enrichment[] = await mapLimit(syms, 4, async (sym) => {
    const [news, rec] = await Promise.all([getCompanyNews(sym, 21), getRecommendation(sym)]);
    let score = 0, n = 0;
    if (news) for (const a of news.slice(0, 25)) { score += scoreHeadlines(`${a.headline} ${a.summary ?? ""}`); n++; }
    const newsScore = n ? Math.round((score / Math.max(1, Math.sqrt(n))) * 10) / 10 : 0;
    const label: Enrichment["newsLabel"] = n === 0 ? "No recent news" : newsScore > 0.6 ? "Positive" : newsScore < -0.6 ? "Negative" : "Neutral";
    let analystBuyPct: number | null = null, analystTotal: number | null = null;
    if (rec && rec.length) { const r = rec[0]; const buy = r.strongBuy + r.buy; const tot = buy + r.hold + r.sell + r.strongSell;
      if (tot > 0) { analystBuyPct = Math.round((buy / tot) * 100); analystTotal = tot; } }
    return { sym, newsLabel: label, newsScore, headlines: n, analystBuyPct, analystTotal };
  });
  return NextResponse.json(out);
}
