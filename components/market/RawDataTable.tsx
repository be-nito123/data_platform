"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [expanded]);

  const renderTable = () => (
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
  );

  return (
    <div className="raw-data-table">
      <div className="raw-table-bar">
        <span className="raw-table-title">{title ?? "Data"}</span>
        <button
          type="button"
          className="raw-table-toggle"
          onClick={() => setExpanded(true)}
          aria-label="Expand table"
        >
          <span className="raw-table-toggle-text">Expand</span>
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
      <div className="raw-data-table-container">{renderTable()}</div>
      {expanded &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="sheet-modal" role="dialog" aria-modal="true" aria-label={`${title ?? "Data"} expanded`}>
            <div className="sheet-modal-backdrop" onClick={() => setExpanded(false)} />
            <div className="sheet-modal-panel">
              <div className="sheet-modal-head">
                <span className="raw-table-title">{title ?? "Data"}</span>
                <button
                  type="button"
                  className="sheet-modal-close"
                  onClick={() => setExpanded(false)}
                  aria-label="Close"
                >
                  <svg
                    viewBox="0 0 16 16"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 4l12 12m0-12L4 12" />
                  </svg>
                </button>
              </div>
              <div className="sheet-modal-body">{renderTable()}</div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}