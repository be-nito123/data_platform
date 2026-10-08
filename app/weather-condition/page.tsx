import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DailyAccessGate from "@/components/DailyAccessGate";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

const ASSETS = [
  {
    id: "gold",
    symbol: "XAU",
    name: "Gold",
    description: "Gold Futures",
  },

  {
    id: "silver",
    symbol: "XAG",
    name: "Silver",
    description: "Silver Futures",
  },

  {
    id: "gsr",
    symbol: "GSR",
    name: "GSR",
    description: "Gold / Silver Ratio",
  },

  {
    id: "dxy",
    symbol: "DXY",
    name: "Dollar Index",
    description: "U.S. Dollar Index",
  },

  {
    id: "us02y-bond",
    symbol: "US02Y",
    name: "US 02Y Bond",
    description: "2-Year Treasury Futures",
  },

  {
    id: "us10y-bond",
    symbol: "US10Y",
    name: "US 10Y Bond",
    description: "10-Year Treasury Futures",
  },

  {
    id: "us02y-yield",
    symbol: "US02Y",
    name: "US 02Y Yield",
    description: "2-Year Treasury Yield",
  },

  {
    id: "us10y-yield",
    symbol: "US10Y",
    name: "US 10Y Yield",
    description: "10-Year Treasury Yield",
  },

  {
    id: "us30y-yield",
    symbol: "US30Y",
    name: "US 30Y Yield",
    description: "30-Year Treasury Yield",
  },

  {
    id: "jpy",
    symbol: "JPY",
    name: "JPY Futures",
    description: "Japanese Yen Futures",
  },

  {
    id: "cad",
    symbol: "CAD",
    name: "CAD Futures",
    description: "Canadian Dollar Futures",
  },

  {
    id: "swiss",
    symbol: "CHF",
    name: "Swiss Futures",
    description: "Swiss Franc Futures",
  },

  {
    id: "oil",
    symbol: "OIL",
    name: "Oil",
    description: "Crude Oil Futures",
  },

  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    description: "Bitcoin Futures",
  },

  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum Futures",
    description: "Ethereum Futures",
  },

  {
    id: "nasdaq100",
    symbol: "NDX",
    name: "Nasdaq 100",
    description: "Nasdaq 100 Futures",
  },

  {
    id: "sp500",
    symbol: "SPX",
    name: "S&P 500",
    description: "S&P 500 Futures",
  },

  {
    id: "us30",
    symbol: "US30",
    name: "US30",
    description: "Dow Jones Futures",
  },

  {
    id: "eurusd",
    symbol: "EURUSD",
    name: "EUR/USD",
    description: "Euro / U.S. Dollar",
  },

  {
    id: "gbpusd",
    symbol: "GBPUSD",
    name: "GBP/USD",
    description: "British Pound / U.S. Dollar",
  },
];

export default async function WeatherConditionPage() {
  /*
   * =========================================================
   * DAILY ACCESS CHECK
   * =========================================================
   */

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let hasAccess = false;

  if (user) {
    /*
     * ---------------------------------------------------------
     * CHECK ADMIN
     * ---------------------------------------------------------
     */

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = profile?.role === "admin";

    if (isAdmin) {
      hasAccess = true;
    } else {
      /*
       * -------------------------------------------------------
       * CHECK RAZORPAY PURCHASE
       * -------------------------------------------------------
       */

      const { data: purchase } = await supabase
        .from("purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("dataset_code", "DAILY")
        .eq("status", "paid")
        .maybeSingle();

      /*
       * -------------------------------------------------------
       * CHECK ACTIVE COUPON ACCESS
       * -------------------------------------------------------
       */

      const { data: couponAccess } = await supabase
        .from("coupon_redemptions")
        .select("id")
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (purchase || couponAccess) {
        hasAccess = true;
      }
    }
  }

  /*
   * =========================================================
   * LOCKED PAGE
   * =========================================================
   *
   * If the user is not an admin and does not have:
   *
   * 1. Paid Daily access
   * OR
   * 2. Active coupon access
   *
   * show the payment / coupon screen.
   */

  if (!hasAccess) {
    return <DailyAccessGate />;
  }

  /*
   * =========================================================
   * DAILY MARKET DATA
   * =========================================================
   */

  return (
    <main
      className="min-h-screen bg-black text-[#FFFFFF]">
      <SiteNav />
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="border-b border-white/[.10] bg-[#1C1C1E]/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <div className="text-[15px] font-bold tracking-[0.08em] text-white">
              WEATHER CONDITION
            </div>

            <div className="h-5 w-px bg-[#3A3A3C]" />

            <div className="text-[11px] uppercase tracking-[0.18em] text-[#7C7C82]">
              Market Data
            </div>
          </div>

          <div className="text-[11px] uppercase tracking-[0.15em] text-[#7C7C82]">
            Daily
          </div>
        </div>
      </header>

      {/* ================================================= */}
      {/* TITLE */}
      {/* ================================================= */}

      <section className="border-b border-white/[.10] px-6 py-8">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[#48484D]">
          Markets / Weather Condition
        </div>

        <h1 className="mt-3 text-[28px] font-semibold text-[#FFFFFF]">
          Market Conditions
        </h1>

        <p className="mt-2 max-w-2xl text-[11px] leading-6 text-[#636366]">
          Select an instrument to view daily price, volume and open interest
          data.
        </p>
      </section>

      {/* ================================================= */}
      {/* ASSET LIST */}
      {/* ================================================= */}

      <section className="px-6 py-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#7C7C82]">
            Select Instrument
          </div>

          <div className="text-[10px] text-[#48484D]">
            {ASSETS.length} Instruments
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-white/[.10] overflow-hidden">
          {ASSETS.map((asset) => (
            <Link
              key={asset.id}
              href={`/weather-condition/${asset.id}`}
              className="
                group
                border-b
                border-white/[.10]
                bg-[#1C1C1E]
                px-6
                py-5
                transition-all
                duration-150
                hover:bg-[#1C1C1E]
              ">
              <div className="flex items-start justify-between">
                {/* LEFT */}

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-16 items-center justify-center rounded-xl border border-white/[.10] bg-white/[.04] text-[11px] font-semibold tracking-[0.08em] text-[#FFFFFF] transition-all duration-150 group-hover:border-[#007AFF] group-hover:text-[#FFFFFF]">
                    {asset.symbol}
                  </div>

                  <div>
                    <div className="text-[15px] font-semibold text-[#FFFFFF]">
                      {asset.name}
                    </div>

                    <div className="mt-1 text-[10px] tracking-[0.03em] text-[#98989F]">
                      {asset.description}
                    </div>
                  </div>
                </div>

                {/* ARROW */}

                <div className="text-[16px] text-[#7C7C82] transition-all duration-150 group-hover:translate-x-1 group-hover:text-[#007AFF]">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ================================================= */}
      {/* INFORMATION */}
      {/* ================================================= */}

      <section className="px-6 pb-8">
        <div className="grid grid-cols-2 rounded-2xl overflow-hidden border border-white/[.10] md:grid-cols-4">
          <Info
            label="Instruments"
            value={String(ASSETS.length)}
          />

          <Info
            label="Frequency"
            value="Daily"
          />

          <Info
            label="Start"
            value="01 OCT 2025"
          />

          <Info
            label="Data"
            value="Market"
          />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

/* ========================================================= */
/* INFO BOX */
/* ========================================================= */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-r border-white/[.10] px-5 py-5">
      <div className="text-[10px] uppercase tracking-[0.15em] text-[#48484D]">
        {label}
      </div>

      <div className="mt-3 text-[12px] text-[#C7C7CC]">
        {value}
      </div>
    </div>
  );
}