/* Transparent, lexicon-based sentiment for financial headlines. Every word that
   moves the score is listed here, so the signal can be audited. A directional
   read on tone, not a forecast. */
const POS: Record<string, number> = {
  surge:2,surges:2,soar:2,soars:2,rally:2,rallies:2,jump:1.5,jumps:1.5,gain:1,gains:1,rise:1,rises:1,
  rebound:1.5,beat:1.5,beats:1.5,record:1.5,high:1,highs:1,upgrade:1.5,upgraded:1.5,growth:1,strong:1.5,
  bullish:2,optimistic:1.5,outperform:1.5,profit:1,profits:1,boost:1.5,boosts:1.5,tops:1.5,climbs:1.5,
  demand:0.8,momentum:1,recovery:1.2,wins:1,approval:1,dovish:1.5,stimulus:1.2,resilient:1.2,expansion:1,eases:1,cooling:1.2,cools:1.2,softens:0.8,ceasefire:1.5,truce:1.2,deal:0.8,steady:0.5,
};
const NEG: Record<string, number> = {
  plunge:2,plunges:2,slump:2,slumps:2,crash:2.5,crashes:2.5,tumble:2,tumbles:2,drop:1.5,drops:1.5,
  fall:1,falls:1,fell:1,sink:1.5,sinks:1.5,loss:1.5,losses:1.5,miss:1.5,misses:1.5,cut:1,cuts:1,
  downgrade:1.5,downgraded:1.5,weak:1.5,bearish:2,recession:2,fear:1.5,fears:1.5,selloff:2,warning:1.5,
  warns:1.5,layoffs:1.5,lawsuit:1,probe:1,decline:1.2,declines:1.2,slowdown:1.5,inflation:0.8,
  default:1.5,bankruptcy:2.5,slashes:1.5,halts:1.2,hawkish:1.5,hike:1,hikes:1,tightening:1.2,sticky:1,tariff:1.2,tariffs:1.2,sanctions:1.2,conflict:1.5,war:1.5,shutdown:1.5,jobless:1.2,deficit:1,crisis:2,downturn:1.5,contraction:1.5,
};
const NEGATORS = new Set(["no","not","never","without","avoids","avoid"]);
export function scoreText(text: string): number {
  const words = text.toLowerCase().replace(/[^a-z0-9\-\s]/g," ").split(/\s+/).filter(Boolean);
  let raw = 0, hits = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i], flip = i>0 && NEGATORS.has(words[i-1]) ? -1 : 1;
    if (w in POS){ raw += POS[w]*flip; hits++; } else if (w in NEG){ raw -= NEG[w]*flip; hits++; }
  }
  if (hits === 0) return 0;
  return Math.max(-1, Math.min(1, raw/4));
}
export function aggregate(scores: number[]) {
  const graded = scores.filter(s=>s!==0);
  const signal = graded.length===0 ? 0 : graded.reduce((a,b)=>a+b,0)/graded.length;
  const positive = scores.filter(s=>s>0.05).length;
  const negative = scores.filter(s=>s<-0.05).length;
  const neutral = scores.length - positive - negative;
  const variance = graded.length===0 ? 1 : graded.reduce((a,b)=>a+(b-signal)**2,0)/graded.length;
  const agreement = 1 - Math.min(1, Math.sqrt(variance));
  const volume = Math.min(1, graded.length/20);
  return { signal, confidence: Math.round(agreement*volume*100)/100, counts: { positive, neutral, negative } };
}
export function labelFor(signal: number): string {
  if (signal>=0.4) return "Bullish";
  if (signal>=0.12) return "Leaning bullish";
  if (signal>-0.12) return "Neutral";
  if (signal>-0.4) return "Leaning bearish";
  return "Bearish";
}
