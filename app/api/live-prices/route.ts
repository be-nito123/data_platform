import { NextResponse } from "next/server";

const MARKETS = [
  { key: "GOLD", symbol: "GC=F", name: "Gold" },
  { key: "SILVER", symbol: "SI=F", name: "Silver" },
  { key: "DXY", symbol: "DX-Y.NYB", name: "U.S. Dollar Index" },
  { key: "US10Y", symbol: "^TNX", name: "U.S. 10-Year Yield" },
  { key: "OIL", symbol: "CL=F", name: "Crude Oil WTI" },
  { key: "BTC", symbol: "BTC-USD", name: "Bitcoin" },
  { key: "NASDAQ", symbol: "^NDX", name: "NASDAQ 100" },
];

type MarketResponse = {
  key: string;
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  percentChange: number | null;
  volume: number | null;
  volumeChange: number | null;
  source: string;
  error: string | null;
};

type CacheEntry = {
  data: { markets: MarketResponse[]; updatedAt: string; cached: boolean };
  ts: number;
};
const CACHE_TTL = 30_000;
let cache: CacheEntry | null = null;

function isFresh(): boolean {
  if (cache === null) return false;
  return Date.now() - cache.ts < CACHE_TTL;
}

async function fetchYahoo(symbol: string) {
  const encoded = encodeURIComponent(symbol);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1d&range=2d`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error("No result");
  const meta = result.meta;
  const closes = result.indicators?.quote?.[0]?.close || [];
  const volumes = result.indicators?.quote?.[0]?.volume || [];
  const current = meta?.regularMarketPrice ?? closes[closes.length - 1];
  const prevClose = meta?.previousClose ?? closes[closes.length - 2];
  const volNow = volumes[volumes.length - 1];
  const volPrev = volumes[volumes.length - 2];
  return { current, prevClose, volNow, volPrev, currency: meta?.currency };
}

export async function GET() {
  const cached = cache;
  if (cached !== null && isFresh()) {
    return NextResponse.json({ ...cached.data, cached: true });
  }

  try {
    const results = await Promise.all(
      MARKETS.map(async (m) => {
        try {
          const d = await fetchYahoo(m.symbol);
          const price = d.current ?? null;
          const prev = d.prevClose ?? null;
          const change = price !== null && prev !== null ? price - prev : null;
          const pct = price !== null && prev !== null && prev !== 0 ? ((price - prev) / prev) * 100 : null;
          const volChange = d.volNow !== undefined && d.volPrev !== undefined && d.volPrev !== 0
            ? ((d.volNow - d.volPrev) / d.volPrev) * 100
            : null;
          return {
            key: m.key,
            symbol: m.symbol,
            name: m.name,
            price,
            change,
            percentChange: pct,
            volume: d.volNow ?? null,
            volumeChange: volChange,
            source: "Yahoo",
            error: null,
          };
        } catch (e) {
          return { key: m.key, symbol: m.symbol, name: m.name, price: null, change: null, percentChange: null, volume: null, volumeChange: null, source: "Yahoo", error: String(e) };
        }
      })
    );

    const payload = { markets: results, updatedAt: new Date().toISOString(), cached: false };
    cache = { data: payload, ts: Date.now() };
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json({ markets: [], updatedAt: new Date().toISOString(), error: String(e) }, { status: 500 });
  }
}