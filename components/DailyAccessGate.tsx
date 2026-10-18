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

    try {
      const response = await fetch("/api/coupons/coupon-redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon.trim() }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setSuccess(false);
        setMessage(payload?.error || "That code could not be redeemed.");
        return;
      }

      setSuccess(true);
      setMessage(
        `Access granted. Your pass is active until ${new Date(
          payload?.expires_at
        ).toLocaleDateString("en-IN")}.`
      );

      setCoupon("");
      setTimeout(() => router.refresh(), 1200);
    } catch (error) {
      console.error("COUPON REQUEST FAILED:", error);
      setSuccess(false);
      setMessage("Could not reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg text-text">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold tracking-[0.02em] text-text"
            >
              <span
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded border border-accent/40 bg-accent/10 font-mono text-[11px] font-bold text-accent"
              >
                ›_
              </span>
              DATA<span className="text-accent">VAULT</span>
            </Link>

            <span className="hidden h-5 w-px bg-border sm:block" />
            <span className="hidden text-[11px] uppercase tracking-[0.18em] text-text-muted sm:inline">
              Daily Market Data
            </span>
          </div>

          <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
            Restricted
          </span>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-[1400px] items-center justify-center px-4 py-14 lg:px-6">
        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-panel shadow-2xl shadow-black/40">
          <div className="border-b border-border px-7 py-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-muted">
              DataVault / Daily
            </div>

            <h1 className="mt-3 text-[25px] font-semibold tracking-tight text-text">
              Daily market data
            </h1>

            <p className="mt-2.5 text-[12px] leading-6 text-text-dim">
              Price, volume, open interest and OI percentage across every supported instrument, with
              daily updates.
            </p>
          </div>

          <div className="px-7 py-7">
            <div className="rounded-xl border border-border bg-bg-elevated p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-text-muted">
                    Daily Access
                  </div>
                  <div className="mt-1.5 text-[18px] font-semibold text-text">
                    Full market dataset
                  </div>
                </div>

                <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
                  Premium
                </span>
              </div>

              <dl className="mt-5 grid grid-cols-3 overflow-hidden rounded-lg border border-border">
                {[
                  ["Frequency", "Daily"],
                  ["Includes", "OI / Volume"],
                  ["Term", "30 days"],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className={`px-4 py-3.5 ${index < 2 ? "border-r border-border" : ""}`}
                  >
                    <dt className="text-[9px] uppercase tracking-[0.1em] text-text-muted">
                      {label}
                    </dt>
                    <dd className="mt-1.5 text-[11px] text-text">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-[0.15em] text-text-muted">
                Have a code?
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div>
              <label
                htmlFor="coupon-code"
                className="text-[10px] uppercase tracking-[0.14em] text-text-muted"
              >
                Coupon code
              </label>

              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="coupon-code"
                  name="coupon"
                  value={coupon}
                  onChange={(event) => setCoupon(event.target.value.toUpperCase())}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") redeemCoupon();
                  }}
                  placeholder="ENTER COUPON"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={Boolean(message) && !success}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-bg-elevated px-4 py-3 font-mono text-[12px] uppercase tracking-[0.08em] text-text placeholder:text-text-muted focus:border-accent"
                />

                <button
                  type="button"
                  onClick={redeemCoupon}
                  disabled={loading}
                  className="rounded-lg border border-accent bg-accent px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white transition hover:border-accent-strong hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Checking…" : "Apply"}
                </button>
              </div>

              {message && (
                <p
                  role="status"
                  aria-live="polite"
                  className={`mt-4 rounded-lg border px-4 py-3 text-[11px] leading-5 ${
                    success
                      ? "border-green/40 bg-green/10 text-green"
                      : "border-red/40 bg-red/10 text-red"
                  }`}
                >
                  {message}
                </p>
              )}
            </div>

            <div className="mt-7 border-t border-border pt-6">
              <div className="mb-3 text-center text-[10px] uppercase tracking-[0.15em] text-text-muted">
                Or purchase access
              </div>

              <button
                type="button"
                disabled
                aria-disabled="true"
                className="w-full cursor-not-allowed rounded-lg border border-border bg-bg-elevated px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-text-muted"
              >
                Buy daily access
              </button>

              <p className="mt-3 text-center text-[10px] leading-5 text-text-muted">
                Online checkout is not live yet. Use a coupon above, or email{" "}
                <a
                  href="mailto:support@datavault.app"
                  className="text-accent underline-offset-2 hover:underline"
                >
                  support@datavault.app
                </a>{" "}
                for access.
              </p>
            </div>

            <div className="mt-7 border-t border-border pt-5 text-center text-[11px] text-text-muted">
              <Link href="/login" className="text-text-dim transition hover:text-text">
                Already have an account? Sign in
              </Link>
              <span className="mx-2 text-border-strong">·</span>
              <Link href="/#pricing" className="text-text-dim transition hover:text-text">
                Compare plans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
