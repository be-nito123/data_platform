import Link from "next/link";
import type { NewsRelease, NewsReleaseEntry } from "@/lib/supabase/data/news";
import {
  changeClass,
  formatNewsDelta,
  formatNewsValue,
} from "@/lib/news/format";
import {
  familyLabel,
  familyOf,
  readOf,
  type DollarLean,
  type TradingRead,
} from "@/lib/news/trading-read";

/*
  One release, every time it was recorded.

  This is where the read lives now. It used to be repeated on the year page and
  the month page — once per event, dozens of times over — which buried the
  interpretation under its own repetition. A single release has a single family
  and a single way of reading it, so it is said once here and each recording
  gets one line: the surprise and which way it leaned.

  The rows are grouped by month, and each month's row carries the anchor the
  heatmap links to, so a click on "movement by month" lands on the release's
  history at the month you clicked.
*/

const LEAN_LABEL: Record<DollarLean, string> = {
  firmer: "USD firmer",
  softer: "USD softer",
  neutral: "Neutral",
};

const LEAN_ARROW: Record<DollarLean, string> = {
  firmer: "↑",
  softer: "↓",
  neutral: "·",
};

const AGAINST_LABEL: Record<string, string> = {
  above: "Above forecast",
  below: "Below forecast",
  "in-line": "In line",
};

function chipClass(read: TradingRead): string {
  if (read.against === "in-line" || read.lean === "neutral") {
    return "news-plan-chip is-flat";
  }

  return read.lean === "firmer"
    ? "news-plan-chip is-firm"
    : "news-plan-chip is-soft";
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** How the release leaned each time it printed. */
function readTally(entries: NewsReleaseEntry[]): {
  firmer: number;
  softer: number;
  flat: number;
  reads: TradingRead[];
} {
  const reads = entries
    .map((entry) => readOf(entry.event))
    .filter((read): read is TradingRead => read !== null);

  return {
    firmer: reads.filter((read) => read.lean === "firmer").length,
    softer: reads.filter((read) => read.lean === "softer").length,
    flat: reads.filter((read) => read.lean === "neutral").length,
    reads,
  };
}

type MonthGroup = {
  anchor: string;
  href: string;
  label: string;
  entries: NewsReleaseEntry[];
};

/** The entries, grouped by month, in sheet order. */
function groupByMonth(release: NewsRelease): MonthGroup[] {
  const groups: MonthGroup[] = [];

  for (const entry of release.entries) {
    const anchor = `${entry.year}-${entry.monthSlug}`;
    const last = groups.at(-1);

    if (last && last.anchor === anchor) {
      last.entries.push(entry);
      continue;
    }

    groups.push({
      anchor,
      href: `/news/${entry.year}/${entry.monthSlug}`,
      label: `${entry.monthShort} ${entry.year}`,
      entries: [entry],
    });
  }

  return groups;
}

export default function NewsReleaseHistory({
  release,
}: {
  release: NewsRelease;
}) {
  const groups = groupByMonth(release);
  // `findNewsRelease` only returns a release that has at least one entry.
  const family = familyOf(release.entries[0].event);
  const tally = readTally(release.entries);

  return (
    <>
      <p className="news-lede" style={{ marginBottom: 18 }}>
        {familyLabel(family)} family, recorded {release.entries.length}{" "}
        {release.entries.length === 1 ? "time" : "times"} across{" "}
        {groups.length} {groups.length === 1 ? "month" : "months"}.
        {tally.reads.length > 0 && (
          <>
            {" "}
            The read: {tally.firmer} firmer, {tally.softer} softer,{" "}
            {tally.flat} flat.
          </>
        )}
      </p>

      <div className="news-table-wrap">
        <table className="news-table news-table-release">
          <thead>
            <tr>
              <th scope="col">Released</th>
              <th scope="col">Actual</th>
              <th scope="col">Forecast</th>
              <th scope="col">Previous</th>
              <th scope="col">Surprise</th>
              <th scope="col">MoM</th>
              <th scope="col">YoY</th>
              <th scope="col">Read</th>
            </tr>
          </thead>

          <tbody>
            {groups.map((group) => (
              <ReleaseMonth key={group.anchor} group={group} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="news-label" style={{ marginTop: 12 }}>
        The read is the direction of the surprise resolved through the release&apos;s
        family, not the sign alone — claims and payrolls can print the same way
        and lean opposite ways. Not investment advice.
      </p>
    </>
  );
}

function ReleaseMonth({ group }: { group: MonthGroup }) {
  return (
    <>
      {/*
        The anchor the heatmap points at: "#2026-10" on a cell lands here, with
        the month it names as the link out to its own page.
      */}
      <tr className="news-table-week">
        <th scope="row" id={group.anchor} colSpan={RELEASE_COLUMNS}>
          <Link href={group.href} className="news-release-month">
            {group.label}
          </Link>
        </th>
      </tr>

      {group.entries.map((entry) => (
        <ReleaseRow key={entry.event.key} entry={entry} />
      ))}
    </>
  );
}

/** Released, actual, forecast, previous, surprise, MoM, YoY, read. */
const RELEASE_COLUMNS = 8;

function ReleaseRow({ entry }: { entry: NewsReleaseEntry }) {
  const { event } = entry;
  const read = readOf(event);
  const released = event.releaseDate ?? event.timeIst;

  return (
    <tr>
      <td className={released ? "" : "is-empty"}>
        {released ?? "—"}
        {/* The gold sheet records both the date and the time; show the other half. */}
        {event.releaseDate && event.timeIst && (
          <span className="news-label news-event-note">{event.timeIst}</span>
        )}
      </td>

      <td className={event.actual ? "" : "is-empty"}>
        {formatNewsValue(event.actual)}
      </td>

      <td className={event.forecast ? "" : "is-empty"}>
        {formatNewsValue(event.forecast)}
      </td>

      <td className={event.previous ? "" : "is-empty"}>
        {formatNewsValue(event.previous)}
      </td>

      <td className={changeCellClass(event.surprise)}>
        {formatNewsDelta(event.surprise)}
      </td>

      <td className={changeCellClass(event.mom)}>
        {formatNewsDelta(event.mom)}
      </td>

      <td className={changeCellClass(event.yoy)}>
        {formatNewsDelta(event.yoy)}
      </td>

      <td className={read ? "news-release-read" : "is-empty"}>
        {read ? (
          <>
            <span
              className={chipClass(read)}
              title={`${capitalize(read.read)} — ${read.market}`}
            >
              {LEAN_ARROW[read.lean]} {LEAN_LABEL[read.lean]}
            </span>
            <span className="news-plan-against">
              {AGAINST_LABEL[read.against ?? ""] ?? "—"}
            </span>
          </>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

/** The same empty/direction rule the month tables use. */
function changeCellClass(
  value: NewsReleaseEntry["event"]["surprise"]
): string {
  const classes = [changeClass(value)];
  if (!value) classes.push("is-empty");

  return classes.filter(Boolean).join(" ");
}
