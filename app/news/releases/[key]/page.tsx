import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getViewer } from "@/lib/access";
import { canReadNews } from "@/lib/news-access";
import {
  baseAmount,
  findNewsRelease,
  getNewsArchive,
  type NewsEvent,
  type NewsReleaseEntry,
} from "@/lib/supabase/data/news";
import NewsLocked from "@/components/news/NewsLocked";
import { NewsWarnings } from "@/components/news/NewsNotices";
import NewsReleaseHistory from "@/components/news/NewsReleaseHistory";
import { NewsReactionTable } from "@/components/news/NewsEvents";
import MetricTrendChart, {
  type TrendSeries,
} from "@/components/news/MetricTrendChart";

/*
  One release's own page: its whole history, and where the read lives.

  The year page and the month page used to repeat the read for every event on
  screen — dozens of interpretations saying the same thing about the same
  family. The interpretation belongs to the *release*, so it is here once, and
  the pages it used to clutter link into it instead: a month table's event name
  opens this page, and a heatmap cell opens it anchored at the month clicked.

  Gated like every other news page: the history is built from the same sheets,
  so it is the same room.
*/

type PageParams = Promise<{ key: string }>;

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const { key } = await params;

  // The gate comes first: a locked browser must not learn the release names
  // from the tab title.
  const viewer = await getViewer();
  if (!(await canReadNews(viewer))) return { title: "News — Data Vault" };

  const release = findNewsRelease(await getNewsArchive(), key);

  return release
    ? { title: `${release.name} — Data News` }
    : { title: "Release — Data News" };
}

export default async function NewsReleasePage({
  params,
}: {
  params: PageParams;
}) {
  const { key } = await params;

  const viewer = await getViewer();

  if (!(await canReadNews(viewer))) {
    return <NewsLocked viewer={viewer} />;
  }

  const archive = await getNewsArchive();
  const release = findNewsRelease(archive, key);

  if (!release) notFound();

  const entries = release.entries;
  const first = entries[0];
  const last = entries[entries.length - 1];

  /*
    The trend line follows the actual reading over time — the month page's chart,
    scoped to this one release. It is drawn only when every reading shares a
    unit: a "162K" and a "3.40%" on one axis would be a lie, and a flat chart of
    one point says nothing the table does not.
  */
  const readings = entries.filter((entry) => entry.event.actual);
  const series: TrendSeries[] = [];

  if (readings.length > 1) {
    const unit = readings[0].event.actual?.unit;
    const consistent =
      unit !== undefined &&
      readings.every((entry) => entry.event.actual?.unit === unit);

    if (consistent && unit !== undefined) {
      series.push({
        key: release.key,
        label: release.name,
        unit,
        points: readings.map((entry) => ({
          period: `${entry.monthShort} ${String(entry.year).slice(2)}`,
          value: baseAmount(entry.event.actual as NonNullable<
            NewsEvent["actual"]
          >),
        })),
      });
    }
  }

  /*
    The gold table needs each row's month for its label and its React key, and
    event keys repeat across months ("ism-manufacturing" exists in several).
    Keyed by the object itself — the same objects the table renders — so identity
    does the work that a slug cannot.
  */
  const entryOf = new Map<NewsEvent, NewsReleaseEntry>(
    entries.map((entry) => [entry.event, entry])
  );

  const hasGold = entries.some((entry) => entry.event.reaction);

  const monthLabel = (event: NewsEvent) => {
    const entry = entryOf.get(event);
    if (!entry) return null;

    return (
      <Link href={`/news/${entry.year}/${entry.monthSlug}`}>
        {entry.monthShort} {entry.year}
      </Link>
    );
  };

  const monthKey = (event: NewsEvent) => {
    const entry = entryOf.get(event);
    if (!entry) return event.key;

    return `${entry.year}-${entry.monthSlug}-${event.key}`;
  };

  return (
    <>
      <section className="news-hero">
        <div className="news-container news-hero-inner">
          <nav aria-label="Breadcrumb">
            <p className="news-eyebrow is-muted" style={{ margin: 0 }}>
              <Link href="/news" style={{ color: "inherit" }}>
                News
              </Link>{" "}
              / {release.name}
            </p>
          </nav>

          <h1 className="news-title">{release.name}</h1>

          <p className="news-lede">
            Every recording of this release, oldest first — from{" "}
            {first.monthShort} {first.year} to {last.monthShort} {last.year}.
            Each month heading links to its own page; the read sits beside every
            row rather than in a section of its own.
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
              <h2 className="news-section-title">History</h2>
              <span className="news-section-note">
                Actual, forecast, previous — with the read
              </span>
            </div>

            <NewsReleaseHistory release={release} />
          </section>

          {series.length > 0 && (
            <section className="news-section">
              <div className="news-section-head">
                <h2 className="news-section-title">Trend</h2>
                <span className="news-section-note">
                  Actual reading, every recording
                </span>
              </div>

              <MetricTrendChart series={series} />
            </section>
          )}

          {hasGold && (
            <section className="news-section">
              <div className="news-section-head">
                <h2 className="news-section-title">Gold reaction</h2>
                <span className="news-section-note">
                  Gold&apos;s open/close, volume and open interest around each
                  release
                </span>
              </div>

              <NewsReactionTable
                events={entries.map((entry) => entry.event)}
                label={monthLabel}
                keyOf={monthKey}
                firstHeading="Month"
              />

              <p className="news-label" style={{ marginTop: 12 }}>
                From the gold report&apos;s OHLCV block. A dash means the sheet
                has not filled that cell in yet — it is not a price of zero.
              </p>
            </section>
          )}

          <nav className="news-pager" aria-label="Back to the calendar">
            <Link href={`/news/${last.year}`} className="news-pager-link">
              <span className="news-eyebrow is-muted">Latest recording in</span>
              <span>{last.year}</span>
            </Link>

            <Link href="/news" className="news-pager-link">
              <span className="news-eyebrow is-muted">All of</span>
              <span>News</span>
            </Link>

            <Link
              href={`/news/${last.year}/${last.monthSlug}`}
              className="news-pager-link"
            >
              <span className="news-eyebrow is-muted">Latest month</span>
              <span>
                {last.monthShort} {last.year}
              </span>
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}
