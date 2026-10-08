"use client";

type CotRow = {
  date: string;
  assetManagerLong: number | null;
  assetManagerShort: number | null;
  assetManagerNet: number | null;

  leveragedMoneyLong: number | null;
  leveragedMoneyShort: number | null;
  leveragedMoneyNet: number | null;
};

type Props = {
  data: CotRow[];
};

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  return Math.abs(value).toLocaleString("en-US");
}

function formatNet(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }

  const sign = value > 0 ? "+" : "";

  return `${sign}${value.toLocaleString("en-US")}`;
}

function getNetClass(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "text-gray-400";
  }

  if (value > 0) {
    return "text-gray-100";
  }

  if (value < 0) {
    return "text-gray-500";
  }

  return "text-gray-300";
}

export default function PositioningBreakdown({ data }: Props) {
  if (!data || data.length === 0) {
    return null;
  }

  const latest = data[data.length - 1];

  return (
    <section className="mt-8">

      {/* HEADER */}

      <div className="mb-4">

        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-500">
          Institutional Positioning
        </p>

        <h2 className="mt-1 text-lg font-semibold text-gray-100">
          Long / Short Breakdown
        </h2>

        <p className="mt-1 text-xs text-gray-600">
          Latest weekly positioning
        </p>

      </div>


      {/* CARDS */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">


        {/* ================================================= */}
        {/* ASSET MANAGERS */}
        {/* ================================================= */}

        <div className="border border-white/[.10] bg-[#1C1C1E]">

          <div className="border-b border-white/[.10] px-5 py-4">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
                  Institutional Group
                </p>

                <h3 className="mt-1 text-sm font-semibold text-gray-100">
                  Asset Managers
                </h3>

              </div>

              <div className="text-[10px] uppercase tracking-[0.15em] text-gray-600">
                {latest.date}
              </div>

            </div>

          </div>


          <div className="divide-y divide-[#1C1C1E]">


            {/* LONG */}

            <div className="flex items-center justify-between px-5 py-4">

              <span className="text-xs uppercase tracking-wider text-gray-500">
                Long
              </span>

              <span className="font-mono text-sm tabular-nums text-gray-200">
                {formatNumber(latest.assetManagerLong)}
              </span>

            </div>


            {/* SHORT */}

            <div className="flex items-center justify-between px-5 py-4">

              <span className="text-xs uppercase tracking-wider text-gray-500">
                Short
              </span>

              <span className="font-mono text-sm tabular-nums text-gray-200">
                {formatNumber(latest.assetManagerShort)}
              </span>

            </div>


            {/* NET */}

            <div className="flex items-center justify-between bg-[#1C1C1E] px-5 py-4">

              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Net Position
              </span>

              <span
                className={`font-mono text-lg font-semibold tabular-nums ${getNetClass(
                  latest.assetManagerNet
                )}`}
              >
                {formatNet(latest.assetManagerNet)}
              </span>

            </div>

          </div>

        </div>


        {/* ================================================= */}
        {/* LEVERAGED MONEY */}
        {/* ================================================= */}

        <div className="border border-white/[.10] bg-[#1C1C1E]">

          <div className="border-b border-white/[.10] px-5 py-4">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
                  Speculative Group
                </p>

                <h3 className="mt-1 text-sm font-semibold text-gray-100">
                  Leveraged Money
                </h3>

              </div>

              <div className="text-[10px] uppercase tracking-[0.15em] text-gray-600">
                {latest.date}
              </div>

            </div>

          </div>


          <div className="divide-y divide-[#1C1C1E]">


            {/* LONG */}

            <div className="flex items-center justify-between px-5 py-4">

              <span className="text-xs uppercase tracking-wider text-gray-500">
                Long
              </span>

              <span className="font-mono text-sm tabular-nums text-gray-200">
                {formatNumber(latest.leveragedMoneyLong)}
              </span>

            </div>


            {/* SHORT */}

            <div className="flex items-center justify-between px-5 py-4">

              <span className="text-xs uppercase tracking-wider text-gray-500">
                Short
              </span>

              <span className="font-mono text-sm tabular-nums text-gray-200">
                {formatNumber(latest.leveragedMoneyShort)}
              </span>

            </div>


            {/* NET */}

            <div className="flex items-center justify-between bg-[#1C1C1E] px-5 py-4">

              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Net Position
              </span>

              <span
                className={`font-mono text-lg font-semibold tabular-nums ${getNetClass(
                  latest.leveragedMoneyNet
                )}`}
              >
                {formatNet(latest.leveragedMoneyNet)}
              </span>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}