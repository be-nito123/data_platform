"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Last-resort boundary: only rendered when the root layout itself throws,
 * so it is responsible for its own <html>/<body>.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Fatal application error:", error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <main
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: "72px 24px",
          }}
        >
          <div style={{ maxWidth: 520, textAlign: "center" }}>
            <p
              style={{
                margin: 0,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--color-accent)",
              }}
            >
              DataVault unavailable
            </p>

            <h1
              style={{
                margin: "12px 0 0",
                fontSize: 30,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--color-text)",
              }}
            >
              The application failed to start
            </h1>

            <p
              style={{
                margin: "14px 0 0",
                fontSize: 13.5,
                lineHeight: 1.7,
                color: "var(--color-text-dim)",
              }}
            >
              This is an unexpected problem on our side. Reloading the page usually resolves it.
            </p>

            <button
              type="button"
              onClick={() => retry()}
              style={{
                marginTop: 24,
                padding: "11px 22px",
                border: "1px solid var(--color-accent)",
                borderRadius: 999,
                background: "var(--color-accent)",
                color: "#fff",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
