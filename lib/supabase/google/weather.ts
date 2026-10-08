import { google } from "googleapis";

/* ========================================================= */
/* GOOGLE AUTH */
/* ========================================================= */

let cachedAuth: InstanceType<typeof google.auth.GoogleAuth> | null = null;

function getAuth() {
  if (cachedAuth) return cachedAuth;

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail) {
    throw new Error("GOOGLE_CLIENT_EMAIL is missing from .env.local.");
  }

  if (!rawKey) {
    throw new Error("GOOGLE_PRIVATE_KEY is missing from .env.local.");
  }

  // Remove wrapping quotes (if any) and turn "\n" text into real line breaks.
  const privateKey = rawKey.trim().replace(/^"|"$/g, "").replace(/\\n/g, "\n");

  // Google service account keys start with "BEGIN PRIVATE KEY".
  // "BEGIN RSA PRIVATE KEY" causes: error:1E08010C:DECODER routines::unsupported
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

/* ========================================================= */
/* GENERIC SHEET READER */
/* ========================================================= */

function normalizeTabName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

type RenderOption = "FORMATTED_VALUE" | "UNFORMATTED_VALUE";

async function fetchTab(
  sheetName: string,
  range: string,
  spreadsheetId: string | undefined,
  valueRenderOption: RenderOption
): Promise<unknown[][]> {
  if (!spreadsheetId) {
    throw new Error(
      "GOOGLE_SHEET_ID is missing from .env.local (the ID of the weather Google Sheet)."
    );
  }

  const sheets = google.sheets({ version: "v4", auth: getAuth() });

  // Ask Google which tabs exist, so we can match the name safely
  // (ignores extra spaces and upper/lower case).
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title",
  });

  const tabs =
    spreadsheet.data.sheets
      ?.map((sheet) => sheet.properties?.title)
      .filter((title): title is string => Boolean(title)) ?? [];

  const actualName = tabs.find(
    (tab) => normalizeTabName(tab) === normalizeTabName(sheetName)
  );

  if (!actualName) {
    throw new Error(
      `Google Sheet tab "${sheetName.trim()}" was not found. ` +
        `Available tabs: ${tabs.join(", ")}`
    );
  }

  // Quote the tab name, e.g. 'Daily'!A1:DM1000
  const fullRange = `'${actualName.replace(/'/g, "''")}'!${range}`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: fullRange,
    valueRenderOption,
    // Dates come back as serial numbers (with the full year), not "1 Oct".
    dateTimeRenderOption: "SERIAL_NUMBER",
  });

  return response.data.values ?? [];
}

/* ========================================================= */
/* getSheetData  (used by app/weather-condition/[asset]/page.tsx) */
/* ========================================================= */

/*
  getSheetData("Daily", "A1:DM1000")
    -> reads the weather sheet (GOOGLE_SHEET_ID)

  getSheetData("COT GOLD", "A1:Z500", process.env.COT_GOOGLE_SHEET_ID)
    -> reads another spreadsheet (for example the COT REPORT sheet)
*/
export async function getSheetData(
  sheetName: string,
  range: string = "A1:DM1000",
  spreadsheetId: string | undefined = process.env.GOOGLE_SHEET_ID
): Promise<unknown[][]> {
  return fetchTab(sheetName, range, spreadsheetId, "UNFORMATTED_VALUE");
}

/* ========================================================= */
/* TYPES */
/* ========================================================= */

export type WeatherRow = {
  date: string;

  price: number | null;
  priceRaw: string;

  volume: number | null;

  oi: number | null;
  oiChange: number | null;
  oiPercent: number | null;

  // Yield instruments only: the sheet columns already contain these.
  dailyBps: number | null;
  weeklyBps: number | null;

  dPercent: number | null;
  weeklyPercent: number | null;
};

/* ========================================================= */
/* ASSET COLUMN CONFIGURATION */
/* ========================================================= */

/*
  Google Sheet:

  A = Date
  B = Moon

  Gold       C:I
  Silver     K:O
  GSR        Q:S
  DXY        U:W

  US02Y Bond AC:AG
  US10Y Bond AI:AM

  US02Y Yield AO:AQ
  US10Y Yield AS:AU
  US30Y Yield AW:AY

  JPY BA:BE
  CAD BG:BK
  Swiss BM:BQ

  Oil BS:BW
  BTC BY:CC
  Nasdaq CE:CI
  S&P 500 CK:CO
  US30 CQ:CU
  EURUSD CW:DA
  GBPUSD DC:DG
  ETH DI:DM
*/

const ASSETS: Record<string, { start: number; columns: number; isYield?: boolean }> = {
  gold: { start: 2, columns: 7 },
  silver: { start: 10, columns: 5 },
  gsr: { start: 16, columns: 3 },
  dxy: { start: 20, columns: 3 },

  "us02y-bond": { start: 28, columns: 5 },
  "us10y-bond": { start: 34, columns: 5 },

  "us02y-yield": { start: 40, columns: 3, isYield: true },
  "us10y-yield": { start: 44, columns: 3, isYield: true },
  "us30y-yield": { start: 48, columns: 3, isYield: true },
  us30y: { start: 48, columns: 3, isYield: true }, // same as us30y-yield (the page uses this key)

  jpy: { start: 52, columns: 5 },
  cad: { start: 58, columns: 5 },
  swiss: { start: 64, columns: 5 },

  oil: { start: 70, columns: 5 },
  btc: { start: 76, columns: 5 },
  nasdaq100: { start: 82, columns: 5 },
  sp500: { start: 88, columns: 5 },
  us30: { start: 94, columns: 5 },
  eurusd: { start: 100, columns: 5 },
  gbpusd: { start: 106, columns: 5 },
  eth: { start: 112, columns: 5 },
};

/* ========================================================= */
/* NUMBER PARSER */
/* ========================================================= */

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  let text = String(value)
    .trim()
    .replace(/,/g, "")
    .replace(/%/g, "")
    .replace(/bps/gi, "")
    .trim();

  // Some prices look like "4126/4160". We use the SECOND number.
  // Bond futures look like "101'21/101'20" (32nds). Keep the last part.
  if (text.includes("/")) {
    const parts = text.split("/");
    text = parts[parts.length - 1].trim();
  }

  // Treasury bond 32nds: "101'21" => 101 + 21/32.
  if (text.includes("'")) {
    const m = text.match(/^([0-9]+)\s*'\s*([0-9]+)$/);
    if (m) {
      return Number(m[1]) + Number(m[2]) / 32;
    }
  }

  // Keep only digits, decimal point and minus sign.
  text = text.replace(/[^0-9.-]/g, "");

  if (!text) {
    return null;
  }

  const number = Number(text);

  return Number.isFinite(number) ? number : null;
}

/* ========================================================= */
/* GET WEATHER DATA */
/* ========================================================= */

export async function getWeatherData(asset: string): Promise<WeatherRow[]> {
  if (!Object.prototype.hasOwnProperty.call(ASSETS, asset)) {
    throw new Error(`Unknown weather asset: ${asset}`);
  }

  const config = ASSETS[asset];

  // Text values as shown in the sheet ("1 Oct", "1.2%", "4,126").
  const rows = await fetchTab(
    "Daily",
    "A:DM",
    process.env.GOOGLE_SHEET_ID,
    "FORMATTED_VALUE"
  );

  /*
    Sheet structure:

    Row 1 = information
    Row 2 = titles
    Row 3 = instrument names
    Row 4 = column headers
    Row 5+ = actual data
  */
  const dataRows = rows.slice(4);

  const result: WeatherRow[] = [];

for (const row of dataRows) {
      const date = String(row[0] ?? "").trim();
      const isYield = config.isYield === true;

      // Ignore rows without dates (blank rows between trading periods).
      if (!date) {
        continue;
      }

      // Always read exactly `columns` cells, even if trailing cells are empty.
      const values = Array.from(
        { length: config.columns },
        (_, i) => row[config.start + i]
      );

      if (isYield) {
        // Yield blocks: [yield open/close, daily bps change, weekly bps change].
        // Volume / OI are meaningless for cash yields, so they stay null.
        result.push({
          date,

          price: parseNumber(values[0]),
          priceRaw: String(values[0] ?? "").trim(),

          volume: null,

          oi: null,
          oiChange: null,
          oiPercent: null,

          dailyBps: parseNumber(values[1]),
          weeklyBps: parseNumber(values[2]),

          dPercent: null,
          weeklyPercent: null,
        });
        continue;
      }

      result.push({
        date,

        price: parseNumber(values[0]),
        priceRaw: String(values[0] ?? "").trim(),

        volume: parseNumber(values[1]),

        oi: parseNumber(values[2]),
        oiChange: parseNumber(values[3]),
        oiPercent: parseNumber(values[4]),

        dailyBps: null,
        weeklyBps: null,

        // Only Gold has these last two columns.
        dPercent: parseNumber(values[5]),
        weeklyPercent: parseNumber(values[6]),
      });
    }

  return result;
}
