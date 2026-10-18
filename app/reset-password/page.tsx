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
        window.history.replaceState({}, document.title, "/reset-password");

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
            <span className="auth-eyebrow">Secure Recovery</span>
            <h1 className="auth-title">Set a new password</h1>
            <p className="auth-sub">
              Choose a new password for your DataVault account. It must be at least 8 characters long.
            </p>
          </header>

          {ready && (
            <form className="auth-form" onSubmit={handleReset}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="password">
                  New Password
                </label>
                <div className="auth-input-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Enter new password"
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
                  Confirm New Password
                </label>
                <div className="auth-input-wrap">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Re-enter new password"
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

              {errorMessage && <div className="auth-msg is-error">{errorMessage}</div>}
              {message && <div className="auth-msg is-success">{message}</div>}

              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? "Updating password…" : "Update password"}
              </button>
            </form>
          )}

          {!ready && !errorMessage && (
            <p className="auth-loading">Verifying secure reset link…</p>
          )}

          {errorMessage && !ready && (
            <div className="auth-form">
              <div className="auth-msg is-error">{errorMessage}</div>
              <Link href="/login" className="auth-submit">
                Return to login
              </Link>
            </div>
          )}
        </div>

        <p className="auth-note">Secure authentication powered by Supabase</p>
      </section>
    </main>
  );
}
