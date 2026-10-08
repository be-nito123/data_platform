"use client";

import { InstrumentConfig } from "@/lib/instruments";
import {
  formatBondDelta,
  formatBondPrice,
  formatYield,
  formatYieldChange,
  formatBps,
} from "@/lib/market/format";

interface MarketStatsProps {
  instrument: InstrumentConfig;
  latestData: {
    price?: number | null;
    change?: number | null;
    changePercent?: number | null;
    volume?: number | null;
    volumeChange?: number | null;
    openInterest?: number | null;
    oiChange?: number | null;
    oiChangePercent?: number | null;
    dailyBps?: number | null;
    weeklyBps?: number | null;
    date?: string;
  } | null;
}

function formatNumber(num: number | null | undefined, decimals = 2): string {
  if (num === null || num === undefined || !Number.isFinite(num)) return "—";
  return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function formatPct(num: number | null | undefined): string {
  if (num === null || num === undefined || !Number.isFinite(num)) return "—";
  const sign = num >= 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

function formatLarge(num: number | null | undefined): string {
  if (num === null || num === undefined || !Number.isFinite(num)) return "—";
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString();
}

export function MarketStats({ instrument, latestData }: MarketStatsProps) {
  if (!latestData) return null;

  const isYield = instrument.isYield === true;
  const isBond = instrument.priceNotation === "bond32";
  const price = latestData.price ?? null;
  const change = latestData.change ?? null;

  const lastValue = isBond
    ? price !== null && Number.isFinite(price)
      ? formatBondPrice(price)
      : "—"
    : isYield
      ? price !== null && Number.isFinite(price)
        ? formatYield(price)
        : "—"
      : formatNumber(price, instrument.decimals);

  const lastChange = isBond
    ? change !== null
      ? formatBondDelta(change)
      : "—"
    : isYield
      ? change !== null
        ? formatYieldChange(change)
        : "—"
      : `${formatNumber(change, instrument.decimals)} (${formatPct(latestData.changePercent)})`;

  const changeSign = (change ?? 0) >= 0;
  const bpsValue = (v: number | null | undefined) => v !== null && v !== undefined && Number.isFinite(v);
  const bpsSign = (v: number | null | undefined) => (v ?? 0) >= 0;

  return (
    <aside className="market-stats" aria-label="Market statistics">
      <div className="stats-header">
        <h3 className="stats-title">MARKET STATS</h3>
        <span className="stats-date">{latestData.date || "Latest"}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-item price-stat">
          <div className="stat-label">{isYield ? "LAST YIELD" : "LAST"}</div>
          <div className="stat-value price-value">
            {lastValue}
          </div>
          <div className={`stat-change ${changeSign ? "positive" : "negative"}`}>
            {lastChange}
          </div>
        </div>

        {isYield && (
          <>
            <div className="stat-item daily-bps-stat">
              <div className="stat-label">DAILY BPS</div>
              <div className={`stat-value daily-bps-value ${bpsValue(latestData.dailyBps) ? (bpsSign(latestData.dailyBps) ? "positive" : "negative") : ""}`}>
                {bpsValue(latestData.dailyBps) ? formatBps(latestData.dailyBps as number) : "—"}
              </div>
              <div className="stat-change">basis points</div>
            </div>
            <div className="stat-item weekly-bps-stat">
              <div className="stat-label">WEEKLY BPS</div>
              <div className={`stat-value weekly-bps-value ${bpsValue(latestData.weeklyBps) ? (bpsSign(latestData.weeklyBps) ? "positive" : "negative") : ""}`}>
                {bpsValue(latestData.weeklyBps) ? formatBps(latestData.weeklyBps as number) : "—"}
              </div>
              <div className="stat-change">basis points</div>
            </div>
          </>
        )}

        {!isYield && latestData.volume !== null && latestData.volume !== undefined && (
          <div className="stat-item volume-stat">
            <div className="stat-label">VOLUME</div>
            <div className="stat-value volume-value">{formatLarge(latestData.volume)}</div>
            <div className={`stat-change ${(latestData.volumeChange ?? 0) >= 0 ? "positive" : "negative"}`}>
              {formatPct(latestData.volumeChange)}
            </div>
          </div>
        )}

        {!isYield && latestData.openInterest !== null && latestData.openInterest !== undefined && (
          <div className="stat-item oi-stat">
            <div className="stat-label">OPEN INT</div>
            <div className="stat-value oi-value">{formatLarge(latestData.openInterest)}</div>
            <div className={`stat-change ${(latestData.oiChangePercent ?? 0) >= 0 ? "positive" : "negative"}`}>
              {formatPct(latestData.oiChangePercent)}
            </div>
          </div>
        )}

        <div className="stat-item meta-stat">
          <div className="stat-label">UNIT</div>
          <div className="stat-value unit-value">{instrument.unit}</div>
        </div>

        <div className="stat-item meta-stat">
          <div className="stat-label">SYMBOL</div>
          <div className="stat-value symbol-value">{instrument.symbol}</div>
        </div>
      </div>

      <div className="stats-divider" />

      <div className="stats-meta">
        <div className="meta-item">
          <span className="meta-label">EXCHANGE</span>
          <span className="meta-value">CME / COMEX / NYMEX</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">SETTLEMENT</span>
          <span className="meta-value">PHYSICAL / CASH</span>
        </div>
        <div className="meta-item">
          <span className="meta-label">CONTRACT SIZE</span>
          <span className="meta-value">100 / 5000 / 1000</span>
        </div>
      </div>
    </aside>
  );
}