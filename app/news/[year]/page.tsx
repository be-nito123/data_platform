import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/access";
import { findNewsEntry, getNewsArchive } from "@/lib/supabase/data/news";
import NewsLocked from "@/components/news/NewsLocked";
import NewsMonthCard from "@/components/news/NewsMonthCard";
import NewsHeatmap from "@/components/news/NewsHeatmap";
import { NewsWarnings } from "@/components/news/NewsNotices";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;

  return { title: `${year} — Data News` };
}

export default async function NewsYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: rawYear } = await params;
  const year = Number(rawYear);

  if (!Number.isInteger(year) || year < 1900 || year > 2999) notFound();

  const viewer = await getViewer();

  if (!viewer.isAdmin) {
    return <NewsLocked viewer={viewer} />;
  }

  const archive = await getNewsArchive();

  if (!archive.years.includes(year)) notFound();

  const entries = archive.entries.filter((entry) => entry.year === year);

  const yearIndex = archive.years.indexOf(year);
  // `years` is newest first, so the following index is the previous year.
  const newer = archive.years[yearIndex - 1];
  const older = archive.years[yearIndex + 1];

  return (
    <>
      <section className="news-hero">
        <div className="news-container news-hero-inner">
          <nav className="news-eyebrow is-muted" aria-label="Breadcrumb">
            <p style={{ margin: 0 }}>
              <Link href="/news" style={{ color: "inherit" }}>
                News
              </Link>{" "}
              / {year}
            </p>
          </nav>

          <h1 className="news-title">{year}</h1>

          <p className="news-lede">
            {entries.length === 12
              ? "All twelve months recorded."
              : `${entries.length} of 12 months recorded.`}{" "}
            Month-on-month change is read from the previous month&apos;s tab, so
            January is measured against December of {year - 1}.
          </p>
        </div>
      </section>

      <div className="news-container" style={{ paddingTop: 32, paddingBottom: 72 }}>
        <NewsWarnings warnings={archive.warnings} />

        <div style={{ marginTop: archive.warnings.length ? 24 : 0 }}>
          <section>
            <div className="news-section-head">
              <h2 className="news-section-title">Movement by month</h2>
              <span className="news-section-note">MoM %</span>
            </div>

            <NewsHeatmap year={year} entries={archive.entries} metrics={archive.metrics} />
          </section>

          <section className="news-section">
            <div className="news-section-head">
              <h2 className="news-section-title">Months</h2>
              <span className="news-section-note">
                {entries.length} / 12
              </span>
            </div>

            <div className="news-grid">
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <NewsMonthCard
                  key={month}
                  year={year}
                  month={month}
                  entry={findNewsEntry(archive, year, month) ?? null}
                />
              ))}
            </div>
          </section>

          {(older !== undefined || newer !== undefined) && (
            <nav className="news-pager" aria-label="Other years">
              {older !== undefined ? (
                <Link href={`/news/${older}`} className="news-pager-link">
                  <span className="news-eyebrow is-muted">Previous</span>
                  <span>{older}</span>
                </Link>
              ) : (
                <span />
              )}

              {newer !== undefined && (
                <Link href={`/news/${newer}`} className="news-pager-link">
                  <span className="news-eyebrow is-muted">Next</span>
                  <span>{newer}</span>
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </>
  );
}
