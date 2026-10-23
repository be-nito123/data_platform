"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [country, setCountry] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  return (
    <main className="auth-page">
      <section className="auth-shell is-wide">
        <Link href="/" className="auth-brand">
          <span className="auth-brand-mark">›_</span>
          <span className="auth-brand-name">
            DATA<span>VAULT</span>
          </span>
        </Link>

        <div className="auth-card is-wide">
          <header className="auth-head">
            <span className="auth-eyebrow">Request Access</span>
            <h1 className="auth-title">Create your DataVault account</h1>
            <p className="auth-sub">
              Tell us a little about yourself and we&apos;ll set up your access to the terminal.
            </p>
          </header>

          <form
            className="auth-form"
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
                // Account creation goes through a server Route Handler, so the
                // service-role key never reaches the browser and — crucially —
                // so no email gets sent through the project's unconfigured SMTP.
                // Accounts are created email_confirmed; the user is signed in
                // straight away below.
                const registerResponse = await fetch("/api/auth/register", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    email,
                    password,
                    full_name: fullName,
                    country,
                    phone_code: phoneCode,
                    phone_number: phoneNumber,
                    company,
                    job_title: jobTitle,
                  }),
                });

                const registerResult = await registerResponse.json().catch(() => ({}));

                if (!registerResponse.ok || !registerResult?.ok) {
                  setErrorMessage(
                    typeof registerResult?.error === "string"
                      ? registerResult.error
                      : "Something went wrong. Please try again."
                  );
                  return;
                }

                setCountry("");
                setPhoneCode("");

                const supabase = createClient();
                const { error: loginError } = await supabase.auth.signInWithPassword({
                  email,
                  password,
                });

                if (loginError) {
                  setSuccessMessage(
                    "Account created successfully. You can now sign in."
                  );
                  return;
                }

                setSuccessMessage("Account created successfully. Opening DataVault...");
                setTimeout(() => {
                  router.push("/");
                  router.refresh();
                }, 500);
              } catch (error) {
                setErrorMessage(
                  error instanceof Error ? error.message : "Something went wrong. Please try again."
                );
              } finally {
                setLoading(false);
              }
            }}
          >
            <div className="auth-grid">
              <div className="auth-field">
                <label className="auth-label" htmlFor="fullName">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  required
                  placeholder="Jane Trader"
                  autoComplete="name"
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="email">
                  Work Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  placeholder="name@company.com"
                  autoComplete="email"
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="country">
                  Country
                </label>
                <select
                  id="country"
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
                  className="auth-input"
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

              <div className="auth-field">
                <label className="auth-label" htmlFor="phoneNumber">
                  Phone Number
                </label>
                <div className="auth-phone">
                  <span className="auth-phone-code">{phoneCode || "+--"}</span>
                  <input
                    id="phoneNumber"
                    type="tel"
                    name="phoneNumber"
                    required
                    placeholder="Enter phone number"
                    autoComplete="tel"
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="company">
                  Company / Organization
                </label>
                <input
                  id="company"
                  type="text"
                  name="company"
                  required
                  placeholder="Company or desk name"
                  autoComplete="organization"
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="jobTitle">
                  Job Title
                </label>
                <input
                  id="jobTitle"
                  type="text"
                  name="jobTitle"
                  required
                  placeholder="Your role"
                  autoComplete="organization-title"
                  className="auth-input"
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="password">
                  Password
                </label>
                <div className="auth-input-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className="auth-input"
                  />
                  <button
                    type="button"
                    className="auth-reveal"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="auth-input-wrap">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className="auth-input"
                  />
                  <button
                    type="button"
                    className="auth-reveal"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            <label className="auth-check align-start">
              <input type="checkbox" name="terms" required />
              <span>
                I agree to the <Link href="/terms">Terms of Use</Link> and{" "}
                <Link href="/privacy">Privacy Policy</Link>.
              </span>
            </label>

            {errorMessage && <div className="auth-msg is-error">{errorMessage}</div>}
            {successMessage && <div className="auth-msg is-success">{successMessage}</div>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>

        <div className="auth-foot">
          <span>© 2026 DataVault</span>
          <div className="auth-foot-links">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
