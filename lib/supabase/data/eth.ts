export type EthCotRow = {
  date: string;
  ethPrice: string;

  dealerNet: number | null;

  assetManagerNet: number | null;
  assetManagerLong: number | null;
  assetManagerShort: number | null;

  leveragedMoneyNet: number | null;
  leveragedMoneyLong: number | null;
  leveragedMoneyShort: number | null;
};


function parseNumber(value?: string): number | null {
  if (!value) return null;

  const cleaned = value
    .replace(/,/g, "")
    .replace(/\s/g, "");

  const number = Number(cleaned);

  return Number.isNaN(number) ? null : number;
}


export function processEthRows(rows: string[][]): EthCotRow[] {
  if (!rows || rows.length < 2) {
    return [];
  }

  return rows
    .slice(1)
    .map((row) => ({
      // A
      date: row[0] ?? "",

      // N
      ethPrice: row[13] ?? "",

      // O
      dealerNet: parseNumber(row[14]),

      // P
      assetManagerNet: parseNumber(row[15]),

      // Q
      assetManagerLong: parseNumber(row[16]),

      // R
      assetManagerShort: parseNumber(row[17]),

      // S
      leveragedMoneyNet: parseNumber(row[18]),

      // T
      leveragedMoneyLong: parseNumber(row[19]),

      // U
      leveragedMoneyShort: parseNumber(row[20]),
    }))
    .filter((row) => row.date !== "");
}