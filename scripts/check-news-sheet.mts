/*
  Checks the monthly-news sheet reader against synthetic grids.

    npm run check:news

  The sheet contract is the part of the news room that fails silently: a
  renamed column, a header row buried under a title or a tab that has not been
  created yet must produce a warning, never a wrong number. `lib/supabase/data/news-sheet.ts`
  is pure precisely so this can run with no credentials, no network and no
  browser.
*/

import assert from "node:assert/strict";

import {
  buildNewsArchive,
  findNewsMonth,
  newsTrendWindow,
} from "../lib/supabase/data/news-sheet.ts";
import { planForMonth, readOf } from "../lib/news/trading-read.ts";

const HEADER = [
  "week",
  "Event type",
  "date , time (ist)",
  "actual",
  "forcast",
  "previous",
  "USD Bias",
  "bond",
  "yeild",
  "nas100",
  "Notes",
];

const GRIDS = [
  {
    tab: "Jan 2025",
    rows: [
      HEADER,
      ["Week 1", "ISM Manufacturing", "Thu 1, 7:30 pm", "52.7", "52.3", "52.4", "risk-on"],
      ["", "NFP", "Fri 2, 6:00 pm", "197K", "201K", "198K", "risk-off"],
    ],
  },
  {
    tab: "JANUARY 2026",
    rows: [
      ["Elite Capital — Macro"],
      [],
      HEADER,
      ["Week 1", "ISM Manufacturing", "Thu 1, 7:30 pm", "54.5", "54.8", "54.6", "risk-off"],
      ["", "NFP", "Fri 2, 6:00 pm", "213K", "215K", "213K", "risk-neutral"],
    ],
  },
  {
    tab: "February 2026",
    rows: [
      HEADER,
      ["Week 1", "ISM Manufacturing", "Mon 2, 7:30 pm", "55.0", "54.7", "54.5"],
      ["Week 2", "Initial Jobless Claims", "Thu 5, 6:00 pm", "200K", "205K", "197K"],
    ],
  },
  {
    // Not a month tab — should be ignored with a warning.
    tab: "EIA Report",
    rows: [
      ["Date", "Crude"],
      ["27 Aug", "420.7"],
    ],
  },
];

const archive = buildNewsArchive(GRIDS, 2026);

function monthOf(year: number, month: number) {
  const found = findNewsMonth(archive, year, month);
  assert.ok(found, `no month for ${year}-${month}`);
  return found;
}

/** Float-safe equality: 54.5 − 54.1 is 0.4000000000000057, and 0.4 it is. */
function approx(actual: number | null | undefined, expected: number) {
  assert.notEqual(actual, null, `expected ${expected}, got null`);
  assert.ok(
    Math.abs((actual as number) - expected) < 1e-9,
    `expected ≈${expected}, got ${actual}`
  );
}

/* =========================================================
   SHAPE
   ========================================================= */

{
  // Both January tabs resolved; the explicit one (2026) is kept.
  assert.equal(archive.months.length, 3, JSON.stringify(archive.months.map((m) => m.tab)));

  const jan2025 = monthOf(2025, 1);
  assert.equal(jan2025.monthName, "January");
  assert.equal(jan2025.monthShort, "Jan");
  assert.equal(jan2025.monthSlug, "01");
  assert.equal(jan2025.events.length, 2);

  const nfp = jan2025.events.find((event) => event.matchKey === "nfp");
  assert.ok(nfp);
  assert.equal(nfp?.actual?.amount, 197);
  assert.equal(nfp?.actual?.unit, "thousand");
  assert.equal(nfp?.actual?.raw, "197K");
  assert.equal(nfp?.forecast?.amount, 201);
  assert.equal(nfp?.mom?.amount, -1);
  assert.equal(nfp?.mom?.unit, "thousand");
  assert.equal(nfp?.bias, "risk-off");

  const ism = jan2025.events.find((event) => event.matchKey === "ism manufacturing");
  assert.ok(ism);
  assert.equal(ism?.actual?.amount, 52.7);
  approx(ism?.surprise?.amount, 0.4);
  assert.equal(ism?.against, "above");

  const jan2026 = monthOf(2026, 1);
  assert.equal(jan2026.events[1]?.mom?.amount, 0); // 213K vs 213K

  // Year on year: NFP 2026 actual 213K vs 2025 197K → +16K
  const nfp2026 = jan2026.events.find((event) => event.matchKey === "nfp");
  assert.ok(nfp2026?.yoy);
  assert.equal(nfp2026?.yoy?.amount, 16);
  assert.equal(nfp2026?.yoy?.unit, "thousand");

  // The EIA Report tab was ignored.
  const warnings = archive.warnings.join(" ");
  assert.ok(warnings.includes("EIA Report"), warnings);
}

/* =========================================================
   TREND
   ========================================================= */

{
  const trend = newsTrendWindow(archive, 2026, 2);
  assert.equal(trend.length, 3); // Jan 2025, Jan 2026, Feb 2026
  assert.equal(trend[0].month, 1);
  assert.equal(trend[0].year, 2025);
}

/* =========================================================
   TWO TABS, ONE MONTH
   ========================================================= */

{
  const collision = buildNewsArchive(
    [
      // A placeholder somebody created first and never filled in.
      {
        tab: "April 2026",
        rows: [["Elite Capital — Macro"], [], HEADER],
      },
      {
        tab: "APRIL MASTER SHEET",
        rows: [
          HEADER,
          ["Week 1", "ISM Manufacturing", "Wed 1, 7:30 pm", "52.7", "52.3", "52.4"],
          ["", "NFP", "Fri 3, 6:00 pm", "180K", "175K", "160K"],
        ],
      },
      // Two tabs that are equally full: only the explicit year can decide.
      {
        tab: "MAY 2026",
        rows: [HEADER, ["Week 1", "ISM Manufacturing", "Fri 1, 7:30 pm", "54.0", "53.5", "52.7"]],
      },
      {
        tab: "MAY MASTER SHEET",
        rows: [HEADER, ["Week 1", "ISM Manufacturing", "Fri 1, 7:30 pm", "53.9", "53.5", "52.7"]],
      },
    ],
    2026
  );

  assert.equal(collision.months.length, 2);

  // The tab with something in it beats the empty one, not the other way round.
  const april = findNewsMonth(collision, 2026, 4);
  assert.equal(april?.tab, "APRIL MASTER SHEET");
  assert.equal(april?.events.length, 2);
  assert.equal(april?.events[1]?.mom?.amount, 20); // 180K against 160K

  // Equal counts are settled by the tab that spells its year out.
  const may = findNewsMonth(collision, 2026, 5);
  assert.equal(may?.tab, "MAY 2026");
  assert.equal(may?.events[0]?.actual?.amount, 54);

  const reported = collision.warnings.join(" ");
  assert.ok(reported.includes("April 2026"), reported);
  assert.ok(reported.includes("MAY MASTER SHEET"), reported);
  // The losing tab's own complaints are not reported — it did not get used.
  assert.ok(!reported.includes("no header row"), reported);
}

/* =========================================================
   A SECOND TABLE BELOW THE EVENTS
   ========================================================= */

{
  /*
    The 2025 tabs carry a "Fed Liquidity Tracker" under the event calendar. Its
    rows look exactly like releases whose actual has not printed yet — a date in
    the event column, a figure in the next one — so without a stop rule they
    land on the page as events.
  */
  const liquidity = buildNewsArchive(
    [
      {
        tab: "OCT 2025",
        rows: [
          ["", "✅ Update on every important red folder day"],
          ["Section 1: Weekly Macro Event Tracker and Fed Liquidity"],
          HEADER,
          ["oct week 1", "ISM", "1 wed, 7.30pm", "49.1", "49", "48.7"],
          ["", "NFP (delayed)", "10 fri, 6:00 PM", "", "51k", "22k"],
          [],
          ["Section 2: Fed Liquidity Tracker"],
          ["date", "Fed's Balance sheet", "previous", "week wise", "change", "USD Bias"],
          ["October3", "6,587B", "6,608B", "sep week 5", "-21.000B"],
          ["October 10", "6,591B", "6,587B", "oct week 1", "4.000B"],
          ["date", "Reserve Balances with Fedral reserve banks", "previous", "week wise", "change"],
          ["October 24", "2.930T", "2.988T", "oct week 3", "-58.000B"],
        ],
      },
    ],
    2026
  );

  const october = findNewsMonth(liquidity, 2025, 10);
  assert.ok(october, "October 2025 missing from the second-table fixture");

  // Only the two real releases above the second table.
  assert.equal(october?.events.length, 2);
  assert.deepEqual(
    october?.events.map((event) => event.matchKey),
    ["ism", "nfp"]
  );

  // Nothing from the balance-sheet table leaked in as an event.
  const names = (october?.events ?? []).map((event) => event.name).join(" ");
  assert.ok(!names.includes("Balance sheet"), names);
  assert.ok(!names.includes("October3"), names);
  assert.ok(!names.includes("Reserve Balances"), names);

  // The skip is reported rather than silent.
  assert.ok(
    liquidity.warnings.some((warning) => warning.includes("second table")),
    liquidity.warnings.join(" ")
  );
}

/* =========================================================
   AN EMPTY TAB IS NOT A MISTAKE
   ========================================================= */

{
  const empty = buildNewsArchive(
    [
      { tab: "NOV 2026", rows: [] },
      {
        tab: "DEC 2026",
        rows: [[" "], [], [], []],
      },
      {
        tab: "JAN 2026",
        rows: [HEADER, ["Week 1", "NFP", "Fri 2, 6:00 pm", "197K", "201K", "198K"]],
      },
    ],
    2026
  );

  // Both placeholders are months on record…
  assert.ok(findNewsMonth(empty, 2026, 11));
  assert.ok(findNewsMonth(empty, 2026, 12));

  // …with no events and no complaint about a missing header row.
  assert.equal(findNewsMonth(empty, 2026, 11)?.events.length, 0);
  const reported = empty.warnings.join(" ");
  assert.ok(!reported.includes("no header row"), reported);

  // A tab with content and no header is still a real problem.
  const broken = buildNewsArchive(
    [{ tab: "FEB 2026", rows: [["Date", "Crude"], ["27 Aug", "420.7"]] }],
    2026
  );
  assert.ok(
    broken.warnings.some((warning) => warning.includes("no header row")),
    broken.warnings.join(" ")
  );
}

/* =========================================================
   MATCHING ACROSS YEARS
   ========================================================= */

{
  /*
    The tabs write the same release with and without its tail: the 2026 tab says
    "ISM Manufacturing PMI", the 2025 tab says "ISM Manufacturing". Year on year
    is the reason those have to collapse to one key.
  */
  const years = buildNewsArchive(
    [
      {
        tab: "SEP 2025",
        rows: [
          HEADER,
          ["sep week 5", "ISM Manufacturing PMI", "1 wed, 7:15 PM", "48.2", "", ""],
          ["", "Core PCE Price Index (YoY)", "1 wed, 7:15 PM", "2.80%", "", ""],
          ["", "CPI (YOY)", "22 wed, 11.3pm", "", "", "3.80%"],
        ],
      },
      {
        tab: "SEP 2026",
        rows: [
          HEADER,
          ["Week 1", "ISM Manufacturing PMI", "Tue 1, 7:30 pm", "54.6", "", ""],
          ["", "Core PCE (YoY)", "Tue 1, 7:30 pm", "3.00%", "", ""],
          ["", "CPI (YoY)", "Tue 1, 7:30 pm", "3.40%", "", ""],
        ],
      },
    ],
    2026
  );

  const september = findNewsMonth(years, 2026, 9);
  assert.ok(september, "September 2026 missing from the cross-year fixture");
  const byKey = new Map(
    (september?.events ?? []).map((event) => [event.matchKey, event])
  );

  // "pmi" and "price index" are dropped, so both pairs resolve.
  approx(byKey.get("ism manufacturing")?.yoy?.amount, 6.4);
  approx(byKey.get("core pce")?.yoy?.amount, 0.2);

  // "CPI (YoY)" has no prior actual to compare against, so it stays blank
  // rather than reporting a confident zero.
  assert.equal(byKey.get("cpi")?.yoy, null);

  // The displayed name is untouched by the normalization.
  assert.equal(byKey.get("ism manufacturing")?.name, "ISM Manufacturing PMI");
}

/* =========================================================
   THE TRADING READ
   ========================================================= */

{
  /*
    The read resolves the direction of a surprise through the release's family,
    because the same word means opposite things on different releases: a payrolls
    beat is a hotter labour market, a claims beat is a colder one. Getting that
    backwards would be the worst kind of wrong — a confident, inverted call — so
    the two labour directions are pinned here.
  */
  const direction = buildNewsArchive(
    [
      {
        tab: "JUN 2026",
        rows: [
          HEADER,
          ["Week 1", "NFP", "Fri 5, 6:00 pm", "300K", "200K", "180K"],
          ["", "Initial Jobless Claims", "Thu 4, 6:00 pm", "250K", "200K", "195K"],
          ["", "Unemployment Rate", "Fri 5, 6:00 pm", "4.5%", "4.2%", "4.2%"],
          ["", "CPI (YoY)", "Wed 10, 6:00 pm", "3.0%", "3.5%", "3.6%"],
          ["", "ISM Manufacturing PMI", "Mon 1, 7:30 pm", "50.0", "50.0", "49.0"],
        ],
      },
    ],
    2026
  );

  const june = findNewsMonth(direction, 2026, 6);
  assert.ok(june, "June 2026 missing from the trading-read fixture");

  const byKey = new Map((june?.events ?? []).map((event) => [event.matchKey, event]));

  /** The read for one of the fixture events, refusing a missing one. */
  const read = (key: string) => {
    const event = byKey.get(key);
    assert.ok(event, "no event " + key + " in the fixture");
    const result = readOf(event);
    assert.ok(result, "no read for " + key);
    return result;
  };

  // A payrolls beat is a hotter labour market → the dollar firms.
  const payrolls = read("nfp");
  assert.equal(payrolls.against, "above");
  assert.equal(payrolls.lean, "firmer", "a payrolls beat must firm the dollar");

  /*
    A claims beat is the opposite: more people filed, so labour is looser and the
    dollar softens. This is the assertion that would have caught the inversion
    where claims were read like payrolls.
  */
  const claims = read("initial jobless claims");
  assert.equal(claims.against, "above");
  assert.equal(claims.lean, "softer", "a claims beat must soften the dollar, not firm it");
  assert.equal(claims.family, "labour-loose");

  // A higher unemployment rate is also looser labour.
  const unemployment = read("unemployment rate");
  assert.equal(unemployment.lean, "softer");
  assert.equal(unemployment.family, "labour-loose");

  // A cooler inflation print firms risk appetite → softer dollar.
  assert.equal(read("cpi").lean, "softer");

  // An in-line print is flat, neither firmer nor softer.
  const ism = read("ism manufacturing");
  assert.equal(ism.against, "in-line");
  assert.equal(ism.lean, "neutral");

  /*
    The three headline counts must equal the number of reads, so the summary line
    and the chips can never disagree.
  */
  const plan = planForMonth(june!);
  assert.equal(plan.firmer + plan.softer + plan.flat, plan.reads.length);
}

/* ========================================================= */

console.log(
  `news sheet reader: ${archive.months.length} month(s), ${archive.months.reduce(
    (total, m) => total + m.events.length,
    0
  )} event(s) — all checks passed`
);
