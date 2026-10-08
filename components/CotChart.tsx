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

type CotChartProps = {
  data: {
    date: string;
    dealerNet: number | null;
    assetManagerNet: number | null;
    leveragedMoneyNet: number | null;
  }[];
};

export default function CotChart({ data }: CotChartProps) {
  return (
    <div className="mt-10 rounded-xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="mb-6 text-2xl font-bold">
        COT Net Positions
      </h2>

      <div className="h-[550px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
            />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="dealerNet"
              name="Dealer Net"
              strokeWidth={2}
              dot={false}
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="assetManagerNet"
              name="Asset Manager Net"
              strokeWidth={2}
              dot={false}
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="leveragedMoneyNet"
              name="Leveraged Money Net"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}