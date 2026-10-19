import type { Metadata } from "next";
import Link from "next/link";
import { getViewer } from "@/lib/access";
import { getNewsArchive } from "@/lib/supabase/data/news";
import NewsLocked from "@/components/news/NewsLocked";
import { NewsSheetSetup, NewsWarnings } from "@/components/news/NewsNotices";

export const metadata: Metadata = {
  title: "Monthly Data News",
  description:
    "Month-on-month and year-on-year movement across every figure DataVault tracks, month by month.",
};

export default async function NewsIndexPage() {
  /*
    The gate runs before the sheet is read. Nothing from the spreadsheet exists
    on this render for a viewer who is not allowed to see it.
  */
  const viewer = await getViewer();

  if (!viewer.isAdmin) {
    return <NewsLocked viewer={viewer} />;
  }

  const archive = await getNewsArchive();
  const latest = archive.entries.at(-1) ?? null;

  return (
    <>
      <section className="news-hero">
        <div className="news-container news-hero-inner">
          <p className="news-eyebrow">Exclusive</p>
          <h1 className="news-title">Monthly Data News</h1>
          <p className="news-lede">
            Each month, what moved and by how much — the month-on-month and
            year-on-year change for every figure in the dataset, plus the
            commentary behind it. This room is limited to administrators.
          </p>
        </div>
      </section>

      <div className="news-container" style={{ paddingTop: 32, paddingBottom: 72 }}>
        <NewsWarnings warnings={archive.warnings} />

        {archive.entries.length === 0 ? (
          <div style={{ marginTop: archive.warnings.length ? 24 : 0 }}>
            <NewsSheetSetup />
          </div>
        ) : (
          <>
            {latest && (
              <section className="news-section">
                <div className="news-section-head">
                  <h2 className="news-section-title">Latest month</h2>
                  <span className="news-section-note">
                    {latest.monthName} {latest.year}
                  </span>
                </div>

                <article className="news-panel">
                  <p className="news-label" style={{ margin: 0 }}>
                    {latest.monthName} {latest.year}
                  </p>

                  <h3
                    className="news-section-title"
                    style={{ marginTop: 8, fontSize: 17, lineHeight: 1.4 }}
                  >
                    {latest.headline ?? "No headline recorded for this month."}
                  </h3>

                  {latest.summary && (
                    <p className="news-lede" style={{ marginTop: 10 }}>
                      {latest.summary}
                    </p>
                  )}

                  <p style={{ margin: "18px 0 0" }}>
                    <Link
                      href={`/news/${latest.year}/${latest.monthSlug}`}
                      className="site-btn is-primary"
                    >
                      Open {latest.monthName} {latest.year}
                    </Link>
                  </p>
                </article>
              </section>
            )}

            <section className="news-section">
              <div className="news-section-head">
                <h2 className="news-section-title">Years</h2>
                <span className="news-section-note">
                  {archive.years.length}{" "}
                  {archive.years.length === 1 ? "year" : "years"} on record
                </span>
              </div>

              <div className="news-grid">
                {archive.years.map((year) => {
                  const months = archive.entries.filter(
                    (entry) => entry.year === year
                  ).length;

                  return (
                    <Link key={year} href={`/news/${year}`} className="news-card">
                      <div className="news-card-head">
                        <span className="news-card-title">{year}</span>
                        <span className="news-section-note" aria-hidden="true">
                          →
                        </span>
                      </div>

                      <p className="news-card-summary">
                        {months === 1
                          ? "1 month of data"
                          : `${months} months of data`}
                      </p>

                      <span className="news-card-count">Open year</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
