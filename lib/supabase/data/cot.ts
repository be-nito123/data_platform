/* ========================================================= */
/* TYPES */
/* ========================================================= */

export type CotRow = {
  date: string;

  // Raw price text from the sheet, e.g. "88,260/92,795".
  // Kept for legacy charts (CombinedChart) that parse it themselves.
  btcPrice: string;

  priceOpen: number | null;
  priceClose: number | null;

  openInterest: number | null;

  dealerNet: number | null;
  dealerLong: number | null;
  dealerShort: number | null;

  assetManagerNet: number | null;
  assetManagerLong: number | null;
  assetManagerShort: number | null;

  leveragedMoneyNet: number | null;
  leveragedMoneyLong: number | null;
  leveragedMoneyShort: number | null;

  // Gold sheet only (Swap Dealers / Managed Money / Producers)
  swapNet?: number | null;
  producerNet?: number | null;
  producerLong?: number | null;
  producerShort?: number | null;
};

export type CotVariant = "standard" | "gold";

interface CotColumns {
  date: number;
  price?: number;
  openInterest?: number;
  dealerNet?: number;
  dealerLong?: number;
  dealerShort?: number;
  assetManagerNet?: number;
  assetManagerLong?: number;
  assetManagerShort?: number;
  leveragedMoneyNet?: number;
  leveragedMoneyLong?: number;
  leveragedMoneyShort?: number;
  swapNet?: number;
  producerNet?: number;
  producerLong?: number;
  producerShort?: number;
}

export interface CotSource {
  tab: string;
  range: string;
  variant: CotVariant;
  columns: CotColumns;
}

/* ========================================================= */
/* COLUMN LAYOUTS (verified against the live sheet headers) */
/* ========================================================= */

// Standard futures COT block: price at `p`, then Dealer, Asset Mgr, Lev Money.
function stdBlock(p: number): Omit<CotColumns, "date"> {
  return {
    price: p,
    dealerNet: p + 1,
    assetManagerNet: p + 2,
    assetManagerLong: p + 3,
    assetManagerShort: p + 4,
    leveragedMoneyNet: p + 5,
    leveragedMoneyLong: p + 6,
    leveragedMoneyShort: p + 7,
  };
}

export const COT_SOURCES: Record<string, CotSource> = {
  // Tab: "COT GOLD" — Date, GOLD price T2T, Swap Deal, Managed Mon, Producers
  gold: {
    tab: "COT GOLD",
    range: "A1:Z1000",
    variant: "gold",
    columns: {
      date: 0,
      price: 1,
      swapNet: 2,
      assetManagerNet: 3,
      assetManagerLong: 4,
      assetManagerShort: 5,
      producerNet: 6,
      producerLong: 7,
      producerShort: 8,
    },
  },

  // Tab: "COT BTC / ETH" — BTC block cols 0-11, ETH block cols 13-22
  btc: {
    tab: "COT BTC / ETH",
    range: "A1:Z1000",
    variant: "standard",
    columns: {
      date: 0,
      price: 1,
      openInterest: 2,
      dealerNet: 3,
      assetManagerNet: 4,
      assetManagerLong: 5,
      assetManagerShort: 6,
      leveragedMoneyNet: 7,
      leveragedMoneyLong: 8,
      leveragedMoneyShort: 9,
    },
  },
  eth: {
    tab: "COT BTC / ETH",
    range: "A1:Z1000",
    variant: "standard",
    columns: { date: 0, ...stdBlock(13) },
  },

  // Tab: "COT DXY / US BONDS" — DXY block cols 0-8, US10YR block cols 10-17
  dxy: {
    tab: "COT DXY / US BONDS",
    range: "A1:Z1000",
    variant: "standard",
    columns: { date: 0, ...stdBlock(1) },
  },
  "us10y-bond": {
    tab: "COT DXY / US BONDS",
    range: "A1:Z1000",
    variant: "standard",
    columns: { date: 0, ...stdBlock(10) },
  },

  // Tab: "COT STOCK EXCHANGE" — NASDAQ block cols 0-8, S&P500 block cols 10-17
  nasdaq100: {
    tab: "COT STOCK EXCHANGE",
    range: "A1:Z1000",
    variant: "standard",
    columns: { date: 0, ...stdBlock(1) },
  },
  sp500: {
    tab: "COT STOCK EXCHANGE",
    range: "A1:Z1000",
    variant: "standard",
    columns: { date: 0, ...stdBlock(10) },
  },

  // Tab: "COT FOREX" — EURUSD block cols 0-8, GBPUSD block cols 10-17
  eurusd: {
    tab: "COT FOREX",
    range: "A1:Z1000",
    variant: "standard",
    columns: { date: 0, ...stdBlock(1) },
  },
  gbpusd: {
    tab: "COT FOREX",
    range: "A1:Z1000",
    variant: "standard",
    columns: { date: 0, ...stdBlock(10) },
  },
};

export function getCotSource(instrumentId: string): CotSource | null {
  return COT_SOURCES[instrumentId] ?? null;
}

/* ========================================================= */
/* DATE */
/* ========================================================= */

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

function toDDMMYYYY(year: number, month: number, day: number): string {
  const d = String(day).padStart(2, "0");
  const m = String(month).padStart(2, "0");
  return `${d}/${m}/${year}`;
}

function parseCotDate(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";

  const raw = String(value).trim();
  if (!raw) return "";

  // Google Sheets serial date, e.g. 45931
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = Number(raw);
    if (serial > 20000 && serial < 100000) {
      const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
      if (!Number.isNaN(date.getTime())) {
        return toDDMMYYYY(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
      }
    }
  }

  // Sheet style "Jan6", "Feb 3", "Aug 11", "Sep 8"
  const named = raw.match(/^([A-Za-z]{3,9})\s*(\d{1,2})$/);
  if (named) {
    const month = MONTHS[named[1].toLowerCase()];
    const day = Number(named[2]);
    if (month && day >= 1 && day <= 31) {
      let year = new Date().getFullYear();
      // If the date lands in the future, it belongs to last year.
      const candidate = new Date(Date.UTC(year, month - 1, day));
      if (candidate.getTime() > Date.now() + 7 * 86400000) {
        year -= 1;
      }
      return toDDMMYYYY(year, month, day);
    }
  }

  // Already formatted DD/MM/YYYY or D/M/YYYY
  const slash = raw.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (slash) {
    return toDDMMYYYY(Number(slash[3]), Number(slash[2]), Number(slash[1]));
  }

  return "";
}

/* ========================================================= */
/* NUMBER / PRICE */
/* ========================================================= */

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/\s/g, "")
    .replace(/%/g, "")
    .trim();

  if (!cleaned) return null;

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

// Parses one side of a T2T price: "88,260", "1.178", "112'20" (bond 32nds).
function parsePriceNumber(text: string): number | null {
  const raw = text.trim();
  if (!raw) return null;

  // Bond fraction, e.g. 112'20 -> 112 + 20/32
  const frac = raw.match(/^(\d+)\s*'(\d{1,2})$/);
  if (frac) {
    return Number(frac[1]) + Number(frac[2]) / 32;
  }

  const cleaned = raw.replace(/,/g, "").replace(/\s/g, "");
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function splitPrice(raw: string): [string, string] {
  const parts = raw.split("/");
  const open = (parts[0] ?? "").trim();
  const close = (parts[1] ?? "").trim();
  return [open, close];
}

/* ========================================================= */
/* PROCESS */
/* ========================================================= */

export function processCotRows(
  rows: unknown[][],
  instrumentId: string = "btc"
): CotRow[] {
  const source = getCotSource(instrumentId);
  if (!rows || rows.length === 0 || !source) return [];

  const c = source.columns;
  const result: CotRow[] = [];

  for (const row of rows) {
    if (!row || row.length === 0) continue;

    const at = (index: number | undefined): unknown =>
      index === undefined || index >= row.length ? undefined : row[index];

    const date = parseCotDate(at(c.date));
    if (!date) continue;

    const rawPrice = String(at(c.price) ?? "").trim();
    const [openRaw, closeRaw] = splitPrice(rawPrice);

    const entry: CotRow = {
      date,
      btcPrice: rawPrice,
      priceOpen: parsePriceNumber(openRaw),
      priceClose: rawPrice ? parsePriceNumber(closeRaw || openRaw) : null,

      openInterest: parseNumber(at(c.openInterest)),

      dealerNet: parseNumber(at(c.dealerNet)),
      dealerLong: parseNumber(at(c.dealerLong)),
      dealerShort: parseNumber(at(c.dealerShort)),

      assetManagerNet: parseNumber(at(c.assetManagerNet)),
      assetManagerLong: parseNumber(at(c.assetManagerLong)),
      assetManagerShort: parseNumber(at(c.assetManagerShort)),

      leveragedMoneyNet: parseNumber(at(c.leveragedMoneyNet)),
      leveragedMoneyLong: parseNumber(at(c.leveragedMoneyLong)),
      leveragedMoneyShort: parseNumber(at(c.leveragedMoneyShort)),

      swapNet: parseNumber(at(c.swapNet)),
      producerNet: parseNumber(at(c.producerNet)),
      producerLong: parseNumber(at(c.producerLong)),
      producerShort: parseNumber(at(c.producerShort)),
    };

    // Skip rows that contain only a date (blank placeholder rows).
    const hasValues =
      entry.btcPrice !== "" ||
      Object.entries(entry).some(
        ([key, value]) =>
          key !== "date" && key !== "btcPrice" && typeof value === "number"
      );

    if (!hasValues) continue;

    result.push(entry);
  }

  return result;
}