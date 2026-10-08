"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("confirmed") === "true") {
      setTimeout(() => setSuccessMessage("Email verified successfully. You can now log in to your DataVault account."), 0);
    }
  }, []);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setErrorMessage("Please enter your work email and password.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setErrorMessage("Please confirm your email address before logging in. Check your Gmail inbox.");
      } else if (error.message.toLowerCase().includes("invalid login credentials")) {
        setErrorMessage("Invalid email or password. Please check your credentials and try again.");
      } else {
        setErrorMessage(error.message);
      }

      setLoading(false);
      return;
    }

    setSuccessMessage("Login successful. Opening DataVault...");

    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 500);
  }

  return (
    <main className="relative h-screen overflow-hidden bg-[#000000] text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(13,38,45,0.7),transparent_60%)]" />

      {/* Background Globe */}
      <div className="pointer-events-none absolute left-1/2 top-[52%] z-0 h-[850px] w-[850px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90">
        {/* Globe glow */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(34,105,112,0.22),rgba(7,26,35,0.35)_45%,transparent_70%)] blur-2xl" />

        {/* Globe outer rings */}
        <div className="absolute inset-[5%] rounded-full border border-cyan-300/[0.18]" />
        <div className="absolute inset-[12%] rounded-full border border-cyan-300/[0.12]" />
        <div className="absolute inset-[20%] rounded-full border border-cyan-300/[0.10]" />

        {/* Horizontal latitude lines */}
        <div className="absolute left-[8%] right-[8%] top-[25%] h-px bg-cyan-300/[0.13]" />
        <div className="absolute left-[3%] right-[3%] top-[40%] h-px bg-cyan-300/[0.13]" />
        <div className="absolute left-[2%] right-[2%] top-[55%] h-px bg-cyan-300/[0.13]" />
        <div className="absolute left-[8%] right-[8%] top-[70%] h-px bg-cyan-300/[0.13]" />

        {/* Vertical longitude lines */}
        <div className="absolute left-1/2 top-[5%] h-[90%] w-px bg-cyan-300/[0.12]" />
        <div className="absolute left-[30%] top-[12%] h-[76%] w-px rotate-[12deg] bg-cyan-300/[0.08]" />
        <div className="absolute right-[30%] top-[12%] h-[76%] w-px -rotate-[12deg] bg-cyan-300/[0.08]" />

        {/* Network lines */}
        <svg
          className="absolute inset-0 h-full w-full opacity-50"
          viewBox="0 0 850 850"
        >
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

        {/* Glow points */}
        {[
          ["20%", "42%"],
          ["28%", "58%"],
          ["37%", "35%"],
          ["48%", "50%"],
          ["62%", "40%"],
          ["70%", "57%"],
          ["76%", "34%"],
          ["58%", "70%"],
          ["34%", "72%"],
        ].map(([left, top], index) => (
          <div
            key={index}
            className="absolute h-3 w-3 rounded-full bg-[#000000] shadow-[0_0_20px_5px_rgba(0,122,255,0.45)]"
            style={{ left, top }}
          />
        ))}
      </div>

      {/* Floating city labels */}
      <div className="pointer-events-none absolute inset-0 z-[1] hidden text-xs tracking-wide text-zinc-300 lg:block">
        <span className="absolute left-[25%] top-[43%]">NEW YORK</span>
        <span className="absolute left-[48%] top-[33%]">LONDON</span>
        <span className="absolute right-[21%] top-[43%]">TOKYO</span>
        <span className="absolute right-[26%] top-[54%]">MUMBAI</span>
        <span className="absolute right-[19%] top-[63%]">SINGAPORE</span>
      </div>

      {/* Main Content */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 pb-14 pt-6">
        {/* Logo */}
        <Link href="/" className="mb-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center border border-[#007AFF] bg-black/40 text-lg font-bold text-[#007AFF] shadow-[0_0_25px_rgba(10,132,255,0.15)]">
            ›_
          </div>

          <span className="text-3xl font-semibold tracking-wide">
            DATA<span className="text-[#007AFF]">VAULT</span>
          </span>
        </Link>

        {/* Heading */}
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-medium tracking-wide text-zinc-200 sm:text-3xl">
            ACCESS YOUR DATA VAULT PORTAL
          </h1>

          <p className="mt-2 text-sm tracking-[0.08em] text-zinc-400">
            INSTITUTIONAL-GRADE DATA. INTELLIGENCE AT SCALE.
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-3 w-full max-w-[490px] rounded-2xl border border-white/[0.12] bg-[#1C1C1E]/80 p-9 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <form onSubmit={handleLogin}>
            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Work Email"
              autoComplete="email"
              className="mb-5 w-full rounded-full border border-[#007AFF] bg-black/30 px-4 py-4 text-base text-white outline-none shadow-[0_0_20px_rgba(10,132,255,0.14)] transition placeholder:text-zinc-400 focus:border-[#007AFF]"
            />

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/[0.12] bg-black/30 px-4 py-4 pr-14 text-base text-white outline-none transition placeholder:text-zinc-400 focus:border-[#007AFF]"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-[#007AFF]"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>

            {/* Remember */}
            <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                name="remember"
                className="h-5 w-5 rounded-2xl border-white/20 bg-transparent accent-[#007AFF]"
              />
              Remember Me
            </label>

            {/* Messages */}
            {errorMessage && (
              <div className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mt-5 rounded-xl border border-[#0A84FF]/30 bg-[#007AFF]/10 px-4 py-3 text-sm text-[#007AFF]">
                {successMessage}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-full border border-[#007AFF] bg-gradient-to-b from-[#0A84FF] to-[#0059B3] py-4 text-base font-semibold tracking-wide text-[#FFFFFF] shadow-[0_0_30px_rgba(10,132,255,0.22)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "AUTHENTICATING..." : "LOGIN TO PORTAL"}
            </button>

            {/* Forgot */}
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={async () => {
                  setErrorMessage("");
                  setSuccessMessage("");

                  const emailInput = document.querySelector<HTMLInputElement>('input[name="email"]');
                  const email = emailInput?.value.trim().toLowerCase() ?? "";

                  if (!email) {
                    setErrorMessage("Enter your work email first, then click Forgot Password?");
                    emailInput?.focus();
                    return;
                  }

                  setLoading(true);

                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });

                  if (error) {
                    setErrorMessage(error.message);
                  } else {
                    setSuccessMessage("Password reset email sent. Check your Gmail inbox.");
                  }

                  setLoading(false);
                }}
                disabled={loading}
                className="text-sm text-zinc-400 transition hover:text-[#007AFF] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Forgot Password?
              </button>
            </div>

            {/* Request account */}
            <p className="mt-6 text-center text-sm text-zinc-400">
              New to Data Vault?{" "}
              <Link
                href="/register"
                className="text-[#0A84FF] transition hover:text-[#007AFF]"
              >
                Request an Account
              </Link>
            </p>
          </form>
        </div>
      </section>

      {/* Bottom Links */}
      <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-5 text-xs text-zinc-500">
        <Link href="/terms" className="transition hover:text-zinc-300">
          Terms of Use
        </Link>

        <Link href="/privacy" className="transition hover:text-zinc-300">
          Privacy Policy
        </Link>
      </div>
    </main>
  );
}
