import Link from "next/link";
import {
  NEWS_MONTH_SHORT,
  readableEventName,
  type NewsValue,
  type NewsMonth,
} from "@/lib/supabase/data/news";
import { classOf, formatNewsDelta } from "@/lib/news/format";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** Rows need to appear in at least this many months to earn a line. */
const MIN_MONTHS = 2;

type Row = {
  key: string;
  label: string;
  /** Indexed by month - 1; null where the event did not appear. */
  cells: (Cell | null)[];
};

type Cell = {
  href: string;
  delta: NewsValue | null;
};

/**
 * Events down, months across, and in each cell the month-on-month move for that
 * event — the sheet's "previous" reading against the actual.
 *
 * There is no colour intensity here, unlike a usual heatmap, because the cells
 * do not share a unit: a 2K move in jobless claims and a 0.2% move in inflation
 * cannot be ranked against each other. Hue carries the direction and the number
 * carries the size.
 */
export default function NewsHeatmap({
  year,
  months,
}: {
  year: number;
  months: NewsMonth[];
}) {
  const byMonth = new Map(months.map((month) => [month.month, month]));
  const rows = new Map<string, Row>();

  for (const month of months) {
    for (const event of month.events) {
      let row = rows.get(event.matchKey);

      if (!row) {
        row = {
          key: event.matchKey,
          label: readableEventName(event.name),
          cells: MONTHS.map(() => null),
        };

        rows.set(event.matchKey, row);
      }

      row.cells[month.month - 1] = {
        href: `/news/${year}/${month.monthSlug}`,
        delta: event.mom,
      };
    }
  }

  const filled = [...rows.values()]
    .filter(
      (row) => row.cells.filter((cell) => cell !== null).length >= MIN_MONTHS
    )
    .sort((left, right) => left.label.localeCompare(right.label));

  if (filled.length === 0) {
    return (
      <p className="news-label">
        No event appears in more than one month of {year} yet, so there is
        nothing to line up.
      </p>
    );
  }

  return (
    <div className="news-heatmap-wrap">
      <table className="news-heatmap">
        <thead>
          <tr>
            <th scope="col">Event</th>
            {MONTHS.map((month) => (
              <th key={month} scope="col">
                {NEWS_MONTH_SHORT[month - 1]}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filled.map((row) => (
            <tr key={row.key}>
              <th scope="row" className="news-heatmap-row-label">
                {row.label}
              </th>

              {MONTHS.map((month, index) => {
                const cell = row.cells[index];
                const entry = byMonth.get(month);

                if (!cell || !entry) {
                  return <td key={month} className="is-empty" />;
                }

                return (
                  <td key={month}>
                    <Link
                      href={cell.href}
                      className={`news-heatmap-cell ${classOf(
                        cell.delta?.amount ?? null
                      )}`.trim()}
                      title={`${row.label} · ${entry.monthName} ${year} · ${
                        cell.delta
                          ? `${formatNewsDelta(cell.delta)} on the prior reading`
                          : "no prior reading"
                      }`}
                    >
                      {cell.delta ? formatNewsDelta(cell.delta) : "—"}
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="news-heatmap-legend">
        <span className="news-heatmap-swatch is-up" />
        Rose
        <span className="news-heatmap-swatch is-down" />
        Fell
        <span className="news-label">
          Month on month, against the prior reading. Cells show the move in the
          event&apos;s own unit.
        </span>
      </p>
    </div>
  );
}
