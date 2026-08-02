"use client";
import { useMemo, useState } from "react";
import useSWR from "swr";
import type { MarketPayload, Tier, Period, StockRow } from "@/lib/types";
import { PERIODS, TIER_NAME } from "@/lib/types";

const fetcher = (u: string) => fetch(u).then((r) => r.json());
const SECTOR_COLORS: Record<string, string> = {
  "Technology":"#4C7DFF","Energy":"#C9973A","Industrials":"#5A9E5A","Financials":"#2FB6A8",
  "Healthcare":"#E0648C","Communication":"#8B6CF0","Consumer & Retail":"#E08A3C",
};
const SIZES: [string, string][] = [["All caps","All"],["Large","L"],["Mid","M"],["Small","S"]];
const pct = (n: number | null) => n == null ? "—" : (n >= 0 ? "+" : "") + n.toFixed(n != null && Math.abs(n) < 10 ? 2 : 1) + "%";
const tileColor = (r: number, scale = 60) => { const a = (0.16 + Math.min(Math.abs(r) / scale, 1) * 0.64).toFixed(2); return r >= 0 ? `rgba(52,211,153,${a})` : `rgba(248,113,122,${a})`; };
const initials = (name: string) => name.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("");

export default function MarketOverview() {
  const { data, isLoading } = useSWR<MarketPayload>("/api/market", fetcher, { refreshInterval: 60000, revalidateOnFocus: false });
  const [period, setPeriod] = useState<Period>("ytd");
  const [hmGroup, setHmGroup] = useState<"sector" | "size">("sector");
  const [sector, setSector] = useState("All");
  const [size, setSize] = useState<Tier | "All">("All");

  const stocks = data?.stocks ?? [];
  const ret = (s: StockRow) => s.returns[period];
  const scale = period === "daily" ? 8 : period === "weekly" ? 18 : period === "monthly" ? 30 : period === "annual" ? 120 : 90;
  const periodLabel = PERIODS.find(p => p.key === period)!.label;

  const withRet = useMemo(() => stocks.filter(s => ret(s) != null), [stocks, period]);
  const sectorsPresent = useMemo(() => Array.from(new Set(stocks.map(s => s.sector))), [stocks]);

  const sectorBars = useMemo(() => {
    const by: Record<string, number[]> = {};
    for (const s of withRet) (by[s.sector] = by[s.sector] || []).push(ret(s) as number);
    return Object.entries(by).map(([name, a]) => ({ name, avg: Math.round(a.reduce((x, y) => x + y, 0) / a.length * 10) / 10 })).sort((a, b) => b.avg - a.avg);
  }, [withRet, period]);
  const maxSec = Math.max(1, ...sectorBars.map(s => Math.abs(s.avg)));

  const groups = useMemo(() => {
    const g: Record<string, StockRow[]> = {}; const order: string[] = [];
    for (const s of withRet) { const k = hmGroup === "size" ? s.tier : s.sector; if (!g[k]) { g[k] = []; order.push(k); } g[k].push(s); }
    const keys = hmGroup === "size" ? (["L", "M", "S"] as string[]).filter(k => g[k]) : order;
    return keys.map(k => ({ label: hmGroup === "size" ? TIER_NAME[k as Tier] : k, items: g[k].slice().sort((a, b) => (ret(b) as number) - (ret(a) as number)) }));
  }, [withRet, hmGroup, period]);

  const top10 = useMemo(() => withRet
    .filter(s => sector === "All" || s.sector === sector)
    .filter(s => size === "All" || s.tier === size)
    .slice().sort((a, b) => (ret(b) as number) - (ret(a) as number)).slice(0, 10), [withRet, sector, size, period]);

  const kpi = useMemo(() => {
    const adv = withRet.filter(s => (ret(s) as number) > 0).length;
    const dec = withRet.filter(s => (ret(s) as number) < 0).length;
    return { adv, dec, breadth: adv + dec ? Math.round(adv / (adv + dec) * 100) : 0, topSector: sectorBars[0], topStock: withRet.slice().sort((a, b) => (ret(b) as number) - (ret(a) as number))[0] };
  }, [withRet, sectorBars, period]);

  const updated = data ? new Date(data.asOf).toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" }) : "";

  const renderRow = (s: StockRow, i: number) => {
    const c = SECTOR_COLORS[s.sector] || "#4C7DFF"; const up = (ret(s) as number) >= 0;
    return (<div className="row" key={s.sym}>
      <div className="rank">{i + 1}</div>
      <div className="logo" style={{ background: c + "22", color: c }}>{initials(s.name)}</div>
      <div className="meta"><div><span className="sym">{s.sym}</span><span className="tier">{TIER_NAME[s.tier]}</span></div><div className="name">{s.name}</div><div className="sec-chip">{s.sector}</div></div>
      <div className={"ytd " + (up ? "up" : "down")}>{pct(ret(s))}</div>
    </div>);
  };

  return (
    <div>
      <div className="panel-head">
        <div>
          <h1>Market overview</h1>
          <p className="sub">Live returns across a curated universe, read from Finnhub on every load. Switch the horizon to re-rank every view.</p>
        </div>
        {data && (
          <div className="status">
            <span className={"badge " + (data.source === "live" ? "live" : "sample")}><span className="dot" />{data.source === "live" ? "Live data" : "Sample data"}</span>
            {data.source === "live" && <span className="upd">Updated {updated}</span>}
          </div>
        )}
      </div>

      <div className="period-tabs">
        {PERIODS.map(p => (
          <button key={p.key} className={"period-tab" + (period === p.key ? " on" : "")} onClick={() => setPeriod(p.key)}>{p.label}</button>
        ))}
      </div>

      {isLoading && !data && <div className="loading">Loading live market data…</div>}

      {data && (<>
        {/* KPI strip */}
        <div className="kpi-strip">
          <div className="kpi"><div className="kpi-k">Breadth · {periodLabel}</div><div className="kpi-n">{kpi.breadth}<span className="kpi-pct">%</span></div><div className="kpi-sub">{kpi.adv} advancing · {kpi.dec} declining</div></div>
          <div className="kpi"><div className="kpi-k">Leading sector</div><div className="kpi-n sm">{kpi.topSector?.name ?? "—"}</div><div className={"kpi-sub " + ((kpi.topSector?.avg ?? 0) >= 0 ? "up" : "down")}>{kpi.topSector ? pct(kpi.topSector.avg) : "—"} avg</div></div>
          <div className="kpi"><div className="kpi-k">Top performer</div><div className="kpi-n">{kpi.topStock?.sym ?? "—"}</div><div className={"kpi-sub " + (((kpi.topStock ? (ret(kpi.topStock) as number) : 0)) >= 0 ? "up" : "down")}>{kpi.topStock ? pct(ret(kpi.topStock)) : "—"}</div></div>
          <div className="kpi"><div className="kpi-k">Undervalued picks</div><div className="kpi-n">{data.picks?.length ?? 0}</div><div className="kpi-sub">clearing the screen</div></div>
          <div className="kpi"><div className="kpi-k">Universe</div><div className="kpi-n">{stocks.length}</div><div className="kpi-sub">tracked names</div></div>
        </div>

        {/* sector performance + heatmap side by side */}
        <div className="dash-2">
          <div>
            <div className="sec-title">Sector performance — {periodLabel}</div>
            <div className="sec-sub">Average return of tracked names in each sector</div>
            <div className="card">
              {sectorBars.map(s => { const up = s.avg >= 0, w = Math.max(3, Math.abs(s.avg) / maxSec * 100);
                return (<div className="bar" key={s.name}><div className="lab">{s.name}</div><div className="track"><div className="fill" style={{ width: `${w}%`, background: up ? "var(--up)" : "var(--down)" }} /></div><div className={"val " + (up ? "up" : "down")}>{pct(s.avg)}</div></div>); })}
            </div>
          </div>
          <div>
            <div className="sec-title">Stock heatmap — {periodLabel}</div>
            <div className="sec-sub">Green = gainers, red = losers · intensity scales with the move</div>
            <div className="pills" style={{ marginBottom: 10 }}>
              {(["sector", "size"] as const).map(g => <button key={g} className={"pill" + (hmGroup === g ? " on" : "")} onClick={() => setHmGroup(g)}>{g === "sector" ? "By sector" : "By size"}</button>)}
            </div>
            <div className="card">
              {groups.map(grp => (
                <div className="hm-sector" key={grp.label}>
                  <div className="hm-lab">{grp.label}</div>
                  <div className="hm-grid">
                    {grp.items.map(s => (<div className="tile" key={s.sym} style={{ background: tileColor(ret(s) as number, scale) }} title={s.name}><div className="t-sym">{s.sym}</div><div className="t-ret">{pct(ret(s))}</div></div>))}
                  </div>
                </div>
              ))}
              <div className="hm-legend"><span><span className="sw" style={{ background: "rgba(52,211,153,.8)" }} />Gainers</span><span><span className="sw" style={{ background: "rgba(248,113,122,.8)" }} />Losers</span></div>
            </div>
          </div>
        </div>

        {/* Top 10 across full width, two columns */}
        <div className="sec-title">Top 10 performers — {periodLabel}</div>
        <div className="sec-sub">Ranked by {periodLabel.toLowerCase()} return · filter by sector and size</div>
        <div className="controls">
          <select className="sel" value={sector} onChange={e => setSector(e.target.value)}>
            <option value="All">All sectors</option>
            {sectorsPresent.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="pills">{SIZES.map(([lab, val]) => <button key={val} className={"pill" + (size === val ? " on" : "")} onClick={() => setSize(val as Tier | "All")}>{lab}</button>)}</div>
        </div>
        <div className="card top10-card">
          {top10.length === 0 ? <div className="empty">No names with data in this slice.</div> : (
            <div className="top10-grid">
              <div className="top10-col">{top10.slice(0, 5).map((s, i) => renderRow(s, i))}</div>
              <div className="top10-col">{top10.slice(5, 10).map((s, i) => renderRow(s, i + 5))}</div>
            </div>
          )}
        </div>

        {data.source === "sample" && <p className="sample-note">No API key set — showing labeled sample data. Add <code>FINNHUB_API_KEY</code> for live returns.</p>}
      </>)}
    </div>
  );
}
