import { google } from "googleapis";

/* ========================================================= */
/* GOOGLE AUTH */
/* ========================================================= */

function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error(
      "GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY is missing in .env.local"
    );
  }

  // Google service account keys start with "BEGIN PRIVATE KEY".
  // A key starting with "BEGIN RSA PRIVATE KEY" causes:
  // error:1E08010C:DECODER routines::unsupported
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      "GOOGLE_PRIVATE_KEY must start with -----BEGIN PRIVATE KEY----- . " +
        "Copy the private_key value from your service account JSON file."
    );
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

/* ========================================================= */
/* HELPERS */
/* ========================================================= */

function normalizeSheetName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/* ========================================================= */
/* GET SHEET DATA */
/* ========================================================= */

/*
  Supported calls:

  getSheetData("Daily", "A1:DM1000")
    -> weather sheet (GOOGLE_SHEET_ID)

  getSheetData("COT BTC / ETH!A1:J1000")
    -> "Tab!Range" form, weather sheet (GOOGLE_SHEET_ID)

  getSheetData("COT GOLD", "A1:J1000", process.env.COT_GOOGLE_SHEET_ID)
    -> a different spreadsheet (for example the COT REPORT sheet)
*/
export async function getSheetData(
  sheetNameOrRange: string,
  cellRange?: string,
  spreadsheetId?: string
): Promise<string[][]> {
  const finalSpreadsheetId = spreadsheetId || process.env.GOOGLE_SHEET_ID;

  if (!finalSpreadsheetId) {
    throw new Error("Missing Google Spreadsheet ID");
  }

  const auth = getGoogleAuth();

  const sheets = google.sheets({
    version: "v4",
    auth,
  });

  let sheetName: string;
  let range: string;

  // getSheetData("Daily", "A1:DM1000")
  if (cellRange) {
    sheetName = sheetNameOrRange.trim();
    range = cellRange.trim();
  }

  // getSheetData("COT BTC / ETH!A1:J1000")
  else {
    const separatorIndex = sheetNameOrRange.lastIndexOf("!");

    if (separatorIndex === -1) {
      throw new Error(
        `Invalid Google Sheets range "${sheetNameOrRange}". ` +
          `Use "Sheet Name", "A1:J1000" or "Sheet Name!A1:J1000".`
      );
    }

    sheetName = sheetNameOrRange.substring(0, separatorIndex).trim();
    range = sheetNameOrRange.substring(separatorIndex + 1).trim();
  }

  if (!sheetName) {
    throw new Error("Google Sheet tab name is empty");
  }

  if (!range) {
    throw new Error("Google Sheet cell range is empty");
  }

  // Find the actual tab name (ignores extra spaces and upper/lower case)
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: finalSpreadsheetId,
    fields: "sheets.properties.title",
  });

  const availableSheets =
    spreadsheet.data.sheets
      ?.map((sheet) => sheet.properties?.title)
      .filter((title): title is string => Boolean(title)) || [];

  const normalizedRequested = normalizeSheetName(sheetName);

  const actualSheetName = availableSheets.find(
    (title) => normalizeSheetName(title) === normalizedRequested
  );

  if (!actualSheetName) {
    throw new Error(
      `Google Sheet tab "${sheetName}" was not found. ` +
        `Available tabs: ${availableSheets.join(", ")}`
    );
  }

  const escapedSheetName = actualSheetName.replace(/'/g, "''");

  const finalRange = `'${escapedSheetName}'!${range}`;

  // Try up to 3 times in case of a temporary Google error
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: finalSpreadsheetId,
        range: finalRange,
        valueRenderOption: "UNFORMATTED_VALUE",
      });

      return (response.data.values || []) as string[][];
    } catch (error: unknown) {
      lastError = error;

      console.error(
        `Google Sheets request failed (attempt ${attempt}/3):`,
        error instanceof Error ? error.message : error
      );

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw new Error(
    `Google Sheets API error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}
  