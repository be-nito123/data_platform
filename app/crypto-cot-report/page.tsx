import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export default function CryptoCotReportPage() {
  return (
    <main
      className="min-h-screen bg-black text-[#FFFFFF]">
      <SiteNav />


      {/* ===================================================== */}
      {/* TITLE */}
      {/* ===================================================== */}

      <section className="border-b border-white/[.10] px-6 py-8">

        <div className="flex items-end justify-between">

          <div>

            <div className="text-[11px] uppercase tracking-[0.18em] text-[#636366]">
              Crypto / Positioning / Reports
            </div>

            <h1 className="mt-3 text-[28px] font-semibold tracking-[0.01em] text-[#FFFFFF]">
              Crypto COT Reports
            </h1>

          </div>

          <div className="text-right">

            <div className="text-[10px] uppercase tracking-[0.15em] text-[#48484D]">
              Instruments
            </div>

            <div className="mt-2 text-[13px] text-[#C7C7CC]">
              BTC / ETH
            </div>

          </div>

        </div>

      </section>


      {/* ===================================================== */}
      {/* REPORT TABLE */}
      {/* ===================================================== */}

      <section className="px-6 py-8">

        <div className="mb-3 flex items-center justify-between">

          <span className="text-[11px] uppercase tracking-[0.18em] text-[#7C7C82]">
            Available Reports
          </span>

          <span className="text-[11px] text-[#48484D]">
            2 Instruments
          </span>

        </div>


        <div className="overflow-x-auto rounded-2xl border border-white/[.10]">

          {/* ================================================= */}
          {/* TABLE HEADER */}
          {/* ================================================= */}

          <div
            className="
              grid
              min-w-[850px]
              grid-cols-[110px_1fr_220px_140px_100px]
              border-b
              border-white/[.10]
              bg-[#1C1C1E]
              px-5
              py-3
            ">

            <div className="text-[10px] uppercase tracking-[0.14em] text-[#7C7C82]">
              Symbol
            </div>

            <div className="text-[10px] uppercase tracking-[0.14em] text-[#7C7C82]">
              Instrument
            </div>

            <div className="text-[10px] uppercase tracking-[0.14em] text-[#7C7C82]">
              Report
            </div>

            <div className="text-[10px] uppercase tracking-[0.14em] text-[#7C7C82]">
              Frequency
            </div>

            <div className="text-right text-[10px] uppercase tracking-[0.14em] text-[#7C7C82]">
              Status
            </div>

          </div>


          {/* ================================================= */}
          {/* BTC REPORT */}
          {/* ================================================= */}

          <Link
            href="/test-sheets"
            className="
              group
              grid
              min-w-[850px]
              grid-cols-[110px_1fr_220px_140px_100px]
              items-center
              border-b
              border-white/[.10]
              px-5
              py-5
              transition-colors
              duration-150
              hover:bg-[#1C1C1E]
            ">

            {/* SYMBOL */}

            <div className="text-[14px] font-bold text-[#FFFFFF]">
              BTC
            </div>


            {/* INSTRUMENT */}

            <div>

              <div className="text-[14px] text-[#FFFFFF]">
                Bitcoin
              </div>

              <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#636366]">
                BTC / USD
              </div>

            </div>


            {/* REPORT */}

            <div className="text-[11px] uppercase tracking-[0.08em] text-[#98989F]">
              COT Positioning
            </div>


            {/* FREQUENCY */}

            <div className="text-[11px] text-[#98989F]">
              Weekly
            </div>


            {/* STATUS */}

            <div className="flex items-center justify-end gap-2">

              <span className="h-[6px] w-[6px] rounded-full bg-[#98989F]" />

              <span className="text-[10px] uppercase text-[#98989F]">
                Active
              </span>

            </div>

          </Link>


          {/* ================================================= */}
          {/* ETH REPORT */}
          {/* ================================================= */}

          <Link
            href="/crypto-cot-report/eth"
            className="
              group
              grid
              min-w-[850px]
              grid-cols-[110px_1fr_220px_140px_100px]
              items-center
              px-5
              py-5
              transition-colors
              duration-150
              hover:bg-[#1C1C1E]
            ">

            {/* SYMBOL */}

            <div className="text-[14px] font-bold text-[#FFFFFF]">
              ETH
            </div>


            {/* INSTRUMENT */}

            <div>

              <div className="text-[14px] text-[#FFFFFF]">
                Ethereum
              </div>

              <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#636366]">
                ETH / USD
              </div>

            </div>


            {/* REPORT */}

            <div className="text-[11px] uppercase tracking-[0.08em] text-[#98989F]">
              COT Positioning
            </div>


            {/* FREQUENCY */}

            <div className="text-[11px] text-[#98989F]">
              Weekly
            </div>


            {/* STATUS */}

            <div className="flex items-center justify-end gap-2">

              <span className="h-[6px] w-[6px] rounded-full bg-[#98989F]" />

              <span className="text-[10px] uppercase text-[#98989F]">
                Active
              </span>

            </div>

          </Link>

        </div>

      </section>


      {/* ===================================================== */}
      {/* MARKET INFORMATION */}
      {/* ===================================================== */}

      <section className="px-6 pb-8">

        <div className="grid grid-cols-2 rounded-2xl overflow-hidden border border-white/[.10] md:grid-cols-4">

          {/* ASSET CLASS */}

          <div className="border-r border-white/[.10] px-5 py-5">

            <div className="text-[10px] uppercase tracking-[0.15em] text-[#48484D]">
              Asset Class
            </div>

            <div className="mt-3 text-[12px] text-[#C7C7CC]">
              Digital Assets
            </div>

          </div>


          {/* REPORTS */}

          <div className="border-r border-white/[.10] px-5 py-5">

            <div className="text-[10px] uppercase tracking-[0.15em] text-[#48484D]">
              Reports
            </div>

            <div className="mt-3 text-[12px] text-[#C7C7CC]">
              02
            </div>

          </div>


          {/* FREQUENCY */}

          <div className="border-r border-white/[.10] px-5 py-5">

            <div className="text-[10px] uppercase tracking-[0.15em] text-[#48484D]">
              Frequency
            </div>

            <div className="mt-3 text-[12px] text-[#C7C7CC]">
              Weekly
            </div>

          </div>


          {/* DATA */}

          <div className="px-5 py-5">

            <div className="text-[10px] uppercase tracking-[0.15em] text-[#48484D]">
              Data
            </div>

            <div className="mt-3 text-[12px] text-[#C7C7CC]">
              COT
            </div>

          </div>

        </div>

      </section>
      <SiteFooter />

    </main>
  );
}