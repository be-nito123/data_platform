import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/access";
import {
  NEWS_MONTH_NAMES,
  findNewsEntry,
  getNewsArchive,
  newsTrendWindow,
} from "@/lib/supabase/data/news";
import NewsLocked from "@/components/news/NewsLocked";
import { NewsWarnings } from "@/components/news/NewsNotices";
import { NewsMetricCard, NewsMetricsTable } from "@/components/news/NewsMetrics";
import MetricTrendChart, {
  type TrendSeries,
} from "@/components/news/MetricTrendChart";

type PageParams = Promise<{ year: string; month: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { year, month } = await params;
  const monthNumber = Number(month);

  const label =
    Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12
      ? `${NEWS_MONTH_NAMES[monthNumber - 1]} ${year}`
      : year;

  return { title: `${label} — Data News` };
}

export default async function NewsMonthPage({ params }: { params: PageParams }) {
  const { year: rawYear, month: rawMonth } = await params;

  const year = Number(rawYear);
  const month = Number(rawMonth);

  if (!Number.isInteger(year) || year < 1900 || year > 2999) notFound();
  if (!Number.isInteger(month) || month < 1 || month > 12) notFound();

  const viewer = await getViewer();

  if (!viewer.isAdmin) {
    return <NewsLocked viewer={viewer} />;
  }

  const archive = await getNewsArchive();
  const entry = findNewsEntry(archive, year, month);

  if (!entry) notFound();

  const position = archive.entries.findIndex(
    (item) => item.year === year && item.month === month
  );
  const previous = position > 0 ? archive.entries[position - 1] : undefined;
  const next =
    position >= 0 && position < archive.entries.length - 1
      ? archive.entries[position + 1]
      : undefined;

  const previousMonthName = NEWS_MONTH_NAMES[(month + 10) % 12];
  const previousMonthYear = month === 1 ? year - 1 : year;

  /*
    One point per month, restricted to the figures this month reports so the
    selector cannot offer a line with a single dot on it.
  */
  const series: TrendSeries[] = entry.metrics
    .map((metric) => {
      const points: { period: string; value: number }[] = [];

      for (const point of newsTrendWindow(archive, year, month)) {
        const value = point.metrics.find((item) => item.key === metric.key)?.value;

        if (value === null || value === undefined) continue;

        points.push({
          period: `${point.monthShort} ${String(point.year).slice(2)}`,
          value,
        });
      }

      return { key: metric.key, label: metric.label, points };
    })
    .filter((item) => item.points.length > 1);

  return (
    <>
      <section className="news-hero">
        <div className="news-container news-hero-inner">
          <nav aria-label="Breadcrumb">
            <p className="news-eyebrow is-muted" style={{ margin: 0 }}>
              <Link href="/news" style={{ color: "inherit" }}>
                News
              </Link>{" "}
              /{" "}
              <Link href={`/news/${year}`} style={{ color: "inherit" }}>
                {year}
              </Link>{" "}
              / {entry.monthShort}
            </p>
          </nav>

          <h1 className="news-title">
            {entry.monthName} {entry.year}
          </h1>

          <p className="news-lede">
            Month-on-month against {previousMonthName} {previousMonthYear}, and
            year-on-year against {entry.monthName} {year - 1}.
          </p>
        </div>
      </section>

      <div className="news-container" style={{ paddingTop: 32, paddingBottom: 72 }}>
        <NewsWarnings warnings={archive.warnings} />

        <div style={{ marginTop: archive.warnings.length ? 24 : 0 }}>
          <article className="news-article">
            <p className="news-eyebrow is-muted" style={{ margin: 0 }}>
              Commentary
            </p>

            <h2 className="news-headline">
              {entry.headline ?? `No headline recorded for ${entry.monthName} ${entry.year}.`}
            </h2>

            {entry.summary ? (
              <p className="news-summary">{entry.summary}</p>
            ) : (
              <p className="news-label" style={{ margin: 0 }}>
                No commentary for this month.
              </p>
            )}

            {entry.source && (
              <p className="news-source" style={{ margin: 0 }}>
                Source: <SourceLink source={entry.source} />
              </p>
            )}
          </article>

          <section className="news-section">
            <div className="news-section-head">
              <h2 className="news-section-title">Figures</h2>
              <span className="news-section-note">
                {entry.metrics.length === 1
                  ? "1 metric"
                  : `${entry.metrics.length} metrics`}
              </span>
            </div>

            {entry.metrics.length === 0 ? (
              <p className="news-label">
                No figures were found in the {entry.monthShort} tab.
              </p>
            ) : (
              <div className="news-metrics">
                {entry.metrics.map((metric) => (
                  <NewsMetricCard key={metric.key} metric={metric} />
                ))}
              </div>
            )}
          </section>

          <section className="news-section">
            <div className="news-section-head">
              <h2 className="news-section-title">Trend</h2>
              <span className="news-section-note">Last 12 months</span>
            </div>

            <MetricTrendChart series={series} />
          </section>

          <section className="news-section">
            <div className="news-section-head">
              <h2 className="news-section-title">Breakdown</h2>
              <span className="news-section-note">MoM vs YoY</span>
            </div>

            <NewsMetricsTable metrics={entry.metrics} />
          </section>

          <nav className="news-pager" aria-label="Other months">
            {previous ? (
              <Link
                href={`/news/${previous.year}/${previous.monthSlug}`}
                className="news-pager-link"
              >
                <span className="news-eyebrow is-muted">Previous</span>
                <span>
                  {previous.monthShort} {previous.year}
                </span>
              </Link>
            ) : (
              <span />
            )}

            <Link href={`/news/${year}`} className="news-pager-link">
              <span className="news-eyebrow is-muted">All of</span>
              <span>{year}</span>
            </Link>

            {next ? (
              <Link
                href={`/news/${next.year}/${next.monthSlug}`}
                className="news-pager-link"
              >
                <span className="news-eyebrow is-muted">Next</span>
                <span>
                  {next.monthShort} {next.year}
                </span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
      </div>
    </>
  );
}

/* ========================================================= */
/* SMALL PARTS                                               */
/* ========================================================= */

function SourceLink({ source }: { source: string }) {
  if (!/^https?:\/\//i.test(source)) {
    return <span>{source}</span>;
  }

  return (
    <a href={source} target="_blank" rel="noreferrer noopener">
      {source}
    </a>
  );
}
