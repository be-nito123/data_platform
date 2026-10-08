"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatBps } from "@/lib/market/format";

interface BpsChartProps {
  data: { date: string; value: number | null }[];
  color: string;
  height?: number;
}

export function BpsChart({ data, color, height = 280 }: BpsChartProps) {
  const chartData = data
    .filter((d) => d.value !== null)
    .map((d) => ({ date: d.date, value: d.value! }));

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d31" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={{ stroke: "#3a3d41" }}
            tickLine={false}
            tickFormatter={(val: string) => val.split("-").slice(1).join("-")}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={{ stroke: "#3a3d41" }}
            tickLine={false}
            tickFormatter={(val: number) => formatBps(val, 0)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#131517",
              border: "1px solid #3a3d41",
              borderRadius: "6px",
              color: "#e8e9ea",
            }}
            labelStyle={{ color: "#9aa0a6", fontSize: "12px" }}
            formatter={(value: unknown) => [
              value !== undefined && value !== null ? `${formatBps(Number(value))} bps` : "-",
              "Change",
            ]}
          />
          <Bar
            dataKey="value"
            name="Change"
            fill={color}
            fillOpacity={0.7}
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}