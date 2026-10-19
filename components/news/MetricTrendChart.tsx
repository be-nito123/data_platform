"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ValueUnit } from "@/lib/supabase/data/news";
import { formatNewsAmount } from "@/lib/news/format";

export type TrendSeries = {
  key: string;
  label: string;
  /** Every point shares this unit, which is why the axis can wear it. */
  unit: ValueUnit;
  /** Oldest point first — the order a trend line should join. */
  points: { period: string; value: number }[];
};

/*
  One client component in the news room: choosing which event to plot needs
  state, and the chart needs a DOM. Everything else on these pages renders on
  the server.
*/
export default function MetricTrendChart({ series }: { series: TrendSeries[] }) {
  const [selectedKey, setSelectedKey] = useState(series[0]?.key ?? "");

  const selected =
    series.find((item) => item.key === selectedKey) ?? series[0] ?? null;

  if (!selected || selected.points.length === 0) {
    return (
      <div className="news-panel">
        <p className="news-chart-empty">
          No event has been reported in enough months to draw a line through.
        </p>
      </div>
    );
  }

  return (
    <div className="news-panel">
      <div className="news-chart-head">
        <h3 className="news-section-title" style={{ margin: 0 }}>
          {selected.label}
        </h3>

        {series.length > 1 && (
          <select
            className="news-select"
            aria-label="Event shown in the trend"
            value={selected.key}
            onChange={(event) => setSelectedKey(event.target.value)}
          >
            {series.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={selected.points}
          margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-border)"
            vertical={false}
          />

          <XAxis
            dataKey="period"
            tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
            stroke="var(--color-border)"
          />

          <YAxis
            width={64}
            domain={["auto", "auto"]}
            tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
            stroke="var(--color-border)"
            tickFormatter={(value: number) => formatNewsAmount(value, selected.unit)}
          />

          <Tooltip
            content={<TrendTooltip unit={selected.unit} />}
            cursor={{ stroke: "var(--color-border)" }}
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------- Tooltip ---------- */

type TooltipEntry = {
  value?: number | string;
  payload?: { period?: string };
};

function TrendTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  unit: ValueUnit;
}) {
  if (!active || !payload?.length) return null;

  const first = payload[0];

  return (
    <div className="news-tooltip">
      <div className="news-tooltip-label">{first.payload?.period}</div>
      <div>{formatNewsAmount(Number(first.value), unit)}</div>
    </div>
  );
}
