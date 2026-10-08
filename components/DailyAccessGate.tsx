"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DailyAccessGate() {
  const router = useRouter();

  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function redeemCoupon() {
    if (!coupon.trim()) {
      setMessage("Please enter a coupon code.");
      setSuccess(false);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/coupons/coupon-redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: coupon.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSuccess(false);
        setMessage(data.error || "Unable to redeem coupon.");
        return;
      }

      setSuccess(true);

      setMessage(
        `Coupon applied successfully. Your Daily access is active until ${new Date(
          data.expires_at
        ).toLocaleDateString("en-IN")}.`
      );

      setTimeout(() => {
        router.refresh();
      }, 1200);
    } catch (error) {
  console.error("COUPON REQUEST FAILED:", error);

  setSuccess(false);

  setMessage(
    error instanceof Error
      ? error.message
      : "Something went wrong while connecting to the server."
  );
} finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen bg-black text-[#FFFFFF]"
      style={{
      }}
    >
      <header className="border-b border-white/[.10] bg-[#1C1C1E]/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/weather-condition"
              className="text-[15px] font-bold tracking-[0.08em] text-white"
            >
              WEATHER CONDITION
            </Link>

            <div className="h-5 w-px bg-[#3A3A3C]" />

            <div className="text-[11px] uppercase tracking-[0.18em] text-[#7C7C82]">
              Daily Market Data
            </div>
          </div>

          <div className="text-[10px] uppercase tracking-[0.15em] text-[#007AFF]">
            Restricted Access
          </div>
        </div>
      </header>

      <section className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl border border-white/[.10] bg-[#1C1C1E]">

          <div className="border-b border-white/[.10] px-7 py-6">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#636366]">
              DataVault / Daily
            </div>

            <h1 className="mt-3 text-[25px] font-semibold text-[#FFFFFF]">
              Daily Market Data
            </h1>

            <p className="mt-3 text-[11px] leading-6 text-[#7C7C82]">
              Access daily price, volume, open interest and OI percentage
              data across all supported instruments.
            </p>
          </div>

          <div className="px-7 py-7">

            <div className="border border-white/[.10] bg-[#1C1C1E] p-5">

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[#7C7C82]">
                    Daily Access
                  </div>

                  <div className="mt-2 text-[18px] font-semibold text-white">
                    Full Market Dataset
                  </div>
                </div>

                <div className="text-[10px] uppercase tracking-[0.12em] text-[#007AFF]">
                  Premium
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 rounded-xl overflow-hidden border border-white/[.10]">
                <div className="border-r border-white/[.10] px-4 py-4">
                  <div className="text-[9px] uppercase text-[#48484D]">
                    Frequency
                  </div>
                  <div className="mt-2 text-[11px] text-[#C7C7CC]">
                    Daily
                  </div>
                </div>

                <div className="border-r border-white/[.10] px-4 py-4">
                  <div className="text-[9px] uppercase text-[#48484D]">
                    Data
                  </div>
                  <div className="mt-2 text-[11px] text-[#C7C7CC]">
                    OI / Volume
                  </div>
                </div>

                <div className="px-4 py-4">
                  <div className="text-[9px] uppercase text-[#48484D]">
                    Access
                  </div>
                  <div className="mt-2 text-[11px] text-[#C7C7CC]">
                    30 Days
                  </div>
                </div>
              </div>

            </div>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-[#1C1C1E]" />

              <span className="text-[9px] uppercase tracking-[0.15em] text-[#48484D]">
                Have a coupon?
              </span>

              <div className="h-px flex-1 bg-[#1C1C1E]" />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.14em] text-[#7C7C82]">
                Coupon Code
              </label>

              <div className="mt-2 flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      redeemCoupon();
                    }
                  }}
                  placeholder="ENTER COUPON"
                  className="min-w-0 flex-1 border border-white/[.10] bg-[#1C1C1E] px-4 py-3 text-[11px] uppercase tracking-[0.08em] text-white outline-none placeholder:text-[#48484D] focus:border-[#007AFF]"
                />

                <button
                  onClick={redeemCoupon}
                  disabled={loading}
                  className="border border-[#007AFF] px-5 py-3 text-[10px] uppercase tracking-[0.12em] text-[#007AFF] transition hover:bg-[#000000] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Checking..." : "Apply"}
                </button>
              </div>

              {message && (
                <div
                  className={`mt-4 border px-4 py-3 text-[10px] leading-5 ${
                    success
                      ? "border-white/[.10] bg-[#1C1C1E] text-[#30D158]"
                      : "border-[#5C1F1F] bg-[#1C1C1E] text-[#FF453A]"
                  }`}
                >
                  {message}
                </div>
              )}
            </div>

            <div className="mt-7">

              <div className="mb-3 text-center text-[9px] uppercase tracking-[0.15em] text-[#48484D]">
                Or purchase access
              </div>

              <button
                disabled
                className="w-full border border-white/[.10] bg-[#1C1C1E] px-5 py-4 text-[10px] uppercase tracking-[0.15em] text-[#7C7C82]"
              >
                Buy Daily Access
              </button>

              <p className="mt-3 text-center text-[9px] leading-5 text-[#48484D]">
                Secure payment access will be available through Razorpay.
              </p>

            </div>

            <div className="mt-7 border-t border-white/[.10] pt-5 text-center">
              <Link
                href="/login"
                className="text-[10px] uppercase tracking-[0.12em] text-[#7C7C82] hover:text-white"
              >
                Already have an account? Sign in
              </Link>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}