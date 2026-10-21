/* =========================================================
   NEWS — the sheet contract.

   One tab per month, named after the month, optionally with the year:

     OCT MASTER SHEET       the running sheet for October
     October 2026           October, explicitly 2026

   "MASTER SHEET" carries no year, so it is read as the year the page is
   rendered in. Spell the year out ("JULY 2026") whenever a tab belongs to a
   particular year, because the two drift apart the first New Year after the
   sheet stops being updated.

   Inside a tab is a macro event calendar, not one row per year:

     week | Event type | date , time (ist) | US time | actual | forcast | previous | USD Bias | …

   Columns are located by header NAME rather than by position. Two tabs in the
   same workbook already disagree about which columns they carry — October has
   a "US time" column and April does not — so a fixed column order would
   mis-read one of them. Reordering a column is therefore harmless, and a tab
   that drifts from the others gets reported rather than silently mis-read.

   Every comparison is computed here from the raw cells, never read from a
   formula cell:

     vs forecast   actual against forecast — the surprise;
     month on month  actual against the sheet's own "previous" column, which a
                     macro calendar fills with the prior reading of the same
                     event;
     year on year  actual against the same event, in the same month, one year
                   earlier, matched by event name.

   Year on year is blank until a tab for the earlier year exists. That is a
   real absence rather than a zero, and the page says so rather than printing
   a confident "0".

   Nothing in this module touches the network or the environment: it takes raw
   grids and returns the room. `news.ts` supplies the grids.
   ========================================================= */

/* ========================================================= */
/* MONTHS                                                    */
/* ========================================================= */

export const NEWS_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const NEWS_MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Tab names that the setup screen offers as examples of the convention. */
export const NEWS_TAB_EXAMPLES = ["October 2026", "OCT MASTER SHEET"] as const;

const MONTH_NUMBERS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

/** A month heading is only looked for within this many rows of the top. */
const HEADER_PROBE_ROWS = 12;

/* =========================================================
   TYPES
   ========================================================= */

/*
  A figure keeps the unit it was written in, because a macro calendar mixes
  them within one column: "197K" jobless claims and "54.5" PMI sit side by side.
  Comparing 197,000 to 54.5 would be meaningless, and rendering 197,000 as
  "197,000" throws away what the sheet actually said.
*/
export type ValueUnit = "number" | "percent" | "thousand" | "million" | "billion";

export type NewsValue = {
  /** The figure as the sheet writes it, in `unit` terms — "213K" is 213. */
  amount: number;
  unit: ValueUnit;
  /** The cell as it arrived, for tooltips and for debugging a bad row. */
  raw: string;
};

/** Which side of the forecast the actual came in on. */
export type Against = "above" | "below" | "in-line";

/**
 * An open and a close, as the gold sheet writes them: "4,498/4,396".
 *
 * Kept as two numbers rather than one string so the UI can lay them out and a
 * later reader can compute the move. `open` and `close` are null when the cell
 * was present but only half readable — the sheet has a few of those — and the
 * row then shows whichever half did parse.
 */
export type NewsRange = {
  open: number | null;
  close: number | null;
  /** The cell as it arrived, for tooltips and for debugging a bad row. */
  raw: string;
};

/**
 * The market's reaction around one release, from the gold sheet's OHLCV block.
 *
 * Every field is independently optional: the old sheet has none of this, the
 * gold sheet does not fill it for every row, and a month part-way through the
 * migration will hold a mix. A missing column therefore has to render as an
 * empty cell rather than a zero.
 */
export type NewsReaction = {
  /** The release-time candle's open, where the tab has that column. */
  candleOpen: number | null;
  /** The event day's open/close, as one cell. */
  eventDay: NewsRange | null;
  /** Contract volume on the event day. */
  eventVolume: number | null;
  /** Open interest at the event day's close. */
  eventOi: number | null;
  /** The date of the next trading day, as the sheet writes it. */
  nextDate: string | null;
  /** The next trading day's open/close. */
  nextDay: NewsRange | null;
  /** Contract volume on the next trading day. */
  nextVolume: number | null;
  /** Open interest at the next trading day's close. */
  nextOi: number | null;
};

/** True when a reaction carries no data at all, so its column stays hidden. */
export function isBlankReaction(reaction: NewsReaction | null): boolean {
  if (!reaction) return true;

  return (
    reaction.candleOpen === null &&
    reaction.eventDay === null &&
    reaction.nextDay === null &&
    reaction.nextDate === null
  );
}

export type NewsEvent = {
  /** Unique within the month, used as a React key. */
  key: string;
  name: string;
  /** The normalized name, used to match the event across months and years. */
  matchKey: string;
  /** The week heading this row sits under, carried down from the row above. */
  week: string | null;
  /** The release time as the sheet records it, in IST. */
  timeIst: string | null;
  /** The same release in US time, where the tab has that column. */
  timeUs: string | null;
  /** The release's date, where the tab has a column of its own for it. */
  releaseDate: string | null;
  actual: NewsValue | null;
  forecast: NewsValue | null;
  /** The sheet's own "previous" column — the prior reading of this event. */
  previous: NewsValue | null;
  /** actual − forecast, in the actual's unit. */
  surprise: NewsValue | null;
  /** actual − previous. Month on month. */
  mom: NewsValue | null;
  /** actual against the same event a year earlier, in the actual's unit. */
  yoy: NewsValue | null;
  against: Against | null;
  bias: string | null;
  bond: string | null;
  yield: string | null;
  nas100: string | null;
  notes: string | null;
  /** The gold sheet's OHLCV around the release, where that tab carries it. */
  reaction: NewsReaction | null;
};

export type NewsWeek = {
  label: string;
  events: NewsEvent[];
};

export type NewsMonthCounts = {
  /** Rows that name an event. */
  events: number;
  /** Rows carrying an actual figure. */
  reported: number;
  above: number;
  below: number;
  inLine: number;
  /** Rows the sheet gave both an actual and a previous reading for. */
  moved: number;
};

export type NewsMonth = {
  year: number;
  /** 1–12. */
  month: number;
  monthName: string;
  monthShort: string;
  /** Two-digit URL segment, e.g. "01". */
  monthSlug: string;
  /** The tab this month was read from. */
  tab: string;
  /** True when the tab name spells the year out rather than implying it. */
  dated: boolean;
  events: NewsEvent[];
  /** The same events grouped under their week heading, in sheet order. */
  weeks: NewsWeek[];
  counts: NewsMonthCounts;
};

export type NewsArchive = {
  /** Every month the sheet exposes, oldest first. */
  months: NewsMonth[];
  /** Distinct years, newest first. */
  years: number[];
  /** Problems met while reading, shown in the setup banner. */
  warnings: string[];
};

/** One month's raw grid, and the tab it came from. */
export type NewsTabGrid = {
  tab: string;
  rows: unknown[][];
};

export type NewsTabName = {
  month: number;
  year: number;
  /** False when the year was inferred from the render date. */
  dated: boolean;
};

/* =========================================================
   MONTH NAMES
   ========================================================= */

export function monthNameOf(month: number): string {
  return NEWS_MONTH_NAMES[month - 1] ?? String(month);
}

export function monthShortOf(month: number): string {
  return NEWS_MONTH_SHORT[month - 1] ?? String(month);
}

export function monthSlugOf(month: number): string {
  return String(month).padStart(2, "0");
}

/** "October" / "Oct" / "OCT" -> 10, or null for anything else. */
export function monthNumberOf(value: string): number | null {
  return MONTH_NUMBERS[value.trim().toLowerCase()] ?? null;
}

/**
 * Read a tab name as a month.
 *
 * The primary rule is narrow: the tab has to *start* with a month. That is what
 * separates the monthly tabs from the rest of a workbook — the auction report,
 * the rig count, the EIA report — without a hard-coded list of names to ignore,
 * which would silently swallow a new tab the day someone adds one.
 *
 * A second workbook names its tabs the other way round — "GOLD SEPTEMBER
 * TRACKER", "OCTOBER GOLD REPORT" — with the month in the middle. So when the
 * name does not start with a month, the month is looked for anywhere in it. The
 * asymmetry is deliberate: "starts with a month" stays the rule that keeps
 * "US auction report" and "sources" out, and the fallback only fires when a
 * month word is actually present.
 */
export function parseNewsTabName(
  title: string,
  fallbackYear: number
): { month: number; year: number; dated: boolean } | null {
  const tokens = title.trim().toLowerCase().split(/[\s_.-]+/).filter(Boolean);

  if (tokens.length === 0) return null;

  const leading = monthNumberOf(tokens[0]);

  const month =
    leading ??
    // The fallback: the first token anywhere in the name that names a month.
    tokens.reduce<number | null>((found, token) => {
      if (found !== null) return found;

      return monthNumberOf(token);
    }, null);

  if (month === null) return null;

  const yearToken = tokens
    .slice(1)
    .find((token) => /^(19|20|21)\d{2}$/.test(token));

  return yearToken
    ? { month, year: Number(yearToken), dated: true }
    : { month, year: fallbackYear, dated: false };
}

/* =========================================================
   VALUE PARSING
   ========================================================= */

const UNIT_SCALES: Record<ValueUnit, number> = {
  number: 1,
  percent: 1,
  thousand: 1e3,
  million: 1e6,
  billion: 1e9,
};

/** The figure in plain units: "213K" is 213,000. */
export function baseAmount(value: NewsValue): number {
  return value.amount * UNIT_SCALES[value.unit];
}

function isBlank(cell: unknown): boolean {
  return cell === null || cell === undefined || String(cell).trim() === "";
}

/*
  A figure, a run of unit letters, and an optional trailing annotation:

    197K               → 197, thousand
    4.20%              → 4.2, percent
    6,657 B            → 6657, billion
    3.9%%              → 3.9, percent (a typo, but an unambiguous one)
    0.086% (8 ponts)   → 0.086, percent

  Anything else is not a figure and comes back null, which is the important
  half. "4.06 - 3.860 = 0.20%" is a worked example, not a value, and reading a
  number out of it would put a plausible wrong figure on the page.
*/
const VALUE_PATTERN = /^([+-]?)(\d[\d,]*(?:\.\d+)?)([%kKmMbB]*)(\([^)]*\))?$/;

/** Thousands grouping is all-or-nothing, so "4,20" is rejected, not read as 420. */
function parseAmountToken(token: string): number | null {
  if (token.includes(",")) {
    if (!/^\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(token)) return null;
    return Number(token.replace(/,/g, ""));
  }

  if (!/^\d+(?:\.\d+)?$|^\.\d+$/.test(token)) return null;

  return Number(token);
}

function unitOf(letters: string): ValueUnit {
  const last = letters.slice(-1).toLowerCase();

  if (last === "%") return "percent";
  if (last === "k") return "thousand";
  if (last === "m") return "million";
  if (last === "b") return "billion";

  return "number";
}

/**
 * Read one cell as a figure.
 *
 * Callers must ask the Sheets API for FORMATTED_VALUE: a cell formatted as a
 * percentage comes back as `0.042` when unformatted, and the percent sign is
 * the only thing that says it meant 4.2%.
 */
export function parseNewsValue(cell: unknown): NewsValue | null {
  if (cell === null || cell === undefined) return null;

  if (typeof cell === "number") {
    return Number.isFinite(cell)
      ? { amount: cell, unit: "number", raw: String(cell) }
      : null;
  }

  const raw = String(cell).trim();
  if (!raw) return null;

  let text = raw.replace(/[\s$€£₹]/g, "");
  if (!text) return null;

  // Accountancy negatives: (1,234) is −1,234.
  let negative = false;

  if (text.startsWith("(") && text.endsWith(")")) {
    negative = true;
    text = text.slice(1, -1);
  }

  const match = VALUE_PATTERN.exec(text);
  if (!match) return null;

  const parsed = parseAmountToken(match[2]);
  if (parsed === null) return null;

  const signed = match[1] === "-" ? -parsed : parsed;

  return {
    amount: negative ? -signed : signed,
    unit: unitOf(match[3]),
    raw,
  };
}

/* =========================================================
   GOLD REACTION PARSING
   ========================================================= */

/**
 * A plain count — a price, a volume, an open interest.
 *
 * Thousands grouping is tolerated but not required, because the gold sheet is
 * inconsistent about it: some cells read "4,503/4,365" and others the same day
 * "4503/4,365". Demanding the comma would drop a real figure over a formatting
 * slip, which is the wrong trade — the number is unambiguous either way.
 */
function parsePlainNumber(cell: unknown): number | null {
  if (cell === null || cell === undefined) return null;

  if (typeof cell === "number") {
    return Number.isFinite(cell) ? cell : null;
  }

  const text = String(cell).replace(/[\s,]/g, "").trim();
  if (!text) return null;

  return /^[+-]?\d+(?:\.\d+)?$/.test(text) ? Number(text) : null;
}

/**
 * An "open/close" pair, as the gold sheet writes it: "4,498/4,396".
 *
 * The separators are optional and either side may be missing — the sheet has a
 * few half-filled cells — so each half is parsed on its own and a row keeps
 * whatever it got. A cell with no slash at all is read as an open with no close,
 * which is how the release-time candle column is written.
 */
function parseRange(cell: unknown): NewsRange | null {
  if (cell === null || cell === undefined) return null;

  const raw = String(cell).trim();
  if (!raw) return null;

  const [openPart, closePart] = raw.split("/");

  const open = parsePlainNumber(openPart);
  const close = closePart === undefined ? null : parsePlainNumber(closePart);

  if (open === null && close === null) return null;

  return { open, close, raw };
}

/* =========================================================
   COMPARISONS
   ========================================================= */

/** Relative tolerance, so a float that should be equal reads as equal. */
function sameAmount(left: number, right: number): boolean {
  const scale = Math.max(1, Math.abs(left), Math.abs(right));

  return Math.abs(left - right) <= scale * 1e-9;
}

/**
 * The difference between two figures, expressed in the first one's unit.
 *
 * Returns null when either side is missing. That is the common case: the sheet
 * leaves `actual` blank until a release happens, and `previous` blank for the
 * first month of a series.
 */
export function changeBetween(
  current: NewsValue | null,
  previous: NewsValue | null
): NewsValue | null {
  if (!current || !previous) return null;

  const difference = baseAmount(current) - baseAmount(previous);

  return {
    amount: difference / UNIT_SCALES[current.unit],
    unit: current.unit,
    raw: "",
  };
}

function againstForecast(
  actual: NewsValue | null,
  forecast: NewsValue | null
): Against | null {
  if (!actual || !forecast) return null;

  const left = baseAmount(actual);
  const right = baseAmount(forecast);

  if (sameAmount(left, right)) return "in-line";

  return left > right ? "above" : "below";
}

/**
 * Collapse an event name to what identifies it across tabs.
 *
 * Releases carry the reference month in parentheses — "NFP (Sep)" in October's
 * tab is the same event as "NFP (Aug)" in September's — so parentheticals go.
 * Emoji and decorations go with them, because the flags that mark how hot a
 * release is are not part of its name.
 *
 * Two tails are dropped as well, because the tabs disagree about how much of a
 * release's title they bother writing:
 *
 *   "ISM Manufacturing PMI"        ≡  "ISM Manufacturing"
 *   "Core PCE Price Index (YoY)"   ≡  "Core PCE (YoY)"
 *
 * The tails are ordered so the longer one is stripped first: "price index" is
 * tried before "index", and "pmi" last. Two different releases can still share
 * the string this produces — "non ISM manufacturing" is not the same series as
 * "ISM Non-Manufacturing PMI" in this workbook — and that limit is deliberate.
 * A looser match would invent a year-on-year figure for a pair that never
 * shared a release, which is worse than leaving the column blank.
 */
/*
  Two spellings of one release, keyed to the single name they both mean.

  This is an *allow-list* on purpose. The whole point of `normalizeEventName` is
  to decide when two rows are the same series, and the one mistake that cannot
  be tolerated is merging two different releases: that invents a year-on-year
  figure for a pair that never shared a source. A fuzzy edit-distance match would
  do exactly that the first time two unrelated names sit close together. Naming
  each equivalence by hand keeps every merge deliberate.

  The entries below are the ones the two workbooks actually need: the gold sheet
  spells releases out ("Non-Farm Payrolls (NFP)", "Consumer Price Index (CPI
  YoY)") where the auction sheet shortens them ("NFP", "CPI (YoY)"), and one
  release was renamed by its publisher.
*/
const EVENT_ALIASES: Record<string, string> = {
  // The publisher's own rename: ISM dropped "Non-Manufacturing" in 2020.
  "ism services": "ism services pmi",
  "ism non manufacturing": "ism services pmi",
  "ism nonmanufacturing": "ism services pmi",

  // The Fed's rate decision, written either by institution or by committee.
  "fed interest rate decision": "interest rate decision",
  "fomc interest rate decision": "interest rate decision",

  // Payrolls: the acronym, the hyphenated form and the run-together form.
  nfp: "non farm payrolls",
  nonfarm: "non farm payrolls",

  // A "MoM" tail is the same series as the bare name in this workbook.
  "average hourly earnings mom": "average hourly earnings",

  /*
    The releases whose gold-sheet spelling carries the acronym *and* the period
    ("Consumer Price Index (CPI YoY)") where the auction sheet writes either just
    one of them ("CPI (YoY)") or the bare acronym. Each resolves to the key the
    auction sheet's short form produces, so both land on one row.
  */
  "consumer price index": "cpi yoy",
  "consumer price index cpi": "cpi yoy",
  cpi: "cpi yoy",
  "producer price index": "ppi yoy",
  "producer price index ppi": "ppi yoy",
  ppi: "ppi yoy",
  "non farm payrolls nfp": "non farm payrolls",
  "nonfarm payrolls": "non farm payrolls",
};

/**
 * Period qualifiers that the two sheets disagree about writing.
 *
 * The auction sheet says "CPI (YoY)" and the gold sheet "Consumer Price Index
 * (CPI YoY)" — same number, same release. The qualifier is dropped so both read
 * as "cpi", and `EVENT_ALIASES` then maps that to the shared key. Dropping it is
 * safe here only because every qualifier in this workbook is a *period* — MoM,
 * YoY, QoQ — and never the thing that distinguishes one release from another.
 */
const PERIOD_QUALIFIERS = new Set([
  "yoy",
  "mom",
  "qoq",
  "yy",
  "mm",
  "year on year",
  "month on month",
]);

/**
 * Is this token a period qualifier? "yoy" and "y/y" both read the same once the
 * punctuation is stripped, which is why the set holds the collapsed form.
 */
function isPeriodQualifier(token: string): boolean {
  return PERIOD_QUALIFIERS.has(token);
}

export function normalizeEventName(name: string): string {
  /*
    Bracketed text is taken out and kept, because the brackets usually hold the
    release's *canonical* name: "Consumer Price Index (CPI YoY)" is, to every
    calendar and every matching rule, "CPI". Dropping the bracket outright would
    leave "consumer price index" → "consumer", which is both wrong and dangerous
    — it would collide with a genuine Consumer Sentiment row. The bracket's words
    are kept and the surrounding words follow them, so both spellings of one
    release collapse to the same string.
  */
  const bracketed = [...name.matchAll(/\(([^)]*)\)/g)]
    .map((match) => match[1])
    .join(" ");

  const collapsed = `${name.replace(/\([^)]*\)/g, " ")} ${bracketed}`
    .replace(/[^\x20-\x7E]/g, " ") // emoji and other non-ASCII decoration
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const withoutQualifiers = collapsed
    .split(" ")
    .filter((token) => !isPeriodQualifier(token))
    .join(" ")
    .trim();

  const trimmed = withoutQualifiers
    .replace(/\s+price index$/, "")
    .replace(/\s+index$/, "")
    .replace(/\s+pmi$/, "")
    .trim();

  return EVENT_ALIASES[trimmed] ?? trimmed;
}

function slugify(value: string): string {
  return value.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** "NFP (Sep)" reads as "NFP" once it is a heading rather than a sheet row. */
export function readableEventName(name: string): string {
  const stripped = name
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return stripped || name;
}

/* =========================================================
   COLUMN MATCHING
   ========================================================= */

type EventField =
  | "event"
  | "timeIst"
  | "timeUs"
  | "releaseDate"
  | "actual"
  | "forecast"
  | "previous"
  | "bias"
  | "bond"
  | "yield"
  | "nas100"
  | "notes"
  | "candleOpen"
  | "eventDayRange"
  | "eventVolume"
  | "eventOi"
  | "nextDate"
  | "nextDayRange"
  | "nextVolume"
  | "nextOi";

/*
  Headings are compared with all whitespace removed, so "US time" ≡ "us time".

  The gold sheet names its columns differently again — "News Event" for the
  event, "Release Time (IST)" and "Release Time (US ET)" for the times — so those
  join the lists alongside the auction sheet's "Event type" and
  "date , time (ist)". Both spellings flow into the same field, which is what
  lets one parser read either workbook.

  The gold sheet also names its OHLCV columns two ways: October and June say
  "Event Day Open/Close" / "Event Day Volume" / "Event Day OI", while September
  says "Day Open/Close" / " Volume" / "  OI". Both variants are listed, and the
  whitespace stripping means the stray leading spaces cost nothing.
*/
const FIELD_HEADINGS: Record<EventField, string[]> = {
  event: [
    "event",
    "eventtype",
    "eventname",
    "events",
    "indicator",
    "release",
    "newsevent",
  ],
  timeIst: [
    "date,time(ist)",
    "date,time",
    "datetime",
    "date",
    "time",
    "ist",
    "time(ist)",
    "isttime",
    "releasetime(ist)",
    "releasetime",
  ],
  releaseDate: ["releasedate"],
  timeUs: [
    "ustime",
    "time(us)",
    "time(est)",
    "esttime",
    "releasetime(uset)",
    "releasetime(us)",
    "uset",
  ],
  actual: ["actual", "act", "actualvalue", "result", "results"],
  forecast: ["forcast", "forecast", "consensus", "expected", "estimate", "projection"],
  previous: ["previous", "prev", "prior", "previousvalue", "last"],
  bias: ["usdbias", "bias", "direction"],
  bond: ["bond", "bonds"],
  yield: ["yeild", "yield"],
  nas100: ["nas100", "nasdaq"],
  notes: ["notes", "note", "comments", "comment", "commentary", "remarks"],
  candleOpen: ["release-timecandleopen", "releasetimecandleopen", "candleopen"],
  eventDayRange: ["eventdayopen/close", "dayopen/close", "eventdayopenclose"],
  eventVolume: ["eventdayvolume", "volume"],
  eventOi: ["eventdayoi", "oi", "openinterest"],
  nextDate: ["nexttradingdaydate", "nexttradingdate", "nextdaydate"],
  nextDayRange: ["nextdayopen/close", "nexttradingdayopen/close", "nextdayopenclose"],
  nextVolume: ["nextdayvolume", "nexttradingdayvolume"],
  nextOi: ["nextdayoi", "nexttradingdayoi"],
};

const EVENT_HEADINGS = new Set(FIELD_HEADINGS.event);

/** "date , time (ist)" and "Date,Time (IST)" read the same. */
function compact(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

/** The week column is the only heading matched by prefix: "week", "week Sep". */
function isWeekHeading(compactHeading: string): boolean {
  return compactHeading.startsWith("week");
}

function matchFieldHeading(compactHeading: string): EventField | null {
  if (!compactHeading) return null;

  for (const [field, headings] of Object.entries(FIELD_HEADINGS) as [
    EventField,
    string[],
  ][]) {
    if (headings.includes(compactHeading)) return field;
  }

  return null;
}

/*
  A tab can hold more than one table. The 2025 tabs carry the event calendar
  first and a "Section 2: Fed Liquidity Tracker" underneath it — a balance-sheet
  series with its own header row (`date | Fed's Balance sheet | previous | …`)
  and its own rows. Left alone, those rows read as events: the event column
  holds a date like "October3" and the "previous" column holds a figure, which
  is exactly the shape of a release whose actual has not printed yet.

  The second table is recognised by its header rather than by its title, because
  the title lives in a merged cell that Google returns as a single unlabelled
  string and cannot be relied on. A row is another table's header when its first
  cell is itself a column heading and the row names at least one more — which no
  data row does, since a data row starts with the event's name and a week label.
*/
const SECTION_HEADING_CELLS = 2;

function headingsInRow(row: unknown[]): number {
  return (row ?? []).filter((cell) => {
    const heading = compact(cell);
    if (!heading) return false;

    return isWeekHeading(heading) || matchFieldHeading(heading) !== null;
  }).length;
}

function isSecondTableHeader(row: unknown[]): boolean {
  const first = compact((row ?? [])[0]);
  if (!first) return false;

  const leadsWithHeading =
    isWeekHeading(first) || matchFieldHeading(first) !== null;

  return leadsWithHeading && headingsInRow(row) >= SECTION_HEADING_CELLS;
}

/** Where the event table ends: the row before another table's header, or all of it. */
function eventTableEnd(rows: unknown[][], headerIndex: number): number {
  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    if (isSecondTableHeader(rows[index] ?? [])) return index;
  }

  return rows.length;
}

/* =========================================================
   MONTH PARSING
   ========================================================= */

function findHeaderRow(rows: unknown[][]): number {
  const limit = Math.min(rows.length, HEADER_PROBE_ROWS);

  for (let index = 0; index < limit; index += 1) {
    for (const cell of rows[index] ?? []) {
      if (EVENT_HEADINGS.has(compact(cell))) return index;
    }
  }

  return -1;
}

/** Read the cell at `index` as trimmed text, or null when it is empty. */
function readText(row: unknown[], index: number | undefined): string | null {
  if (index === undefined) return null;

  const value = row[index];
  if (isBlank(value)) return null;

  return String(value).trim();
}

type ColumnMap = Partial<Record<EventField | "week", number>>;

function classifyColumns(
  headerRow: unknown[],
  warn: (message: string) => void,
  tab: string
): ColumnMap {
  const map: ColumnMap = {};

  headerRow.forEach((cell, index) => {
    const heading = compact(cell);
    if (!heading) return;

    if (isWeekHeading(heading)) {
      if (map.week === undefined) map.week = index;
      return;
    }

    const field = matchFieldHeading(heading);
    if (!field) return;

    if (map[field] !== undefined) {
      warn(
        `${tab}: two columns are headed "${String(cell).trim()}" — reading the first and ignoring the column at position ${index + 1}.`
      );
      return;
    }

    map[field] = index;
  });

  return map;
}

/**
 * Turn one month's tab into events.
 *
 * A row counts as an event when it names one and says something else as well:
 * an actual, a forecast, a previous reading or a release time. That keeps the
 * week headings ("Week 1" on a row of its own) and stray notes out of the list
 * without needing to know what any particular release is called.
 *
 * The warnings come back rather than going straight into the archive, because
 * which tab wins a month is decided after this runs — reporting a problem with
 * a tab that then loses is noise, and hiding the one that loses would be worse.
 */
function parseEventTab(grid: { tab: string; rows: unknown[][] }): {
  events: NewsEvent[];
  warnings: string[];
} {
  const { rows, tab } = grid;
  const warnings: string[] = [];
  const warn = (message: string) => warnings.push(message);
  const headerIndex = findHeaderRow(rows);

  if (headerIndex === -1) {
    /*
      An empty tab is a month somebody has created but not filled in yet, and
      there is nothing wrong with that — it is how the next month starts. Only a
      tab that actually holds content and still has no header is a mistake worth
      reporting.
    */
    const hasContent = rows.some((row) =>
      (row ?? []).some((cell) => !isBlank(cell))
    );

    if (hasContent) {
      warn(
        `${tab}: no header row found — it needs a column named "Event type" ` +
          `in the first ${HEADER_PROBE_ROWS} rows.`
      );
    }

    return { events: [], warnings };
  }

  const columns = classifyColumns(rows[headerIndex] ?? [], warn, tab);

  if (columns.actual === undefined && columns.forecast === undefined) {
    warn(
      `${tab}: neither an "actual" nor a "forecast" column was found, ` +
        `so no figures could be read.`
    );
  }

  const tableEnd = eventTableEnd(rows, headerIndex);

  if (tableEnd < rows.length) {
    warn(
      `${tab}: stopped at a second table below the events (row ${tableEnd + 1}), ` +
        `so only the event calendar above it was read.`
    );
  }

  const events: NewsEvent[] = [];
  const usedKeys = new Set<string>();
  let week: string | null = null;

  for (const row of rows.slice(headerIndex + 1, tableEnd)) {
    if (!row) continue;

    const nextWeek = readText(row, columns.week);
    if (nextWeek) week = nextWeek;

    const name = readText(row, columns.event);
    if (!name) continue;

    // A week heading that landed in the event column is a section marker.
    if (/^week\b/i.test(name)) continue;

    const actual = parseNewsValue(
      columns.actual === undefined ? null : row[columns.actual]
    );
    const forecast = parseNewsValue(
      columns.forecast === undefined ? null : row[columns.forecast]
    );
    const previous = parseNewsValue(
      columns.previous === undefined ? null : row[columns.previous]
    );

    const timeIst = readText(row, columns.timeIst);
    const timeUs = readText(row, columns.timeUs);

    /*
      The gold reaction is built from whichever of its columns this tab has. The
      old sheet has none of them, so every field stays null and the block is
      dropped — `isBlankReaction` then keeps the second table off the page.
    */
    const reaction: NewsReaction = {
      candleOpen: parsePlainNumber(
        columns.candleOpen === undefined ? null : row[columns.candleOpen]
      ),
      eventDay: parseRange(
        columns.eventDayRange === undefined ? null : row[columns.eventDayRange]
      ),
      eventVolume: parsePlainNumber(
        columns.eventVolume === undefined ? null : row[columns.eventVolume]
      ),
      eventOi: parsePlainNumber(
        columns.eventOi === undefined ? null : row[columns.eventOi]
      ),
      nextDate: readText(row, columns.nextDate),
      nextDay: parseRange(
        columns.nextDayRange === undefined ? null : row[columns.nextDayRange]
      ),
      nextVolume: parsePlainNumber(
        columns.nextVolume === undefined ? null : row[columns.nextVolume]
      ),
      nextOi: parsePlainNumber(
        columns.nextOi === undefined ? null : row[columns.nextOi]
      ),
    };

    // A row has to say something beyond the event's name to be an event.
    if (!actual && !forecast && !previous && !timeIst && !timeUs) continue;

    const matchKey = normalizeEventName(name) || slugify(name) || name;

    let key = slugify(matchKey) || "event";
    let attempt = 2;

    while (usedKeys.has(key)) {
      key = `${slugify(matchKey) || "event"}-${attempt}`;
      attempt += 1;
    }

    usedKeys.add(key);

    events.push({
      key,
      name,
      matchKey,
      week,
      timeIst,
      timeUs,
      releaseDate: readText(row, columns.releaseDate),
      actual,
      forecast,
      previous,
      surprise: changeBetween(actual, forecast),
      mom: changeBetween(actual, previous),
      yoy: null,
      against: againstForecast(actual, forecast),
      bias: readText(row, columns.bias),
      bond: readText(row, columns.bond),
      yield: readText(row, columns.yield),
      nas100: readText(row, columns.nas100),
      notes: readText(row, columns.notes),
      reaction: isBlankReaction(reaction) ? null : reaction,
    });
  }

  return { events, warnings };
}

/* =========================================================
   GROUPING
   ========================================================= */

function groupByWeek(events: NewsEvent[]): NewsWeek[] {
  const weeks: NewsWeek[] = [];

  for (const event of events) {
    const label = event.week ?? "Without a week heading";
    const last = weeks.at(-1);

    if (last && last.label === label) {
      last.events.push(event);
      continue;
    }

    weeks.push({ label, events: [event] });
  }

  return weeks;
}

function countOf(events: NewsEvent[]): NewsMonthCounts {
  let reported = 0;
  let above = 0;
  let below = 0;
  let inLine = 0;
  let moved = 0;

  for (const event of events) {
    if (event.actual) reported += 1;
    if (event.against === "above") above += 1;
    if (event.against === "below") below += 1;
    if (event.against === "in-line") inLine += 1;
    if (event.mom) moved += 1;
  }

  return { events: events.length, reported, above, below, inLine, moved };
}

/* =========================================================
   ARCHIVE
   ========================================================= */

type Candidate = {
  month: number;
  year: number;
  dated: boolean;
  tab: string;
  events: NewsEvent[];
  /** Problems this tab produced on its own, reported only if it wins. */
  notes: string[];
  /**
   * True when the tab held anything at all.
   *
   * This separates an empty placeholder — a tab somebody created ahead of the
   * month, which is not a mistake — from a tab that has content but could not be
   * read, which always is. Both produce no events, so the events alone cannot
   * tell them apart.
   */
  hasContent: boolean;
};

/**
 * How well populated one row is, used to decide which sheet's version of a
 * shared release to keep.
 *
 * The gold row wins on a tie because it carries the forecast and the OHLCV that
 * the auction sheet's 2026 tabs lack. Scoring rather than a fixed "gold always
 * wins" keeps that honest: if a future tab is richer still, it takes the row.
 */
function reactionScore(event: NewsEvent): number {
  let score = 0;

  if (event.actual) score += 1;
  if (event.forecast) score += 1;
  if (event.previous) score += 1;
  if (event.reaction) score += 1;
  if (event.timeUs) score += 1;

  return score;
}

/**
 * Fold the tabs covering one month into a single month, event by event.
 *
 * The first tab sets the month's identity — its year, its dated flag and its
 * name — and every tab's rows are then keyed by `matchKey`, so two spellings of
 * one release ("NFP" and "Non-Farm Payrolls (NFP)") land on one row. Where both
 * tabs carry the same release the better-populated row wins; a row only one tab
 * has is kept as it stands.
 *
 * `key` is re-slugged at the end because two tabs can each hold a row whose key
 * was unique within its own tab ("ism-manufacturing-pmi") and the merged list
 * needs one key per row.
 */
function mergeCandidates(group: Candidate[]): Candidate {
  const first = group[0];

  const order: string[] = [];
  const byKey = new Map<string, NewsEvent>();

  for (const candidate of group) {
    for (const event of candidate.events) {
      const existing = byKey.get(event.matchKey);

      if (!existing) {
        byKey.set(event.matchKey, event);
        order.push(event.matchKey);
        continue;
      }

      if (reactionScore(event) > reactionScore(existing)) {
        byKey.set(event.matchKey, event);
      }
    }
  }

  const usedKeys = new Set<string>();
  const events = order.map((matchKey) => {
    const event = byKey.get(matchKey) as NewsEvent;

    let key = slugify(event.matchKey) || "event";
    let attempt = 2;

    while (usedKeys.has(key)) {
      key = `${slugify(event.matchKey) || "event"}-${attempt}`;
      attempt += 1;
    }

    usedKeys.add(key);

    return { ...event, key };
  });

  return {
    month: first.month,
    year: first.year,
    dated: group.some((candidate) => candidate.dated),
    tab: group.map((candidate) => candidate.tab).join(" + "),
    events,
    notes: [],
    hasContent: group.some((candidate) => candidate.hasContent),
  };
}

/**
 * Assemble the room from the grids that were read.
 *
 * Pure: same grids in, same archive out. `seedWarnings` carries problems the
 * reader hit before parsing (a spreadsheet it could not list, a tab it could
 * not fetch) so everything wrong with the setup appears in one banner.
 */
export function buildNewsArchive(
  grids: { tab: string; rows: unknown[][] }[],
  fallbackYear: number,
  seedWarnings: string[] = []
): NewsArchive {
  const warnings: string[] = [];
  const warn = (message: string) => {
    if (!warnings.includes(message)) warnings.push(message);
  };

  for (const warning of seedWarnings) warn(warning);

  /* ---------- read every month tab ---------- */

  const bySlot = new Map<string, Candidate[]>();

  for (const grid of grids) {
    const parsed = parseNewsTabName(grid.tab, fallbackYear);

    if (!parsed) {
      warn(`${grid.tab}: not named after a month, so this tab was skipped.`);
      continue;
    }

    const { events, warnings: notes } = parseEventTab(grid);

    const hasContent = grid.rows.some((row) =>
      (row ?? []).some((cell) => !isBlank(cell))
    );

    const candidate: Candidate = {
      ...parsed,
      tab: grid.tab,
      events,
      notes,
      hasContent,
    };

    const slot = `${candidate.year}-${String(candidate.month).padStart(2, "0")}`;
    const group = bySlot.get(slot);

    if (group) group.push(candidate);
    else bySlot.set(slot, [candidate]);
  }

  /*
    A month can be covered by more than one tab, and during the migration from
    the auction report to the gold report it *is*: May, June, September and
    October 2026 all exist in both workbooks at once.

    Picking one tab and discarding the other would be wrong in both directions.
    Neither sheet is complete on its own — the gold sheet carries forecast and
    OHLCV for the overlap months while the auction sheet carries rows gold lacks
    ("Fed Waller Speaks", "Federal Budget Balance", "NFP (Aug)") and is the only
    source for 2025 and for the 2026 months gold has not filled in. So the two
    are folded together per *event*, not per month:

      - a release both sheets name is one row, with the gold reading preferred
        (it has the forecast and the OHLCV; the auction sheet's 2026 tabs have
        blank forecasts)
      - a release only one sheet names is kept as it stands
      - the week heading and the row order follow the first tab that carried the
        month, so the calendar keeps its shape

    When every month has moved across and the auction sheet contributes nothing,
    this reduces to reading the gold sheet alone — no second code change.
  */

  const candidates: Candidate[] = [];

  for (const group of bySlot.values()) {
    const merged = group.length > 1 ? mergeCandidates(group) : group[0];

    /*
      A merge is only worth reporting when it actually rescued rows — when more
      than one tab put events into the month. During the migration every overlap
      month has a second tab, and reporting each one would fill the setup banner
      with notices that are the expected state, not a problem. A tab that turned
      out to be an empty placeholder adds nothing, so it stays quiet; the month
      page's "From … and …" line already names every contributing tab.
    */
    const contributors = group.filter((candidate) => candidate.events.length > 0);

    if (group.length > 1 && contributors.length > 1) {
      warn(
        `${monthNameOf(merged.month)} ${merged.year} is covered by ` +
          `${contributors.length} tabs (${contributors
            .map((item) => `"${item.tab}"`)
            .join(", ")}), so their events were combined into one month.`
      );
    }

    for (const candidate of group) {
      /*
        A candidate that was folded in still had problems worth reporting — a
        column it could not read, a second table it stopped at. What is dropped
        is the silence of an empty placeholder: a tab with nothing in it has no
        complaint to make, and during the migration the gold sheet has several
        months created ahead of time.
      */
      if (!candidate.hasContent) continue;

      for (const note of candidate.notes) warn(note);
    }

    if (merged.events.length === 0 && merged.notes.length === 0) {
      warn(
        `${merged.tab}: ${monthNameOf(merged.month)} ${merged.year} ` +
          `has no events yet, so it shows as an empty month.`
      );
    }

    candidates.push(merged);
  }

  candidates.sort(
    (left, right) => left.year - right.year || left.month - right.month
  );

  /* ---------- turn them into months ---------- */

  const months: NewsMonth[] = candidates.map((candidate) => {
    const events = candidate.events;

    return {
      year: candidate.year,
      month: candidate.month,
      monthName: monthNameOf(candidate.month),
      monthShort: monthShortOf(candidate.month),
      monthSlug: String(candidate.month).padStart(2, "0"),
      tab: candidate.tab,
      dated: candidate.dated,
      events,
      weeks: groupByWeek(events),
      counts: countOf(events),
    };
  });

  /* ---------- year on year ---------- */

  const byMonthKey = new Map<string, NewsMonth>();

  for (const month of months) {
    byMonthKey.set(`${month.year}-${month.monthSlug}`, month);
  }

  for (const month of months) {
    const earlier = byMonthKey.get(
      `${month.year - 1}-${month.monthSlug}`
    );

    if (!earlier) continue;

    const earlierByMatch = new Map<string, NewsEvent>();

    for (const event of earlier.events) {
      if (event.actual && !earlierByMatch.has(event.matchKey)) {
        earlierByMatch.set(event.matchKey, event);
      }
    }

    for (const event of month.events) {
      const counterpart = earlierByMatch.get(event.matchKey);
      if (!counterpart) continue;

      event.yoy = changeBetween(event.actual, counterpart.actual);
    }
  }

  const years = [...new Set(months.map((month) => month.year))].sort(
    (left, right) => right - left
  );

  return { months, years, warnings };
}

/* =========================================================
   LOOKUPS
   ========================================================= */

export function findNewsMonth(
  archive: NewsArchive,
  year: number,
  month: number
): NewsMonth | undefined {
  return archive.months.find(
    (entry) => entry.year === year && entry.month === month
  );
}

/** Every month the archive holds for one year, oldest first. */
export function newsMonthsForYear(
  archive: NewsArchive,
  year: number
): NewsMonth[] {
  return archive.months.filter((entry) => entry.year === year);
}

/**
 * The window of months ending at `(year, month)`, oldest first — the points a
 * trend line should join.
 */
export function newsTrendWindow(
  archive: NewsArchive,
  year: number,
  month: number,
  length = 12
): NewsMonth[] {
  const end = `${year}-${String(month).padStart(2, "0")}`;

  return archive.months
    .filter((entry) => `${entry.year}-${entry.monthSlug}` <= end)
    .slice(-length);
}
