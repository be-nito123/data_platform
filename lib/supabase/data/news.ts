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

/** Rows and columns read from each tab. The monthly sheets are ~30 rows. */
const NEWS_READ_RANGE = "A1:N300";

/**
 * Where the monthly tabs live. They are expected in their own spreadsheet;
 * falling back to the primary one keeps a single-workbook setup working.
 */
function newsSpreadsheetId(): string | undefined {
  return process.env.NEWS_GOOGLE_SHEET_ID || process.env.GOOGLE_SHEET_ID;
}

/** The year a "MASTER SHEET" tab belongs to, when the name does not say. */
function currentYear(): number {
  return new Date().getFullYear();
}

export async function getNewsArchive(): Promise<NewsArchive> {
  const spreadsheetId = newsSpreadsheetId();
  const fallbackYear = currentYear();

  if (!spreadsheetId) {
    return buildNewsArchive([], fallbackYear, [
      "No spreadsheet configured. Set NEWS_GOOGLE_SHEET_ID in .env.local.",
    ]);
  }

  let titles: string[];

  try {
    titles = await listSheetTitles(spreadsheetId);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    return buildNewsArchive([], fallbackYear, [
      `The news spreadsheet could not be opened: ${reason}`,
    ]);
  }

  const monthlyTabs = titles.filter(
    (title) => parseNewsTabName(title, fallbackYear) !== null
  );

  if (monthlyTabs.length === 0) {
    const [specific, openEnded] = NEWS_TAB_EXAMPLES;

    return buildNewsArchive([], fallbackYear, [
      "No tab in the spreadsheet is named after a month. Expected something " +
        `like "${specific}" or "${openEnded}". Found: ${
          titles.join(", ") || "(no tabs)"
        }.`,
    ]);
  }

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

  const grids: NewsTabGrid[] = [];
  const warnings: string[] = [];

  for (const result of results) {
    if (typeof result === "string") {
      if (!warnings.includes(result)) warnings.push(result);
      continue;
    }

    grids.push(result);
  }

  return buildNewsArchive(grids, fallbackYear, warnings);
}
