"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/*
  The access-code box on the locked news screen.

  It only exists when the server has NEWS_ACCESS_CODE configured — the flag
  arrives as a prop, so an unconfigured deployment shows nothing to type into.
  On success the server has already set the signed cookie, so a refresh is
  enough: the news page re-runs its gate and reads the sheet.
*/
export default function NewsAccessForm({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!enabled) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/news/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(body?.error ?? "That code is not right.");
        return;
      }

      setCode("");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="news-access-form" onSubmit={submit}>
      <label className="news-label" htmlFor="news-access-code">
        Or unlock with an access code
      </label>

      <div className="news-access-row">
        <input
          id="news-access-code"
          className="news-access-input"
          type="password"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Access code"
          autoComplete="off"
          disabled={busy}
        />

        <button
          className="site-btn is-primary"
          type="submit"
          disabled={busy || code.length === 0}
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </div>

      {error ? <p className="news-access-error">{error}</p> : null}
    </form>
  );
}
