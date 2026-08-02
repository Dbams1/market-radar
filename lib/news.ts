import { getGeneralNews, getForexNews, hasKey } from "./finnhub";

export type Category = "Markets" | "Fed" | "Macro" | "Global";
export type NewsItem = { source: string; category: Category; headline: string; url: string; datetime: number };
export type SourceStatus = { name: string; ok: boolean; count: number };

const RSS_SOURCES: { name: string; url: string; category: Category }[] = [
  { name: "Federal Reserve", url: "https://www.federalreserve.gov/feeds/press_all.xml", category: "Fed" },
  { name: "CNBC", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", category: "Markets" },
  { name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml", category: "Global" },
  { name: "CNN Business", url: "http://rss.cnn.com/rss/money_latest.rss", category: "Markets" },
  { name: "MarketWatch", url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", category: "Markets" },
];
const nowSec = () => Math.floor(Date.now() / 1000);
const FED = /\b(fed|fomc|powell|federal reserve|rate cut|rate hike|interest rate|monetary policy|basis points?)\b/i;
const MACRO = /\b(inflation|cpi|pce|gdp|jobs|payroll|unemployment|recession|tariffs?|treasury|yields?|econom(y|ic)|deficit|stimulus)\b/i;

function decodeEntities(s: string) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x?[0-9a-f]+;/gi, "").replace(/\s+/g, " ").trim();
}
function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decodeEntities(m[1]) : null;
}
function parseFeed(xml: string, source: string, category: Category, cap = 12): NewsItem[] {
  const isAtom = /<entry[\s>]/i.test(xml) && !/<item[\s>]/i.test(xml);
  const parts = xml.split(new RegExp(isAtom ? "<entry[\\s>]" : "<item[\\s>]", "i")).slice(1);
  const out: NewsItem[] = [];
  for (const p of parts.slice(0, cap)) {
    const headline = tag(p, "title"); if (!headline) continue;
    let url = tag(p, "link") || ""; if (!url) { const lm = p.match(/<link[^>]*href="([^"]+)"/i); if (lm) url = lm[1]; }
    const dt = tag(p, "pubDate") || tag(p, "updated") || tag(p, "published");
    const ts = dt ? Math.floor(Date.parse(dt) / 1000) : nowSec();
    out.push({ source, category, headline, url: url || "#", datetime: isFinite(ts) ? ts : nowSec() });
  }
  return out;
}
async function fetchText(url: string, ms = 4500): Promise<string | null> {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { signal: ac.signal, headers: { "user-agent": "Mozilla/5.0 (compatible; MarketRadar/1.0)" }, next: { revalidate: 300 } });
    if (!r.ok) return null; return await r.text();
  } catch { return null; } finally { clearTimeout(t); }
}
function retag(it: NewsItem): NewsItem {
  if (it.category === "Fed") return it;
  if (FED.test(it.headline)) return { ...it, category: "Fed" };
  if (MACRO.test(it.headline) && it.category !== "Global") return { ...it, category: "Macro" };
  return it;
}
function dedupe(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>(); const out: NewsItem[] = [];
  for (const i of items) { const k = i.headline.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60); if (k && !seen.has(k)) { seen.add(k); out.push(i); } }
  return out;
}

export async function collectNews(): Promise<{ items: NewsItem[]; sources: SourceStatus[]; live: boolean }> {
  const sources: SourceStatus[] = [];
  const tasks: Promise<NewsItem[]>[] = [];

  if (hasKey()) {
    tasks.push((async () => { try { const n = await getGeneralNews(); const it = (n || []).slice(0, 20).map(x => ({ source: x.source || "Finnhub", category: "Markets" as Category, headline: x.headline, url: x.url, datetime: x.datetime })); sources.push({ name: "Finnhub Markets", ok: it.length > 0, count: it.length }); return it; } catch { sources.push({ name: "Finnhub Markets", ok: false, count: 0 }); return []; } })());
    tasks.push((async () => { try { const n = await getForexNews(); const it = (n || []).slice(0, 12).map(x => ({ source: x.source || "Finnhub", category: "Macro" as Category, headline: x.headline, url: x.url, datetime: x.datetime })); sources.push({ name: "Finnhub Macro/FX", ok: it.length > 0, count: it.length }); return it; } catch { sources.push({ name: "Finnhub Macro/FX", ok: false, count: 0 }); return []; } })());
  }
  for (const src of RSS_SOURCES) {
    tasks.push((async () => { const xml = await fetchText(src.url); if (!xml) { sources.push({ name: src.name, ok: false, count: 0 }); return []; } const it = parseFeed(xml, src.name, src.category); sources.push({ name: src.name, ok: it.length > 0, count: it.length }); return it; })());
  }

  const settled = await Promise.allSettled(tasks);
  let items: NewsItem[] = [];
  for (const s of settled) if (s.status === "fulfilled") items = items.concat(s.value);
  items = dedupe(items.map(retag)).sort((a, b) => b.datetime - a.datetime);
  return { items, sources: sources.sort((a, b) => Number(b.ok) - Number(a.ok) || a.name.localeCompare(b.name)), live: items.length > 0 };
}
