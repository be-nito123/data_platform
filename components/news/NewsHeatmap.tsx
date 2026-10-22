import Link from "next/link";
import {
  NEWS_MONTH_SHORT,
  newsReleaseSlug,
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
  /** The event's name as the sheet writes it, used when labels collide. */
  full: string;
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
          full: event.name,
          cells: MONTHS.map(() => null),
        };

        rows.set(event.matchKey, row);
      }

      /*
        A cell links to the release's own history, anchored at this month: the
        read lives there now, and clicking a number should lead to what that
        number means and how it has printed before. The month itself is one
        hop further, from the anchor row on that page.
      */
      row.cells[month.month - 1] = {
        href: `/news/releases/${newsReleaseSlug(
          event.matchKey,
          event.name
        )}#${year}-${month.monthSlug}`,
        delta: event.mom,
      };
    }
  }

  const filled = [...rows.values()]
    .filter(
      (row) => row.cells.filter((cell) => cell !== null).length >= MIN_MONTHS
    )
    .sort((left, right) => left.label.localeCompare(right.label));

  /*
    Two rows can shorten to the same label — "NFP" and "NFP (Aug)" both read as
    "NFP" once the bracket is dropped, and they are genuinely different series:
    one is this month's print, the other last month's reported late. A reader
    cannot tell them apart under one name, so where a label repeats, the rows
    fall back to their full names ("NFP (Aug)"), which is exactly the part the
    shortening removed.
  */
  const labelCounts = new Map<string, number>();
  for (const row of filled) {
    labelCounts.set(row.label, (labelCounts.get(row.label) ?? 0) + 1);
  }

  for (const row of filled) {
    if ((labelCounts.get(row.label) ?? 0) > 1) row.label = row.full;
  }

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
                {/* The name opens this release's whole history — the read for
                    the series, every month it printed in. The cells open the
                    same page at one month. */}
                <Link
                  href={`/news/releases/${newsReleaseSlug(row.key, row.full)}`}
                  title={row.full}
                >
                  {row.label}
                </Link>
              </th>

              {MONTHS.map((month, index) => {
                const cell = row.cells[index];
                const entry = byMonth.get(month);

                if (!cell || !entry) {
                  return <td key={month} className="is-empty" />;
                }

                /*
                  The hue sits on the cell, not on the link inside it: a cell
                  can grow past its 40px link (one long label on a row is
                  enough), and a background on the link alone would then float
                  as a band with gaps above and below — colour that never
                  touches its own cell's edges. On the <td> it fills the box.
                */
                return (
                  <td
                    key={month}
                    className={classOf(cell.delta?.amount ?? null) || undefined}
                  >
                    <Link
                      href={cell.href}
                      className="news-heatmap-cell"
                      title={`${row.label} · ${entry.monthName} ${year} · ${
                        cell.delta
                          ? `${formatNewsDelta(cell.delta)} on the prior reading`
                          : "no prior reading"
                      } — opens this release's history at ${entry.monthName}`}
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

      <p className="news-heatmap-caption">
        Month on month, against the sheet&apos;s own prior reading. Green rose,
        red fell, and the figure is the move in the event&apos;s own unit — so
        two cells cannot be ranked against each other, only read in place. A
        cell opens that release&apos;s history at the month you clicked; its
        name opens all of it, where the read lives.
      </p>
    </div>
  );
}
