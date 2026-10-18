"use client";

import Link from "next/link";
import { useEffect } from "react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Report the full error to the server logs; never render it to the user in production.
    console.error("Unhandled application error:", error);
  }, [error]);

  const showDetail = process.env.NODE_ENV !== "production";

  return (
    <div className="site-doc">
      <SiteNav />

      <main className="site-doc-main">
        <section className="site-error">
          <div className="site-error-card">
            <span className="site-error-code">Something went wrong</span>
            <h1 className="site-error-title">We couldn&apos;t load this page</h1>
            <p className="site-error-desc">
              A temporary problem stopped this page from loading. Try again — if it keeps failing,
              the data source may be briefly unavailable.
            </p>

            <div className="site-error-actions">
              <button type="button" onClick={() => retry()} className="site-btn is-primary">
                Try again
              </button>
              <Link href="/datasets" className="site-btn is-ghost">
                Browse datasets
              </Link>
            </div>

            {showDetail && error.message && (
              <pre className="site-error-detail">{error.message}</pre>
            )}
            {error.digest && (
              <p className="site-error-desc" style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}>
                Reference: {error.digest}
              </p>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
