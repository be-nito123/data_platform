import type { NewsEvent, NewsMonth, NewsWeek } from "@/lib/supabase/data/news";
import {
  changeClass,
  formatNewsDelta,
  formatNewsValue,
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
        <span className="news-event-name">{event.name}</span>

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
