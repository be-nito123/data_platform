import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="site-doc">
      <SiteNav />

      <main className="site-doc-main">
        <section className="site-error">
          <div className="site-error-card">
            <span className="site-error-code">404 — Not found</span>
            <h1 className="site-error-title">This page doesn&apos;t exist</h1>
            <p className="site-error-desc">
              The page you were looking for has moved, been renamed, or never existed. Head back to
              the dataset library to find the market you need.
            </p>
            <div className="site-error-actions">
              <Link href="/datasets" className="site-btn is-primary">
                Browse datasets
              </Link>
              <Link href="/" className="site-btn is-ghost">
                Back to home
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
