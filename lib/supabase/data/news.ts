import { getSheetData } from "@/lib/supabase/google/sheets";
import {
  NEWS_MONTH_TABS,
  buildNewsArchive,
  type MonthGrid,
  type NewsArchive,
} from "./news-sheet";

/*
  Reading the monthly tabs.

  The contract, the column matching and the delta arithmetic all live in
  `news-sheet.ts`, which is pure and can be exercised without credentials. This
  module is only the part that needs the environment: which spreadsheet, and
  the twelve reads.

  Every read is allowed to fail on its own. A tab that has not been created yet
  must produce a setup hint on the page, not a 500 — so nothing here throws.
*/

export * from "./news-sheet";

/** Rows and columns read from each tab. */
const NEWS_READ_RANGE = "A1:AZ400";

/**
 * Where the monthly tabs live. They are expected in their own spreadsheet;
 * falling back to the primary one keeps a single-workbook setup working.
 */
function newsSpreadsheetId(): string | undefined {
  return process.env.NEWS_GOOGLE_SHEET_ID || process.env.GOOGLE_SHEET_ID;
}

/**
 * Read all twelve monthly tabs and assemble the archive.
 *
 * The tabs are fetched in parallel: on a cold cache that is one round trip
 * instead of twelve, and `getSheetData` memoises for `SHEET_CACHE_TTL_SECONDS`
 * afterwards.
 */
export async function getNewsArchive(): Promise<NewsArchive> {
  const spreadsheetId = newsSpreadsheetId();

  if (!spreadsheetId) {
    return buildNewsArchive([], [
      "No spreadsheet configured. Set NEWS_GOOGLE_SHEET_ID in .env.local.",
    ]);
  }

  const warnings: string[] = [];

  const results = await Promise.all(
    NEWS_MONTH_TABS.map(async (tab, index): Promise<MonthGrid | string> => {
      try {
        const rows = await getSheetData(tab, NEWS_READ_RANGE, spreadsheetId);
        return { month: index + 1, rows };
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);

        // The Sheets client lists the tabs that do exist in its "not found"
        // message; repeating that twelve times would bury the rest.
        return reason.includes("was not found")
          ? `Tab "${tab}" is missing.`
          : `Tab "${tab}": ${reason}`;
      }
    })
  );

  const grids: MonthGrid[] = [];

  for (const result of results) {
    if (typeof result === "string") {
      if (!warnings.includes(result)) warnings.push(result);
      continue;
    }

    grids.push(result);
  }

  return buildNewsArchive(grids, warnings);
}
