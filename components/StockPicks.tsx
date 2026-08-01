"use client";
import useSWR from "swr";
import type { MarketPayload } from "@/lib/types";
import { TIER_NAME } from "@/lib/types";

const fetcher = (u: string) => fetch(u).then((r) => r.json());
const SECTOR_COLORS: Record<string, string> = {
  "Technology":"#4C7DFF","Energy":"#C9973A","Industrials":"#5A9E5A","Financials":"#2FB6A8",
  "Healthcare":"#E0648C","Communication":"#8B6CF0","Consumer & Retail":"#E08A3C",
};
type Sent = { label: string; signal: number } | undefined;
const initials = (n: string) => n.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("");
const num = (n: number | null, s = "") => n == null ? "—" : n.toFixed(1) + s;

export default function StockPicks() {
  const { data } = useSWR<MarketPayload>("/api/market", fetcher, { refreshInterval: 60000, revalidateOnFocus: false });
  const { data: sent } = useSWR<Sent>("/api/sentiment", fetcher, { refreshInterval: 120000, revalidateOnFocus: false });
  if (!data) return null;

  const picks = data.picks ?? [];
  const sectors = data.sectorPicks ?? [];
  const maxScore = Math.max(1, ...sectors.map(s => s.score));

  return (
    <section style={{ marginTop: 10 }}>
      <div className="sec-title">Where the value is — fundamentals screen</div>
      <div className="sec-sub">Undervalued names ranked by a transparent value score (cheap multiples, quality, and discount to 52-week high), read live</div>

      <div className="disclaimer">
        <b>Not investment advice.</b> This is an automated, educational screen built on public fundamentals and market data.
        It is not a recommendation to buy or sell any security. Screens can be wrong, data can be stale, and past performance
        does not predict future results. Do your own research and consult a licensed financial professional before investing.
      </div>

      {sent && (
        <div className="tone-strip">
          <span className="tone-lab">Market tone right now</span>
          <span className={"tone-val " + (sent.signal > 0.05 ? "up" : sent.signal < -0.05 ? "down" : "flat")}>{sent.label}</span>
          <span className="tone-note">from live news sentiment — context for the screen below, not a signal on any single name.</span>
        </div>
      )}

      <div className="picks-grid2">
        <div>
          <div className="mini-h">Sectors screening best</div>
          <div className="sec-sub2">Blend of average value score and recent momentum</div>
          <div className="card">
            {sectors.map((s, i) => { const w = Math.max(6, s.score / maxScore * 100); const c = SECTOR_COLORS[s.sector] || "#4C7DFF";
              return (<div className="rec-row" key={s.sector}>
                <div className="rec-rank">{i + 1}</div>
                <div className="rec-lab">{s.sector}</div>
                <div className="rec-track"><div className="rec-fill" style={{ width: `${w}%`, background: c }} /></div>
                <div className="rec-score">{s.score.toFixed(0)}</div>
              </div>); })}
          </div>
        </div>

        <div>
          <div className="mini-h">Undervalued names</div>
          <div className="sec-sub2">Cheap, profitable, and off their highs — higher score = cheaper for the quality</div>
          {picks.length === 0 && <div className="card empty">No names currently clear the undervalued screen. Nothing is forced onto the list.</div>}
          <div className="pick-list">
            {picks.map((p) => { const c = SECTOR_COLORS[p.sector] || "#4C7DFF";
              return (<div className="pick-card" key={p.sym}>
                <div className="pick-top">
                  <div className="logo" style={{ background: c + "22", color: c }}>{initials(p.name)}</div>
                  <div className="pick-id"><div><span className="sym">{p.sym}</span><span className="tier">{TIER_NAME[p.tier]}</span></div><div className="name">{p.name}</div><div className="sec-chip">{p.sector}</div></div>
                  <div className="vscore"><div className="vscore-n">{p.valueScore.toFixed(0)}</div><div className="vscore-l">value</div></div>
                </div>
                <div className="pick-metrics">
                  <span className="chip">P/E <b>{num(p.pe)}</b></span>
                  <span className="chip">P/B <b>{num(p.pb)}</b></span>
                  <span className="chip">ROE <b>{num(p.roe, "%")}</b></span>
                  <span className="chip">Off high <b>{num(p.discount, "%")}</b></span>
                  <span className={"chip " + ((p.ytd ?? 0) >= 0 ? "up" : "down")}>YTD <b>{p.ytd == null ? "—" : (p.ytd >= 0 ? "+" : "") + p.ytd.toFixed(0) + "%"}</b></span>
                </div>
              </div>); })}
          </div>
        </div>
      </div>
    </section>
  );
}
