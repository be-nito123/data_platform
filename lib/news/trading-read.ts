/* =========================================================
   NEWS — the trading read.

   What a release implies, derived from the sheet's own numbers.

   The sheet has a "USD Bias" column, and this deliberately does not use it.
   That column is empty in every tab, and a rule that reads an intended call is
   only as good as the discipline of filling it in. What is never empty is
   `actual` against `forcast`, which is the whole content of a macro calendar.

   So the read is mechanical: the size and direction of the surprise, resolved
   through the release's own family. That family matters, because "above" does
   not mean one thing:

     payrolls above forecast   labour is hot      → USD firmer, yields up
     claims above forecast     labour is looser   → USD softer, yields down
     CPI above forecast        inflation sticky   → USD firmer, yields up

   Two releases can both surprise upward and point opposite ways, which is why
   the family is looked up rather than the sign alone.
   ========================================================= */

import type { Against, NewsEvent, NewsMonth } from "@/lib/supabase/data/news-sheet";

/* =========================================================
   TYPES
   ========================================================= */

/** Which way the read leans for the dollar. */
export type DollarLean = "firmer" | "softer" | "neutral";

export type TradingRead = {
  event: NewsEvent;
  /** The release's family, for grouping and for the label. */
  family: Family;
  /** Actual against forecast. The surprise is what moves the tape. */
  against: Against | null;
  lean: DollarLean;
  /** One line: what the number says about the economy. */
  read: string;
  /** The same thing in market terms. */
  market: string;
};

export type Family =
  | "labour"
  | "labour-loose"
  | "inflation"
  | "growth"
  | "fed"
  | "housing"
  | "consumer"
  | "other";

/* =========================================================
   FAMILIES
   ========================================================= */

/*
  Ordered, because a name can carry more than one word that would match: "Core
  PCE Price Index" is inflation, not a price level, and it must not fall through
  to a later rule. The first family whose pattern matches wins.

  The two labour families are kept apart because the same word on the page means
  opposite things. A payrolls beat and a claims beat are both "above forecast",
  and they point opposite ways — one is more work, the other is more people out
  of it. A single "labour" family would have to say one of those backwards.
*/
const FAMILY_RULES: { family: Family; label: string; pattern: RegExp }[] = [
  {
    family: "fed",
    label: "Fed",
    pattern: /fed |fomc|interest rate decision|powell|waller|speaks|minutes/i,
  },
  {
    // More of these = more people out of work. Higher is a weaker labour market.
    family: "labour-loose",
    label: "Labour (soft)",
    pattern:
      /jobless|claims|unemployment|layoff|continuing claims|challenger|labour force participation/i,
  },
  {
    // More of these = more work. Higher is a stronger labour market.
    family: "labour",
    label: "Labour",
    pattern: /nfp|nonfarm|non-farm|payroll|jolts|adp|earnings|hires|labour| labor/i,
  },
  {
    family: "inflation",
    label: "Inflation",
    pattern: /cpi|ppi|pce|inflation|price index|redbook/i,
  },
  {
    family: "housing",
    label: "Housing",
    pattern: /housing|home|mortgage|building permit|existing|new home/i,
  },
  {
    family: "consumer",
    label: "Consumer",
    pattern: /retail|sentiment|consumer|confidence|spending/i,
  },
  {
    family: "growth",
    label: "Growth",
    pattern:
      /pmi|ism|gdp|industrial|manufactur|production|durable|trade balance|current account|money supply|m2|rig count/i,
  },
];

const FAMILY_LABELS: Record<Family, string> = {
  labour: "Labour",
  "labour-loose": "Labour (soft)",
  inflation: "Inflation",
  growth: "Growth",
  fed: "Fed",
  housing: "Housing",
  consumer: "Consumer",
  other: "Other",
};

export function familyOf(event: NewsEvent): Family {
  for (const rule of FAMILY_RULES) {
    if (rule.pattern.test(event.name)) return rule.family;
  }

  return "other";
}

export function familyLabel(family: Family): string {
  return FAMILY_LABELS[family];
}

/* =========================================================
   THE READ
   ========================================================= */

type Interpretation = {
  /** What the surprise says about the economy. */
  above: string;
  below: string;
  /** What it says about the dollar. */
  aboveLean: DollarLean;
  belowLean: DollarLean;
  /** How it usually lands across assets. */
  aboveMarket: string;
  belowMarket: string;
};

/*
  One entry per family. Each says what a beat means and what a miss means,
  because the two are not always mirror images — a lower reading of jobless
  claims is a stronger labour market, not a weaker one, and that family carries
  the inversion rather than the reader having to remember it.
*/
const INTERPRETATIONS: Record<Family, Interpretation> = {
  labour: {
    above: "labour market hotter than expected",
    below: "labour market softer than expected",
    aboveLean: "firmer",
    belowLean: "softer",
    aboveMarket: "yields up, dollar firm, equities cautious",
    belowMarket: "yields down, dollar soft, rate-cut odds improve",
  },
  /*
    The same market outcome, reached through the opposite sign. More claims is a
    weaker labour market, so a beat here leans the dollar the way a payrolls
    miss does.
  */
  "labour-loose": {
    above: "labour market loosening faster than expected",
    below: "labour market holding up better than expected",
    aboveLean: "softer",
    belowLean: "firmer",
    aboveMarket: "yields down, dollar soft, rate-cut odds improve",
    belowMarket: "yields up, dollar firm, equities cautious",
  },
  inflation: {
    above: "inflation stickier than expected",
    below: "inflation cooling faster than expected",
    aboveLean: "firmer",
    belowLean: "softer",
    aboveMarket: "yields up, dollar firm, equities pressured",
    belowMarket: "yields down, dollar soft, equities supported",
  },
  growth: {
    above: "activity stronger than expected",
    below: "activity weaker than expected",
    aboveLean: "firmer",
    belowLean: "softer",
    aboveMarket: "cyclicals bid, dollar firm, yields up",
    belowMarket: "growth concerns, dollar soft, yields down",
  },
  fed: {
    above: "policy more hawkish than expected",
    below: "policy more dovish than expected",
    aboveLean: "firmer",
    belowLean: "softer",
    aboveMarket: "yields up, dollar firm, equities down",
    belowMarket: "yields down, dollar soft, equities up",
  },
  housing: {
    above: "housing activity stronger than expected",
    below: "housing activity weaker than expected",
    aboveLean: "firmer",
    belowLean: "softer",
    aboveMarket: "dollar firm, yields up",
    belowMarket: "dollar soft, yields down",
  },
  consumer: {
    above: "consumer stronger than expected",
    below: "consumer weaker than expected",
    aboveLean: "firmer",
    belowLean: "softer",
    aboveMarket: "risk-on, dollar firm",
    belowMarket: "risk-off, dollar soft",
  },
  other: {
    above: "reading above forecast",
    below: "reading below forecast",
    aboveLean: "neutral",
    belowLean: "neutral",
    aboveMarket: "watch the prior reading for the trend",
    belowMarket: "watch the prior reading for the trend",
  },
};

/**
 * The read for one event, or null when the sheet gave no forecast to surprise
 * against. A release that has not printed has no read, which is a real absence
 * rather than a neutral one.
 */
export function readOf(event: NewsEvent): TradingRead | null {
  if (!event.against || !event.actual || !event.forecast) return null;

  const family = familyOf(event);
  const interpretation = INTERPRETATIONS[family];

  if (event.against === "in-line") {
    return {
      event,
      family,
      against: "in-line",
      lean: "neutral",
      read: "came in as forecast",
      market: "no fresh signal — the print was already priced",
    };
  }

  const beat = event.against === "above";

  return {
    event,
    family,
    against: event.against,
    lean: beat ? interpretation.aboveLean : interpretation.belowLean,
    read: beat ? interpretation.above : interpretation.below,
    market: beat ? interpretation.aboveMarket : interpretation.belowMarket,
  };
}

/* =========================================================
   THE MONTH'S PLAN
   ========================================================= */

export type MonthPlan = {
  reads: TradingRead[];
  /** Releases whose read leans the dollar firmer. */
  firmer: number;
  /** Releases whose read leans the dollar softer. */
  softer: number;
  /**
   * Releases that moved the dollar neither way: those that printed in line with
   * forecast, and those whose family carries no dollar lean at all. This is the
   * remainder that makes firmer + softer + flat equal the number of reads, so
   * the headline and the chips always agree.
   */
  flat: number;
  /** The family with the most releases this month, for the headline. */
  dominant: Family | null;
};

/**
 * Every released event in the month, as a read, strongest surprise first.
 *
 * "Strongest" is the size of the surprise measured against the forecast, so a
 * 60K payroll miss outranks a 0.1% inflation tick. That uses `surprise`, which
 * the reader already computes in the actual's own unit.
 */
export function planForMonth(month: NewsMonth): MonthPlan {
  return summarize(readsForEvents(month.events));
}

function summarize(reads: TradingRead[]): MonthPlan {
  const counts = new Map<Family, number>();
  for (const read of reads) {
    counts.set(read.family, (counts.get(read.family) ?? 0) + 1);
  }

  let dominant: Family | null = null;
  let best = 0;

  for (const [family, count] of counts) {
    if (count > best) {
      best = count;
      dominant = family;
    }
  }

  return {
    reads,
    firmer: reads.filter((read) => read.lean === "firmer").length,
    softer: reads.filter((read) => read.lean === "softer").length,
    flat: reads.filter((read) => read.lean === "neutral").length,
    dominant,
  };
}

/* =========================================================
   THE YEAR'S PLAN
   ========================================================= */

export type YearPlan = {
  /** One plan per month that had anything to read, in sheet order. */
  months: { month: NewsMonth; plan: MonthPlan }[];
  /** The year aggregated, for the headline. */
  total: MonthPlan;
};

/**
 * Every month of the year that printed a readable release, with the year's own
 * totals alongside.
 *
 * The year page is where the months sit next to each other, so the reads are
 * kept per month rather than merged into one list: a firmer dollar in April and
 * a softer one in October are two facts, not one average.
 */
export function planForYear(months: NewsMonth[]): YearPlan {
  const perMonth = months
    .map((month) => ({ month, plan: planForMonth(month) }))
    .filter((entry) => entry.plan.reads.length > 0);

  return {
    months: perMonth,
    total: summarize(perMonth.flatMap((entry) => entry.plan.reads)),
  };
}

/**
 * A surprise as a fraction of its forecast, so unlike units can be ranked.
 *
 * A 60K miss on a 89K forecast is a bigger story than a 0.1% tick on a 3.6%
 * forecast, and this is what makes those two comparable. A forecast of zero has
 * no meaningful ratio, so its surprise is taken at face value.
 */
function relativeSurprise(event: NewsEvent): number {
  const surprise = event.surprise?.amount;
  const forecast = event.forecast?.amount;

  if (surprise === undefined) return 0;
  if (!forecast) return Math.abs(surprise);

  return Math.abs(surprise / forecast);
}

/**
 * The reads for a set of events, strongest surprise first.
 *
 * `planForMonth` is the month-shaped caller; this is the one the month page
 * uses for a single week's rows.
 */
export function readsForEvents(events: NewsEvent[]): TradingRead[] {
  const reads: TradingRead[] = [];

  for (const event of events) {
    const read = readOf(event);
    if (read) reads.push(read);
  }

  return reads.sort(
    (left, right) => relativeSurprise(right.event) - relativeSurprise(left.event)
  );
}
