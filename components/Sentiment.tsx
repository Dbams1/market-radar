"use client";
import { useState } from "react";
import useSWR from "swr";

type NewsItem = { source: string; category: string; headline: string; url: string; datetime: number; score: number };
type Cat = { key: string; signal: number; label: string; count: number };
type Src = { name: string; ok: boolean; count: number };
type Payload = { signal: number; label: string; confidence: number; counts: { positive: number; neutral: number; negative: number }; items: NewsItem[]; categories: Cat[]; sources: Src[]; source: "live" | "sample"; asOf: string };

const fetcher = (u: string) => fetch(u).then(r => r.json());
const tone = (s: number) => s > 0.05 ? "up" : s < -0.05 ? "down" : "flat";
const ago = (t: number) => { const d = Math.max(0, Date.now() / 1000 - t); if (d < 3600) return Math.floor(d / 60) + "m ago"; if (d < 86400) return Math.floor(d / 3600) + "h ago"; return Math.floor(d / 86400) + "d ago"; };

function Gauge({ signal }: { signal: number }) {
  const c = Math.max(-1, Math.min(1, signal));
  const angle = 180 - ((c + 1) / 2) * 180, rad = angle * Math.PI / 180;
  const cx = 130, cy = 120, r = 96, nx = cx + r * Math.cos(rad), ny = cy - r * Math.sin(rad);
  return (
    <svg viewBox="0 0 260 140" className="gauge" role="img" aria-label="Market sentiment gauge">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#F8717A" /><stop offset="0.5" stopColor="#6B7480" /><stop offset="1" stopColor="#34D399" /></linearGradient></defs>
      <path d="M 34 120 A 96 96 0 0 1 226 120" fill="none" stroke="url(#g)" strokeWidth="14" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#E9ECF1" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="7" fill="#E9ECF1" />
      <text x="34" y="136" className="gauge-end">Bearish</text>
      <text x="226" y="136" className="gauge-end" textAnchor="end">Bullish</text>
    </svg>
  );
}

export default function Sentiment() {
  const { data } = useSWR<Payload>("/api/sentiment", fetcher, { refreshInterval: 120000, revalidateOnFocus: false });
  const [cat, setCat] = useState<string>("All");
  const items = (data?.items ?? []).filter(n => cat === "All" || n.category === cat);
  const liveSrc = (data?.sources ?? []).filter(s => s.ok).length;
  const totalSrc = (data?.sources ?? []).length;

  return (
    <section style={{ marginTop: 8 }}>
      <div className="sec-title">Market signal — multi-source news &amp; sentiment</div>
      <div className="sec-sub">Tone aggregated live and resiliently across markets, the Federal Reserve, macro and global sources — any one source can fail without breaking the read</div>

      <div className="signal-grid">
        <div className="gauge-card">
          <Gauge signal={data?.signal ?? 0} />
          <div className="gauge-label">{data?.label ?? "Reading…"}</div>
          <div className="gauge-meta"><span>Signal {data ? `${data.signal >= 0 ? "+" : ""}${data.signal.toFixed(2)}` : "—"}</span><span>Confidence {data ? Math.round(data.confidence * 100) + "%" : "—"}</span></div>
          {data && <div className="tally"><span className="up">{data.counts.positive} pos</span><span className="flat">{data.counts.neutral} neu</span><span className="down">{data.counts.negative} neg</span></div>}
          {/* per-category tone */}
          <div className="cat-tones">
            {(data?.categories ?? []).map(c => (
              <div className="cat-tone" key={c.key}>
                <span className="cat-tone-k">{c.key}</span>
                <span className={"cat-tone-v " + tone(c.signal)}>{c.label}</span>
                <span className="cat-tone-n">{c.count}</span>
              </div>
            ))}
          </div>
          {/* source coverage / resilience */}
          {data && (
            <div className="src-cov">
              <div className="src-cov-h">{data.source === "sample" ? "Sample feed (add key / deploy for live)" : `Live from ${liveSrc} of ${totalSrc} sources`}</div>
              <div className="src-list">
                {data.sources.map(s => (<span className={"src-chip " + (s.ok ? "ok" : "off")} key={s.name}><span className="src-dot" />{s.name}</span>))}
              </div>
            </div>
          )}
        </div>

        <div className="news-card">
          <div className="news-head">
            <span>Headlines driving the signal</span>
            <div className="cat-filter">
              {["All", ...(data?.categories ?? []).map(c => c.key)].map(k => (
                <button key={k} className={"cat-btn" + (cat === k ? " on" : "")} onClick={() => setCat(k)}>{k}</button>
              ))}
            </div>
          </div>
          <ul className="news-list">
            {items.slice(0, 14).map((n, i) => (
              <li className="news-item" key={i}>
                <span className={"news-tone " + tone(n.score)} />
                <div className="news-body">
                  <a href={n.url} target="_blank" rel="noopener noreferrer" className="news-hl">{n.headline}</a>
                  <div className="news-meta"><span className={"cat-badge c-" + n.category.toLowerCase()}>{n.category}</span><span className="news-src">{n.source}</span><span>·</span><span>{ago(n.datetime)}</span><span className={"news-score " + tone(n.score)}>{n.score >= 0 ? "+" : ""}{n.score.toFixed(2)}</span></div>
                </div>
              </li>
            ))}
            {!data && <li className="empty2">Loading headlines…</li>}
            {data && items.length === 0 && <li className="empty2">No headlines in this category right now.</li>}
          </ul>
        </div>
      </div>
      {data?.source === "sample" && <p className="sample-note">Showing sample multi-source headlines — live feeds load on the deployed app (they need server-side fetch).</p>}
    </section>
  );
}
