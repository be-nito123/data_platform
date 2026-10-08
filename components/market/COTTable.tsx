"use client";

import type { CotRow, CotVariant } from "@/lib/supabase/data/cot";

interface COTTableProps {
  data: CotRow[];
  variant?: CotVariant;
  maxRows?: number;
}

function fmt(num: number | null | undefined): string {
  if (num === null || num === undefined || !Number.isFinite(num)) return "—";
  return num.toLocaleString();
}

function changeClass(num: number | null | undefined): string {
  if (num === null || num === undefined || !Number.isFinite(num)) return "";
  return num >= 0 ? "positive" : "negative";
}

interface Column {
  key: keyof CotRow;
  label: string;
  colored?: boolean;
}

const STANDARD_COLUMNS: Column[] = [
  { key: "dealerNet", label: "DEALER NET", colored: true },
  { key: "assetManagerNet", label: "ASSET MGR NET", colored: true },
  { key: "leveragedMoneyNet", label: "LEV MONEY NET", colored: true },
  { key: "dealerLong", label: "DEALER LONG" },
  { key: "dealerShort", label: "DEALER SHORT" },
  { key: "assetManagerLong", label: "ASSET MGR LONG" },
  { key: "assetManagerShort", label: "ASSET MGR SHORT" },
  { key: "leveragedMoneyLong", label: "LEV MONEY LONG" },
  { key: "leveragedMoneyShort", label: "LEV MONEY SHORT" },
];

const GOLD_COLUMNS: Column[] = [
  { key: "swapNet", label: "SWAP DEALER NET", colored: true },
  { key: "assetManagerNet", label: "MANAGED MONEY NET", colored: true },
  { key: "producerNet", label: "PRODUCERS NET", colored: true },
  { key: "assetManagerLong", label: "M. MONEY LONG" },
  { key: "assetManagerShort", label: "M. MONEY SHORT" },
  { key: "producerLong", label: "PRODUCERS LONG" },
  { key: "producerShort", label: "PRODUCERS SHORT" },
];

function PriceCell({ row }: { row: CotRow }) {
  const raw = row.btcPrice || "";
  if (!raw) return <td className="price-col">—</td>;

  const [openRaw = "", closeRaw = ""] = raw.split("/").map((s) => s.trim());
  const displayClose = closeRaw || openRaw;

  const cls =
    row.priceOpen !== null && row.priceClose !== null
      ? row.priceClose >= row.priceOpen
        ? "positive"
        : "negative"
      : "";

  return (
    <td className={`price-col ${cls}`}>
      {closeRaw ? (
        <>
          <span className="price-open">{openRaw}</span>
          <span className="price-sep"> → </span>
          <span className="price-close">{displayClose}</span>
        </>
      ) : (
        displayClose
      )}
    </td>
  );
}

export function COTTable({ data, variant = "standard", maxRows = 20 }: COTTableProps) {
  // Sheet rows are oldest → newest; show the most recent reports first.
  const displayData = data.slice(-maxRows).reverse();
  const columns = variant === "gold" ? GOLD_COLUMNS : STANDARD_COLUMNS;

  return (
    <div className="cot-table-container">
      <div className="cot-table-bar">
        <span className="cot-table-title">COT POSITIONING</span>
        <span className="cot-table-freq">WEEKLY · {data.length} REPORTS</span>
      </div>
      <div className="cot-table-scroll">
        <table className="cot-table">
          <thead>
            <tr>
              <th className="date-col">DATE</th>
              <th>PRICE (OPEN → CLOSE)</th>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="cot-empty">
                  No COT reports available
                </td>
              </tr>
            ) : (
              displayData.map((row, idx) => (
                <tr key={`${row.date}-${idx}`}>
                  <td className="date-col">{row.date}</td>
                  <PriceCell row={row} />
                  {columns.map((col) => {
                    const value = row[col.key] as number | null | undefined;
                    const cls = col.colored ? changeClass(value ?? null) : "";
                    return (
                      <td key={col.key} className={cls}>
                        {fmt(value ?? null)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="cot-legend">
        <span className="legend-item"><span className="legend-color positive" /> Positive / Long</span>
        <span className="legend-item"><span className="legend-color negative" /> Negative / Short</span>
        <span className="legend-item">Price: week open → week close (green = close ≥ open)</span>
      </div>
    </div>
  );
}
