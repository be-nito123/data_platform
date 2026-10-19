import type { Metadata } from "next";
import Link from "next/link";
import { getViewer } from "@/lib/access";
import { canReadNews } from "@/lib/news-access";
import { getNewsArchive } from "@/lib/supabase/data/news";
import NewsLocked from "@/components/news/NewsLocked";
import { NewsSheetSetup, NewsWarnings } from "@/components/news/NewsNotices";
import { formatNewsCount } from "@/lib/news/format";

export const metadata: Metadata = {
  title: "Monthly Data News",
  description:
    "Every macro release, month by month: what came in against the forecast, and how it moved against the prior reading.",
};

export default async function NewsIndexPage() {
  /*
    The gate runs before the sheet is read. Nothing from the spreadsheet exists
    on this render for a viewer who is not allowed to see it.
  */
  const viewer = await getViewer();

  if (!(await canReadNews(viewer))) {
    return <NewsLocked viewer={viewer} />;
  }

  const archive = await getNewsArchive();
  const latest = archive.months.at(-1) ?? null;

  return (
    <>
      <section className="news-hero">
        <div className="news-container news-hero-inner">
          <p className="news-eyebrow">Exclusive</p>
          <h1 className="news-title">Monthly Data News</h1>
          <p className="news-lede">
            Every macro release, month by month — what came in against the
            forecast, and how it moved against the prior reading. This room is
            limited to administrators.
          </p>
        </div>
      </section>

      <div
        className="news-container"
        style={{ paddingTop: 32, paddingBottom: 72 }}
      >
        <NewsWarnings warnings={archive.warnings} />

        {archive.months.length === 0 ? (
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
                    {latest.tab}
                  </p>

                  <h3
                    className="news-section-title"
                    style={{ marginTop: 8, fontSize: 17, lineHeight: 1.4 }}
                  >
                    {formatNewsCount(latest.counts.events)}{" "}
                    {latest.counts.events === 1 ? "event" : "events"},{" "}
                    {formatNewsCount(latest.counts.reported)} with a figure
                    recorded.
                  </h3>

                  <p className="news-lede" style={{ marginTop: 10 }}>
                    {formatNewsCount(latest.counts.above)} came in above forecast
                    and {formatNewsCount(latest.counts.below)} below, with{" "}
                    {formatNewsCount(latest.counts.inLine)} in line.{" "}
                    {formatNewsCount(latest.counts.moved)} carry a prior reading
                    to measure against.
                  </p>

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
                  {formatNewsCount(archive.years.length)}{" "}
                  {archive.years.length === 1 ? "year" : "years"} on record
                </span>
              </div>

              <div className="news-grid">
                {archive.years.map((year) => {
                  const months = archive.months.filter(
                    (entry) => entry.year === year
                  );
                  const events = months.reduce(
                    (total, entry) => total + entry.counts.events,
                    0
                  );

                  return (
                    <Link
                      key={year}
                      href={`/news/${year}`}
                      className="news-card"
                    >
                      <div className="news-card-head">
                        <span className="news-card-title">{year}</span>
                        <span className="news-section-note" aria-hidden="true">
                          →
                        </span>
                      </div>

                      <p className="news-card-summary">
                        {months.length === 1
                          ? "1 month of data"
                          : `${formatNewsCount(months.length)} months of data`}
                        {events > 0 &&
                          `, ${formatNewsCount(events)} ${
                            events === 1 ? "event" : "events"
                          }`}
                        .
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
