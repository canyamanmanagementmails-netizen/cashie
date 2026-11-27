"use client";

import { useEffect, useMemo, useState } from "react";

type Asset = {
  symbol: string;
  name: string;
  asset_type: "stock" | "crypto";
  price: number;
  change_percent: number;
  currency: string;
};

type MarketResponse = { source: string; updated_at: string; assets: Asset[] };

const sampleAssets: Asset[] = [
  { symbol: "AAPL", name: "Apple Inc.", asset_type: "stock", price: 189.84, change_percent: 1.24, currency: "USD" },
  { symbol: "MSFT", name: "Microsoft Corporation", asset_type: "stock", price: 420.72, change_percent: 0.68, currency: "USD" },
  { symbol: "NVDA", name: "NVIDIA Corporation", asset_type: "stock", price: 875.28, change_percent: -0.42, currency: "USD" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", asset_type: "stock", price: 178.15, change_percent: 1.09, currency: "USD" },
  { symbol: "BTC", name: "Bitcoin", asset_type: "crypto", price: 67432.18, change_percent: 2.81, currency: "USD" },
  { symbol: "ETH", name: "Ethereum", asset_type: "crypto", price: 3521.64, change_percent: -1.16, currency: "USD" },
  { symbol: "SOL", name: "Solana", asset_type: "crypto", price: 148.92, change_percent: 4.37, currency: "USD" },
  { symbol: "XRP", name: "XRP", asset_type: "crypto", price: 0.624, change_percent: 0.35, currency: "USD" },
];

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value < 1 ? 4 : 2 }).format(value);

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>(sampleAssets);
  const [source, setSource] = useState("Sample data");
  const [filter, setFilter] = useState<"all" | "stock" | "crypto">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${apiUrl}/api/markets`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Market API unavailable");
        return response.json() as Promise<MarketResponse>;
      })
      .then((data) => {
        if (data.assets?.length) {
          setAssets(data.assets);
          setSource(data.source === "demo" ? "Sample data" : data.source);
        }
      })
      .catch(() => setSource("Sample data · API offline"));
  }, []);

  const filtered = useMemo(() => assets.filter((asset) => {
    const matchesType = filter === "all" || asset.asset_type === filter;
    const matchesQuery = `${asset.symbol} ${asset.name}`.toLowerCase().includes(query.toLowerCase());
    return matchesType && matchesQuery;
  }), [assets, filter, query]);

  const stocks = assets.filter((asset) => asset.asset_type === "stock");
  const crypto = assets.filter((asset) => asset.asset_type === "crypto");
  const averageMove = assets.length ? assets.reduce((sum, item) => sum + item.change_percent, 0) / assets.length : 0;

  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="#home"><span className="brand-mark">c</span> cashie</a>
        <div className="side-label">WORKSPACE</div>
        <a className="nav-item active" href="#overview"><span>▦</span> Overview</a>
        <a className="nav-item" href="#markets"><span>◷</span> Markets</a>
        <a className="nav-item" href="#watchlist"><span>☆</span> Watchlist</a>
        <div className="sidebar-bottom"><div className="avatar">C</div><div><strong>My account</strong><small>Demo workspace</small></div><span className="dots">···</span></div>
      </aside>

      <section className="main-area" id="home">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> Overview</div><div className="top-right"><span className="market-status"><i /> Market overview</span><button className="icon-button" aria-label="Notifications">♧</button><div className="avatar small">C</div></div></header>
        <div className="content" id="overview">
          <div className="heading-row"><div><div className="eyebrow">FRIDAY, NOVEMBER 27</div><h1>Good morning<span className="wave">✦</span></h1><p className="subheading">A clear view of the markets, all in one place.</p></div><button className="date-button">⌑ &nbsp; Market snapshot <span>⌄</span></button></div>

          <div className="notice"><span className="notice-icon">i</span><div><strong>Dashboard preview</strong><span> Prices shown are illustrative sample data, not live quotes. No trading or account funding is enabled.</span></div></div>

          <div className="section-title"><div><h2>Market overview</h2><p>Track a few of the most watched assets.</p></div><span className="source-label">{source}</span></div>
          <div className="stats-grid">
            <article className="stat-card"><div className="stat-top"><span>Stocks tracked</span><span className="stat-icon blue">↗</span></div><strong>{stocks.length}</strong><div className="stat-foot">Across large-cap names</div></article>
            <article className="stat-card"><div className="stat-top"><span>Crypto assets</span><span className="stat-icon purple">₿</span></div><strong>{crypto.length}</strong><div className="stat-foot">Digital assets tracked</div></article>
            <article className="stat-card"><div className="stat-top"><span>Average daily move</span><span className="stat-icon green">⌁</span></div><strong className={averageMove >= 0 ? "positive" : "negative"}>{averageMove >= 0 ? "+" : ""}{averageMove.toFixed(2)}%</strong><div className="stat-foot">Illustrative, across this list</div></article>
          </div>

          <section className="market-panel" id="markets">
            <div className="panel-heading"><div><h2>Markets</h2><p>Browse stocks and crypto in your watchlist.</p></div><div className="panel-actions"><label className="search-box"><span>⌕</span><input aria-label="Search assets" placeholder="Search assets..." value={query} onChange={(event) => setQuery(event.target.value)} /></label></div></div>
            <div className="filters" role="tablist" aria-label="Asset type">{(["all", "stock", "crypto"] as const).map((value) => <button key={value} className={filter === value ? "filter active-filter" : "filter"} onClick={() => setFilter(value)}>{value === "all" ? "All assets" : value === "stock" ? "Stocks" : "Crypto"}</button>)}</div>
            <div className="table-wrap"><table><thead><tr><th>ASSET</th><th>TYPE</th><th>PRICE</th><th>24H CHANGE</th><th className="align-right">WATCHLIST</th></tr></thead><tbody>{filtered.map((asset) => <tr key={asset.symbol}><td><div className="asset-cell"><span className={`coin ${asset.asset_type}`}>{asset.asset_type === "stock" ? asset.symbol.slice(0, 1) : asset.symbol.slice(0, 1)}</span><div><strong>{asset.symbol}</strong><small>{asset.name}</small></div></div></td><td><span className={`type-pill ${asset.asset_type}`}>{asset.asset_type === "stock" ? "Stock" : "Crypto"}</span></td><td className="price">{money(asset.price)}</td><td><span className={asset.change_percent >= 0 ? "change positive" : "change negative"}>{asset.change_percent >= 0 ? "↗" : "↘"} {Math.abs(asset.change_percent).toFixed(2)}%</span></td><td className="align-right"><button className="star" aria-label={`Add ${asset.symbol} to watchlist`} onClick={(event) => event.currentTarget.classList.toggle("starred")}>☆</button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty">No assets match your search.</div>}</div>
            <div className="table-footer">Showing {filtered.length} of {assets.length} assets <span>Prices are sample data</span></div>
          </section>
          <footer>Cashie is a dashboard preview, not a broker or investment adviser. Market data is simulated.</footer>
        </div>
      </section>
    </main>
  );
}
