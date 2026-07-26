import type { Stock } from "./types";
/* Curated, liquid universe screened LIVE. Not the whole market — but it includes
   the names that actually lead and lag, so real YTD returns drive everything.
   Add symbols freely; the app derives sectors, sizes, heatmap and leaders from data. */
export const UNIVERSE: Stock[] = [
  // Technology (incl. the 2026 memory/semis leaders and a couple software laggards)
  { sym:"AAPL",name:"Apple",sector:"Technology",tier:"L" },
  { sym:"MSFT",name:"Microsoft",sector:"Technology",tier:"L" },
  { sym:"NVDA",name:"NVIDIA",sector:"Technology",tier:"L" },
  { sym:"AVGO",name:"Broadcom",sector:"Technology",tier:"L" },
  { sym:"AMD",name:"Advanced Micro Devices",sector:"Technology",tier:"L" },
  { sym:"MU",name:"Micron Technology",sector:"Technology",tier:"L" },
  { sym:"SNDK",name:"SanDisk",sector:"Technology",tier:"L" },
  { sym:"WDC",name:"Western Digital",sector:"Technology",tier:"L" },
  { sym:"STX",name:"Seagate Technology",sector:"Technology",tier:"L" },
  { sym:"INTC",name:"Intel",sector:"Technology",tier:"L" },
  { sym:"MRVL",name:"Marvell Technology",sector:"Technology",tier:"L" },
  { sym:"DELL",name:"Dell Technologies",sector:"Technology",tier:"L" },
  { sym:"GLW",name:"Corning",sector:"Technology",tier:"L" },
  { sym:"INTU",name:"Intuit",sector:"Technology",tier:"L" },
  { sym:"FSLY",name:"Fastly",sector:"Technology",tier:"S" },
  // Communication
  { sym:"GOOGL",name:"Alphabet",sector:"Communication",tier:"L" },
  { sym:"META",name:"Meta Platforms",sector:"Communication",tier:"L" },
  { sym:"NFLX",name:"Netflix",sector:"Communication",tier:"L" },
  { sym:"DIS",name:"Walt Disney",sector:"Communication",tier:"L" },
  { sym:"TMUS",name:"T-Mobile",sector:"Communication",tier:"L" },
  { sym:"ROKU",name:"Roku",sector:"Communication",tier:"M" },
  // Consumer & Retail
  { sym:"AMZN",name:"Amazon",sector:"Consumer & Retail",tier:"L" },
  { sym:"TSLA",name:"Tesla",sector:"Consumer & Retail",tier:"L" },
  { sym:"HD",name:"Home Depot",sector:"Consumer & Retail",tier:"L" },
  { sym:"COST",name:"Costco",sector:"Consumer & Retail",tier:"L" },
  { sym:"WMT",name:"Walmart",sector:"Consumer & Retail",tier:"L" },
  { sym:"NKE",name:"Nike",sector:"Consumer & Retail",tier:"L" },
  { sym:"LULU",name:"Lululemon",sector:"Consumer & Retail",tier:"L" },
  { sym:"ETSY",name:"Etsy",sector:"Consumer & Retail",tier:"M" },
  // Financials
  { sym:"JPM",name:"JPMorgan Chase",sector:"Financials",tier:"L" },
  { sym:"V",name:"Visa",sector:"Financials",tier:"L" },
  { sym:"MA",name:"Mastercard",sector:"Financials",tier:"L" },
  { sym:"GS",name:"Goldman Sachs",sector:"Financials",tier:"L" },
  { sym:"BAC",name:"Bank of America",sector:"Financials",tier:"L" },
  { sym:"SOFI",name:"SoFi Technologies",sector:"Financials",tier:"M" },
  // Healthcare
  { sym:"UNH",name:"UnitedHealth",sector:"Healthcare",tier:"L" },
  { sym:"LLY",name:"Eli Lilly",sector:"Healthcare",tier:"L" },
  { sym:"JNJ",name:"Johnson & Johnson",sector:"Healthcare",tier:"L" },
  { sym:"MRK",name:"Merck",sector:"Healthcare",tier:"L" },
  { sym:"BSX",name:"Boston Scientific",sector:"Healthcare",tier:"L" },
  { sym:"HIMS",name:"Hims & Hers",sector:"Healthcare",tier:"M" },
  // Industrials
  { sym:"CAT",name:"Caterpillar",sector:"Industrials",tier:"L" },
  { sym:"GE",name:"GE Aerospace",sector:"Industrials",tier:"L" },
  { sym:"BA",name:"Boeing",sector:"Industrials",tier:"L" },
  { sym:"HON",name:"Honeywell",sector:"Industrials",tier:"L" },
  { sym:"DE",name:"Deere",sector:"Industrials",tier:"L" },
  { sym:"BW",name:"Babcock & Wilcox",sector:"Industrials",tier:"S" },
  // Energy
  { sym:"XOM",name:"Exxon Mobil",sector:"Energy",tier:"L" },
  { sym:"CVX",name:"Chevron",sector:"Energy",tier:"L" },
  { sym:"COP",name:"ConocoPhillips",sector:"Energy",tier:"L" },
  { sym:"SLB",name:"Schlumberger",sector:"Energy",tier:"L" },
  { sym:"EOG",name:"EOG Resources",sector:"Energy",tier:"L" },
  { sym:"KOS",name:"Kosmos Energy",sector:"Energy",tier:"M" },
];
