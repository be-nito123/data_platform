import { getSheetData } from "@/lib/supabase/google/sheets";
import { processCotRows } from "@/lib/supabase/data/cot";
import CombinedChart from "@/components/CombinedChart";
import PositioningBreakdown from "@/components/PositioningBreakdown";

function formatNumber(value: number | null) {
  if (value === null || value === undefined) return "-";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function TestSheetsPage() {
  // IMPORTANT:
  // Google Sheet contains columns A:J
  const rows = await getSheetData(
  "COT BTC / ETH",
  "A1:J1000",
  process.env.COT_GOOGLE_SHEET_ID
);

  if (!rows || rows.length === 0) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-3xl font-bold">
          No data found
        </h1>
      </main>
    );
  }

  const data = processCotRows(rows);

  if (data.length === 0) {
    return (
      <main className="min-h-screen bg-black p-10 text-white">
        <h1 className="text-3xl font-bold">
          No usable data found
        </h1>
      </main>
    );
  }

  const latest = data[data.length - 1];

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white md:px-8">

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <header className="mb-8 border-b border-white/[.10] pb-6">

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

          <div>

            <div className="flex items-center gap-3">

              <h1 className="text-3xl font-semibold tracking-tight text-white">
                COT BTC / ETH
              </h1>

              <span className="border border-white/[.10] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Market Data
              </span>

            </div>

            <p className="mt-2 text-sm text-gray-500">
              Commitment of Traders positioning dashboard
            </p>

          </div>

          <div className="text-left md:text-right">

            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
              Dataset
            </p>

            <p className="mt-1 font-mono text-sm tabular-nums text-gray-400">
              {data.length} RECORDS
            </p>

          </div>

        </div>

      </header>


      {/* ===================================================== */}
      {/* MARKET SNAPSHOT */}
      {/* ===================================================== */}

      <section>

        <div className="mb-3 flex items-center justify-between">

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Market Snapshot
          </p>

          <p className="font-mono text-[10px] tabular-nums text-gray-600">
            LATEST REPORT
          </p>

        </div>


        <div className="grid grid-cols-1 border border-white/[.10] bg-[#1C1C1E] sm:grid-cols-2 lg:grid-cols-5">


          {/* BTC PRICE */}

          <div className="border-b border-white/[.10] p-5 sm:border-r">

            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
              BTC Price
            </p>

            <p className="mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight text-gray-100">
              {latest.btcPrice || "-"}
            </p>

          </div>


          {/* OPEN INTEREST */}

          <div className="border-b border-white/[.10] p-5 lg:border-r">

            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
              Open Interest
            </p>

            <p className="mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight text-gray-100">
              {formatNumber(latest.openInterest)}
            </p>

          </div>


          {/* DEALER NET */}

          <div className="border-b border-white/[.10] p-5 sm:border-r">

            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
              Dealer Net
            </p>

            <p className="mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight text-gray-100">
              {formatNumber(latest.dealerNet)}
            </p>

          </div>


          {/* ASSET MANAGER NET */}

          <div className="border-b border-white/[.10] p-5 lg:border-r">

            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
              Asset Mgr Net
            </p>

            <p className="mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight text-gray-100">
              {formatNumber(latest.assetManagerNet)}
            </p>

          </div>


          {/* REPORT DATE */}

          <div className="border-b border-white/[.10] p-5">

            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
              Report Date
            </p>

            <p className="mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight text-gray-100">
              {latest.date || "-"}
            </p>

          </div>


          {/* ASSET MANAGER LONG */}

          <div className="border-t border-white/[.10] p-5 sm:border-r">

            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
              Asset Mgr Long
            </p>

            <p className="mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight text-gray-100">
              {formatNumber(latest.assetManagerLong)}
            </p>

          </div>


          {/* ASSET MANAGER SHORT */}

          <div className="border-t border-white/[.10] p-5 lg:border-r">

            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
              Asset Mgr Short
            </p>

            <p className="mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight text-gray-100">
              {formatNumber(latest.assetManagerShort)}
            </p>

          </div>


          {/* LEVERAGED MONEY NET */}

          <div className="border-t border-white/[.10] p-5 sm:border-r">

            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
              Lev Money Net
            </p>

            <p className="mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight text-gray-100">
              {formatNumber(latest.leveragedMoneyNet)}
            </p>

          </div>


          {/* LEVERAGED MONEY LONG */}

          <div className="border-t border-white/[.10] p-5 lg:border-r">

            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
              Lev Money Long
            </p>

            <p className="mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight text-gray-100">
              {formatNumber(latest.leveragedMoneyLong)}
            </p>

          </div>


          {/* LEVERAGED MONEY SHORT */}

          <div className="border-t border-white/[.10] p-5">

            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
              Lev Money Short
            </p>

            <p className="mt-3 font-mono text-2xl font-semibold tabular-nums tracking-tight text-gray-100">
              {formatNumber(latest.leveragedMoneyShort)}
            </p>

          </div>

        </div>

      </section>


      {/* ===================================================== */}
      {/* COT POSITIONING CHART */}
      {/* ===================================================== */}

      <section className="mt-8">

        <div className="mb-3 flex items-center justify-between">

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
            Positioning Analysis
          </p>

          <p className="font-mono text-[10px] tabular-nums text-gray-600">
            WEEKLY
          </p>

        </div>


      </section>


      {/* ===================================================== */}
      {/* BTC PRICE CHART */}
      {/* ===================================================== */}

      <section className="mt-8">

        <CombinedChart data={data} />
        <PositioningBreakdown data={data} />

      </section>


      {/* ===================================================== */}
      {/* COT REPORT TABLE */}
      {/* ===================================================== */}

      <section className="mt-12">


        {/* SECTION HEADER */}

        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">

          <div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              Commitment of Traders
            </p>

            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
              COT Report — BTC
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Weekly positioning data
            </p>

          </div>


          <div className="text-left md:text-right">

            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-600">
              Reports
            </p>

            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-gray-300">
              {data.length}
            </p>

          </div>

        </div>


        {/* TABLE */}

        <div className="overflow-hidden border border-white/[.10] bg-[#1C1C1E]">


          {/* TABLE BAR */}

          <div className="flex items-center justify-between border-b border-white/[.10] bg-[#1C1C1E] px-5 py-3">

            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
              BTC Positioning
            </span>

            <span className="font-mono text-[10px] tabular-nums text-gray-600">
              WEEKLY
            </span>

          </div>


          {/* SCROLL AREA */}

          <div className="max-h-[650px] overflow-auto">

            <table className="w-full min-w-[1600px] border-collapse">


              {/* TABLE HEADER */}

              <thead className="sticky top-0 z-10">

                <tr className="border-b border-white/[.10] bg-[#1C1C1E]">


                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Report Date
                  </th>


                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                    BTC Price
                  </th>


                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Open Interest
                  </th>


                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Dealer NET
                  </th>


                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Asset Mgr NET
                  </th>


                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Asset Mgr Long
                  </th>


                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Asset Mgr Short
                  </th>


                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Lev Money NET
                  </th>


                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Lev Money Long
                  </th>


                  <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                    Lev Money Short
                  </th>

                </tr>

              </thead>


              {/* TABLE BODY */}

              <tbody>

                {data.map((row, rowIndex) => {

                  const isLatest =
                    rowIndex === data.length - 1;

                  return (

                    <tr
                      key={rowIndex}
                      className={`
                        border-b border-white/[.10]
                        transition-colors
                        hover:bg-[#1C1C1E]
                        ${
                          isLatest
                            ? "bg-[#1C1C1E]"
                            : "bg-transparent"
                        }
                      `}
                    >


                      {/* DATE */}

                      <td className="whitespace-nowrap px-5 py-3">

                        <span
                          className={
                            isLatest
                              ? "font-mono text-[13px] font-semibold tabular-nums text-white"
                              : "font-mono text-[13px] tabular-nums text-gray-400"
                          }
                        >
                          {row.date}
                        </span>

                      </td>


                      {/* BTC PRICE */}

                      <td className="px-5 py-3 text-right">

                        <span className="font-mono text-[13px] font-medium tabular-nums tracking-tight text-gray-100">
                          {row.btcPrice || "-"}
                        </span>

                      </td>


                      {/* OPEN INTEREST */}

                      <td className="px-5 py-3 text-right">

                        <span className="font-mono text-[13px] font-medium tabular-nums tracking-tight text-gray-200">
                          {formatNumber(row.openInterest)}
                        </span>

                      </td>


                      {/* DEALER NET */}

                      <td className="px-5 py-3 text-right">

                        <span className="font-mono text-[13px] font-medium tabular-nums tracking-tight text-gray-100">
                          {formatNumber(row.dealerNet)}
                        </span>

                      </td>


                      {/* ASSET MANAGER NET */}

                      <td className="px-5 py-3 text-right">

                        <span className="font-mono text-[13px] font-medium tabular-nums tracking-tight text-gray-100">
                          {formatNumber(row.assetManagerNet)}
                        </span>

                      </td>


                      {/* ASSET MANAGER LONG */}

                      <td className="px-5 py-3 text-right">

                        <span className="font-mono text-[13px] font-medium tabular-nums tracking-tight text-gray-100">
                          {formatNumber(row.assetManagerLong)}
                        </span>

                      </td>


                      {/* ASSET MANAGER SHORT */}

                      <td className="px-5 py-3 text-right">

                        <span className="font-mono text-[13px] font-medium tabular-nums tracking-tight text-gray-100">
                          {formatNumber(row.assetManagerShort)}
                        </span>

                      </td>


                      {/* LEVERAGED MONEY NET */}

                      <td className="px-5 py-3 text-right">

                        <span className="font-mono text-[13px] font-medium tabular-nums tracking-tight text-gray-100">
                          {formatNumber(row.leveragedMoneyNet)}
                        </span>

                      </td>


                      {/* LEVERAGED MONEY LONG */}

                      <td className="px-5 py-3 text-right">

                        <span className="font-mono text-[13px] font-medium tabular-nums tracking-tight text-gray-100">
                          {formatNumber(row.leveragedMoneyLong)}
                        </span>

                      </td>


                      {/* LEVERAGED MONEY SHORT */}

                      <td className="px-5 py-3 text-right">

                        <span className="font-mono text-[13px] font-medium tabular-nums tracking-tight text-gray-100">
                          {formatNumber(row.leveragedMoneyShort)}
                        </span>

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        </div>


        {/* TABLE FOOTER */}

        <div className="mt-3 flex flex-col justify-between gap-2 text-[10px] uppercase tracking-wider text-gray-600 sm:flex-row">

          <span>
            Source: Google Sheets
          </span>

          <span>
            Latest report highlighted
          </span>

        </div>

      </section>

    </main>
  );
}