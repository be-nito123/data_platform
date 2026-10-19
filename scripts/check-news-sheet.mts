/*
  Checks the monthly-news sheet reader against synthetic grids.

    npm run check:news

  The sheet contract is the part of the news room that fails silently: a
  renamed column, a duplicated heading or a tab that has not been created yet
  must produce a warning, never a wrong number. `lib/supabase/data/news-sheet.ts`
  is pure precisely so this can run with no credentials, no network and no
  browser.
*/

import assert from "node:assert/strict";

import {
  buildNewsArchive,
  findNewsEntry,
  newsTrendWindow,
  type MonthGrid,
  type NewsMetric,
} from "../lib/supabase/data/news-sheet.ts";

const HEADER = ["Year", "Exports", "Lead", "Headline", "Narrative", "Source"];

const GRIDS: MonthGrid[] = [
  {
    month: 1,
    rows: [
      HEADER,
      [2025, 100, "1.2M", "Copper tariffs bite", "January 2025 narrative.", "Reuters"],
      [2026, 132, "(1,234)", "Copper recovers", "January 2026 narrative.", "Reuters"],
    ],
  },
  {
    // A title row and a spacer sit above the real header; the probe must still
    // find it. "Notes" is free text and must be left out with a warning.
    month: 2,
    rows: [
      ["Monthly data news — February"],
      [],
      [...HEADER, "Notes"],
      [2025, 110, "2.5k", "Steel demand softens", "February 2025 narrative.", "Reuters", "free text"],
      [2026, 143, "2.75k", "Steel rebounds", "February 2026 narrative.", "Reuters", "more free text"],
    ],
  },
  {
    month: 3,
    rows: [HEADER, [2025, 120, 3_000_000, "March headline", "March narrative.", "Reuters"]],
  },
  {
    // December exists so that January 2026 has something to measure against.
    month: 12,
    rows: [HEADER, [2025, 120, 2_400_000, "December headline", "December narrative.", "Reuters"]],
  },
];

const archive = buildNewsArchive(GRIDS);

function entryOf(year: number, month: number) {
  const found = findNewsEntry(archive, year, month);
  assert.ok(found, `no entry for ${year}-${month}`);

  return found;
}

function metricOf(year: number, month: number, key = "exports"): NewsMetric {
  const found = entryOf(year, month).metrics.find((metric) => metric.key === key);
  assert.ok(found, `no "${key}" for ${year}-${month}`);

  return found;
}

function close(actual: number | null, expected: number, label: string) {
  assert.ok(
    actual !== null && Math.abs(actual - expected) < 1e-9,
    `${label}: expected ${expected}, got ${actual}`
  );
}

/* ========================================================= */
/* SHAPE                                                     */
/* ========================================================= */

{
  assert.equal(archive.entries.length, 6);
  assert.deepEqual(archive.years, [2026, 2025]);
  assert.deepEqual(
    archive.entries.map((item) => `${item.year}-${item.monthSlug}`),
    ["2025-01", "2025-02", "2025-03", "2025-12", "2026-01", "2026-02"]
  );

  // The first tab to define a metric fixes its wording for every month.
  assert.deepEqual(
    archive.metrics.map((metric) => `${metric.key}=${metric.label}`),
    ["exports=Exports", "lead=Lead"]
  );

  const january = entryOf(2025, 1);
  assert.equal(january.monthName, "January");
  assert.equal(january.monthShort, "Jan");
  assert.equal(january.monthSlug, "01");
  assert.equal(january.headline, "Copper tariffs bite");
  assert.equal(january.summary, "January 2025 narrative.");
  assert.equal(january.source, "Reuters");

  // February's header sat below a title row and was still found.
  assert.equal(entryOf(2025, 2).headline, "Steel demand softens");

  // The unrecognised text column is dropped, and said so.
  assert.ok(
    archive.warnings.some(
      (warning) => warning.includes("Notes") && warning.includes("February")
    ),
    `expected a warning about Notes, got ${JSON.stringify(archive.warnings)}`
  );
  assert.equal(archive.warnings.length, 1, JSON.stringify(archive.warnings));
}

/* ========================================================= */
/* DELTAS                                                    */
/* ========================================================= */

{
  // January 2025 is the first month on record: nothing to compare against.
  const january2025 = metricOf(2025, 1);
  assert.equal(january2025.value, 100);
  assert.equal(january2025.mom, null);
  assert.equal(january2025.momPct, null);
  assert.equal(january2025.yoy, null);
  assert.equal(january2025.yoyPct, null);

  // February 2025 has a month-on-month comparison and no prior year.
  const february2025 = metricOf(2025, 2);
  assert.equal(february2025.mom, 10);
  assert.equal(february2025.momPct, 10);
  assert.equal(february2025.yoy, null);

  // March 2025: 110 -> 120.
  const march2025 = metricOf(2025, 3);
  assert.equal(march2025.mom, 10);
  close(march2025.momPct, (10 / 110) * 100, "March 2025 MoM %");

  // December 2025 has no November on record, so month-on-month is a gap.
  assert.equal(metricOf(2025, 12).mom, null);
  assert.equal(metricOf(2025, 12).momPct, null);

  // January 2026 rolls month-on-month back to December 2025, and reads
  // year-on-year from the row above it in the same tab.
  const january2026 = metricOf(2026, 1);
  assert.equal(january2026.value, 132);
  assert.equal(january2026.mom, 132 - 120);
  assert.equal(january2026.momPct, 10);
  assert.equal(january2026.yoy, 32);
  assert.equal(january2026.yoyPct, 32);

  // February 2026 compares against January 2026 and February 2025.
  const february2026 = metricOf(2026, 2);
  assert.equal(february2026.mom, 11);
  close(february2026.momPct, (11 / 132) * 100, "February 2026 MoM %");
  assert.equal(february2026.yoy, 33);
  assert.equal(february2026.yoyPct, 30);
}

/* ========================================================= */
/* VALUE FORMATS                                             */
/* ========================================================= */

{
  const cases: [number, number, number][] = [
    [2025, 1, 1_200_000], // "1.2M"
    [2026, 1, -1_234], // "(1,234)"
    [2025, 2, 2_500], // "2.5k"
    [2026, 2, 2_750], // "2.75k"
    [2025, 3, 3_000_000], // a real number
    [2025, 12, 2_400_000], // a real number
  ];

  for (const [year, month, expected] of cases) {
    assert.equal(metricOf(year, month, "lead").value, expected, `lead ${year}-${month}`);
  }

  // The scaled column still reports its own deltas. February 2026 measures
  // against January 2026, which is negative, so the absolute move is reported
  // and the percentage is not.
  const leadFebruary2026 = metricOf(2026, 2, "lead");
  assert.equal(leadFebruary2026.value, 2_750);
  assert.equal(leadFebruary2026.mom, 2_750 - -1_234);
  assert.equal(leadFebruary2026.momPct, null);
}

/* ========================================================= */
/* GAPS AND EDGES                                            */
/* ========================================================= */

{
  // A month with no tab is simply absent, not zero.
  assert.equal(findNewsEntry(archive, 2025, 6), undefined);

  // A zero baseline must not become an infinite percentage.
  const zeroBaseline = buildNewsArchive([
    { month: 1, rows: [["Year", "Index"], [2025, 0]] },
    { month: 2, rows: [["Year", "Index"], [2025, 10]] },
  ]);
  assert.equal(zeroBaseline.entries[1].metrics[0].mom, 10);
  assert.equal(zeroBaseline.entries[1].metrics[0].momPct, null);

  // Neither must a negative baseline.
  const negativeBaseline = buildNewsArchive([
    { month: 1, rows: [["Year", "Net"], [2025, -100]] },
    { month: 2, rows: [["Year", "Net"], [2025, -50]] },
  ]);
  assert.equal(negativeBaseline.entries[1].metrics[0].mom, 50);
  assert.equal(negativeBaseline.entries[1].metrics[0].momPct, null);
}

{
  // Two columns may share a heading; the second is suffixed, not lost.
  const duplicates = buildNewsArchive([
    { month: 1, rows: [["Year", "Change", "Change"], [2025, 1, 2]] },
  ]);
  assert.deepEqual(
    duplicates.entries[0].metrics.map((metric) => metric.key),
    ["change", "change-2"]
  );
}

{
  // No "Year" heading: column A is used, and the reader says so.
  const noYearHeader = buildNewsArchive([
    { month: 1, rows: [["", "Exports"], [2025, 100], [2026, 132]] },
  ]);

  assert.equal(noYearHeader.entries.length, 2);
  assert.equal(noYearHeader.entries[1].year, 2026);
  assert.equal(noYearHeader.entries[1].metrics[0].yoy, 32);
  assert.ok(noYearHeader.warnings.some((warning) => warning.includes('"Year"')));
}

{
  // Rows whose Year cell is unusable are skipped rather than guessed at.
  const junk = buildNewsArchive([
    { month: 1, rows: [["Year", "Index"], ["n/a", 5], [2025, 100], [], [null, 7]] },
  ]);
  assert.equal(junk.entries.length, 1);
  assert.equal(junk.entries[0].metrics[0].value, 100);
}

{
  // Nothing configured at all: an empty archive, not a throw.
  const empty = buildNewsArchive([], ["No spreadsheet configured."]);
  assert.deepEqual(empty.entries, []);
  assert.deepEqual(empty.years, []);
  assert.deepEqual(empty.metrics, []);
  assert.deepEqual(empty.warnings, ["No spreadsheet configured."]);
}

/* ========================================================= */
/* TREND WINDOW                                              */
/* ========================================================= */

{
  assert.deepEqual(
    newsTrendWindow(archive, 2026, 2).map((item) => `${item.year}-${item.monthSlug}`),
    ["2025-01", "2025-02", "2025-03", "2025-12", "2026-01", "2026-02"]
  );

  assert.deepEqual(
    newsTrendWindow(archive, 2026, 2, 3).map((item) => `${item.year}-${item.monthSlug}`),
    ["2025-12", "2026-01", "2026-02"]
  );

  // The window never reaches past its end month.
  assert.deepEqual(
    newsTrendWindow(archive, 2025, 2).map((item) => item.monthSlug),
    ["01", "02"]
  );
}

console.log(`news sheet reader: ${archive.entries.length} rows, ${archive.metrics.length} metrics — all checks passed`);
