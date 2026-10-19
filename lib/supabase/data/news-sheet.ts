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
 * The rule is deliberately narrow: the tab has to *start* with a month. That is
 * what separates the monthly tabs from the rest of this workbook — the auction
 * report, the rig count, the EIA report — without a hard-coded list of names to
 * ignore, which would silently swallow a new tab the day someone adds one.
 */
export function parseNewsTabName(
  title: string,
  fallbackYear: number
): { month: number; year: number; dated: boolean } | null {
  const tokens = title.trim().toLowerCase().split(/[\s_.-]+/).filter(Boolean);

  if (tokens.length === 0) return null;

  const month = monthNumberOf(tokens[0]);
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
 * The limit is worth stating: "Core PCE Price Index(YoY)" and "Core PCE(YoY)"
 * do not collapse to the same string, so those two will not match across
 * years. Year-on-year coverage is reported on the page rather than assumed.
 */
export function normalizeEventName(name: string): string {
  return name
    .replace(/[^\x20-\x7E]/g, " ") // emoji and other non-ASCII decoration
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  | "actual"
  | "forecast"
  | "previous"
  | "bias"
  | "bond"
  | "yield"
  | "nas100"
  | "notes";

/** Headings are compared with all whitespace removed, so "US time" ≡ "us time". */
const FIELD_HEADINGS: Record<EventField, string[]> = {
  event: ["event", "eventtype", "eventname", "events", "indicator", "release"],
  timeIst: [
    "date,time(ist)",
    "date,time",
    "datetime",
    "date",
    "time",
    "ist",
    "time(ist)",
    "isttime",
  ],
  timeUs: ["ustime", "time(us)", "time(est)", "esttime"],
  actual: ["actual", "act", "actualvalue", "result", "results"],
  forecast: ["forcast", "forecast", "consensus", "expected", "estimate", "projection"],
  previous: ["previous", "prev", "prior", "previousvalue", "last"],
  bias: ["usdbias", "bias", "direction"],
  bond: ["bond", "bonds"],
  yield: ["yeild", "yield"],
  nas100: ["nas100", "nasdaq"],
  notes: ["notes", "note", "comments", "comment", "commentary", "remarks"],
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
    warn(
      `${tab}: no header row found — it needs a column named "Event type" ` +
        `in the first ${HEADER_PROBE_ROWS} rows.`
    );
    return { events: [], warnings };
  }

  const columns = classifyColumns(rows[headerIndex] ?? [], warn, tab);

  if (columns.actual === undefined && columns.forecast === undefined) {
    warn(
      `${tab}: neither an "actual" nor a "forecast" column was found, ` +
        `so no figures could be read.`
    );
  }

  const events: NewsEvent[] = [];
  const usedKeys = new Set<string>();
  let week: string | null = null;

  for (const row of rows.slice(headerIndex + 1)) {
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
};

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
    const candidate: Candidate = { ...parsed, tab: grid.tab, events, notes };

    const slot = `${candidate.year}-${String(candidate.month).padStart(2, "0")}`;
    const group = bySlot.get(slot);

    if (group) group.push(candidate);
    else bySlot.set(slot, [candidate]);
  }

  /*
    Two tabs can name the same month — "APRIL MASTER SHEET" and "April 2026"
    both do. Preferring the one that spells its year out would be the obvious
    rule, except that a dated tab is often the placeholder somebody created
    first and never filled in. The tab with the most events wins instead, and
    an explicit year only settles a tie between equals.
  */

  const candidates: Candidate[] = [];

  for (const group of bySlot.values()) {
    const winner = group.reduce((best, other) => {
      if (other.events.length > best.events.length) return other;
      if (
        other.events.length === best.events.length &&
        other.dated &&
        !best.dated
      ) {
        return other;
      }

      return best;
    }, group[0]);

    for (const candidate of group) {
      if (candidate === winner) continue;

      warn(
        candidate.events.length === 0
          ? `${candidate.tab}: contains no events, so this month came from ` +
              `"${winner.tab}" instead.`
          : `${candidate.tab}: skipped, because "${winner.tab}" already covers ` +
              `${monthNameOf(winner.month)} ${winner.year}.`
      );
    }

    for (const note of winner.notes) warn(note);

    candidates.push(winner);
  }

  candidates.sort(
    (left, right) => left.year - right.year || left.month - right.month
  );

  /* ---------- turn them into months ---------- */

  const months: NewsMonth[] = candidates.map((candidate) => {
    const events = candidate.events;

    if (events.length === 0 && candidate.notes.length === 0) {
      warn(
        `${candidate.tab}: read as ${monthNameOf(candidate.month)} ` +
          `${candidate.year} but no events were found in it.`
      );
    }

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
