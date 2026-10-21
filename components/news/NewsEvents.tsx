import type { ReactNode } from "react";
import Link from "next/link";
import type {
  NewsEvent,
  NewsMonth,
  NewsWeek,
} from "@/lib/supabase/data/news";
import { newsReleaseSlug } from "@/lib/supabase/data/news";
import {
  changeClass,
  formatContracts,
  formatNewsDelta,
  formatNewsValue,
  formatPrice,
  formatRange,
} from "@/lib/news/format";

/** Event, time, actual, forecast, previous, surprise, MoM, YoY. */
const EVENT_COLUMNS = 8;

/* =========================================================
   MONTH AT A GLANCE
   ========================================================= */

/**
 * The month in six numbers.
 *
 * "Above" and "below" are counted against the sheet's own forecast column and
 * deliberately say nothing about whether a reading is good or bad: a rise in
 * jobless claims and a rise in payrolls both land in "above", and only one of
 * them is good news. The page states the direction, not the verdict.
 */
export function NewsMonthSummary({ month }: { month: NewsMonth }) {
  const stats = [
    { label: "Events", value: month.counts.events },
    { label: "Reported", value: month.counts.reported },
    { label: "Above forecast", value: month.counts.above },
    { label: "Below forecast", value: month.counts.below },
    { label: "In line", value: month.counts.inLine },
    { label: "Prior reading", value: month.counts.moved },
  ];

  return (
    <div className="news-metrics">
      {stats.map((stat) => (
        <article key={stat.label} className="news-metric">
          <h3 className="news-label" style={{ margin: 0 }}>
            {stat.label}
          </h3>

          <p className="news-value" style={{ margin: 0 }}>
            {stat.value}
          </p>
        </article>
      ))}
    </div>
  );
}

/* =========================================================
   THE MONTH'S EVENTS
   ========================================================= */

/**
 * Every release in the month, grouped under its week heading.
 *
 * The units differ from row to row on purpose — "197K" jobless claims and
 * "54.5" PMI sit in the same column in the sheet — so nothing is summed.
 * Each row carries its own figures and its own comparisons.
 */
export function NewsEventsTable({ weeks }: { weeks: NewsWeek[] }) {
  return (
    <div className="news-table-wrap">
      <table className="news-table">
        <thead>
          <tr>
            <th scope="col">Event</th>
            <th scope="col">Time (IST)</th>
            <th scope="col">Actual</th>
            <th scope="col">Forecast</th>
            <th scope="col">Previous</th>
            <th scope="col">Surprise</th>
            <th scope="col">MoM</th>
            <th scope="col">YoY</th>
          </tr>
        </thead>

        <tbody>
          {weeks.map((week, index) => (
            <WeekRows key={`${week.label}-${index}`} week={week} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WeekRows({ week }: { week: NewsWeek }) {
  return (
    <>
      <tr className="news-table-week">
        <th scope="row" colSpan={EVENT_COLUMNS}>
          {week.label}
        </th>
      </tr>

      {week.events.map((event) => (
        <EventRow key={event.key} event={event} />
      ))}
    </>
  );
}

/**
 * A comparison cell — Surprise, MoM, YoY.
 *
 * `changeClass` carries the direction colour; an empty one is also marked
 * `is-empty` so a missing figure reads as missing rather than as a figure of
 * zero. Without that, YoY (blank until a tab for the earlier year exists)
 * rendered as brightly as a real reading.
 */
function changeCellClass(value: NewsEvent["surprise"]): string {
  const classes = [changeClass(value)];
  if (!value) classes.push("is-empty");

  return classes.filter(Boolean).join(" ");
}

function EventRow({ event }: { event: NewsEvent }) {
  return (
    <tr>
      <td>
        {/*
          The name leads to this release's own page — its whole history, and
          where the read lives now. The table shows one month; the link is the
          way out to the series.
        */}
        <Link
          className="news-event-name"
          href={`/news/releases/${newsReleaseSlug(event.matchKey, event.name)}`}
        >
          {event.name}
        </Link>

        {event.notes && (
          <span className="news-label news-event-note">{event.notes}</span>
        )}
      </td>

      <td className={event.timeIst ? "" : "is-empty"}>
        {event.timeIst ?? "—"}
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
    </tr>
  );
}

/* =========================================================
   GOLD REACTION
   ========================================================= */

/**
 * What gold did around each release, from the gold report's OHLCV block.
 *
 * This lives in its own table rather than beside the figures above because it is
 * a different subject: the events table is "what the economy did", this is "what
 * the market did about it". Side by side, the nine extra columns would squeeze
 * the events table to the point of being unreadable on a laptop, and the two
 * would look like one wide row of unrelated numbers.
 *
 * The rows line up with the events table by event order, not by an explicit tie,
 * because both are built from the same `weeks` and so cannot drift apart.
 *
 * Every figure is optional. The table is only shown at all when at least one
 * event in the month carries a reaction, and a single missing cell prints a dash
 * rather than a zero — a release the gold sheet has not filled in yet must not
 * look like gold opened at nothing.
 */
export function NewsReactions({ weeks }: { weeks: NewsWeek[] }) {
  const weeksWithReactions = weeks
    .map((week) => ({
      label: week.label,
      events: week.events.filter((event) => event.reaction),
    }))
    .filter((week) => week.events.length > 0);

  if (weeksWithReactions.length === 0) return null;

  return (
    <div className="news-table-wrap">
      <table className="news-table news-table-gold">
        <ReactionHead />

        <tbody>
          {weeksWithReactions.map((week, index) => (
            <ReactionWeek key={`${week.label}-${index}`} week={week} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The same figures for a flat list — one release's whole history, where the
 * rows are months rather than weeks. `label` decides what the first column
 * says: a month name on the release page, the event's name in a month.
 */
export function NewsReactionTable({
  events,
  label,
  keyOf,
  firstHeading = "Event",
}: {
  events: NewsEvent[];
  label?: (event: NewsEvent) => ReactNode;
  /**
   * A key per row. `event.key` is unique within a month, but the release page
   * spans months, where the same key recurs — so it brings its own.
   */
  keyOf?: (event: NewsEvent) => string;
  /** What the first column says — "Event" in a month, "Month" on a release. */
  firstHeading?: string;
}) {
  const withGold = events.filter((event) => event.reaction);
  if (withGold.length === 0) return null;

  return (
    <div className="news-table-wrap">
      <table className="news-table news-table-gold">
        <ReactionHead firstHeading={firstHeading} />

        <tbody>
          {withGold.map((event) => (
            <ReactionRow
              key={keyOf?.(event) ?? event.key}
              event={event}
              label={label?.(event)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReactionHead({ firstHeading = "Event" }: { firstHeading?: string }) {
  return (
    <thead>
      <tr>
        <th scope="col">{firstHeading}</th>
        <th scope="col">Candle open</th>
        <th scope="col">Event day O/C</th>
        <th scope="col">Event volume</th>
        <th scope="col">Event OI</th>
        <th scope="col">Next day</th>
        <th scope="col">Next day O/C</th>
        <th scope="col">Next volume</th>
        <th scope="col">Next OI</th>
      </tr>
    </thead>
  );
}

function ReactionWeek({
  week,
}: {
  week: { label: string; events: NewsEvent[] };
}) {
  return (
    <>
      <tr className="news-table-week">
        <th scope="row" colSpan={GOLD_COLUMNS}>
          {week.label}
        </th>
      </tr>

      {week.events.map((event) => (
        <ReactionRow key={event.key} event={event} />
      ))}
    </>
  );
}

/** Event, candle open, event day O/C, volume, OI, next day, O/C, volume, OI. */
const GOLD_COLUMNS = 9;

function ReactionRow({
  event,
  label,
}: {
  event: NewsEvent;
  label?: ReactNode;
}) {
  const gold = event.reaction;
  if (!gold) return null;

  return (
    <tr>
      <td>
        {label ?? <span className="news-event-name">{event.name}</span>}
      </td>

      <td className={gold.candleOpen === null ? "is-empty" : ""}>
        {formatPrice(gold.candleOpen)}
      </td>

      <td className={gold.eventDay ? "" : "is-empty"}>
        {formatRange(gold.eventDay)}
      </td>

      <td className={gold.eventVolume === null ? "is-empty" : ""}>
        {formatContracts(gold.eventVolume)}
      </td>

      <td className={gold.eventOi === null ? "is-empty" : ""}>
        {formatContracts(gold.eventOi)}
      </td>

      <td className={gold.nextDate ? "" : "is-empty"}>
        {gold.nextDate ?? "—"}
      </td>

      <td className={gold.nextDay ? "" : "is-empty"}>
        {formatRange(gold.nextDay)}
      </td>

      <td className={gold.nextVolume === null ? "is-empty" : ""}>
        {formatContracts(gold.nextVolume)}
      </td>

      <td className={gold.nextOi === null ? "is-empty" : ""}>
        {formatContracts(gold.nextOi)}
      </td>
    </tr>
  );
}
