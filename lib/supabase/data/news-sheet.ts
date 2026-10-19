/* ========================================================= */
/* SHEET CONTRACT                                            */
/* ========================================================= */

/*
  Twelve tabs, one per month. Each tab holds every year as a row:

    Year | <metric> | <metric> | … | Headline | Narrative | Source
    2024 | …
    2025 | …
    2026 | …

  Columns are located by header NAME rather than by position. Adding a metric
  column in Google Sheets therefore makes it appear on the site without a code
  change, reordering columns is harmless, and a tab that drifts from the others
  can be reported instead of silently mis-read.

  Year-over-year reads the previous year from the same tab; month-over-month
  reads the previous month's tab (January rolls back to December of the prior
  year). Both are computed here from the raw values rather than trusted from a
  formula cell — a broken formula should surface as a gap, not as a confident
  wrong number.

  Nothing in this module touches the network or the environment: it takes raw
  grids and returns the archive. `news.ts` supplies the grids.
*/

export const NEWS_MONTH_TABS = [
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

/** A header row is only looked for within this many rows of the top. */
const HEADER_PROBE_ROWS = 10;

/** How much of a column must parse as numbers before it counts as a metric. */
const NUMERIC_COLUMN_THRESHOLD = 0.8;

/* ========================================================= */
/* TYPES                                                     */
/* ========================================================= */

export type NewsMetric = {
  key: string;
  label: string;
  value: number | null;
  /** Absolute change against the previous month. */
  mom: number | null;
  /** Percentage change against the previous month. */
  momPct: number | null;
  /** Absolute change against the same month last year. */
  yoy: number | null;
  /** Percentage change against the same month last year. */
  yoyPct: number | null;
};

export type NewsEntry = {
  year: number;
  /** 1–12. */
  month: number;
  monthName: string;
  monthShort: string;
  /** Two-digit URL segment, e.g. "01". */
  monthSlug: string;
  headline: string | null;
  summary: string | null;
  source: string | null;
  metrics: NewsMetric[];
};

export type NewsArchive = {
  /** Every (year, month) the sheet exposes, oldest first. */
  entries: NewsEntry[];
  /** Distinct years, newest first. */
  years: number[];
  /** The union of every metric the sheet defines, in first-seen order. */
  metrics: { key: string; label: string }[];
  /** Problems encountered while reading, shown in the setup banner. */
  warnings: string[];
};

/** One month's raw grid, exactly as the Sheets API returned it. */
export type MonthGrid = {
  month: number;
  rows: unknown[][];
};

/** One sheet row, before deltas are attached. */
type RawEntry = {
  year: number;
  month: number;
  headline: string | null;
  summary: string | null;
  source: string | null;
  values: Map<string, number | null>;
};

/* ========================================================= */
/* HEADER MATCHING                                           */
/* ========================================================= */

const YEAR_HEADERS = new Set(["year", "yr"]);

/** Columns describing the month already encoded by the tab name. */
const IGNORED_HEADERS = new Set([
  "month",
  "mon",
  "month name",
  "month number",
  "mo",
  "m",
  "date",
]);

export type TextField = "headline" | "summary" | "source";

/*
  Narrative columns, in two tiers.

  A heading in `primary` names the field outright. A heading in `secondary` only
  hints at it, and is used when no `primary` column exists. Without that split, a
  sheet carrying both "Narrative" and "Notes" would let whichever sat further
  right silently become the commentary — the kind of mix-up that reads as
  plausible copy rather than as a bug.
*/
const TEXT_FIELDS: {
  field: TextField;
  primary: Set<string>;
  secondary: Set<string>;
}[] = [
  {
    field: "headline",
    primary: new Set(["headline", "headlines", "title"]),
    secondary: new Set(["news", "topic", "subject"]),
  },
  {
    field: "summary",
    primary: new Set([
      "summary",
      "narrative",
      "description",
      "details",
      "detail",
      "commentary",
    ]),
    secondary: new Set(["note", "notes", "news summary"]),
  },
  {
    field: "source",
    primary: new Set(["source", "sources"]),
    secondary: new Set(["link", "url", "reference", "references"]),
  },
];

/** Which narrative field a heading names, and how confidently. */
function matchTextField(name: string): { field: TextField; rank: number } | null {
  if (!name) return null;

  for (const spec of TEXT_FIELDS) {
    if (spec.primary.has(name)) return { field: spec.field, rank: 0 };
  }

  for (const spec of TEXT_FIELDS) {
    if (spec.secondary.has(name)) return { field: spec.field, rank: 1 };
  }

  return null;
}

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[*:]+$/, "")
    .trim();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === "";
}

/* ========================================================= */
/* VALUE PARSING                                             */
/* ========================================================= */

/*
  Values arrive with UNFORMATTED_VALUE, so most cells are already numbers.
  Hand-maintained sheets still carry percentages, thousands separators,
  currency symbols, short scales ("1.2k") and accountancy negatives
  ("(1,234)").
*/
function parseNumeric(value: unknown): number | null {
  if (isBlank(value)) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  let text = String(value).trim();

  let negative = false;
  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }

  let multiplier = 1;
  const suffix = text.match(/([kKmMbB])$/);
  if (suffix) {
    const factors: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9 };
    const factor = factors[suffix[1].toLowerCase()];
    // Only a suffix that follows a digit scales: "1.2M" yes, "M1.2" no.
    if (factor && /\d\s*$/.test(text.slice(0, -1))) {
      multiplier = factor;
      text = text.slice(0, -1);
    }
  }

  text = text.replace(/[^0-9.eE+-]/g, "");
  if (!text) return null;

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return null;

  return (negative ? -parsed : parsed) * multiplier;
}

function parseYear(value: unknown): number | null {
  if (isBlank(value)) return null;

  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 1900 && value <= 2999 ? value : null;
  }

  const text = String(value).trim();

  if (/^\d{4}$/.test(text)) {
    const numeric = Number(text);
    return numeric >= 1900 && numeric <= 2999 ? numeric : null;
  }

  // "FY2026", "CY 2026" — last resort, a bare four-digit year.
  const match = text.match(/\b(19|20|21)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

/* ========================================================= */
/* TAB PARSING                                               */
/* ========================================================= */

type ColumnRole =
  | { kind: "year" }
  | { kind: "text"; field: TextField; rank: number; label: string }
  | { kind: "measure"; label: string }
  | { kind: "ignored" };

type TextColumnRole = Extract<ColumnRole, { kind: "text" }>;

function isTextColumn(
  item: { role: ColumnRole; index: number }
): item is { role: TextColumnRole; index: number } {
  return item.role.kind === "text";
}

/**
 * Turn one month's tab into rows.
 *
 * `metricRegistry` is shared across the twelve tabs: the first tab to define a
 * metric fixes its label, so every month renders the same wording.
 */
function parseMonthTab(
  month: number,
  monthName: string,
  rows: unknown[][],
  metricRegistry: Map<string, string>,
  warn: (message: string) => void
): RawEntry[] {
  /* ---------- find the header row ---------- */

  let headerIndex = -1;

  for (let index = 0; index < Math.min(rows.length, HEADER_PROBE_ROWS); index += 1) {
    const candidate = rows[index] ?? [];
    if (candidate.some((cell) => YEAR_HEADERS.has(normalizeHeader(cell)))) {
      headerIndex = index;
      break;
    }
  }

  if (headerIndex === -1) {
    headerIndex = rows.findIndex((row) => row.some((cell) => !isBlank(cell)));
  }

  if (headerIndex === -1) return [];

  const headerRow = rows[headerIndex] ?? [];
  const dataRows = rows.slice(headerIndex + 1);

  /* ---------- classify the columns ---------- */

  const roles: ColumnRole[] = headerRow.map((cell) => {
    const name = normalizeHeader(cell);
    const label = String(cell ?? "").trim();

    if (!name) return { kind: "ignored" };
    if (YEAR_HEADERS.has(name)) return { kind: "year" };
    if (IGNORED_HEADERS.has(name)) return { kind: "ignored" };

    const text = matchTextField(name);
    if (text) return { kind: "text", field: text.field, rank: text.rank, label };

    return { kind: "measure", label };
  });

  let yearIndex = roles.findIndex((role) => role.kind === "year");

  if (yearIndex === -1) {
    if (roles.length === 0) return [];

    // A tab without an explicit "Year" heading still reads when column A holds
    // the years — but say so, because it may just as easily hold dates.
    warn(
      `${monthName}: no "Year" column — reading column A as the year. ` +
        `Rename it to "Year" to silence this.`
    );
    roles[0] = { kind: "year" };
    yearIndex = 0;
  }

  /* ---------- resolve the narrative columns ---------- */

  const textIndex = new Map<TextField, number>();

  roles
    .map((role, index) => ({ role, index }))
    .filter(isTextColumn)
    .sort((a, b) => a.role.rank - b.role.rank || a.index - b.index)
    .forEach((candidate) => {
      if (textIndex.has(candidate.role.field)) {
        warn(
          `${monthName}: column "${candidate.role.label}" looks like a second ` +
            `${candidate.role.field} column and was left out.`
        );
        return;
      }

      textIndex.set(candidate.role.field, candidate.index);
    });

  /* ---------- decide which columns are metrics ---------- */

  const metricColumns: { index: number; key: string }[] = [];

  roles.forEach((role, index) => {
    if (role.kind !== "measure") return;

    let nonEmpty = 0;
    let numeric = 0;

    for (const row of dataRows) {
      const cell = row?.[index];
      if (isBlank(cell)) continue;
      nonEmpty += 1;
      if (parseNumeric(cell) !== null) numeric += 1;
    }

    if (nonEmpty === 0) return;

    if (numeric / nonEmpty < NUMERIC_COLUMN_THRESHOLD) {
      warn(
        `${monthName}: column "${role.label}" is not numeric and was left out. ` +
          `Rename it or move it beyond the data range.`
      );
      return;
    }

    // Two columns in the same tab can share a heading ("Change").
    const base = slugify(role.label) || `column-${index}`;
    let key = base;
    let attempt = 2;

    while (metricColumns.some((column) => column.key === key)) {
      key = `${base}-${attempt}`;
      attempt += 1;
    }

    if (!metricRegistry.has(key)) metricRegistry.set(key, role.label);

    metricColumns.push({ index, key });
  });

  /* ---------- build the rows ---------- */

  const entries: RawEntry[] = [];

  for (const row of dataRows) {
    if (!row) continue;

    const year = parseYear(row[yearIndex]);
    if (year === null) continue;

    const readText = (field: TextField): string | null => {
      const index = textIndex.get(field);
      if (index === undefined) return null;
      const value = row[index];
      return isBlank(value) ? null : String(value).trim();
    };

    const values = new Map<string, number | null>();
    for (const column of metricColumns) {
      values.set(column.key, parseNumeric(row[column.index]));
    }

    entries.push({
      year,
      month,
      headline: readText("headline"),
      summary: readText("summary"),
      source: readText("source"),
      values,
    });
  }

  return entries;
}

/* ========================================================= */
/* HELPERS                                                   */
/* ========================================================= */

function cellKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Percentage change.
 *
 * A percentage of a non-positive base is not interpretable — going from −1,234
 * to +2,750 is not a rise of 323% of anything — so those come back as a gap. The
 * absolute change is always reported, so nothing is actually lost.
 */
function percentageChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function changeOf(
  current: number | null,
  previous: number | null
): { delta: number | null; percent: number | null } {
  if (current === null || previous === null) {
    return { delta: null, percent: null };
  }

  return { delta: current - previous, percent: percentageChange(current, previous) };
}

/* ========================================================= */
/* ARCHIVE                                                   */
/* ========================================================= */

/**
 * Assemble the archive from the grids that were read.
 *
 * Pure: same grids in, same archive out. `seedWarnings` carries problems the
 * caller hit before parsing (a missing tab, no spreadsheet configured) so that
 * every issue a reader needs to know about comes back in one list.
 */
export function buildNewsArchive(
  grids: MonthGrid[],
  seedWarnings: string[] = []
): NewsArchive {
  const warnings: string[] = [];
  const warn = (message: string) => {
    if (!warnings.includes(message)) warnings.push(message);
  };

  for (const message of seedWarnings) warn(message);

  const metricRegistry = new Map<string, string>();
  const raw: RawEntry[] = [];

  for (const grid of grids) {
    const monthName = NEWS_MONTH_NAMES[grid.month - 1];
    raw.push(...parseMonthTab(grid.month, monthName, grid.rows, metricRegistry, warn));
  }

  /* ---------- attach the deltas ---------- */

  const sorted = [...raw].sort((a, b) => a.year - b.year || a.month - b.month);

  const grid = new Map<string, RawEntry>();
  for (const entry of sorted) grid.set(cellKey(entry.year, entry.month), entry);

  const entries: NewsEntry[] = sorted.map((rawEntry) => {
    const previousMonth =
      rawEntry.month === 1
        ? grid.get(cellKey(rawEntry.year - 1, 12))
        : grid.get(cellKey(rawEntry.year, rawEntry.month - 1));
    const previousYear = grid.get(cellKey(rawEntry.year - 1, rawEntry.month));

    const metrics: NewsMetric[] = [];

    for (const [key, value] of rawEntry.values) {
      const mom = changeOf(value, previousMonth?.values.get(key) ?? null);
      const yoy = changeOf(value, previousYear?.values.get(key) ?? null);

      metrics.push({
        key,
        label: metricRegistry.get(key) ?? key,
        value,
        mom: mom.delta,
        momPct: mom.percent,
        yoy: yoy.delta,
        yoyPct: yoy.percent,
      });
    }

    return {
      year: rawEntry.year,
      month: rawEntry.month,
      monthName: NEWS_MONTH_NAMES[rawEntry.month - 1],
      monthShort: NEWS_MONTH_SHORT[rawEntry.month - 1],
      monthSlug: String(rawEntry.month).padStart(2, "0"),
      headline: rawEntry.headline,
      summary: rawEntry.summary,
      source: rawEntry.source,
      metrics,
    };
  });

  const years = [...new Set(entries.map((entry) => entry.year))].sort((a, b) => b - a);

  // Drop metrics that carry no value anywhere (for example a stray column in a
  // single tab), so the legend is not padded with blanks.
  const metrics = [...metricRegistry.entries()]
    .filter(([key]) =>
      entries.some((entry) =>
        entry.metrics.some((metric) => metric.key === key && metric.value !== null)
      )
    )
    .map(([key, label]) => ({ key, label }));

  return { entries, years, metrics, warnings };
}

/* ========================================================= */
/* LOOKUPS                                                   */
/* ========================================================= */

export function findNewsEntry(
  archive: NewsArchive,
  year: number,
  month: number
): NewsEntry | undefined {
  return archive.entries.find((entry) => entry.year === year && entry.month === month);
}

/**
 * The window of months ending at `(year, month)`, oldest first — the twelve
 * points a trend line should join.
 */
export function newsTrendWindow(
  archive: NewsArchive,
  year: number,
  month: number,
  length = 12
): NewsEntry[] {
  const end = cellKey(year, month);

  return archive.entries
    .filter((entry) => cellKey(entry.year, entry.month) <= end)
    .slice(-length);
}
