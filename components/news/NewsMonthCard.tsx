import Link from "next/link";
import type { NewsMonth } from "@/lib/supabase/data/news";
import { formatNewsCount } from "@/lib/news/format";

/**
 * One month of the year.
 *
 * Missing months stay on the page rather than disappearing from it: a gap in
 * the sheet is information, and a grid that quietly shrinks to the months that
 * exist hides the fact that half the year was never made.
 */
export default function NewsMonthCard({
  year,
  monthName,
  monthShort,
  entry,
}: {
  year: number;
  monthName: string;
  monthShort: string;
  entry: NewsMonth | undefined;
}) {
  if (!entry) {
    return (
      <div className="news-card is-empty">
        <div className="news-card-head">
          <span className="news-card-title">{monthShort}</span>
          <span className="news-section-note">{year}</span>
        </div>

        <p className="news-card-summary">
          No tab for {monthName} {year} in the sheet.
        </p>

        <span className="news-card-count">Missing</span>
      </div>
    );
  }

  return (
    <Link href={`/news/${year}/${entry.monthSlug}`} className="news-card">
      <div className="news-card-head">
        <span className="news-card-title">{monthShort}</span>
        <span className="news-section-note">{year}</span>
      </div>

      <p className="news-card-summary">
        {entry.counts.reported === 0
          ? "No releases recorded yet."
          : `${formatNewsCount(entry.counts.above)} above forecast, ${formatNewsCount(
              entry.counts.below
            )} below.`}
      </p>

      <span className="news-card-count">
        {entry.counts.events === 1
          ? "1 event"
          : `${formatNewsCount(entry.counts.events)} events`}
      </span>
    </Link>
  );
}
