import type { NewsMonth } from "@/lib/supabase/data/news";
import { readableEventName } from "@/lib/supabase/data/news-sheet";
import { formatNewsValue } from "@/lib/news/format";
import {
  familyLabel,
  planForYear,
  readsForEvents,
  type DollarLean,
  type MonthPlan,
  type TradingRead,
} from "@/lib/news/trading-read";

/*
  The trading read.

  A macro calendar on its own tells you what happened. This says what the number
  implies: whether the surprise came in above or below its forecast, what that
  says about the economy in the release's own terms, and which way it usually
  leans for the dollar.

  It is a mechanical read of the sheet's own columns — the direction of the
  surprise, resolved through the release's family — and the panel says so. It is
  not a recommendation, and it does not invent levels the sheet never held.
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

/* =========================================================
   THE YEAR'S PLAN — "Movement by month" page
   ========================================================= */

/**
 * The year's reads, month by month, above the heatmap.
 *
 * This replaces the old rose/fell legend: rather than explaining the colours,
 * it says what the colours added up to. Each month keeps its own list, because
 * a firmer dollar in April and a softer one in October are two facts and not one
 * average, and each read carries what it means for the dollar and where it
 * normally lands across assets.
 */
export default function NewsTradingPlan({ months }: { months: NewsMonth[] }) {
  const year = months[0]?.year;
  const plan = planForYear(months);

  if (plan.months.length === 0) {
    return (
      <p className="news-label">
        No release in {year ?? "this year"} has both an actual and a forecast
        yet, so there is nothing to read. A release earns a read once the
        sheet&apos;s <code className="news-code">forcast</code> column is filled
        in.
      </p>
    );
  }

  const { total } = plan;

  return (
    <div className="news-plan">
      <div className="news-plan-head">
        <div>
          <p className="news-plan-headline">{summaryLine("The year", total)}</p>
          <p className="news-plan-sub">
            {total.reads.length} readable releases across {plan.months.length}{" "}
            {plan.months.length === 1 ? "month" : "months"}. A read is the
            direction of a surprise against its own forecast, resolved through
            the release&apos;s family — not the sign alone. &ldquo;Flat&rdquo;
            covers releases that printed as forecast and those whose family
            carries no dollar lean.
          </p>
        </div>

        <span className={tiltClass(total)}>{tiltLabel(total)}</span>
      </div>

      <div className="news-plan-months">
        {plan.months.map(({ month, plan: monthPlan }) => (
          <section key={month.month} className="news-plan-month">
            <div className="news-plan-month-head">
              <h3 className="news-plan-month-name">
                {month.monthShort}
                {month.year !== year ? ` ${month.year}` : ""}
              </h3>
              <span className="news-plan-month-count">
                {monthPlan.reads.length}{" "}
                {monthPlan.reads.length === 1 ? "read" : "reads"}
              </span>
            </div>

            <ul className="news-plan-list">
              {monthPlan.reads.map((read) => (
                <PlanRow key={read.event.key} read={read} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="news-plan-foot">
        A mechanical read of the sheet&apos;s own numbers. Jobless claims and
        payrolls can surprise the same way and point opposite ways, which is why
        the release&apos;s family is looked up rather than the sign alone. Not
        investment advice.
      </p>
    </div>
  );
}

function summaryLine(scope: string, plan: MonthPlan): string {
  const parts = [`${plan.firmer} firmer`, `${plan.softer} softer`];

  if (plan.flat > 0) parts.push(`${plan.flat} flat`);

  return `${scope}: ${parts.join(", ")}`;
}

function tiltLabel(plan: MonthPlan): string {
  if (plan.firmer > plan.softer) return "Dollar firm";
  if (plan.softer > plan.firmer) return "Dollar soft";

  return "Balanced";
}

function tiltClass(plan: MonthPlan): string {
  if (plan.firmer > plan.softer) return "news-plan-badge is-firm";
  if (plan.softer > plan.firmer) return "news-plan-badge is-soft";

  return "news-plan-badge";
}

function PlanRow({ read }: { read: TradingRead }) {
  return (
    <li className="news-plan-row">
      <div className="news-plan-row-main">
        <span className="news-plan-event">
          {readableEventName(read.event.name)}
        </span>
        <span className="news-plan-family">{familyLabel(read.family)}</span>
      </div>

      <div className="news-plan-figures">
        <span className="news-plan-actual">
          {formatNewsValue(read.event.actual)}
        </span>
        <span className="news-plan-forecast">
          vs {formatNewsValue(read.event.forecast)}
        </span>
      </div>

      <div className="news-plan-read">
        <span className={chipClass(read)}>
          {LEAN_ARROW[read.lean]} {LEAN_LABEL[read.lean]}
        </span>
        <span className="news-plan-against">
          {AGAINST_LABEL[read.against ?? ""] ?? "—"}
        </span>
      </div>

      <p className="news-plan-why">
        {capitalize(read.read)} —{" "}
        <span className="news-plan-market">{read.market}</span>
      </p>
    </li>
  );
}

/* =========================================================
   THE MONTH'S READS — the month page
   ========================================================= */

/**
 * The reads for the month, under its events table.
 *
 * The same interpretation as the year page, kept compact: it sits where the
 * figures it is reading are already on screen, so it only needs the event, the
 * lean, and the one line of why.
 */
export function NewsWeekReads({ weeks }: { weeks: NewsMonth["weeks"] }) {
  const reads = readsForEvents(weeks.flatMap((week) => week.events));

  if (reads.length === 0) return null;

  return (
    <ul className="news-reads">
      {reads.map((read) => (
        <li key={read.event.key} className="news-reads-row">
          <span className="news-plan-event">
            {readableEventName(read.event.name)}
          </span>
          <span className={chipClass(read)}>
            {LEAN_ARROW[read.lean]} {LEAN_LABEL[read.lean]}
          </span>
          <span className="news-reads-why">
            {capitalize(read.read)} — {read.market}
          </span>
        </li>
      ))}
    </ul>
  );
}
