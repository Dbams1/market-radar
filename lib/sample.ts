import { UNIVERSE } from "./universe";
import type { MarketPayload, StockRow, SectorAgg, Sector } from "./types";
/* Labeled fallback so the app is explorable with no key. Clearly marked
   source:"sample" and badged in the UI. Roughly mirrors 2026's shape
   (semis strong, some software weak) but is NOT real and never presented as such. */
function mulberry32(a:number){return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const seed=(s:string)=>[...s].reduce((a,c)=>a+c.charCodeAt(0),7);
const NEG = new Set(["INTU","BSX","LULU","FSLY"]);
export function sampleMarket(): MarketPayload {
  const stocks: StockRow[] = UNIVERSE.map((s) => {
    const r = mulberry32(seed(s.sym));
    let base:number;
    if (s.sector==="Technology") base = 30 + r()*180;
    else if (s.sector==="Energy") base = 10 + r()*45;
    else if (s.sector==="Industrials") base = 5 + r()*40;
    else base = r()*30 - 4;
    if (NEG.has(s.sym)) base = -(20 + r()*35);
    return { sym:s.sym, name:s.name, sector:s.sector, tier:s.tier, ytd: Math.round(base*10)/10 };
  });
  return { stocks, sectors: aggregate(stocks), source:"sample", asOf: new Date().toISOString() };
}
export function aggregate(stocks: StockRow[]): SectorAgg[] {
  const by = new Map<Sector, number[]>();
  for (const s of stocks){ if(s.ytd==null) continue; const a=by.get(s.sector)??[]; a.push(s.ytd); by.set(s.sector,a); }
  return Array.from(by.entries())
    .map(([name, arr]) => ({ name, avg: Math.round(arr.reduce((x,y)=>x+y,0)/arr.length*10)/10, count: arr.length }))
    .sort((a,b)=>b.avg-a.avg);
}
