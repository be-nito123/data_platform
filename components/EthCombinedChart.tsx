"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type EthCotRow = {
  date: string;
  ethPrice: string;

  dealerNet: number | null;

  assetManagerNet: number | null;
  assetManagerLong: number | null;
  assetManagerShort: number | null;

  leveragedMoneyNet: number | null;
  leveragedMoneyLong: number | null;
  leveragedMoneyShort: number | null;
};

type Props = {
  data: EthCotRow[];
};


function parseEthPrice(value: string): number | null {
  if (!value) return null;

  // Example:
  // 2,972/3,257
  // We use the first ETH price.
  const firstPrice = value.split("/")[0];

  const cleaned = firstPrice
    .replace(/,/g, "")
    .replace(/\s/g, "");

  const number = Number(cleaned);

  return Number.isNaN(number) ? null : number;
}


export default function EthCombinedChart({ data }: Props) {

  const chartData = data
    .map((row) => ({
      date: row.date,

      ethPrice: parseEthPrice(row.ethPrice),

      dealerNet: row.dealerNet,

      assetManagerNet: row.assetManagerNet,

      leveragedMoneyNet: row.leveragedMoneyNet,
    }))
    .filter(
      (row) =>
        row.ethPrice !== null ||
        row.dealerNet !== null ||
        row.assetManagerNet !== null ||
        row.leveragedMoneyNet !== null
    );


  return (
    <section className="mt-8 border border-white/[.10] bg-[#1C1C1E]">

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div className="flex flex-col justify-between gap-3 border-b border-white/[.10] px-5 py-4 md:flex-row md:items-center">

        <div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Market Positioning
          </p>

          <h2 className="mt-1 text-lg font-semibold tracking-tight text-gray-100">
            ETH Price & COT Positioning
          </h2>

          <p className="mt-1 text-xs text-gray-600">
            Weekly ETH price versus institutional net positioning
          </p>

        </div>

        <div className="text-[10px] uppercase tracking-[0.15em] text-gray-600">
          Weekly
        </div>

      </div>


      {/* ===================================================== */}
      {/* CHART */}
      {/* ===================================================== */}

      <div className="h-[650px] w-full p-2 sm:p-4">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 10,
              bottom: 20,
            }}
          >

            <CartesianGrid
              stroke="#1C1C1E"
              strokeDasharray="2 4"
              vertical={false}
            />


            {/* ================================================= */}
            {/* X AXIS */}
            {/* ================================================= */}

            <XAxis
              dataKey="date"
              tick={{
                fill: "#636366",
                fontSize: 11,
              }}
              axisLine={{
                stroke: "#3A3A3C",
              }}
              tickLine={false}
            />


            {/* ================================================= */}
            {/* ETH PRICE AXIS */}
            {/* ================================================= */}

            <YAxis
              yAxisId="price"
              orientation="left"
              tick={{
                fill: "#7C7C82",
                fontSize: 11,
              }}
              tickFormatter={(value) =>
                `$${Number(value).toLocaleString()}`
              }
              axisLine={{
                stroke: "#3A3A3C",
              }}
              tickLine={false}
            />


            {/* ================================================= */}
            {/* COT AXIS */}
            {/* ================================================= */}

            <YAxis
              yAxisId="cot"
              orientation="right"
              tick={{
                fill: "#7C7C82",
                fontSize: 11,
              }}
              tickFormatter={(value) =>
                Number(value).toLocaleString()
              }
              axisLine={{
                stroke: "#3A3A3C",
              }}
              tickLine={false}
            />


            {/* ================================================= */}
            {/* TOOLTIP */}
            {/* ================================================= */}

            <Tooltip
              contentStyle={{
                backgroundColor: "#1C1C1E",
                border: "1px solid #3A3A3C",
                borderRadius: "4px",
                color: "#FFFFFF",
              }}
              labelStyle={{
                color: "#7C7C82",
                fontSize: "12px",
              }}
              formatter={(value, name) => {

                if (value === null || value === undefined) {
                  return ["-", name];
                }

                if (name === "ETH Price") {
                  return [
                    `$${Number(value).toLocaleString()}`,
                    name,
                  ];
                }

                return [
                  Number(value).toLocaleString(),
                  name,
                ];
              }}
            />


            {/* ================================================= */}
            {/* LEGEND */}
            {/* ================================================= */}

            <Legend
              wrapperStyle={{
                paddingTop: "15px",
                fontSize: "11px",
              }}
            />


            {/* ================================================= */}
            {/* ETH PRICE */}
            {/* ================================================= */}

            <Line
              yAxisId="price"
              type="monotone"
              dataKey="ethPrice"
              name="ETH Price"
              stroke="#FFFFFF"
              strokeWidth={2}
              dot={{
                r: 3,
                fill: "#FFFFFF",
                stroke: "#FFFFFF",
              }}
              activeDot={{
                r: 5,
              }}
              connectNulls
            />


            {/* ================================================= */}
            {/* ASSET MANAGER NET */}
            {/* ================================================= */}

            <Line
              yAxisId="cot"
              type="monotone"
              dataKey="assetManagerNet"
              name="Asset Mgr NET"
              stroke="#0A84FF"
              strokeWidth={1.8}
              dot={{
                r: 3,
                fill: "#0A84FF",
                stroke: "#0A84FF",
              }}
              activeDot={{
                r: 4,
              }}
              connectNulls
            />


            {/* ================================================= */}
            {/* DEALER NET */}
            {/* ================================================= */}

            <Line
              yAxisId="cot"
              type="monotone"
              dataKey="dealerNet"
              name="Dealer NET"
              stroke="#007AFF"
              strokeWidth={1.8}
              dot={{
                r: 3,
                fill: "#007AFF",
                stroke: "#007AFF",
              }}
              activeDot={{
                r: 4,
              }}
              connectNulls
            />


            {/* ================================================= */}
            {/* LEVERAGED MONEY NET */}
            {/* ================================================= */}

            <Line
              yAxisId="cot"
              type="monotone"
              dataKey="leveragedMoneyNet"
              name="Lev Money NET"
              stroke="#30D158"
              strokeWidth={1.8}
              dot={{
                r: 3,
                fill: "#30D158",
                stroke: "#30D158",
              }}
              activeDot={{
                r: 4,
              }}
              connectNulls
            />

          </LineChart>

        </ResponsiveContainer>

      </div>


      {/* ===================================================== */}
      {/* FOOTER */}
      {/* ===================================================== */}

      <div className="flex flex-col justify-between gap-2 border-t border-white/[.10] px-5 py-3 text-[10px] uppercase tracking-wider text-gray-600 sm:flex-row">

        <span>
          ETH price · left scale
        </span>

        <span>
          COT positioning · right scale
        </span>

      </div>

    </section>
  );
}