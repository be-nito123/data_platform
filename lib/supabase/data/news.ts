import { cache } from "react";
import { getSheetData, listSheetTitles } from "@/lib/supabase/google/sheets";
import {
  buildNewsArchive,
  NEWS_TAB_EXAMPLES,
  parseNewsTabName,
  type NewsArchive,
  type NewsTabGrid,
} from "./news-sheet";

/*
  Reading the monthly tabs.

  The contract, the column matching and the comparisons all live in
  `news-sheet.ts`, which is pure and can be exercised without credentials. This
  module is only the part that needs the environment: which spreadsheet, which
  tabs, and the reads.

  The tabs are discovered rather than guessed. The workbook holds other things
  besides the monthly sheets — an auction report, a rig count, an EIA report —
  and asking for twelve hard-coded names would produce twelve "not found"
  errors, one of which happens to list the names that do exist.

  Every read is allowed to fail on its own. A month that has not been created
  yet must produce a note on the page, not a 500 — so nothing here throws.

  The reads ask for FORMATTED_VALUE, unlike the rest of the app. A macro
  calendar's units live in the cell format: a cell holding 0.042 that displays
  as "4.20%" is a percentage, and the unformatted rendering throws away the one
  thing that says so.
*/

export * from "./news-sheet";

/**
 * Rows and columns read from each tab.
 *
 * The monthly sheets are ~30 rows. The width is set by the gold report, which
 * carries the event calendar and then a full OHLCV block beside it — sixteen
 * columns as far as "Next Day OI". Reading only the event calendar's width would
 * silently drop the last two gold columns, which is exactly the sort of loss the
 * column-name matching exists to prevent.
 */
const NEWS_READ_RANGE = "A1:P300";

/**
 * The spreadsheets the monthly tabs live in.
 *
 * More than one is normal during the migration from the auction report to the
 * gold report: both workbooks carry a month at the same time, and `buildNewsArchive`
 * folds them together. `NEWS_GOOGLE_SHEET_ID` is therefore a comma-separated
 * list, oldest first, and the fallback to `GOOGLE_SHEET_ID` keeps a
 * single-workbook setup working.
 *
 * The list is the right shape for the end of the migration too. Retiring a sheet
 * is then a matter of dropping an id from the environment rather than a code
 * change, and leaving one in place costs a single listing call.
 */
function newsSpreadsheetIds(): string[] {
  const configured = process.env.NEWS_GOOGLE_SHEET_ID || process.env.GOOGLE_SHEET_ID;

  if (!configured) return [];

  return configured
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/** The year a "MASTER SHEET" tab belongs to, when the name does not say. */
function currentYear(): number {
  return new Date().getFullYear();
}

/*
  One read per request, however many times it is asked for: the page and its
  `generateMetadata` both need the archive, and each read lists two
  spreadsheets and fetches every month tab. React's cache is request-scoped, so
  nothing is memoised across requests — only within this render.
*/
export const getNewsArchive = cache(async (): Promise<NewsArchive> => {
  const spreadsheetIds = newsSpreadsheetIds();
  const fallbackYear = currentYear();

  if (spreadsheetIds.length === 0) {
    return buildNewsArchive([], fallbackYear, [
      "No spreadsheet configured. Set NEWS_GOOGLE_SHEET_ID in .env.local.",
    ]);
  }

  const grids: NewsTabGrid[] = [];
  const warnings: string[] = [];
  let recognisedAnything = false;

  for (const spreadsheetId of spreadsheetIds) {
    let titles: string[];

    try {
      titles = await listSheetTitles(spreadsheetId);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);

      /*
        One workbook failing to open must not take the other down with it. At the
        end of the migration the auction sheet is likely to be archived or
        unshared, and the page has to keep working on the gold sheet alone.
      */
      warnings.push(
        `The news spreadsheet ${spreadsheetId} could not be opened: ${reason}`
      );
      continue;
    }

    const monthlyTabs = titles.filter(
      (title) => parseNewsTabName(title, fallbackYear) !== null
    );

    if (monthlyTabs.length === 0) {
      const [specific, openEnded] = NEWS_TAB_EXAMPLES;

      warnings.push(
        `No tab in the spreadsheet ${spreadsheetId} is named after a month. ` +
          `Expected something like "${specific}" or "${openEnded}". Found: ${
            titles.join(", ") || "(no tabs)"
          }.`
      );
      continue;
    }

    recognisedAnything = true;

    const results = await Promise.all(
      monthlyTabs.map(async (tab): Promise<NewsTabGrid | string> => {
        try {
          const rows = await getSheetData(
            tab,
            NEWS_READ_RANGE,
            spreadsheetId,
            "FORMATTED_VALUE"
          );

          return { tab, rows };
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);

          return `Tab "${tab}": ${reason}`;
        }
      })
    );

    for (const result of results) {
      if (typeof result === "string") {
        if (!warnings.includes(result)) warnings.push(result);
        continue;
      }

      grids.push(result);
    }
  }

  if (!recognisedAnything && grids.length === 0) {
    return buildNewsArchive([], fallbackYear, warnings);
  }

  return buildNewsArchive(grids, fallbackYear, warnings);
});
