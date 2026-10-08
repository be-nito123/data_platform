"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatYield } from "@/lib/market/format";

export interface OverviewPoint {
  date: string;
  price: number | null;
  volume: number | null;
  oi: number | null;
  dailyBps?: number | null;
  weeklyBps?: number | null;
}

export type OverviewMode = "market" | "yield";

interface OverviewChartProps {
  data: OverviewPoint[];
  mode?: OverviewMode;
  priceFormat?: (value: number) => string;
}

type SeriesKey = string;

interface Series {
  key: SeriesKey;
  label: string;
  dataKey: keyof OverviewPoint;
  color: string;
  kind: "line" | "bar";
  axis: "left" | "right";
}

const MARKET_SERIES: Series[] = [
  { key: "price", label: "PRICE", dataKey: "price", color: "#007bff", kind: "line", axis: "left" },
  { key: "volume", label: "VOLUME", dataKey: "volume", color: "#9aa0a6", kind: "bar", axis: "right" },
  { key: "oi", label: "OPEN INTEREST", dataKey: "oi", color: "#ffb800", kind: "line", axis: "right" },
];

const YIELD_SERIES: Series[] = [
  { key: "yield", label: "YIELD", dataKey: "price", color: "#00c851", kind: "line", axis: "left" },
  { key: "dailyBps", label: "DAILY BPS", dataKey: "dailyBps", color: "#007bff", kind: "bar", axis: "left" },
  { key: "weeklyBps", label: "WEEKLY BPS", dataKey: "weeklyBps", color: "#ffb800", kind: "line", axis: "left" },
];

function axisTick(value: number): string {
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toLocaleString();
}

export function OverviewChart({
  data,
  mode = "market",
  priceFormat,
}: OverviewChartProps) {
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>(() => ({
    price: true,
    volume: true,
    oi: true,
    yield: true,
    dailyBps: true,
    weeklyBps: true,
  }));

  const series = mode === "yield" ? YIELD_SERIES : MARKET_SERIES;

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: d.date,
        price: d.price,
        volume: d.volume,
        oi: d.oi,
        dailyBps: d.dailyBps ?? null,
        weeklyBps: d.weeklyBps ?? null,
      })),
    [data]
  );

  const anyVisible = series.some((s) => visible[s.key]);

  const showLeft = series.some((s) => s.axis === "left" && visible[s.key]);
  const showRight = series.some((s) => s.axis === "right" && visible[s.key]);

  const toggle = (key: SeriesKey) =>
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));

  const leftTick =
    mode === "yield"
      ? (v: number) => v.toFixed(2)
      : priceFormat ?? axisTick;

  const formatTooltip = (value: unknown, name: unknown): [string, string] => {
    const label = String(name);
    if (value === undefined || value === null || !Number.isFinite(Number(value))) {
      return ["-", label];
    }
    const v = Number(value);
    if (mode === "yield") {
      if (label === "YIELD") return [formatYield(v), "Yield"];
      return [
        `${v >= 0 ? "+" : ""}${v.toFixed(1)} bps`,
        label === "DAILY BPS" ? "Daily BPS" : "Weekly BPS",
      ];
    }
    if (label === "PRICE") return [priceFormat ? priceFormat(v) : v.toLocaleString(), "Price"];
    if (label === "VOLUME") return [v.toLocaleString(), "Volume"];
    if (label === "OPEN INTEREST") return [v.toLocaleString(), "Open Interest"];
    return [v.toLocaleString(), label];
  };

  return (
    <div className="overview-chart-panel">
      <div className="overview-toolbar" role="group" aria-label="Overview series visibility">
        <span className="overview-toolbar-label">SERIES</span>
        {series.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`series-toggle ${s.key} ${visible[s.key] ? "on" : "off"}`}
            aria-pressed={visible[s.key]}
            onClick={() => toggle(s.key)}
          >
            <span
              className="series-swatch"
              style={{
                backgroundColor: visible[s.key] ? s.color : "transparent",
                borderColor: s.color,
              }}
            />
            {s.label}
          </button>
        ))}
        <span className="overview-toolbar-hint">
          {chartData.length} rows · click a tab below for the full view
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className="overview-empty">No market data available</div>
      ) : !anyVisible ? (
        <div className="overview-empty">
          All series are hidden — enable one above to show the chart
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d31" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#6b7280", fontSize: 11 }}
              axisLine={{ stroke: "#3a3d41" }}
              tickLine={false}
            />
            {showLeft && (
              <YAxis
                yAxisId="left"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={{ stroke: "#3a3d41" }}
                tickLine={false}
                tickFormatter={leftTick}
                width={60}
              />
            )}
            {showRight && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={{ stroke: "#3a3d41" }}
                tickLine={false}
                tickFormatter={axisTick}
                width={60}
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: "#131517",
                border: "1px solid #3a3d41",
                borderRadius: "6px",
                color: "#e8e9ea",
              }}
              labelStyle={{ color: "#9aa0a6", fontSize: "12px" }}
              formatter={(value: unknown, name: unknown) => formatTooltip(value, name)}
            />
            {series.map((s) => {
              if (!visible[s.key]) return null;
              if (s.kind === "bar") {
                return (
                  <Bar
                    key={s.key}
                    yAxisId={s.axis}
                    dataKey={s.dataKey}
                    name={s.label}
                    fill={s.color}
                    fillOpacity={mode === "yield" ? 0.6 : 0.35}
                    maxBarSize={14}
                  />
                );
              }
              return (
                <Line
                  key={s.key}
                  yAxisId={s.axis}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={s.key === "price" || s.key === "yield" ? 2 : 1.5}
                  dot={false}
                  activeDot={{ r: 4, fill: s.color }}
                  connectNulls
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}