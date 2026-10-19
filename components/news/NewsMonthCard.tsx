import Link from "next/link";
import {
  NEWS_MONTH_NAMES,
  NEWS_MONTH_SHORT,
  type NewsEntry,
} from "@/lib/supabase/data/news";

/**
 * One month in the year grid. A month with no row in the sheet renders as a
 * disabled card rather than disappearing, so a gap in the data stays visible.
 */
export default function NewsMonthCard({
  year,
  month,
  entry,
}: {
  year: number;
  month: number;
  entry: NewsEntry | null;
}) {
  const monthLabel = NEWS_MONTH_SHORT[month - 1];
  const monthName = NEWS_MONTH_NAMES[month - 1];

  if (!entry) {
    return (
      <div className="news-card is-empty">
        <div className="news-card-head">
          <span className="news-card-title">{monthLabel}</span>
          <span className="news-section-note">{year}</span>
        </div>

        <p className="news-card-summary">
          No row for {monthName} {year} in the sheet.
        </p>

        <span className="news-card-count">Missing</span>
      </div>
    );
  }

  return (
    <Link href={`/news/${entry.year}/${entry.monthSlug}`} className="news-card">
      <div className="news-card-head">
        <span className="news-card-title">{monthLabel}</span>
        <span className="news-section-note">{year}</span>
      </div>

      <p className="news-card-summary">
        {entry.headline ?? `${monthName} ${entry.year}`}
      </p>

      <span className="news-card-count">
        {entry.metrics.length === 1 ? "1 figure" : `${entry.metrics.length} figures`}
      </span>
    </Link>
  );
}
