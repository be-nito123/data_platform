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

type CotRow = {
  date: string;
  btcPrice: string;
  openInterest: number | null;
  dealerNet: number | null;
  assetManagerNet: number | null;
  assetManagerLong: number | null;
  assetManagerShort: number | null;
  leveragedMoneyNet: number | null;
  leveragedMoneyLong?: number | null;
  leveragedMoneyShort?: number | null;
};

type Props = {
  data: CotRow[];
};

function parseBtcPrice(value: string): number | null {
  if (!value) return null;

  // Example:
  // "88,260/92,795"
  //
  // We use the first BTC price.
  const firstPrice = value.split("/")[0];

  const cleaned = firstPrice
    .replace(/,/g, "")
    .replace(/\s/g, "");

  const number = Number(cleaned);

  return Number.isNaN(number) ? null : number;
}

export default function CombinedChart({ data }: Props) {
  const chartData = data
    .map((row) => ({
      date: row.date,

      btcPrice: parseBtcPrice(row.btcPrice),

      dealerNet: row.dealerNet,

      assetManagerNet: row.assetManagerNet,

      leveragedMoneyNet: row.leveragedMoneyNet,
    }))
    .filter(
      (row) =>
        row.btcPrice !== null ||
        row.dealerNet !== null ||
        row.assetManagerNet !== null ||
        row.leveragedMoneyNet !== null
    );

  return (
    <div className="w-full border border-white/[.10] bg-[#1C1C1E]">

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div className="flex flex-col justify-between gap-3 border-b border-white/[.10] px-5 py-4 md:flex-row md:items-center">

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Market Positioning
          </p>

          <h2 className="mt-1 text-lg font-semibold tracking-tight text-gray-100">
            BTC Price & COT Positioning
          </h2>

          <p className="mt-1 text-xs text-gray-600">
            Weekly BTC price versus institutional net positioning
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

            {/* ================================================= */}
            {/* GRID */}
            {/* ================================================= */}

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
            {/* BTC PRICE AXIS */}
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
    marginBottom: "8px",
  }}
  itemSorter={(item) => {
    const order: Record<string, number> = {
      "BTC Price": 1,
      "Dealer NET": 2,
      "Asset Mgr NET": 3,
      "Lev Money NET": 4,
    };

    return order[String(item.name)] ?? 99;
  }}
  formatter={(value, name) => {
    if (value === null || value === undefined) {
      return ["-", name];
    }

    if (name === "BTC Price") {
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
            {/* BTC PRICE */}
            {/* WHITE + DOTS */}
            {/* ================================================= */}

            <Line
              yAxisId="price"
              type="monotone"
              dataKey="btcPrice"
              name="BTC Price"

              stroke="#FFFFFF"
              strokeWidth={2.4}

              /*
               * DOTS ON EVERY BTC PRICE POINT
               */
              dot={{
                r: 3,
                fill: "#FFFFFF",
                stroke: "#FFFFFF",
                strokeWidth: 1,
              }}

              /*
               * BIGGER DOT WHEN HOVERING
               */
              activeDot={{
                r: 5,
                fill: "#FFFFFF",
                stroke: "#FFFFFF",
                strokeWidth: 1,
              }}

              connectNulls
            />


            {/* ================================================= */}
            {/* DEALER NET */}
            {/* DARK GRAY + DOTS */}
            {/* ================================================= */}

            <Line
              yAxisId="cot"
              type="monotone"
              dataKey="dealerNet"
              name="Dealer NET"

              stroke="#007AFF"
              strokeWidth={1.6}

              dot={{
  r: 3,
  fill: "#007AFF",
  stroke: "#007AFF",
  strokeWidth: 1,
}}

activeDot={{
  r: 4,
  fill: "#007AFF",
  stroke: "#007AFF",
  strokeWidth: 1,
}}

              connectNulls
            />


            {/* ================================================= */}
            {/* ASSET MANAGER NET */}
            {/* LIGHT BLUE + DOTS */}
            {/* ================================================= */}

            <Line
              yAxisId="cot"
              type="monotone"
              dataKey="assetManagerNet"
              name="Asset Mgr NET"

              stroke="#0A84FF"
              strokeWidth={1.7}

              dot={{
                r: 3,
                fill: "#0A84FF",
                stroke: "#0A84FF",
                strokeWidth: 1,
              }}

              activeDot={{
                r: 4,
                fill: "#0A84FF",
                stroke: "#0A84FF",
                strokeWidth: 1,
              }}

              connectNulls
            />


            {/* ================================================= */}
            {/* LEVERAGED MONEY NET */}
            {/* GREEN + DOTS */}
            {/* ================================================= */}

            <Line
              yAxisId="cot"
              type="monotone"
              dataKey="leveragedMoneyNet"
              name="Lev Money NET"

              stroke="#30D158"
              strokeWidth={1.7}

              dot={{
                r: 3,
                fill: "#30D158",
                stroke: "#30D158",
                strokeWidth: 1,
              }}

              activeDot={{
                r: 4,
                fill: "#30D158",
                stroke: "#30D158",
                strokeWidth: 1,
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
          BTC price · left scale
        </span>

        <span>
          COT positioning · right scale
        </span>

      </div>

    </div>
  );
}