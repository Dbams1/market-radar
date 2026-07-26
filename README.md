# Market Radar — Live Market Overview

A real-time equity dashboard built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**,
and the **Finnhub** API, designed to deploy on **Vercel**. Unlike a static page, it reads live
year-to-date returns on every load — so the numbers are correct by definition, never frozen.

Three views on one page:
- **Sector performance (YTD)** — average return of the tracked names in each sector.
- **Stock heatmap (YTD)** — every name coloured by its real return, green→red, toggleable by sector or size.
- **Top performers (YTD)** — ranked, filterable by sector and market-cap size.

## Why this is accurate

- **Key stays server-side.** The browser calls this app's own `/api/market` route; that route calls
  Finnhub with your key. The key is never shipped to the client.
- **Live on every load.** Returns come from Finnhub's metric endpoint (`yearToDatePriceReturnDaily`),
  fetched fresh, cached briefly, and re-checked automatically every minute.
- **Honest scope.** It screens a **curated universe** of liquid names (edit `lib/universe.ts`), not the
  entire market — a full-market screener needs a paid data tier. Every figure shown is a real return
  for a real ticker.
- **Graceful fallback.** With no key it runs in clearly-labeled **sample** mode so it's explorable
  immediately; add a key and every number goes live.

## Run locally
```bash
npm install
cp .env.example .env.local     # paste your free Finnhub key
npm run dev                     # http://localhost:3000
```
No key yet? `npm run dev` still works and shows labeled sample data.

## Deploy to Vercel
1. Push this folder to a Git repo and import it at vercel.com (auto-detects Next.js).
2. Add env var **`FINNHUB_API_KEY`** with your free key (finnhub.io).
3. Deploy. Free tiers of both Vercel and Finnhub cover this.

## Connect to your portfolio
- In `app/layout.tsx`, set `PORTFOLIO_URL` to your live portfolio URL.
- On your portfolio, point the Market Radar project's live link at this app's Vercel URL.

## Notes
- Rate limits: one metric call per symbol (~52 total), fetched with bounded concurrency and cached
  ~15 min, comfortably inside Finnhub's free tier. Widen `lib/universe.ts` when you move to a paid tier.
- Research/educational tool. Not investment advice.
