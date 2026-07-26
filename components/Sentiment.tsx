"use client";
import useSWR from "swr";

type NewsItem = { source:string; headline:string; url:string; datetime:number; score:number };
type Payload = { signal:number; label:string; confidence:number; counts:{positive:number;neutral:number;negative:number}; items:NewsItem[]; source:"live"|"sample"; asOf:string };

const fetcher = (u:string)=>fetch(u).then(r=>r.json());
const tone = (s:number)=> s>0.05?"up":s<-0.05?"down":"flat";
const ago = (t:number)=>{const d=Math.max(0,Date.now()/1000-t);if(d<3600)return Math.floor(d/60)+"m ago";if(d<86400)return Math.floor(d/3600)+"h ago";return Math.floor(d/86400)+"d ago";};

function Gauge({ signal }:{ signal:number }) {
  const c = Math.max(-1,Math.min(1,signal));
  const angle = 180 - ((c+1)/2)*180, rad = angle*Math.PI/180;
  const cx=130, cy=120, r=96, nx=cx+r*Math.cos(rad), ny=cy-r*Math.sin(rad);
  return (
    <svg viewBox="0 0 260 140" className="gauge" role="img" aria-label="Market sentiment gauge">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#F8717A"/><stop offset="0.5" stopColor="#6B7480"/><stop offset="1" stopColor="#34D399"/></linearGradient></defs>
      <path d="M 34 120 A 96 96 0 0 1 226 120" fill="none" stroke="url(#g)" strokeWidth="14" strokeLinecap="round"/>
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#E9ECF1" strokeWidth="3" strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r="7" fill="#E9ECF1"/>
      <text x="34" y="136" className="gauge-end">Bearish</text>
      <text x="226" y="136" className="gauge-end" textAnchor="end">Bullish</text>
    </svg>
  );
}

export default function Sentiment() {
  const { data } = useSWR<Payload>("/api/sentiment", fetcher, { refreshInterval: 120000, revalidateOnFocus:false });
  return (
    <section style={{marginTop:8}}>
      <div className="sec-title">Market signal - news &amp; sentiment</div>
      <div className="sec-sub">A transparent read on market tone, aggregated live from financial headlines</div>
      <div className="signal-grid">
        <div className="gauge-card">
          <Gauge signal={data?.signal ?? 0} />
          <div className="gauge-label">{data?.label ?? "Reading…"}</div>
          <div className="gauge-meta"><span>Signal {data?`${data.signal>=0?"+":""}${data.signal.toFixed(2)}`:"-"}</span><span>Confidence {data?Math.round(data.confidence*100)+"%":"-"}</span></div>
          {data && <div className="tally"><span className="up">{data.counts.positive} pos</span><span className="flat">{data.counts.neutral} neu</span><span className="down">{data.counts.negative} neg</span></div>}
          <p className="gauge-foot">Heuristic lexical sentiment across recent headlines. A directional signal, not a forecast.</p>
        </div>
        <div className="news-card">
          <div className="news-head">Headlines driving the signal</div>
          <ul className="news-list">
            {(data?.items ?? []).slice(0,12).map((n,i)=>(
              <li className="news-item" key={i}>
                <span className={"news-tone "+tone(n.score)} />
                <div className="news-body">
                  <a href={n.url} target="_blank" rel="noopener noreferrer" className="news-hl">{n.headline}</a>
                  <div className="news-meta"><span className="news-src">{n.source}</span><span>·</span><span>{ago(n.datetime)}</span><span className={"news-score "+tone(n.score)}>{n.score>=0?"+":""}{n.score.toFixed(2)}</span></div>
                </div>
              </li>
            ))}
            {!data && <li className="empty2">Loading headlines…</li>}
          </ul>
        </div>
      </div>
      {data?.source==="sample" && <p className="sample-note">Showing sample headlines - live news loads once your Finnhub key is active.</p>}
    </section>
  );
}
