import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/access";
import { canReadNews } from "@/lib/news-access";
import {
  NEWS_MONTH_NAMES,
  findNewsMonth,
  getNewsArchive,
  newsTrendWindow,
  readableEventName,
  type ValueUnit,
} from "@/lib/supabase/data/news";
import NewsLocked from "@/components/news/NewsLocked";
import { NewsWarnings } from "@/components/news/NewsNotices";
import { NewsMonthSummary, NewsEventsTable } from "@/components/news/NewsEvents";
import MetricTrendChart, {
  type TrendSeries,
} from "@/components/news/MetricTrendChart";
import { baseAmount } from "@/lib/supabase/data/news-sheet";

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

  if (!(await canReadNews(viewer))) {
    return <NewsLocked viewer={viewer} />;
  }

  const archive = await getNewsArchive();
  const entry = findNewsMonth(archive, year, month);

  if (!entry) notFound();

  const position = archive.months.findIndex(
    (item) => item.year === year && item.month === month
  );
  const previous = position > 0 ? archive.months[position - 1] : undefined;
  const next =
    position >= 0 && position < archive.months.length - 1
      ? archive.months[position + 1]
      : undefined;

  const earlierYear = year - 1;

  /*
    The trend line can only be drawn for events that are reported repeatedly
    and that keep the same unit. An event's "previous" reading (MoM) cannot be
    plotted on a trend of levels, so the chart follows the event's actual
    reading over time. The list is restricted to those that appear at least
    twice in the last 12 months.
  */
  const series: TrendSeries[] = [];
  const seen = new Map<string, { label: string; unit: ValueUnit | null }>();

  for (const point of newsTrendWindow(archive, year, month)) {
    for (const event of point.events) {
      if (!event.actual) continue;

      let record = seen.get(event.matchKey);
      if (!record) {
        record = { label: readableEventName(event.name), unit: event.actual.unit };
        seen.set(event.matchKey, record);
      } else if (record.unit !== null && record.unit !== event.actual.unit) {
        // A single event cannot jump units; skip it rather than throwing.
        record.unit = null;
      }
    }
  }

  for (const [matchKey, meta] of seen) {
    if (meta.unit === null) continue;

    const points: { period: string; value: number }[] = [];

    for (const point of newsTrendWindow(archive, year, month)) {
      const event = point.events.find((item) => item.matchKey === matchKey);
      const actual = event?.actual;

      if (!actual) continue;

      points.push({
        period: `${point.monthShort} ${String(point.year).slice(2)}`,
        value: baseAmount(actual),
      });
    }

    if (points.length > 1) {
      series.push({
        key: matchKey,
        label: meta.label,
        unit: meta.unit,
        points,
      });
    }
  }

  series.sort((left, right) => left.label.localeCompare(right.label));

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
            The month&apos;s releases. Month-on-month compares the actual
            against the sheet&apos;s <em>previous</em> reading for each event.
            Year-on-year compares against {entry.monthName} {earlierYear} — it
            only appears once that month&apos;s tab exists.
          </p>
        </div>
      </section>

      <div
        className="news-container"
        style={{ paddingTop: 32, paddingBottom: 72 }}
      >
        <NewsWarnings warnings={archive.warnings} />

        <div style={{ marginTop: archive.warnings.length ? 24 : 0 }}>
          <section className="news-section">
            <div className="news-section-head">
              <h2 className="news-section-title">At a glance</h2>
              <span className="news-section-note">
                From the {entry.tab} tab
              </span>
            </div>

            <NewsMonthSummary month={entry} />
          </section>

          <section className="news-section">
            <div className="news-section-head">
              <h2 className="news-section-title">Events</h2>
              <span className="news-section-note">
                Actual, forecast, previous — with surprises and MoM/YoY
              </span>
            </div>

            {entry.events.length === 0 ? (
              <p className="news-label">
                No releases were found in this month&apos;s tab.
              </p>
            ) : (
              <NewsEventsTable weeks={entry.weeks} />
            )}
          </section>

          <section className="news-section">
            <div className="news-section-head">
              <h2 className="news-section-title">Trend</h2>
              <span className="news-section-note">Last 12 months</span>
            </div>

            <MetricTrendChart series={series} />
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
