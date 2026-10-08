"use client";

import { useState } from "react";

export interface RawCell {
  text: string;
  cls?: "positive" | "negative";
}

export interface RawTableRow {
  date: string;
  cells: RawCell[];
}

interface RawDataTableProps {
  columns: string[];
  rows: RawTableRow[];
  title?: string;
}

export function RawDataTable({ columns, rows, title }: RawDataTableProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`raw-data-table${expanded ? " expanded" : ""}`}>
      <div className="raw-table-bar">
        <span className="raw-table-title">{title ?? "Data"}</span>
        <button
          type="button"
          className="raw-table-toggle"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <span>{expanded ? "Collapse" : "Expand"}</span>
          <svg
            className="raw-table-toggle-icon"
            viewBox="0 0 16 16"
            width="12"
            height="12"
            aria-hidden="true"
          >
            <path
              d="M6 3.5 10.5 8 6 12.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="raw-data-table-container">
        <table className="terminal">
          <thead>
            <tr>
              <th>DATE</th>
              {columns.map((c) => (
                <th key={c} className="text-right">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} style={{ textAlign: "center", padding: "24px" }}>
                  No data available
                </td>
              </tr>
            ) : (
              rows
                .slice()
                .reverse()
                .map((row, i) => (
                  <tr key={i}>
                    <td className="date-col">{row.date}</td>
                    {row.cells.map((cell, j) => (
                      <td key={j} className={`text-right ${cell.cls ?? ""}`}>
                        {cell.text}
                      </td>
                    ))}
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}