"use client";
import useSWR from "swr";
import type { MarketPayload } from "@/lib/types";
import { TIER_NAME } from "@/lib/types";
import { computeTechnicals, type TechRow, type Trend } from "@/lib/technical";

const fetcher = (u: string) => fetch(u).then((r) => r.json());
const SECTOR_COLORS: Record<string, string> = {
  "Technology":"#4C7DFF","Energy":"#C9973A","Industrials":"#5A9E5A","Financials":"#2FB6A8",
  "Healthcare":"#E0648C","Communication":"#8B6CF0","Consumer & Retail":"#E08A3C",
};
const initials = (n: string) => n.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("");
const num = (n: number | null | undefined, s = "") => n == null ? "—" : (n >= 0 ? "+" : "") + (Math.round(n * 10) / 10) + s;
const rsClass = (rs: number) => rs >= 80 ? "up" : rs >= 50 ? "flat" : "down";
const TREND: Record<Trend, { t: string; c: string }> = { Uptrend: { t: "▲ Uptrend", c: "up" }, Downtrend: { t: "▼ Downtrend", c: "down" }, Mixed: { t: "◆ Mixed", c: "flat" } };

export default function TechnicalPicks() {
  const { data } = useSWR<MarketPayload>("/api/market", fetcher, { refreshInterval: 60000, revalidateOnFocus: false });
  if (!data) return null;
  const { leaders, rsLeaders } = computeTechnicals(data.stocks);
  const maxRs = 99;

  return (
    <section style={{ marginTop: 10 }}>
      <div className="sec-title">Technical setups — trend &amp; momentum</div>
      <div className="sec-sub">A price-action screen: relative strength, multi-timeframe trend and 52-week positioning — complementary to the fundamental screen above (a name can be technically strong yet fundamentally rich, or vice-versa)</div>

      <div className="disclaimer">
        <b>Not investment advice.</b> A technical/price-action screen for education, derived from multi-horizon returns and 52-week range positioning (no intraday candles). Momentum can reverse sharply; this is not a signal to trade any security.
      </div>

      <div className="picks-grid2">
        <div>
          <div className="mini-h">Relative strength leaders</div>
          <div className="sec-sub2">Momentum ranked vs the universe (RS 1–99, IBD-style)</div>
          <div className="card">
            {rsLeaders.map((t, i) => { const c = SECTOR_COLORS[t.sector] || "#4C7DFF";
              return (<div className="rec-row" key={t.sym}>
                <div className="rec-rank">{i + 1}</div>
                <div className="rec-lab">{t.sym}<span className="rec-peg">{t.sector}</span></div>
                <div className="rec-track"><div className="rec-fill" style={{ width: `${Math.max(6, t.rs / maxRs * 100)}%`, background: c }} /></div>
                <div className="rec-score">{t.rs}</div>
              </div>); })}
          </div>
        </div>

        <div>
          <div className="mini-h">Technical leaders</div>
          <div className="sec-sub2">Strong relative strength in a confirmed trend — highest technical score first</div>
          {leaders.length === 0 && <div className="card empty">No names in a confirmed uptrend right now.</div>}
          <div className="pick-list">
            {leaders.map((t) => { const c = SECTOR_COLORS[t.sector] || "#4C7DFF"; const tr = TREND[t.trend];
              return (<div className="pick-card" key={t.sym}>
                <div className="pick-top">
                  <div className="logo" style={{ background: c + "22", color: c }}>{initials(t.name)}</div>
                  <div className="pick-id"><div><span className="sym">{t.sym}</span><span className="tier">{TIER_NAME[t.tier]}</span></div><div className="name">{t.name}</div><div className="sec-chip">{t.sector}</div></div>
                  <div className="vscore"><div className="vscore-n" style={{ color: "#4C7DFF" }}>{t.techScore.toFixed(0)}</div><div className="vscore-l">tech</div></div>
                </div>
                <div className="tech-flags">
                  <span className={"qflag " + tr.c}>{tr.t}</span>
                  <span className={"qflag " + rsClass(t.rs)}>RS <b>{t.rs}</b></span>
                </div>
                {t.rangePos != null && (
                  <div className="range-wrap">
                    <div className="range-lab"><span>52-wk low</span><span>position <b>{t.rangePos}%</b></span><span>high</span></div>
                    <div className="range-track"><div className="range-fill" style={{ width: `${t.rangePos}%` }} /><div className="range-dot" style={{ left: `${t.rangePos}%` }} /></div>
                  </div>
                )}
                <div className="pick-metrics">
                  <span className={"chip " + ((t.weekly ?? 0) >= 0 ? "up" : "down")}>1W <b>{num(t.weekly, "%")}</b></span>
                  <span className={"chip " + ((t.monthly ?? 0) >= 0 ? "up" : "down")}>1M <b>{num(t.monthly, "%")}</b></span>
                  <span className={"chip " + ((t.annual ?? 0) >= 0 ? "up" : "down")}>1Y <b>{num(t.annual, "%")}</b></span>
                  <span className="chip">Off high <b>{t.distHigh == null ? "—" : "-" + Math.round(t.distHigh) + "%"}</b></span>
                  <span className="chip">Beta <b>{t.beta == null ? "—" : t.beta.toFixed(2)}</b></span>
                </div>
              </div>); })}
          </div>
        </div>
      </div>
      <p className="method-note">Relative Strength ranks each name's blended multi-horizon return against the universe (1–99). Trend requires short-, medium- and long-horizon returns to agree. 52-week range position shows where the current price sits between its yearly low and high. These are momentum/price-action signals — strongest when confirmed by the fundamental screen above, and always secondary to your own research.</p>
    </section>
  );
}
