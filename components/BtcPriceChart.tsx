"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type BtcPriceChartProps = {
  data: {
    date: string;
    btcPrice: string;
  }[];
};

function parseBtcPrice(value: string) {
  if (!value) return NaN;

  const cleaned = value
    .replace(/,/g, "")
    .trim();

  if (cleaned.includes("/")) {
    const prices = cleaned
      .split("/")
      .map(Number)
      .filter((n) => !Number.isNaN(n));

    if (prices.length === 2) {
      return (prices[0] + prices[1]) / 2;
    }
  }

  return Number(cleaned);
}

export default function BtcPriceChart({
  data,
}: BtcPriceChartProps) {
  const chartData = data
    .map((row) => ({
      date: row.date,
      btcPrice: parseBtcPrice(row.btcPrice),
    }))
    .filter((row) => !Number.isNaN(row.btcPrice));

  const latest =
    chartData.length > 0
      ? chartData[chartData.length - 1].btcPrice
      : null;

  const previous =
    chartData.length > 1
      ? chartData[chartData.length - 2].btcPrice
      : null;

  const change =
    latest !== null && previous !== null
      ? latest - previous
      : null;

  const changePercent =
    latest !== null &&
    previous !== null &&
    previous !== 0
      ? (change! / previous) * 100
      : null;

  const isPositive = (change ?? 0) >= 0;

  return (
    <section className="mt-8 border border-white/[.10] bg-[#1C1C1E]">

      {/* TOP BAR */}
      <div className="flex items-center justify-between border-b border-white/[.10] px-5 py-4">

        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-wide text-white">
              BTC/USD
            </h2>

            <span className="border border-white/[.10] px-2 py-0.5 text-[10px] font-medium tracking-widest text-gray-400">
              COT
            </span>
          </div>

          <p className="mt-1 text-xs text-gray-500">
            Bitcoin price history
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          MARKET DATA
        </div>

      </div>


      {/* PRICE HEADER */}
      <div className="grid grid-cols-1 border-b border-white/[.10] md:grid-cols-3">

        <div className="border-b border-white/[.10] px-5 py-5 md:border-b-0 md:border-r">
          <p className="text-[10px] font-medium tracking-[0.18em] text-gray-500">
            LAST PRICE
          </p>

          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {latest !== null
              ? `$${latest.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "—"}
          </p>
        </div>


        <div className="border-b border-white/[.10] px-5 py-5 md:border-b-0 md:border-r">
          <p className="text-[10px] font-medium tracking-[0.18em] text-gray-500">
            CHANGE
          </p>

          <p
            className={`mt-2 text-2xl font-semibold ${
 isPositive
 ? "text-[#30D158]"
 : "text-[#FF453A]"
 }`}
          >
            {change !== null
              ? `${isPositive ? "+" : ""}$${change.toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                )}`
              : "—"}
          </p>
        </div>


        <div className="px-5 py-5">
          <p className="text-[10px] font-medium tracking-[0.18em] text-gray-500">
            CHANGE %
          </p>

          <p
            className={`mt-2 text-2xl font-semibold ${
 isPositive
 ? "text-[#30D158]"
 : "text-[#FF453A]"
 }`}
          >
            {changePercent !== null
              ? `${isPositive ? "+" : ""}${changePercent.toFixed(
                  2
                )}%`
              : "—"}
          </p>
        </div>

      </div>


      {/* CHART */}
      <div className="p-5">

        <div className="mb-3 flex items-center justify-between">

          <div>
            <p className="text-xs font-medium tracking-widest text-gray-400">
              PRICE HISTORY
            </p>

            <p className="mt-1 text-[11px] text-gray-600">
              Weekly observations
            </p>
          </div>

          <div className="text-[10px] text-gray-600">
            {chartData.length} OBS
          </div>

        </div>


        <div className="h-[650px] w-full">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 20,
                left: 10,
                bottom: 10,
              }}
            >

              <CartesianGrid
                stroke="#2C2C2E"
                strokeDasharray="2 4"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tick={{
                  fill: "#636366",
                  fontSize: 10,
                }}
                tickLine={false}
                axisLine={{
                  stroke: "#3A3A3C",
                }}
              />

              <YAxis
                tick={{
                  fill: "#636366",
                  fontSize: 10,
                }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  `$${(value / 1000).toFixed(0)}K`
                }
                width={55}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#1C1C1E",
                  border: "1px solid #3A3A3C",
                  borderRadius: "2px",
                  color: "#FFFFFF",
                  fontSize: "12px",
                }}
                labelStyle={{
                  color: "#98989F",
                  marginBottom: "5px",
                }}
                formatter={(value) => [
                  `$${Number(value).toLocaleString()}`,
                  "BTC",
                ]}
              />

              <Line
                type="monotone"
                dataKey="btcPrice"
                stroke="#007AFF"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 4,
                }}
              />

            </LineChart>
          </ResponsiveContainer>

        </div>

      </div>

    </section>
  );
}