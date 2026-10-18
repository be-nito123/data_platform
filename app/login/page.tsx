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

  async function handleForgotPassword() {
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
      setSuccessMessage("Password reset email sent. Please check your Gmail inbox.");
    }

    setLoading(false);
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <Link href="/" className="auth-brand">
          <span className="auth-brand-mark">›_</span>
          <span className="auth-brand-name">
            DATA<span>VAULT</span>
          </span>
        </Link>

        <div className="auth-card">
          <header className="auth-head">
            <span className="auth-eyebrow">Secure Access</span>
            <h1 className="auth-title">Sign in to your terminal</h1>
            <p className="auth-sub">
              Institutional-grade market data for commodities, rates, FX, equities and crypto.
            </p>
          </header>

          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                Work Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="name@company.com"
                autoComplete="email"
                className="auth-input"
              />
            </div>

            <div className="auth-field">
              <div className="auth-field-top">
                <label className="auth-label" htmlFor="password">
                  Password
                </label>
                <button
                  type="button"
                  className="auth-forgot"
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  Forgot Password?
                </button>
              </div>

              <div className="auth-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
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

            <label className="auth-check">
              <input type="checkbox" name="remember" />
              <span>Remember me on this device</span>
            </label>

            {errorMessage && <div className="auth-msg is-error">{errorMessage}</div>}
            {successMessage && <div className="auth-msg is-success">{successMessage}</div>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Authenticating…" : "Sign in"}
            </button>
          </form>

          <p className="auth-switch">
            New to DataVault? <Link href="/register">Request an account</Link>
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
