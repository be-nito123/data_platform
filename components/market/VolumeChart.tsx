"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface VolumeChartProps {
  data: { date: string; volume: number | null; volumeChange?: number | null }[];
  height?: number;
}

export function VolumeChart({ data, height = 280 }: VolumeChartProps) {
  const chartData = data
    .filter(d => d.volume !== null)
    .map(d => ({
      date: d.date,
      volume: d.volume!,
      change: d.volumeChange ?? 0,
    }));

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#2a2d31"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={{ stroke: "#3a3d41" }}
            tickLine={false}
            tickFormatter={val => val.split("-").slice(1).join("-")}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={{ stroke: "#3a3d41" }}
            tickLine={false}
            tickFormatter={val => val >= 1e6 ? `${(val/1e6).toFixed(1)}M` : val >= 1e3 ? `${(val/1e3).toFixed(0)}K` : val.toLocaleString()}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#131517",
              border: "1px solid #3a3d41",
              borderRadius: "6px",
              color: "#e8e9ea",
            }}
            labelStyle={{ color: "#9aa0a6", fontSize: "12px" }}
            formatter={(value: unknown, name: unknown) => [
              value !== undefined && value !== null ? Number(value).toLocaleString() : "-",
              name === "volume" || name === "Volume" ? "Volume" : "Change %"
            ]}
          />
          <Bar
            dataKey="volume"
            name="Volume"
            fill="#007bff"
            fillOpacity={0.7}
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}