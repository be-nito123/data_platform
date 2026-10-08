"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface ChartProps {
  data: { date: string; value: number | null }[];
  color: string;
  height?: number;
  showGrid?: boolean;
  label?: string;
  tickFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
}

export function PriceChart({ data, color = "#00c851", height = 320, label = "Price", tickFormatter, tooltipFormatter }: ChartProps) {
  const chartData = data.filter(d => d.value !== null).map(d => ({ date: d.date, value: d.value! }));

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
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
            tickFormatter={tickFormatter ?? ((val: number) => val >= 1e6 ? `${(val/1e6).toFixed(1)}M` : val >= 1e3 ? `${(val/1e3).toFixed(0)}K` : val.toLocaleString())}
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
              value !== undefined && value !== null && Number.isFinite(Number(value)) && tooltipFormatter
                ? tooltipFormatter(Number(value))
                : value !== undefined && value !== null
                  ? Number(value).toLocaleString()
                  : "-",
              label
            ]}
          />
          <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "11px" }} />
          <Line
            type="monotone"
            dataKey="value"
            name={label}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6, fill: color }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}