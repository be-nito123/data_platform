import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/access";
import { canReadNews } from "@/lib/news-access";
import {
  NEWS_MONTH_NAMES,
  NEWS_MONTH_SHORT,
  getNewsArchive,
  newsMonthsForYear,
} from "@/lib/supabase/data/news";
import NewsLocked from "@/components/news/NewsLocked";
import { NewsWarnings } from "@/components/news/NewsNotices";
import NewsHeatmap from "@/components/news/NewsHeatmap";
import NewsMonthCard from "@/components/news/NewsMonthCard";
import NewsTradingPlan from "@/components/news/NewsTradingPlan";
import { formatNewsCount } from "@/lib/news/format";

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

  if (!(await canReadNews(viewer))) {
    return <NewsLocked viewer={viewer} />;
  }

  const archive = await getNewsArchive();

  if (!archive.years.includes(year)) notFound();

  const months = newsMonthsForYear(archive, year);
  const byMonth = new Map(months.map((entry) => [entry.month, entry]));

  const totalEvents = months.reduce(
    (total, entry) => total + entry.counts.events,
    0
  );

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
            {months.length === 12
              ? "All twelve months recorded"
              : `${formatNewsCount(months.length)} of 12 months recorded`}
            , holding {formatNewsCount(totalEvents)} events. Month-on-month
            change is the sheet&apos;s own previous reading, so it needs no
            earlier tab; year-on-year appears once a tab for the same month of{" "}
            {year - 1} exists.
          </p>
        </div>
      </section>

      <div
        className="news-container"
        style={{ paddingTop: 32, paddingBottom: 72 }}
      >
        <NewsWarnings warnings={archive.warnings} />

        <div style={{ marginTop: archive.warnings.length ? 24 : 0 }}>
          <section>
            <div className="news-section-head">
              <h2 className="news-section-title">Movement by month</h2>
              <span className="news-section-note">
                Against the prior reading
              </span>
            </div>

            <NewsHeatmap year={year} months={newsMonthsForYear(archive, year)} />
          </section>

          <section className="news-section">
            <div className="news-section-head">
              <h2 className="news-section-title">The read</h2>
              <span className="news-section-note">
                Surprise against forecast
              </span>
            </div>

            <NewsTradingPlan months={months} />
          </section>

          <section className="news-section">
            <div className="news-section-head">
              <h2 className="news-section-title">Months</h2>
              <span className="news-section-note">
                {formatNewsCount(months.length)} of 12
              </span>
            </div>

            <div className="news-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                <NewsMonthCard
                  key={month}
                  year={year}
                  monthName={NEWS_MONTH_NAMES[month - 1]}
                  monthShort={NEWS_MONTH_SHORT[month - 1]}
                  entry={byMonth.get(month)}
                />
              ))}
            </div>
          </section>

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
        </div>
      </div>
    </>
  );
}
