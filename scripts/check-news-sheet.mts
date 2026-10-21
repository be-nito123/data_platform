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

  const nfp = jan2025.events.find((event) => event.matchKey === "non farm payrolls");
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
  const nfp2026 = jan2026.events.find((event) => event.matchKey === "non farm payrolls");
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
  /*
    A month covered by more than one tab is folded together event by event,
    because during the migration from the auction report to the gold report both
    workbooks carry the same months and neither is complete on its own. A
    per-month winner would drop the rows only the losing sheet has.
  */
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
      // Two tabs that are equally full: their rows are combined too.
      {
        tab: "MAY 2026",
        rows: [
          HEADER,
          ["Week 1", "ISM Manufacturing PMI", "Fri 1, 7:30 pm", "54.0", "53.5", "52.7"],
          ["", "Fed Waller Speaks", "Fri 1, 9:00 pm", "—", "", ""],
        ],
      },
      {
        tab: "GOLD MAY TRACKER",
        rows: [
          HEADER,
          ["Week 1", "ISM Manufacturing PMI", "2026-05-01", "54.0", "53.5", "52.7"],
          ["", "Non-Farm Payrolls (NFP)", "2026-05-02", "180K", "175K", "160K"],
        ],
      },
    ],
    2026
  );

  assert.equal(collision.months.length, 2);

  // The empty placeholder contributes nothing, so April is the filled tab's.
  const april = findNewsMonth(collision, 2026, 4);
  assert.equal(april?.events.length, 2);
  assert.equal(april?.events[1]?.mom?.amount, 20); // 180K against 160K

  // May is the union of both tabs: the two shared releases and the one that
  // only one sheet carried.
  const may = findNewsMonth(collision, 2026, 5);
  assert.equal(may?.events.length, 3);
  assert.deepEqual(
    (may?.events ?? []).map((event) => event.matchKey),
    ["ism manufacturing", "fed waller speaks", "non farm payrolls"]
  );

  // The merged month names every tab it came from, so a half-migrated month is
  // visible rather than silent.
  assert.equal(may?.tab, "MAY 2026 + GOLD MAY TRACKER");

  const reported = collision.warnings.join(" ");
  assert.ok(reported.includes("MAY 2026"), reported);
  assert.ok(reported.includes("GOLD MAY TRACKER"), reported);
  /*
    The empty April placeholder adds nothing to the month, so it is not reported
    as a merge — the notice is reserved for a merge that actually rescued rows,
    which is what keeps the setup banner readable during the migration.
  */
  assert.ok(!reported.includes("April 2026"), reported);
}

/* =========================================================
   MERGING: WHICH SHEET'S ROW WINS
   ========================================================= */

{
  /*
    Where both sheets carry the same release the better-populated row is kept.
    The gold sheet has the forecast and the OHLCV, the auction sheet's 2026 tabs
    have neither, so gold has to win — losing the forecast would be a regression
    for every overlap month.
  */
  const merged = buildNewsArchive(
    [
      {
        tab: "SEP 2026",
        rows: [
          HEADER,
          ["Week 1", "NFP", "Fri 4, 6:00 pm", "162K", "", "21K"],
        ],
      },
      {
        tab: "GOLD SEPTEMBER TRACKER",
        rows: [
          [
            "Week",
            "News Event",
            "Release Date",
            "Release Time (IST)",
            "Actual",
            "Forecast",
            "Previous",
            "Event Day Open/Close",
            "Event Day Volume",
            "Event Day OI",
          ],
          [
            "Week 1",
            "Non-Farm Payrolls (NFP)",
            "2026-09-04",
            "6:00 PM IST",
            "162K",
            "55K",
            "21K",
            "4,552/4,476",
            "219,572",
            "414,355",
          ],
        ],
      },
    ],
    2026
  );

  const september = findNewsMonth(merged, 2026, 9);
  assert.equal(september?.events.length, 1, "the two spellings must land on one row");

  const nfp = september?.events[0];
  assert.equal(nfp?.matchKey, "non farm payrolls");
  // The gold row won on score, so the forecast and the OHLCV are present.
  assert.equal(nfp?.forecast?.amount, 55);
  assert.equal(nfp?.actual?.amount, 162);
  assert.deepEqual(nfp?.reaction?.eventDay, {
    open: 4552,
    close: 4476,
    raw: "4,552/4,476",
  });
  assert.equal(nfp?.reaction?.eventVolume, 219572);
  assert.equal(nfp?.reaction?.eventOi, 414355);
}

/* =========================================================
   NAME ALIASES
   ========================================================= */

{
  /*
    The two workbooks spell the same releases differently — the gold sheet writes
    them out, the auction sheet shortens them — and the merge depends on both
    landing on one key. Each equivalence below is named in the allow-list; the
    separations are just as important, because a merge that invents a shared key
    for two different releases would put a confident wrong figure on the page.
  */
  const spellings = buildNewsArchive(
    [
      {
        tab: "OCT 2026",
        rows: [
          HEADER,
          ["Week 1", "CPI (YoY)", "Tue 1, 6:00 pm", "3.70%", "3.60%", "3.40%"],
          ["", "PPI (YoY)", "Tue 1, 6:00 pm", "6.30%", "5.30%", "5.60%"],
          ["", "Fed Interest Rate Decision", "Wed 2, 6:00 pm", "4.00%", "4.00%", "3.75%"],
          ["", "ISM Non-Manufacturing PMI", "Thu 3, 7:30 pm", "54.9", "55.1", "55.4"],
          ["", "Average Hourly Earnings (MoM", "Fri 4, 6:00 pm", "0.10%", "0.30%", "0.30%"],
        ],
      },
      {
        tab: "OCTOBER GOLD REPORT",
        rows: [
          [
            "Week",
            "News Event",
            "Release Date",
            "Release Time (IST)",
            "Actual",
            "Forecast",
            "Previous",
          ],
          ["Week 1", "Consumer Price Index (CPI YoY)", "2026-10-01", "6:00 PM IST", "3.70%", "3.60%", "3.40%"],
          ["", "Producer Price Index (PPI YoY)", "2026-10-01", "6:00 PM IST", "6.30%", "5.30%", "5.60%"],
          ["", "FOMC Interest Rate Decision", "2026-10-02", "6:00 PM IST", "4.00%", "4.00%", "3.75%"],
          ["", "ISM Services PMI", "2026-10-03", "7:30 PM IST", "54.9", "55.1", "55.4"],
          ["", "Average Hourly Earnings (MoM)", "2026-10-04", "6:00 PM IST", "0.10%", "0.30%", "0.30%"],
        ],
      },
    ],
    2026
  );

  const october = findNewsMonth(spellings, 2026, 10);
  assert.equal(
    october?.events.length,
    5,
    "every pair of spellings must collapse to one row: " +
      JSON.stringify((october?.events ?? []).map((event) => event.matchKey))
  );

  assert.deepEqual(
    (october?.events ?? []).map((event) => event.matchKey),
    [
      "cpi yoy",
      "ppi yoy",
      "interest rate decision",
      "ism services pmi",
      "average hourly earnings",
    ]
  );
}

/* =========================================================
   ALIASES THAT MUST NOT MERGE
   ========================================================= */

{
  /*
    The other half of the allow-list: pairs that look close but are different
    releases. Collapsing these would report one release's number as another's,
    which is worse than leaving the column blank — so they are pinned here.
  */
  const distinct = buildNewsArchive(
    [
      {
        tab: "SEP 2026",
        rows: [
          HEADER,
          ["Week 1", "CPI (YoY)", "Tue 1, 6:00 pm", "3.40%", "3.40%", "3.40%"],
          ["", "Core CPI (YoY)", "Tue 1, 6:00 pm", "2.40%", "2.40%", "2.50%"],
          ["", "PCE Price Index (YoY)", "Tue 2, 6:00 pm", "3.40%", "3.70%", "3.40%"],
          ["", "Core PCE Price Index (YoY)", "Tue 2, 6:00 pm", "3.00%", "3.30%", "3.00%"],
          ["", "ISM Manufacturing PMI", "Wed 3, 7:30 pm", "54.6", "55.2", "55.6"],
          ["", "ISM Services PMI", "Wed 3, 7:30 pm", "55.4", "54.1", "54.1"],
          ["", "NFP", "Fri 5, 6:00 pm", "162K", "55K", "21K"],
          ["", "NFP (Aug)", "Fri 5, 6:00 pm", "162K", "55K", "21K"],
        ],
      },
    ],
    2026
  );

  const september = findNewsMonth(distinct, 2026, 9);
  assert.equal(
    september?.events.length,
    8,
    "none of these may collapse: " +
      JSON.stringify((september?.events ?? []).map((event) => event.matchKey))
  );

  const keys = new Set((september?.events ?? []).map((event) => event.matchKey));
  for (const key of [
    "cpi yoy",
    "core cpi",
    "pce",
    "core pce",
    "ism manufacturing",
    "ism services pmi",
    "non farm payrolls",
    "nfp aug",
  ]) {
    assert.ok(keys.has(key), `missing ${key}: ${[...keys].join(", ")}`);
  }
}

/* =========================================================
   A MONTH NAMED THE OTHER WAY ROUND
   ========================================================= */

{
  /*
    The gold workbook names its tabs "GOLD SEPTEMBER TRACKER" and "OCTOBER GOLD
    REPORT" — the month is in the middle rather than at the front. The reader has
    to accept those while still rejecting a tab that names no month at all, such
    as the auction report or a sources tab.
  */
  const goldTabs = buildNewsArchive(
    [
      {
        tab: "GOLD SEPTEMBER TRACKER",
        rows: [
          ["ELITE CAPITAL-GOLD MACRO REPORT SEPTEMBER 2026"],
          [],
          [
            "Week",
            "News Event",
            "Release Date",
            "Release Time (IST)",
            "Actual",
            "Forecast",
            "Previous",
          ],
          ["Week 1", "ISM Services PMI", "2026-09-03", "7:30 PM IST", "55.4", "54.1", "54.1"],
        ],
      },
      {
        tab: "OCTOBER GOLD REPORT",
        rows: [
          ["ELITE CAPITAL - GOLD MACRO REPORT | OCTOBER 2026"],
          [],
          [
            "Week",
            "News Event",
            "Release Date",
            "Release Time (IST)",
            "Actual",
            "Forecast",
            "Previous",
          ],
          ["Week 1", "Initial Jobless Claims", "2026-10-01", "6:00 PM IST", "197K", "201K", "198K"],
        ],
      },
      {
        // Named after nothing: still skipped, and still reported.
        tab: "US auction report",
        rows: [["Date", "Millions"], ["27 Aug", "420.7"]],
      },
    ],
    2026
  );

  const september = findNewsMonth(goldTabs, 2026, 9);
  assert.ok(september, "GOLD SEPTEMBER TRACKER must read as September");
  assert.equal(september?.monthName, "September");
  assert.equal(september?.dated, false, "the year is inferred, not written");
  assert.equal(september?.events[0]?.matchKey, "ism services pmi");

  const october = findNewsMonth(goldTabs, 2026, 10);
  assert.ok(october, "OCTOBER GOLD REPORT must read as October");
  assert.equal(october?.events[0]?.actual?.amount, 197);

  assert.ok(
    goldTabs.warnings.some((warning) => warning.includes("US auction report")),
    goldTabs.warnings.join(" ")
  );
}

/* =========================================================
   THE GOLD OHLCV BLOCK
   ========================================================= */

{
  /*
    The gold sheet's OHLCV columns are named two ways across its tabs, and some
    cells miss the thousands comma the others carry. Neither may cost a figure:
    "4503/4,365" is as readable as "4,503/4,365".
  */
  const ohlcv = buildNewsArchive(
    [
      {
        tab: "GOLD JUNE TRACKER",
        rows: [
          ["ELITE CAPITAL-GOLD MACRO REPORT JUNE 2026"],
          [],
          [
            "Week",
            "News Event",
            "Release Date",
            "Release Time (IST)",
            "Actual",
            "Forecast",
            "Previous",
            "Event Day Open/Close",
            "Event Day Volume",
            "Event Day OI",
            "Next Trading Day Date",
            "Next Day Open/Close",
            "Next Day Volume",
            "Next Day OI",
          ],
          [
            "Week 1",
            "ISM Services PMI",
            "2026-06-03",
            "7:30 PM IST",
            "54.1",
            "53.5",
            "53.0",
            "4503/4,365",
            "226,973",
            "415,196",
            "2026-06-04",
            "4,377/4,414",
            "211,258",
            "411,787",
          ],
        ],
      },
      {
        // September names the same columns differently.
        tab: "GOLD SEPTEMBER TRACKER",
        rows: [
          [""],
          [],
          [
            "Week",
            "News Event",
            "Release Date",
            "Release Time (IST)",
            "Actual",
            "Forecast",
            "Previous",
            "Release-Time Candle Open",
            "Day Open/Close",
            " Volume",
            "  OI",
            "Next Trading Day Date",
            "Next Day Open/Close",
            "Next Day Volume",
            "Next Day OI",
          ],
          [
            "Week 1",
            "ISM Manufacturing PMI",
            "2026-09-01",
            "7:30 PM IST",
            "54.6",
            "55.2",
            "55.6",
            "4,414",
            "4,498/4,396",
            "226,973",
            "415,196",
            "2026-09-02",
            "4,377/4,414",
            "211,258",
            "411,787",
          ],
        ],
      },
    ],
    2026
  );

  const june = findNewsMonth(ohlcv, 2026, 6);
  const juneIsm = june?.events[0];
  assert.ok(juneIsm?.reaction, "the June OHLCV block must be read");
  // The missing comma is tolerated on both halves.
  assert.deepEqual(juneIsm?.reaction?.eventDay, {
    open: 4503,
    close: 4365,
    raw: "4503/4,365",
  });
  assert.equal(juneIsm?.reaction?.eventVolume, 226973);
  assert.equal(juneIsm?.reaction?.eventOi, 415196);
  assert.equal(juneIsm?.reaction?.nextDate, "2026-06-04");
  assert.deepEqual(juneIsm?.reaction?.nextDay, {
    open: 4377,
    close: 4414,
    raw: "4,377/4,414",
  });

  const september = findNewsMonth(ohlcv, 2026, 9);
  const septemberIsm = september?.events[0];
  assert.ok(septemberIsm?.reaction, "the September column names must be read");
  assert.equal(septemberIsm?.reaction?.candleOpen, 4414);
  assert.deepEqual(septemberIsm?.reaction?.eventDay, {
    open: 4498,
    close: 4396,
    raw: "4,498/4,396",
  });

  // A tab with no OHLCV columns at all carries no reaction, so the second table
  // stays off the page rather than rendering a block of dashes.
  const plain = buildNewsArchive(
    [
      {
        tab: "NOV 2026",
        rows: [HEADER, ["Week 1", "NFP", "Fri 6, 6:00 pm", "197K", "201K", "198K"]],
      },
    ],
    2026
  );
  assert.equal(findNewsMonth(plain, 2026, 11)?.events[0]?.reaction, null);
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
    ["ism", "nfp delayed"]
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
  assert.equal(byKey.get("cpi yoy")?.yoy, null);

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
  const payrolls = read("non farm payrolls");
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
  assert.equal(read("cpi yoy").lean, "softer");

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
