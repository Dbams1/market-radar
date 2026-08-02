"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import type { MarketPayload, Enrichment, Pillars } from "@/lib/types";
import { TIER_NAME, PILLAR_LABELS } from "@/lib/types";

const fetcher = (u: string) => fetch(u).then((r) => r.json());
const SECTOR_COLORS: Record<string, string> = {
  "Technology":"#4C7DFF","Energy":"#C9973A","Industrials":"#5A9E5A","Financials":"#2FB6A8",
  "Healthcare":"#E0648C","Communication":"#8B6CF0","Consumer & Retail":"#E08A3C",
};
type Sent = { label: string; signal: number } | undefined;
const initials = (n: string) => n.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("");
const num = (n: number | null | undefined, s = "") => n == null ? "—" : (Math.round(n * 10) / 10) + s;

function PillarBars({ p }: { p: Pillars }) {
  return (
    <div className="pillars">
      {PILLAR_LABELS.map(({ key, label }) => { const v = p[key]; const pct = v == null ? 0 : Math.round(v * 100);
        return (<div className="pil" key={key}><div className="pil-lab">{label}</div>
          <div className="pil-track"><div className="pil-fill" style={{ width: `${pct}%` }} /></div>
          <div className="pil-n">{v == null ? "—" : pct}</div></div>); })}
    </div>
  );
}

export default function StockPicks() {
  const { data } = useSWR<MarketPayload>("/api/market", fetcher, { refreshInterval: 60000, revalidateOnFocus: false });
  const { data: sent } = useSWR<Sent>("/api/sentiment", fetcher, { refreshInterval: 120000, revalidateOnFocus: false });
  const [enrich, setEnrich] = useState<Record<string, Enrichment>>({});

  const picks = data?.picks ?? [];
  const sectors = data?.sectorPicks ?? [];
  const symKey = picks.map(p => p.sym).join(",");

  useEffect(() => {
    if (!symKey) return;
    let alive = true;
    fetch(`/api/enrich?syms=${encodeURIComponent(symKey)}`).then(r => r.json())
      .then((rows: Enrichment[]) => { if (alive && Array.isArray(rows)) { const m: Record<string, Enrichment> = {}; rows.forEach(e => m[e.sym] = e); setEnrich(m); } })
      .catch(() => {});
    return () => { alive = false; };
  }, [symKey]);

  if (!data) return null;
  const maxScore = Math.max(1, ...sectors.map(s => s.score));

  return (
    <section style={{ marginTop: 10 }}>
      <div className="sec-title">Where the value is — multi-factor screen</div>
      <div className="sec-sub">A six-factor smart-beta model — Value, Quality, Growth, risk-adjusted Momentum, Low-Volatility and Safety — scored with winsorized cross-sectional z-scores, gated by a Piotroski-style health score and an Altman-style distress screen, then confirmed with live news sentiment and analyst views</div>

      <div className="disclaimer">
        <b>Not investment advice.</b> An automated, educational screen built on public fundamentals, news and analyst data.
        It is not a recommendation to buy or sell any security. Cheap can stay cheap, data can be stale or wrong, and past
        performance does not predict future results. Do your own research and consult a licensed professional before investing.
      </div>

      {sent && (
        <div className="tone-strip">
          <span className="tone-lab">Market tone</span>
          <span className={"tone-val " + (sent.signal > 0.05 ? "up" : sent.signal < -0.05 ? "down" : "flat")}>{sent.label}</span>
          <span className="tone-note">broad news sentiment — context, not a call on any single name.</span>
        </div>
      )}

      <div className="picks-grid2">
        <div>
          <div className="mini-h">Sectors screening best</div>
          <div className="sec-sub2">Balanced score + momentum · with each sector's average PEG</div>
          <div className="card">
            {sectors.map((s, i) => { const w = Math.max(6, s.score / maxScore * 100); const c = SECTOR_COLORS[s.sector] || "#4C7DFF";
              return (<div className="rec-row" key={s.sector}>
                <div className="rec-rank">{i + 1}</div>
                <div className="rec-lab">{s.sector}<span className="rec-peg">PEG {num(s.peg)}</span></div>
                <div className="rec-track"><div className="rec-fill" style={{ width: `${w}%`, background: c }} /></div>
                <div className="rec-score">{s.score.toFixed(0)}</div>
              </div>); })}
          </div>
        </div>

        <div>
          <div className="mini-h">Undervalued names</div>
          <div className="sec-sub2">Growth-adjusted cheap, growing, quality and financially sound — with news &amp; analyst confirmation</div>
          {picks.length === 0 && <div className="card empty">No names currently clear the multi-factor screen. Nothing is forced onto the list.</div>}
          <div className="pick-list">
            {picks.map((p) => { const c = SECTOR_COLORS[p.sector] || "#4C7DFF"; const e = enrich[p.sym];
              const pegBelow = p.peg != null && p.sectorPeg != null && p.peg < p.sectorPeg;
              return (<div className="pick-card" key={p.sym}>
                <div className="pick-top">
                  <div className="logo" style={{ background: c + "22", color: c }}>{initials(p.name)}</div>
                  <div className="pick-id"><div><span className="sym">{p.sym}</span><span className="tier">{TIER_NAME[p.tier]}</span></div><div className="name">{p.name}</div><div className="sec-chip">{p.sector}</div></div>
                  <div className="vscore"><div className="vscore-n">{p.valueScore.toFixed(0)}</div><div className="vscore-l">score</div></div>
                </div>
                <PillarBars p={p.pillars} />
                <div className="peg-line">
                  <span className={"peg-badge " + (pegBelow ? "good" : "")}>PEG <b>{num(p.peg)}</b> vs sector <b>{num(p.sectorPeg)}</b>{pegBelow ? " · cheaper" : ""}</span>
                  {p.fScore != null && <span className={"qflag " + (p.fScore >= 7 ? "good" : p.fScore >= 5 ? "" : "warn")}>F-Score <b>{p.fScore}/9</b></span>}
                  {p.distress && <span className={"qflag " + (p.distress === "Low" ? "good" : p.distress === "High" ? "warn" : "")}>Distress <b>{p.distress}</b></span>}
                </div>
                <div className="pick-metrics">
                  <span className="chip">EV/EBITDA <b>{num(p.evEbitda)}</b></span>
                  <span className="chip">FCF yld <b>{num(p.fcfYield, "%")}</b></span>
                  <span className="chip">ROIC <b>{num(p.roic, "%")}</b></span>
                  <span className="chip">Net mgn <b>{num(p.netMargin, "%")}</b></span>
                  <span className="chip">D/E <b>{num(p.debtEq, "%")}</b></span>
                  <span className="chip">EPS gr <b>{num(p.epsGrowth, "%")}</b></span>
                </div>
                <div className="pick-enrich">
                  {e ? (<>
                    <span className={"etag " + (e.newsLabel === "Positive" ? "up" : e.newsLabel === "Negative" ? "down" : "flat")}>News: {e.newsLabel}{e.headlines ? ` (${e.headlines})` : ""}</span>
                    <span className="etag">Analysts: {e.analystBuyPct == null ? "n/a" : `${e.analystBuyPct}% buy`}{e.analystTotal ? ` · ${e.analystTotal}` : ""}</span>
                  </>) : <span className="etag muted">loading news &amp; analyst view…</span>}
                </div>
              </div>); })}
          </div>
        </div>
      </div>
      <p className="method-note">Each factor is a winsorized z-score standardized across the tracked universe (outliers clipped at 3 SD), then combined into a composite and converted to a 0-100 cross-sectional rank. Momentum is risk-adjusted (return / beta); Low-Vol rewards low beta. The <b>F-Score</b> (0-9) is a Piotroski-style fundamental-health check; <b>Distress</b> is an Altman-style leverage/coverage/liquidity screen. A name only qualifies as undervalued if it ranks highly, has a PEG at or below its sector, positive earnings growth, F-Score of at least 5, and is not high-distress. Cross-sectional techniques on current data, not a backtested or machine-learned forecast.</p>
    </section>
  );
}
