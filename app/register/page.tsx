"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [country, setCountry] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  return (
    <main className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[#000000] text-white">

      {/* =========================================================
          BACKGROUND
      ========================================================= */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Deep dark blue background */}
        <div className="absolute inset-0 bg-[#000000]" />

        {/* Main blue atmospheric glow */}
        <div
          className="absolute left-1/2 top-[48%] h-[950px] w-[950px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(25,88,105,0.32) 0%, rgba(10,38,49,0.22) 38%, transparent 70%)",
            filter: "blur(15px)",
          }}
        />

        {/* =====================================================
            DIGITAL GLOBE
        ===================================================== */}

        <div className="absolute left-1/2 top-[55%] h-[920px] w-[920px] -translate-x-1/2 -translate-y-1/2">

          {/* Globe glow */}
          <div
            className="absolute inset-[-5%] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(41,139,153,0.20), rgba(8,35,45,0.12) 48%, transparent 72%)",
              filter: "blur(20px)",
            }}
          />

          {/* Main globe sphere */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 48% 40%, rgba(25,75,87,0.25), rgba(3,16,24,0.45) 50%, rgba(1,7,12,0.9) 76%)",
              border: "1px solid rgba(73,181,197,0.25)",
              boxShadow:
                "inset 0 0 120px rgba(34,137,151,0.16), 0 0 100px rgba(27,116,132,0.12)",
            }}
          />

          {/* Outer globe ring */}
          <div className="absolute inset-[7%] rounded-full border border-cyan-300/[0.17]" />

          {/* Horizontal latitude rings */}
          <div className="absolute left-[7%] right-[7%] top-[27%] h-[46%] rounded-2xl-[50%] border border-cyan-300/[0.13]" />

          <div className="absolute left-[2%] right-[2%] top-[39%] h-[22%] rounded-2xl-[50%] border border-cyan-300/[0.14]" />

          <div className="absolute left-[10%] right-[10%] top-[16%] h-[68%] rounded-2xl-[50%] border border-cyan-300/[0.07]" />

          {/* Vertical longitude rings */}
          <div className="absolute left-[27%] top-[1%] h-[98%] w-[46%] rounded-2xl-[50%] border border-cyan-300/[0.13]" />

          <div className="absolute left-[39%] top-[1%] h-[98%] w-[22%] rounded-2xl-[50%] border border-cyan-300/[0.12]" />

          <div className="absolute left-[17%] top-[5%] h-[90%] w-[66%] rounded-2xl-[50%] border border-cyan-300/[0.06]" />

          {/* Globe network */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 920 920"
            fill="none"
          >

            {/* Cyan network lines */}
            <g
              stroke="#55d6df"
              strokeWidth="1"
              opacity="0.28"
            >
              <path d="M70 380 L220 280 L380 360 L535 235 L730 345 L860 430" />

              <path d="M50 490 L205 410 L365 505 L540 390 L720 480 L875 455" />

              <path d="M95 615 L265 505 L430 625 L600 510 L810 620" />

              <path d="M180 235 L335 350 L490 215 L660 350 L800 270" />

              <path d="M130 450 L280 365 L440 475 L610 350 L790 450" />

              <path d="M210 700 L350 570 L510 685 L665 555 L785 670" />

              <path d="M300 150 L410 300 L570 170 L720 315" />
            </g>

            {/* Gold data routes */}
            <g
              stroke="#e7a83d"
              strokeWidth="1.5"
              opacity="0.42"
            >
              <path d="M70 410 Q260 175 470 405 T850 390" />

              <path d="M95 565 Q290 340 480 525 T830 510" />

              <path d="M180 650 Q370 455 560 590 T800 575" />

              <path d="M220 225 Q390 410 555 280 T790 400" />

              <path d="M125 350 Q330 520 500 380 T820 430" />
            </g>

            {/* Cyan nodes */}
            <g fill="#5de1e4">
              <circle cx="220" cy="280" r="3" />
              <circle cx="380" cy="360" r="4" />
              <circle cx="535" cy="235" r="3" />
              <circle cx="730" cy="345" r="3" />

              <circle cx="205" cy="410" r="3" />
              <circle cx="540" cy="390" r="4" />
              <circle cx="720" cy="480" r="3" />

              <circle cx="265" cy="505" r="3" />
              <circle cx="600" cy="510" r="4" />
            </g>

            {/* Gold nodes */}
            <g fill="#007AFF">
              <circle cx="300" cy="330" r="5" />
              <circle cx="430" cy="475" r="6" />
              <circle cx="555" cy="280" r="5" />
              <circle cx="665" cy="555" r="5" />
              <circle cx="510" cy="685" r="5" />
              <circle cx="350" cy="570" r="5" />
              <circle cx="790" cy="400" r="5" />
            </g>

          </svg>

          {/* Additional glowing points */}
          {[
            ["22%", "38%"],
            ["31%", "31%"],
            ["41%", "48%"],
            ["53%", "27%"],
            ["63%", "39%"],
            ["72%", "52%"],
            ["36%", "64%"],
            ["55%", "68%"],
            ["76%", "42%"],
          ].map(([left, top], index) => (
            <div
              key={index}
              className="absolute h-2.5 w-2.5 rounded-full bg-[#000000]"
              style={{
                left,
                top,
                boxShadow:
                  "0 0 8px 3px rgba(0,122,255,0.55), 0 0 25px 8px rgba(0,122,255,0.18)",
              }}
            />
          ))}

          {/* Blue light inside globe */}
          <div
            className="absolute left-[16%] top-[16%] h-[50%] w-[50%] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(63,182,194,0.13), transparent 65%)",
              filter: "blur(20px)",
            }}
          />

        </div>

        {/* Side horizontal network lines */}
        <div className="absolute left-0 top-[39%] h-px w-[22%] bg-cyan-300/[0.10]" />
        <div className="absolute right-0 top-[39%] h-px w-[22%] bg-cyan-300/[0.10]" />

        <div className="absolute left-0 top-[64%] h-px w-[19%] bg-cyan-300/[0.08]" />
        <div className="absolute right-0 top-[64%] h-px w-[19%] bg-cyan-300/[0.08]" />

      </div>


      {/* =========================================================
          CITY LABELS
      ========================================================= */}

      <div className="pointer-events-none absolute inset-0 z-[1] hidden text-[13px] tracking-wide text-zinc-300 lg:block">

        <span className="absolute left-[25%] top-[42%]">
          NEW YORK
        </span>

        <span className="absolute left-[47%] top-[29%]">
          LONDON
        </span>

        <span className="absolute right-[22%] top-[42%]">
          TOKYO
        </span>

        <span className="absolute right-[26%] top-[53%]">
          MUMBAI
        </span>

        <span className="absolute right-[19%] top-[63%]">
          SINGAPORE
        </span>

      </div>


      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}

      <section className="relative z-10 flex min-h-screen flex-col items-center px-5 pb-24 pt-7">

        {/* Logo */}
        <Link
          href="/"
          className="mb-4 flex items-center gap-4"
        >
          <div className="flex h-12 w-12 items-center justify-center border border-[#007AFF] bg-black/40 text-lg font-bold text-[#007AFF] shadow-[0_0_25px_rgba(10,132,255,0.18)]">
            ›_
          </div>

          <span className="text-3xl font-semibold tracking-wide">
            DATA<span className="text-[#007AFF]">VAULT</span>
          </span>
        </Link>


        {/* Heading */}
        <div className="mb-4 text-center">

          <h1 className="text-2xl font-medium tracking-wide text-zinc-200 sm:text-3xl">
            REQUEST ACCESS
          </h1>

          <p className="mt-2 text-sm tracking-[0.08em] text-zinc-400">
            JOIN THE DATA VAULT INTELLIGENCE NETWORK
          </p>

        </div>


        {/* =====================================================
            REGISTER CARD
        ===================================================== */}

        <div className="w-full max-w-[700px] rounded-2xl border border-white/[0.10] bg-[#1C1C1E]/90 p-6 shadow-2xl shadow-black/70 backdrop-blur-xl sm:p-8">

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setErrorMessage("");
              setSuccessMessage("");

              const formData = new FormData(e.currentTarget);
              const fullName = String(formData.get("fullName") ?? "").trim();
              const email = String(formData.get("email") ?? "").trim().toLowerCase();
              const phoneNumber = String(formData.get("phoneNumber") ?? "").trim();
              const company = String(formData.get("company") ?? "").trim();
              const jobTitle = String(formData.get("jobTitle") ?? "").trim();
              const password = String(formData.get("password") ?? "");
              const confirmPassword = String(formData.get("confirmPassword") ?? "");
              const termsAccepted = formData.get("terms") === "on";

              if (!fullName || !email || !country || !phoneNumber || !company || !jobTitle || !password || !confirmPassword) {
                setErrorMessage("Please complete all required fields.");
                return;
              }
              if (!phoneCode && country !== "other") {
                setErrorMessage("Please select a valid country.");
                return;
              }
              if (password.length < 8) {
                setErrorMessage("Password must be at least 8 characters long.");
                return;
              }
              if (password !== confirmPassword) {
                setErrorMessage("Passwords do not match.");
                return;
              }
              if (!termsAccepted) {
                setErrorMessage("Please agree to the Terms of Use and Privacy Policy.");
                return;
              }

              setLoading(true);
              try {
                const supabase = createClient();
                const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/login?confirmed=true`,
    data: {
      full_name: fullName,
      country,
      phone_code: phoneCode,
      phone_number: phoneNumber,
      company,
      job_title: jobTitle,
    },
  },
});

                if (error) {
                  setErrorMessage(error.message);
                  return;
                }

                if (data.user) {
                  setSuccessMessage(
                    data.session
                      ? "Account created successfully. You can now access the Data Vault."
                      : "Account created successfully. Please check your email to confirm your account."
                  );
              
                  setCountry("");
                  setPhoneCode("");
                }
              } catch (error) {
                setErrorMessage(
                  error instanceof Error ? error.message : "Something went wrong. Please try again."
                );
              } finally {
                setLoading(false);
              }
            }}
          >

            {/* Two column row */}
            <div className="grid gap-4 sm:grid-cols-2">

              {/* Full Name */}
              <div>
                <label className="mb-2 block text-xs font-medium tracking-[0.12em] text-zinc-400">
                  FULL NAME
                </label>

                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-white/[0.10] bg-[#1C1C1E]/90 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#007AFF]"
                />
              </div>


              {/* Email */}
              <div>
                <label className="mb-2 block text-xs font-medium tracking-[0.12em] text-zinc-400">
                  WORK EMAIL
                </label>

                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-white/[0.10] bg-[#1C1C1E]/90 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#007AFF]"
                />
              </div>


              {/* Country */}
<div>
  <label className="mb-2 block text-xs font-medium tracking-[0.12em] text-zinc-400">
    COUNTRY
  </label>

  <select
    name="country"
    required
    value={country}
    onChange={(e) => {
      const selectedCountry = e.target.value;
      setCountry(selectedCountry);

      const countryCodes: Record<string, string> = {
        india: "+91",
        usa: "+1",
        uk: "+44",
        canada: "+1",
        australia: "+61",
        singapore: "+65",
        uae: "+971",
        germany: "+49",
        france: "+33",
        japan: "+81",
        china: "+86",
        other: "",
      };

      setPhoneCode(countryCodes[selectedCountry] || "");
    }}
    className="w-full rounded-xl border border-white/[0.10] bg-[#1C1C1E]/90 px-4 py-3 text-sm text-zinc-400 outline-none transition focus:border-[#007AFF]"
  >
    <option value="" disabled>
      Select your country
    </option>

    <option value="india">India</option>
    <option value="usa">United States</option>
    <option value="uk">United Kingdom</option>
    <option value="canada">Canada</option>
    <option value="australia">Australia</option>
    <option value="singapore">Singapore</option>
    <option value="uae">United Arab Emirates</option>
    <option value="germany">Germany</option>
    <option value="france">France</option>
    <option value="japan">Japan</option>
    <option value="china">China</option>
    <option value="other">Other</option>
  </select>
</div>

            {/* Phone Number */}
<div>
  <label className="mb-2 block text-xs font-medium tracking-[0.12em] text-zinc-400">
    PHONE NUMBER
  </label>

  <div className="flex gap-2">
    <div className="flex w-[90px] shrink-0 items-center justify-center rounded-xl border border-white/[0.10] bg-[#1C1C1E]/90 px-3 py-3 text-sm font-medium text-[#007AFF]">
      {phoneCode || "+--"}
    </div>

    <input
      type="tel"
      name="phoneNumber"
      required
      placeholder="Enter phone number"
      className="min-w-0 flex-1 rounded-xl border border-white/[0.10] bg-[#1C1C1E]/90 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#007AFF]"
    />
  </div>
</div>
{/* Company / Organization */}
<div>
  <label className="mb-2 block text-xs font-medium tracking-[0.12em] text-zinc-400">
    COMPANY NAME / ORGANIZATION
  </label>

  <input
    type="text"
    name="company"
    required
    placeholder="Enter company or organization name"
    className="w-full rounded-xl border border-white/[0.10] bg-[#1C1C1E]/90 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#007AFF]"
  />
</div>
              {/* Job Title */}
              <div>
                <label className="mb-2 block text-xs font-medium tracking-[0.12em] text-zinc-400">
                  JOB TITLE
                </label>

                <input
                  type="text"
                  name="jobTitle"
                  required
                  placeholder="Your role"
                  className="w-full rounded-xl border border-white/[0.10] bg-[#1C1C1E]/90 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#007AFF]"
                />
              </div>


              {/* Password */}
              <div>
                <label className="mb-2 block text-xs font-medium tracking-[0.12em] text-zinc-400">
                  PASSWORD
                </label>

                <div className="relative">

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="Create password"
                    className="w-full rounded-xl border border-white/[0.10] bg-[#1C1C1E]/90 px-4 py-3 pr-14 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#007AFF]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-[#007AFF]"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>

                </div>
              </div>


              {/* Confirm Password */}
              <div>
                <label className="mb-2 block text-xs font-medium tracking-[0.12em] text-zinc-400">
                  CONFIRM PASSWORD
                </label>

                <div className="relative">

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    required
                    placeholder="Confirm password"
                    className="w-full rounded-xl border border-white/[0.10] bg-[#1C1C1E]/90 px-4 py-3 pr-14 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-[#007AFF]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-[#007AFF]"
                  >
                    {showConfirmPassword ? "HIDE" : "SHOW"}
                  </button>

                </div>
              </div>

            </div>


            {/* Terms */}
            <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-5 text-zinc-400">

              <input
                type="checkbox"
                name="terms"
                required
                className="mt-0.5 h-4 w-4 accent-[#007AFF]"
              />

              <span>
                I agree to the{" "}

                <Link
                  href="/terms"
                  className="text-[#0A84FF] hover:text-[#007AFF]"
                >
                  Terms of Use
                </Link>{" "}

                and{" "}

                <Link
                  href="/privacy"
                  className="text-[#0A84FF] hover:text-[#007AFF]"
                >
                  Privacy Policy
                </Link>
                .
              </span>

            </label>


            {/* Form Messages */}
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

            {/* Request Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-full border border-[#007AFF] bg-gradient-to-b from-[#0A84FF] to-[#0059B3] py-3.5 text-sm font-semibold tracking-[0.1em] text-[#FFFFFF] shadow-[0_0_35px_rgba(10,132,255,0.25)] transition hover:brightness-110"
            >
              {loading ? "CREATING ACCOUNT..." : "REQUEST ACCOUNT ACCESS"}
            </button>


            {/* Login Link */}
            <p className="mt-5 text-center text-sm text-zinc-400">

              Already have an account?{" "}

              <Link
                href="/login"
                className="text-[#0A84FF] transition hover:text-[#007AFF]"
              >
                Login to Portal
              </Link>

            </p>

          </form>

        </div>

      </section>


      {/* =========================================================
          BOTTOM LINKS
      ========================================================= */}

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-5 text-xs text-zinc-500">

        <Link
          href="/terms"
          className="transition hover:text-zinc-300"
        >
          Terms of Use
        </Link>

        <Link
          href="/privacy"
          className="transition hover:text-zinc-300"
        >
          Privacy Policy
        </Link>

      </div>

    </main>
  );
}