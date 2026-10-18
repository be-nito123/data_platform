import { google } from "googleapis";

/* ========================================================= */
/* CONFIG */
/* ========================================================= */

/** How long resolved sheet metadata and values stay cached. */
const DEFAULT_CACHE_TTL_SECONDS = 300;

const CACHE_TTL_MS = (() => {
  const configured = Number(process.env.SHEET_CACHE_TTL_SECONDS);
  if (Number.isFinite(configured) && configured >= 0) return configured * 1000;
  return DEFAULT_CACHE_TTL_SECONDS * 1000;
})();

/* ========================================================= */
/* GOOGLE AUTH */
/* ========================================================= */

type SheetsClient = ReturnType<typeof google.sheets>;

let cachedAuth: InstanceType<typeof google.auth.GoogleAuth> | null = null;
let cachedSheets: SheetsClient | null = null;

function getGoogleAuth() {
  if (cachedAuth) return cachedAuth;

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY is missing in .env.local");
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

  cachedAuth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return cachedAuth;
}

/** Reuse one authenticated client instead of rebuilding it on every request. */
function getSheetsClient(): SheetsClient {
  if (cachedSheets) return cachedSheets;
  cachedSheets = google.sheets({ version: "v4", auth: getGoogleAuth() });
  return cachedSheets;
}

/* ========================================================= */
/* CACHE */
/* ========================================================= */

/*
  Both the tab listing (spreadsheets.get) and the cell values
  (values.get) are cached in memory. Previously every page render
  and API request paid two Google round-trips, which was the main
  source of latency and a real quota risk.
*/

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

const sheetTitlesCache = new Map<string, CacheEntry<string[]>>();
const sheetValuesCache = new Map<string, CacheEntry<string[][]>>();
const inFlightValues = new Map<string, Promise<string[][]>>();

function readCache<T>(store: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;

  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }

  return entry.value;
}

function writeCache<T>(store: Map<string, CacheEntry<T>>, key: string, value: T): void {
  store.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
}

/** Drop every cached sheet response (useful right after editing the source sheet). */
export function clearSheetCache(): void {
  sheetTitlesCache.clear();
  sheetValuesCache.clear();
  inFlightValues.clear();
}

/* ========================================================= */
/* HELPERS */
/* ========================================================= */

function normalizeSheetName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

async function fetchSheetTitles(spreadsheetId: string): Promise<string[]> {
  const cached = readCache(sheetTitlesCache, spreadsheetId);
  if (cached) return cached;

  const sheets = getSheetsClient();

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });

  const titles =
    spreadsheet.data.sheets
      ?.map((sheet) => sheet.properties?.title)
      .filter((title): title is string => Boolean(title)) ?? [];

  writeCache(sheetTitlesCache, spreadsheetId, titles);
  return titles;
}

async function fetchSheetValues(spreadsheetId: string, range: string): Promise<string[][]> {
  const sheets = getSheetsClient();

  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
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

  // Resolve the real tab name (tolerating extra spaces and casing).
  const availableSheets = await fetchSheetTitles(finalSpreadsheetId);

  const normalizedRequested = normalizeSheetName(sheetName);

  const actualSheetName = availableSheets.find(
    (title) => normalizeSheetName(title) === normalizedRequested
  );

  if (!actualSheetName) {
    throw new Error(
      `Google Sheet tab "${sheetName}" was not found in the configured spreadsheet. ` +
        `Available tabs: ${availableSheets.join(", ") || "(none)"}`
    );
  }

  const qualifiedRange = `'${actualSheetName.replace(/'/g, "''")}'!${range}`;
  const cacheKey = `${finalSpreadsheetId}::${qualifiedRange}`;

  const cachedValues = readCache(sheetValuesCache, cacheKey);
  if (cachedValues) return cachedValues;

  // Collapse concurrent identical requests into a single Google call.
  const pending = inFlightValues.get(cacheKey);
  if (pending) return pending;

  const request = fetchSheetValues(finalSpreadsheetId, qualifiedRange)
    .then((values) => {
      writeCache(sheetValuesCache, cacheKey, values);
      return values;
    })
    .finally(() => {
      inFlightValues.delete(cacheKey);
    });

  inFlightValues.set(cacheKey, request);
  return request;
}
