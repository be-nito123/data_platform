import { notFound } from "next/navigation";
import Link from "next/link";
import { getSheetData } from "@/lib/supabase/google/sheets";
import MarketDataChart from "@/components/MarketWeatherChart";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

/* ========================================================= */
/* SETTINGS */
/* ========================================================= */

// Name of the tab inside the "weather conditon to TAKE OFF" Google Sheet.
// Must match the tab name at the bottom of the sheet EXACTLY.
const SHEET_TAB = "Daily";

// Only rows from this date onward are shown.
const START_DATE = new Date(2025, 9, 1); // 1 October 2025

/* ========================================================= */
/* ASSET CONFIGURATION */
/* ========================================================= */

type AssetConfig = {
  symbol: string;
  name: string;
  description: string;
  start: number;
  columns: number;
  headers: readonly string[];
};

const FUTURES_HEADERS = [
  "Price",
  "Volume",
  "Open Interest",
  "OI Change",
  "OI %",
] as const;

const YIELD_HEADERS = ["Yield", "BPS", "Weekly BPS"] as const;

const ASSETS: Record<string, AssetConfig> = {
  gold: {
    symbol: "XAU",
    name: "Gold",
    description: "Gold Futures · CME Group",
    start: 2,
    columns: 7,
    headers: [
      "Price",
      "Volume",
      "Open Interest",
      "OI Change",
      "OI %",
      "D %",
      "Weekly %",
    ],
  },

  silver: {
    symbol: "XAG",
    name: "Silver",
    description: "Silver Futures · CME Group",
    start: 10,
    columns: 5,
    headers: FUTURES_HEADERS,
  },

  gsr: {
    symbol: "GSR",
    name: "Gold / Silver Ratio",
    description: "Gold to Silver Ratio",
    start: 16,
    columns: 3,
    headers: ["Price", "Value", "Change"],
  },

  dxy: {
    symbol: "DXY",
    name: "US Dollar Index",
    description: "US Dollar Index",
    start: 20,
    columns: 3,
    headers: ["Price", "Volume", "Open Interest"],
  },

  "us02y-bond": {
    symbol: "US02Y",
    name: "US 02Y Bond",
    description: "US Treasury 2 Year Bond",
    start: 28,
    columns: 5,
    headers: FUTURES_HEADERS,
  },

  "us10y-bond": {
    symbol: "US10Y",
    name: "US 10Y Bond",
    description: "US Treasury 10 Year Bond",
    start: 34,
    columns: 5,
    headers: FUTURES_HEADERS,
  },

  "us02y-yield": {
    symbol: "US02Y",
    name: "US 02Y Yield",
    description: "US Treasury 2 Year Yield",
    start: 40,
    columns: 3,
    headers: YIELD_HEADERS,
  },

  "us10y-yield": {
    symbol: "US10Y",
    name: "US 10Y Yield",
    description: "US Treasury 10 Year Yield",
    start: 44,
    columns: 3,
    headers: YIELD_HEADERS,
  },

  us30y: {
    symbol: "US30Y",
    name: "US 30Y Yield",
    description: "US Treasury 30 Year Yield",
    start: 48,
    columns: 3,
    headers: YIELD_HEADERS,
  },

  jpy: {
    symbol: "JPY",
    name: "JPY Futures",
    description: "Japanese Yen Futures",
    start: 52,
    columns: 5,
    headers: FUTURES_HEADERS,
  },

  cad: {
    symbol: "CAD",
    name: "CAD Futures",
    description: "Canadian Dollar Futures",
    start: 58,
    columns: 5,
    headers: FUTURES_HEADERS,
  },

  swiss: {
    symbol: "CHF",
    name: "Swiss Futures",
    description: "Swiss Franc Futures",
    start: 64,
    columns: 5,
    headers: FUTURES_HEADERS,
  },

  oil: {
    symbol: "OIL",
    name: "Oil",
    description: "Crude Oil Futures",
    start: 70,
    columns: 5,
    headers: FUTURES_HEADERS,
  },

  btc: {
    symbol: "BTC",
    name: "Bitcoin",
    description: "Bitcoin Futures",
    start: 76,
    columns: 5,
    headers: FUTURES_HEADERS,
  },

  nasdaq100: {
    symbol: "NDX",
    name: "Nasdaq 100",
    description: "Nasdaq 100 Index",
    start: 82,
    columns: 5,
    headers: FUTURES_HEADERS,
  },

  sp500: {
    symbol: "SPX",
    name: "S&P 500",
    description: "S&P 500 Index",
    start: 88,
    columns: 5,
    headers: FUTURES_HEADERS,
  },

  us30: {
    symbol: "US30",
    name: "US 30",
    description: "Dow Jones Industrial Average",
    start: 94,
    columns: 5,
    headers: FUTURES_HEADERS,
  },

  eurusd: {
    symbol: "EURUSD",
    name: "EUR / USD",
    description: "Euro / US Dollar",
    start: 100,
    columns: 5,
    headers: FUTURES_HEADERS,
  },

  gbpusd: {
    symbol: "GBPUSD",
    name: "GBP / USD",
    description: "British Pound / US Dollar",
    start: 106,
    columns: 5,
    headers: FUTURES_HEADERS,
  },

  eth: {
    symbol: "ETH",
    name: "Ethereum",
    description: "Ethereum Futures",
    start: 112,
    columns: 5,
    headers: FUTURES_HEADERS,
  },
};

/* ========================================================= */
/* DATE HELPERS */
/* ========================================================= */

// Month names -> month index (0 = January).
const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/*
  Converts a sheet cell into a Date (local time, midnight).

  Supports:
  - Google Sheets serial numbers, e.g. 45931
  - "01-Oct-2025", "1 Oct 2025", "1/Oct/2025"
  - "1 Oct" (no year)  -> uses fallbackYear
  - ISO / standard date strings
*/
function parseSheetDate(value: unknown, fallbackYear?: number): Date | null {
  if (value === null || value === undefined) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  // Google Sheets serial date.
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const serial = Number(raw);

    if (serial > 20000 && serial < 100000) {
      const utc = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);

      if (!Number.isNaN(utc.getTime())) {
        return new Date(
          utc.getUTCFullYear(),
          utc.getUTCMonth(),
          utc.getUTCDate()
        );
      }
    }

    return null;
  }

  // "01-Oct-2025", "01 Oct 2025", ...
  const full = raw.match(/^(\d{1,2})[-\/ ]([A-Za-z]{3,9})[-\/ ](\d{4})$/);

  if (full) {
    const day = Number(full[1]);
    const month = MONTHS[full[2].toLowerCase()];
    const year = Number(full[3]);

    if (month !== undefined) {
      const date = new Date(year, month, day);

      if (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        return date;
      }
    }
  }

  // "1 Oct" (no year).
  const short = raw.match(/^(\d{1,2})[-\/ ]([A-Za-z]{3,9})$/);

  if (short && fallbackYear !== undefined) {
    const day = Number(short[1]);
    const month = MONTHS[short[2].toLowerCase()];

    if (month !== undefined) {
      const date = new Date(fallbackYear, month, day);

      if (date.getMonth() === month && date.getDate() === day) {
        return date;
      }
    }

    return null;
  }

  // ISO / standard date strings (only if it contains a 4-digit year).
  if (/\d{4}/.test(raw)) {
    const parsed = new Date(raw);

    if (!Number.isNaN(parsed.getTime())) {
      return new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
      );
    }
  }

  return null;
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/* ========================================================= */
/* DISPLAY FORMATTING */
/* ========================================================= */

function formatNumberWithCommas(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";

  const raw = String(value).trim();
  if (!raw) return "-";

  // Price pairs such as 4,440/4,473.
  if (raw.includes("/")) {
    return raw
      .split("/")
      .map((part) => formatNumberWithCommas(part))
      .join("/");
  }

  const cleaned = raw.replace(/,/g, "").trim();
  const number = Number(cleaned);

  if (!Number.isFinite(number)) return raw;

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
  }).format(number);
}

function formatPercentage(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";

  const raw = String(value).trim();
  if (!raw) return "-";

  if (raw.endsWith("%")) {
    const number = Number(raw.slice(0, -1).replace(/,/g, "").trim());
    if (!Number.isFinite(number)) return raw;

    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(number)}%`;
  }

  const number = Number(raw.replace(/,/g, ""));

  if (!Number.isFinite(number)) return raw;

  // Sheet stores percentage changes as decimal ratios.
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(number * 100)}%`;
}

function formatCellValue(value: unknown, header: string): string {
  if (value === null || value === undefined || value === "") return "-";

  if (header.toLowerCase().includes("%")) {
    return formatPercentage(value);
  }

  return formatNumberWithCommas(value);
}

/*
  Converts text such as "4,673" or "426,688" into a number.
  For price pairs such as "3887/3897", the LAST value is used.
*/
function parseNumber(value: string | undefined): number | null {
  if (!value) return null;

  const lastPart = String(value).split("/").pop() ?? "";

  const cleaned = lastPart.replace(/,/g, "").replace(/%/g, "").trim();
  if (!cleaned) return null;

  const number = Number(cleaned);

  return Number.isNaN(number) ? null : number;
}

/* ========================================================= */
/* PAGE */
/* ========================================================= */

export default async function WeatherAssetPage({
  params,
}: {
  params: Promise<{ asset: string }>;
}) {
  const { asset } = await params;

  const alias: Record<string, string> = {
    xau: "gold",
    xag: "silver",
    bitcoin: "btc",
    nasdaq: "nasdaq100",
    "nasdaq-100": "nasdaq100",
    ndx: "nasdaq100",
    spx: "sp500",
    dow: "us30",
    chf: "swiss",
    wti: "oil",
    crude: "oil",
    usdjpy: "jpy",
    usdcad: "cad",
  };

  const normalized = asset.toLowerCase();
  const key =
    alias[normalized] ??
    Object.keys(ASSETS).find(
      (name) => name.toLowerCase() === normalized
    );
  const config = key ? ASSETS[key] : undefined;

  /* ======================================================= */
  /* INVALID ASSET */
  /* ======================================================= */

  if (!config) { notFound(); }

  /* ======================================================= */
  /* GOOGLE SHEET DATA */
  /* ======================================================= */

  let rows: unknown[][] = [];

  try {
    rows = await getSheetData(SHEET_TAB, "A1:DM1000");
  } catch (error) {
    console.error("Sheet fetch failed:", error);
    return <DataUnavailable symbol={config.symbol} name={config.name} />;
  }

  if (rows.length === 0) {
    return <DataUnavailable symbol={config.symbol} name={config.name} />;
  }

  /* ======================================================= */
  /* DATE ROWS */
  /* ======================================================= */

  /*
    Do not assume the market data always starts on row 5.
    We detect real date rows from column A and keep market data
    from START_DATE onward.

    If the sheet shows dates without a year (for example "1 Oct"),
    the year is inferred from the row order: it starts at the year of
    START_DATE and increases by 1 each time the month goes backwards
    (for example Dec -> Jan).
  */

  let currentYear = START_DATE.getFullYear();
  let lastMonth = -1;

  const datedRows = rows.map((row) => {
    const raw = String(row[0] ?? "").trim();
    const noYear = raw.match(/^(\d{1,2})[-\/ ]([A-Za-z]{3,9})$/);

    if (noYear) {
      const month = MONTHS[noYear[2].toLowerCase()];

      if (month !== undefined) {
        if (lastMonth !== -1 && month < lastMonth) {
          currentYear += 1; // eslint-disable-line react-hooks/immutability
        }

        lastMonth = month;

        return { row, date: parseSheetDate(raw, currentYear) };
      }
    }

    return { row, date: parseSheetDate(raw) };
  });

  const filteredRows = datedRows
    .filter(
      (item): item is { row: unknown[]; date: Date } =>
        item.date !== null && item.date >= START_DATE
    )
    // Oldest -> newest, so the last row is really the latest.
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  /* ======================================================= */
  /* BUILD TABLE */
  /* ======================================================= */

  const tableRows = filteredRows.map(({ row, date }) => {
    // Always return exactly `columns` cells, even if the sheet
    // trimmed empty cells at the end of the row.
    const values = Array.from({ length: config.columns }, (_, i) => {
      const cell = row[config.start + i];
      return cell === null || cell === undefined ? "" : String(cell);
    });

    return {
      date: formatDate(date),
      values,
    };
  });

  // Latest = last row that actually has market data
  // (skips weekends / future dates with empty cells).
  const latest =
    [...tableRows]
      .reverse()
      .find((row) => row.values.some((value) => value.trim() !== "")) ?? null;

  /* ======================================================= */
  /* GRAPH DATA */
  /* ======================================================= */

  const chartData = tableRows
    .map((row) => ({
      date: row.date,

      // First column = Price / Close
      price: parseNumber(row.values[0]),

      // Second column = Volume
      volume: parseNumber(row.values[1]),

      // Third column = Open Interest
      oi: parseNumber(row.values[2]),
    }))
    .filter(
      (row) => row.price !== null || row.volume !== null || row.oi !== null
    );

  /* ======================================================= */
  /* RENDER */
  /* ======================================================= */

  return (
    <main
      className="min-h-screen bg-black text-[#FFFFFF]">
      <SiteNav />

      {/* ===================================================== */}
      {/* TITLE */}
      {/* ===================================================== */}

      <section className="border-b border-white/[.10] px-6 py-8">
        <div className="flex items-end justify-between">
          <div>
            <Link
              href="/weather-condition"
              className="text-[10px] uppercase tracking-[0.18em] text-[#48484D] hover:text-[#98989F]">
              Market / Conditions / Daily
            </Link>

            <div className="mt-3 flex items-center gap-4">
              <h1 className="text-[30px] font-semibold tracking-tight text-[#FFFFFF]">
                {config.name}
              </h1>

              <span className="border border-white/[.10] px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-[#98989F]">
                {config.symbol}
              </span>
            </div>

            <p className="mt-2 text-[13px] text-[#636366]">
              {config.description}
            </p>
          </div>

          <div className="hidden text-right sm:block">
            <div className="text-[10px] uppercase tracking-[0.15em] text-[#48484D]">
              Frequency
            </div>

            <div className="mt-2 text-[13px] text-[#C7C7CC]">DAILY</div>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* MARKET SNAPSHOT */}
      {/* ===================================================== */}

      <section className="px-6 py-7">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#7C7C82]">
            Market Snapshot
          </div>

          <div className="text-[10px] uppercase tracking-[0.15em] text-[#48484D]">
            Latest
          </div>
        </div>

        <div className="grid grid-cols-2 rounded-2xl overflow-hidden border border-white/[.10] md:grid-cols-5">
          <Metric label="Date" value={latest?.date || "-"} />

          <Metric
            label={config.headers[0] || "Value"}
            value={formatCellValue(latest?.values[0], config.headers[0] || "")}
          />

          <Metric
            label={config.headers[1] || "-"}
            value={formatCellValue(latest?.values[1], config.headers[1] || "")}
          />

          <Metric
            label={config.headers[2] || "-"}
            value={formatCellValue(latest?.values[2], config.headers[2] || "")}
          />

          <Metric
            label={config.headers[3] || "-"}
            value={formatCellValue(latest?.values[3], config.headers[3] || "")}
          />
        </div>
      </section>

      {/* ===================================================== */}
      {/* MARKET CHART */}
      {/* ===================================================== */}

      <section className="px-6 pb-8">
        <MarketDataChart data={chartData} />
      </section>

      {/* ===================================================== */}
      {/* DAILY DATA */}
      {/* ===================================================== */}

      <section className="px-6 pb-10">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#7C7C82]">
            Complete Daily Data
          </div>

          <div className="text-[10px] text-[#48484D]">
            {tableRows.length} records
          </div>
        </div>

        <div className="overflow-x-auto border border-white/[.10]">
          <table className="min-w-[1000px] w-full border-collapse">
            {/* HEADER */}

            <thead>
              <tr className="bg-[#1C1C1E]">
                <th className="border-r border-white/[.10] px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.08em] text-[#7C7C82]">
                  Date
                </th>

                {config.headers.map((header) => (
                  <th
                    key={header}
                    className="border-r border-white/[.10] px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.08em] text-[#7C7C82]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            {/* BODY */}

            <tbody>
              {tableRows.map((row, rowIndex) => (
                <tr
                  key={`${row.date}-${rowIndex}`}
                  className="hover:bg-white/[.02] transition-colors">
                  <td className="border-b border-white/[.04] px-3 py-2 text-left text-[11.5px] font-medium text-[#C7C7CC]">
                    {row.date}
                  </td>

{row.values.map((value, index) => (
                    <td
                      key={index}
                      className={`border-r border-white/[.10] px-4 py-3 text-[12px] ${getValueColor(
                        value,
                        config.headers[index]
                      )}`}>
                      {formatCellValue(value, config.headers[index] || "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

/* ========================================================= */
/* METRIC */
/* ========================================================= */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-white/[.10] px-5 py-5">
      <div className="text-[10px] uppercase tracking-[0.15em] text-[#48484D]">
        {label}
      </div>

      <div className="mt-3 text-[15px] font-semibold text-[#FFFFFF]">
        {value}
      </div>
    </div>
  );
}

/* ========================================================= */
/* VALUE COLOR */
/* ========================================================= */

function getValueColor(value: string, header?: string) {
  if (!value) {
    return "text-[#C7C7CC]";
  }

  const clean = String(value)
    .replace(/,/g, "")
    .replace(/%/g, "")
    .replace(/bps/gi, "")
    .trim();

  const number = Number(clean);

  if (Number.isNaN(number) || clean === "") {
    return "text-[#C7C7CC]";
  }

  // Color change columns green/red
  const h = (header || "").toLowerCase();
  const isChange = h.includes("change") || h.includes("%") || h.includes("net");

  if (isChange) {
    if (number > 0) return "text-[#30D158]";
    if (number < 0) return "text-[#FF453A]";
  }

  return "text-[#C7C7CC]";
}

/* ========================================================= */
/* DATA UNAVAILABLE STATE                                   */
/* ========================================================= */

function DataUnavailable({ symbol, name }: { symbol: string; name: string }) {
  return (
    <main className="min-h-screen bg-black text-[#FFFFFF]">
      <SiteNav />

      <section className="mx-auto max-w-[1600px] px-5 py-20 lg:px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[.10] bg-white/[.04] font-mono text-sm font-bold text-[#0A84FF]">
          {symbol}
        </div>

        <p className="mt-7 font-mono text-[10px] uppercase tracking-[.2em] text-[#0A84FF]">
          Market Weather
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          {name} data is loading
        </h1>

        <p className="mt-4 max-w-xl text-base leading-7 text-white/45">
          We are fetching the latest market data for {name}. Please refresh in
          a moment — the feed usually recovers within seconds.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={`/weather-condition/${symbol}`}
            className="rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0A84FF]"
          >
            Retry →
          </a>

          <Link
            href="/weather-condition"
            className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/[.04]"
          >
            All instruments
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
