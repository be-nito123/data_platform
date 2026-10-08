"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
  Legend,
} from "recharts";

type ChartRow = {
  date: string;
  price: number | string | null;
  volume: number | string | null;
  oi: number | string | null;
};

type Props = {
  data: ChartRow[];
};

function toNumber(
  value: number | string | null | undefined
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : null;
  }

  let text = String(value).trim();

  /*
    Example:

    3887/3897

    Use the second number.
  */

  if (text.includes("/")) {
    const parts = text.split("/");
    text = parts[parts.length - 1];
  }

  text = text
    .replace(/,/g, "")
    .replace(/%/g, "")
    .replace(/[^\d.-]/g, "");

  if (!text) {
    return null;
  }

  const number = Number(text);

  return Number.isFinite(number)
    ? number
    : null;
}


export default function MarketWeatherChart({
  data,
}: Props) {

  const chartData = data
  .map((row) => ({
    date: row.date,

    price: toNumber(row.price),

    volume: toNumber(row.volume),

    oi: toNumber(row.oi),
  }))
  .filter((row) => {

    if (!row.date) {
      return false;
    }

    /*
      Keep only data from
      October 1, 2025 onward.
    */

    const parts = String(row.date)
  .split(/[\/\-]/)
  .map(Number);

    let date: Date | null = null;

    /*
      Handles:

      01/10/2025
      01-10-2025

      as DD/MM/YYYY.
    */

    if (parts.length === 3) {

      const [day, month, year] = parts;

      if (
        day &&
        month &&
        year
      ) {
        date = new Date(
          year,
          month - 1,
          day
        );
      }
    }

    /*
      If the date couldn't be understood,
      keep the row rather than deleting it.
    */

    if (!date || Number.isNaN(date.getTime())) {
      return true;
    }

    const startDate = new Date(
      2025,
      9,
      1
    );

    return date >= startDate;

  })
  .filter(
    (row) =>
      row.price !== null ||
      row.volume !== null ||
      row.oi !== null
  );


  return (
    <div className="rounded-2xl border border-white/[.10] bg-[#1C1C1E] overflow-hidden shadow-2xl shadow-black/50">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="border-b border-white/[.10] px-5 py-4">

        <div className="text-[10px] uppercase tracking-[0.2em] text-[#7C7C82]">
          Market Trend
        </div>

        <h2 className="mt-1 text-[17px] font-semibold text-[#FFFFFF]">
          Price · Volume · Open Interest
        </h2>

        <p className="mt-1 text-[10px] text-[#48484D]">
          Daily market activity
        </p>

      </div>


      {/* ================================================= */}
      {/* CHART */}
      {/* ================================================= */}

      <div className="h-[650px] w-full p-2 sm:p-4">

        {chartData.length === 0 ? (

          <div className="flex h-full items-center justify-center">

            <div className="text-center">

              <div className="text-[11px] uppercase tracking-[0.2em] text-[#636366]">
                No chart data
              </div>

              <div className="mt-2 text-[10px] text-[#48484D]">
                No valid market values were found.
              </div>

            </div>

          </div>

        ) : (

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <LineChart
              data={chartData}
              margin={{
                top: 20,
                right: 80,
                left: 15,
                bottom: 60,
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
              {/* DATE */}
              {/* ================================================= */}

              <XAxis
                dataKey="date"
                tick={{
                  fill: "#636366",
                  fontSize: 10,
                }}
                axisLine={{
                  stroke: "#3A3A3C",
                }}
                tickLine={false}
              />


              {/* ================================================= */}
              {/* PRICE SCALE */}
              {/* ================================================= */}

              <YAxis
                yAxisId="price"
                orientation="left"
                tick={{
                  fill: "#FFFFFF",
                  fontSize: 10,
                }}
                axisLine={{
                  stroke: "#3A3A3C",
                }}
                tickLine={false}
                width={70}
              />


              {/* ================================================= */}
              {/* VOLUME SCALE */}
              {/* ================================================= */}

              <YAxis
                yAxisId="volume"
                orientation="right"
                tick={{
                  fill: "#98989F",
                  fontSize: 10,
                }}
                axisLine={{
                  stroke: "#3A3A3C",
                }}
                tickLine={false}
                width={70}
              />


              {/* ================================================= */}
              {/* OI SCALE */}
              {/* ================================================= */}

              <YAxis
                yAxisId="oi"
                orientation="right"
                hide
              />


              {/* ================================================= */}
              {/* TOOLTIP */}
              {/* ================================================= */}

              <Tooltip
                contentStyle={{
                  backgroundColor: "#1C1C1E",
                  border:
                    "1px solid #3A3A3C",
                  borderRadius: "3px",
                }}
                labelStyle={{
                  color: "#7C7C82",
                  fontSize: "11px",
                  marginBottom: "5px",
                }}
                itemStyle={{
                  fontSize: "11px",
                }}
                formatter={(value, name) => {

                  if (
                    value === null ||
                    value === undefined
                  ) {
                    return ["-", name];
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
                verticalAlign="top"
                align="right"
                height={30}
                wrapperStyle={{
                  fontSize: "10px",
                  color: "#7C7C82",
                }}
              />


              {/* ================================================= */}
              {/* PRICE */}
              {/* ================================================= */}

              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                name="Close Price"
                stroke="#FFFFFF"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 5,
                }}
                connectNulls
              />


              {/* ================================================= */}
              {/* VOLUME */}
              {/* ================================================= */}

              <Line
                yAxisId="volume"
                type="monotone"
                dataKey="volume"
                name="Volume"
                stroke="#7C7C82"
                strokeWidth={1.6}
                dot={false}
                activeDot={{
                  r: 4,
                }}
                connectNulls
              />


              {/* ================================================= */}
              {/* OPEN INTEREST */}
              {/* ================================================= */}

              <Line
                yAxisId="oi"
                type="monotone"
                dataKey="oi"
                name="Open Interest"
                stroke="#007AFF"
                strokeWidth={1.8}
                dot={false}
                activeDot={{
                  r: 4,
                }}
                connectNulls
              />


              {/* ================================================= */}
              {/* DATE RANGE SLIDER */}
              {/* ================================================= */}

              <Brush
  dataKey="date"
  height={45}
  stroke="#48484D"
  travellerWidth={12}
  fill="#1C1C1E"
  tickFormatter={() => ""}

  /*
    Initially show the latest portion
    of the available data.
  */

  startIndex={
    Math.max(
      0,
      chartData.length - 120
    )
  }

  endIndex={
    Math.max(
      0,
      chartData.length - 1
    )
  }
/>

            </LineChart>

          </ResponsiveContainer>

        )}

      </div>


      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <div className="flex items-center justify-between border-t border-white/[.10] px-5 py-3">

        <span className="text-[9px] uppercase tracking-[0.15em] text-[#48484D]">
          Price · left scale
        </span>

        <span className="text-[9px] uppercase tracking-[0.15em] text-[#48484D]">
          Volume · right scale
        </span>

        <span className="text-[9px] uppercase tracking-[0.15em] text-[#48484D]">
          Open Interest · independent scale
        </span>

      </div>

    </div>
  );
}