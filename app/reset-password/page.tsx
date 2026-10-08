"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
  let mounted = true;

  async function prepareRecoverySession() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!mounted) return;

      if (error) {
        console.error("Password reset code exchange failed:", error.message);
        setErrorMessage(
          "This password reset link is invalid or has expired. Please request a new one."
        );
        return;
      }

      // Remove the one-time code from the browser URL.
      window.history.replaceState(
        {},
        document.title,
        "/reset-password"
      );

      setReady(true);
      return;
    }

    const { data } = await supabase.auth.getSession();

    if (!mounted) return;

    if (data.session) {
      setReady(true);
      setErrorMessage("");
    } else {
      setErrorMessage(
        "This password reset link is invalid or has expired. Please request a new one."
      );
    }
  }

  prepareRecoverySession();

  return () => {
    mounted = false;
  };
}, [supabase]);

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage("");
    setMessage("");

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password updated successfully. Redirecting to login...");
    setLoading(false);

    await supabase.auth.signOut();

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#000000] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(13,38,45,0.7),transparent_60%)]" />

      <div className="pointer-events-none absolute left-1/2 top-[52%] z-0 h-[850px] w-[850px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(34,105,112,0.22),rgba(7,26,35,0.35)_45%,transparent_70%)] blur-2xl" />
        <div className="absolute inset-[5%] rounded-full border border-cyan-300/[0.18]" />
        <div className="absolute inset-[12%] rounded-full border border-cyan-300/[0.12]" />
        <div className="absolute inset-[20%] rounded-full border border-cyan-300/[0.10]" />
        <div className="absolute left-[8%] right-[8%] top-[25%] h-px bg-cyan-300/[0.13]" />
        <div className="absolute left-[3%] right-[3%] top-[40%] h-px bg-cyan-300/[0.13]" />
        <div className="absolute left-[2%] right-[2%] top-[55%] h-px bg-cyan-300/[0.13]" />
        <div className="absolute left-[8%] right-[8%] top-[70%] h-px bg-cyan-300/[0.13]" />
        <div className="absolute left-1/2 top-[5%] h-[90%] w-px bg-cyan-300/[0.12]" />
        <div className="absolute left-[30%] top-[12%] h-[76%] w-px rotate-[12deg] bg-cyan-300/[0.08]" />
        <div className="absolute right-[30%] top-[12%] h-[76%] w-px -rotate-[12deg] bg-cyan-300/[0.08]" />
        <svg className="absolute inset-0 h-full w-full opacity-50" viewBox="0 0 850 850">
          <g stroke="#4fd1c5" strokeWidth="1" fill="none" opacity="0.45">
            <path d="M80 350 L250 270 L410 390 L600 250 L770 360" />
            <path d="M50 500 L210 430 L350 550 L540 420 L790 510" />
            <path d="M130 640 L280 530 L450 680 L620 540 L730 650" />
            <path d="M220 180 L360 330 L500 190 L650 350" />
            <path d="M150 380 L300 480 L450 300 L610 460 L720 310" />
          </g>
          <g fill="#007AFF">
            <circle cx="250" cy="270" r="5" />
            <circle cx="410" cy="390" r="6" />
            <circle cx="600" cy="250" r="5" />
            <circle cx="210" cy="430" r="5" />
            <circle cx="540" cy="420" r="6" />
            <circle cx="450" cy="680" r="5" />
            <circle cx="620" cy="540" r="6" />
            <circle cx="360" cy="330" r="5" />
          </g>
        </svg>
      </div>

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-10">
        <Link href="/" className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center border border-[#007AFF] bg-black/40 text-lg font-bold text-[#007AFF] shadow-[0_0_25px_rgba(10,132,255,0.15)]">
            ›_
          </div>
          <span className="text-3xl font-semibold tracking-wide">
            DATA<span className="text-[#007AFF]">VAULT</span>
          </span>
        </Link>

        <div className="mb-5 text-center">
          <h1 className="text-2xl font-medium tracking-wide text-zinc-200 sm:text-3xl">
            RESET YOUR DATA VAULT PASSWORD
          </h1>
          <p className="mt-2 text-sm tracking-[0.08em] text-zinc-400">
            SECURE ACCOUNT RECOVERY.
          </p>
        </div>

        <div className="w-full max-w-[490px] rounded-2xl border border-white/[0.10] bg-[#1C1C1E]/90 p-9 shadow-2xl shadow-black/60 backdrop-blur-xl">
          {ready && (
            <form onSubmit={handleReset}>
              <label className="mb-2 block text-xs font-medium tracking-[0.12em] text-zinc-400">
                NEW PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  className="w-full rounded-xl border border-white/[0.10] bg-[#1C1C1E]/90 px-4 py-4 pr-16 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-[#007AFF]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-[#007AFF]"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>

              <label className="mb-2 mt-5 block text-xs font-medium tracking-[0.12em] text-zinc-400">
                CONFIRM NEW PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  className="w-full rounded-xl border border-white/[0.10] bg-[#1C1C1E]/90 px-4 py-4 pr-16 text-base text-white outline-none transition placeholder:text-zinc-500 focus:border-[#007AFF]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-[#007AFF]"
                >
                  {showConfirmPassword ? "HIDE" : "SHOW"}
                </button>
              </div>

              {errorMessage && (
                <div className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}

              {message && (
                <div className="mt-5 rounded-xl border border-[#0A84FF]/30 bg-[#007AFF]/10 px-4 py-3 text-sm text-[#007AFF]">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-full border border-[#007AFF] bg-gradient-to-b from-[#0A84FF] to-[#0059B3] py-4 text-base font-semibold tracking-wide text-[#FFFFFF] shadow-[0_0_30px_rgba(10,132,255,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "UPDATING PASSWORD..." : "UPDATE PASSWORD"}
              </button>
            </form>
          )}

          {!ready && !errorMessage && (
            <p className="text-center text-sm text-zinc-400">VERIFYING SECURE RESET LINK...</p>
          )}

          {errorMessage && !ready && (
            <div className="text-center">
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {errorMessage}
              </div>
              <Link
                href="/login"
                className="mt-5 inline-block text-sm text-[#0A84FF] hover:text-[#007AFF]"
              >
                Return to Login
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
