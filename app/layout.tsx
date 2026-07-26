import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Market Radar — Live Market Overview",
  description: "Real-time equity overview: live YTD sector performance, a stock heatmap, and top performers by sector and size. Built by Dare Bamidele.",
};
const PORTFOLIO_URL = "../index.html"; // set to your live portfolio URL after deploy

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap" />
        <header className="app-header"><div className="app-wrap head-inner">
          <a className="brand" href={PORTFOLIO_URL}><span className="mark">◈</span><span className="brand-text"><span className="brand-name">Market Radar</span><span className="brand-by">Dare Bamidele</span></span></a>
          <span className="live-tag">Live · Finnhub</span>
        </div></header>
        <main className="app-wrap">{children}</main>
        <footer className="app-footer"><div className="app-wrap foot-inner">
          <span>Live data via Finnhub · Curated universe · Research tool, not investment advice.</span>
          <a href={PORTFOLIO_URL}>&larr; Back to portfolio</a>
        </div></footer>
      </body>
    </html>
  );
}
