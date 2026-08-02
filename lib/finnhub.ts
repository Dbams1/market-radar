/* Server-only Finnhub client. Key read from env, never sent to the browser.
   Fails soft (returns null) so the app can fall back to labeled sample data. */
const BASE = "https://finnhub.io/api/v1";
const KEY = process.env.FINNHUB_API_KEY;
export function hasKey(): boolean { return typeof KEY === "string" && KEY.length > 0; }

async function fh<T>(path: string, revalidate: number): Promise<T | null> {
  if (!hasKey()) return null;
  try {
    const res = await fetch(`${BASE}${path}&token=${KEY}`, { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch { return null; }
}
export type MetricResp = { metric?: Record<string, number | null> } | null;
export const getMetric = (symbol: string) =>
  fh<MetricResp>(`/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all`, 900);

export function pick(metric: Record<string, number | null> | undefined, keys: string[]): number | null {
  if (!metric) return null;
  for (const k of keys) { const v = metric[k]; if (typeof v === "number" && Number.isFinite(v)) return v; }
  return null;
}
export async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length); let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); }
  });
  await Promise.all(workers); return out;
}

export type RawNews = { datetime: number; headline: string; source: string; summary?: string; url: string }[];
export const getGeneralNews = () => fh<RawNews>(`/news?category=general`, 300);

export type QuoteResp = { c?: number; dp?: number } | null;
export const getQuote = (symbol: string) =>
  fh<QuoteResp>(`/quote?symbol=${encodeURIComponent(symbol)}`, 180);

export type CompanyNews = { datetime: number; headline: string; summary?: string }[];
export function getCompanyNews(symbol: string, days = 21) {
  const to = new Date(); const from = new Date(Date.now() - days * 864e5);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return fh<CompanyNews>(`/company-news?symbol=${encodeURIComponent(symbol)}&from=${fmt(from)}&to=${fmt(to)}`, 1800);
}
export type RecTrend = { buy: number; hold: number; sell: number; strongBuy: number; strongSell: number; period: string }[];
export const getRecommendation = (symbol: string) =>
  fh<RecTrend>(`/stock/recommendation?symbol=${encodeURIComponent(symbol)}`, 3600);

export const getForexNews = () => fh<RawNews>(`/news?category=forex`, 300);
