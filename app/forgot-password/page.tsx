"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      cleanEmail,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage(
        "Password reset email sent. Please check your Gmail inbox."
      );
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
            <span className="auth-eyebrow">Account Recovery</span>
            <h1 className="auth-title">Reset your password</h1>
            <p className="auth-sub">
              Enter your registered email address and we will send you a secure password reset link.
            </p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit}>
            {successMessage && <div className="auth-msg is-success">{successMessage}</div>}
            {errorMessage && <div className="auth-msg is-error">{errorMessage}</div>}

            <div className="auth-field">
              <label className="auth-label" htmlFor="email">
                Registered Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="auth-input"
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="auth-switch">
            <Link href="/login">← Return to login</Link>
          </p>
        </div>

        <p className="auth-note">Secure authentication powered by Supabase</p>
      </section>
    </main>
  );
}
