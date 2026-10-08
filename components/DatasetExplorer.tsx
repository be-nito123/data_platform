"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { type InstrumentConfig } from "@/lib/instruments";

export type DatasetItem = {
  id: string;
  name: string;
  description: string;
  icon: string;
  href: string;
  config: InstrumentConfig;
};

const CATEGORY_LABELS: Record<string, string> = {
  commodities: "Commodities",
  rates: "Rates & Yields",
  forex: "Forex",
  equities: "Equities / Indices",
  crypto: "Crypto",
  intermarket: "Intermarket",
};

const CATEGORY_ICONS: Record<string, string> = {
  commodities: "◆",
  rates: "%",
  forex: "¥",
  equities: "▲",
  crypto: "₿",
  intermarket: "◍",
};

const TYPE_LABELS: Record<string, string> = {
  price: "Price",
  volume: "Volume",
  openInterest: "Open Interest",
  cot: "COT",
  yield: "Yield",
  historical: "Historical",
};

export function DatasetExplorer({ datasets }: { datasets: DatasetItem[] }) {
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(datasets.map((d) => d.config.category)))],
    [datasets]
  );

  const visible =
    category === "All"
      ? datasets
      : datasets.filter((d) => d.config.category === category);

  return (
    <div className="dataset-explorer">
      <div className="ds-filter" role="group" aria-label="Filter datasets by category">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`ds-filter-option ${category === cat ? "active" : ""}`}
          >
            {CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="ds-empty">No datasets in this category.</div>
      ) : (
        <div className="ds-grid">
          {visible.map((dataset) => {
            const cat = dataset.config.category;
            const types = dataset.config.availableDataTypes;
            return (
              <article key={dataset.id} className="ds-card">
                <div className="ds-card-top">
                  <span className="ds-icon" aria-hidden="true">
                    {CATEGORY_ICONS[cat] ?? dataset.icon}
                  </span>
                  <span className="ds-badge">{CATEGORY_LABELS[cat] ?? cat}</span>
                </div>

                <h3 className="ds-name">{dataset.name}</h3>
                <p className="ds-desc">{dataset.description}</p>

                <div className="ds-types">
                  {types.map((t) => (
                    <span key={t} className="ds-type">
                      {TYPE_LABELS[t] ?? t}
                    </span>
                  ))}
                </div>

                <div className="ds-card-foot">
                  <span className="ds-count">
                    {types.length} data {types.length === 1 ? "type" : "types"}
                  </span>
                  <Link href={dataset.href} className="ds-open">
                    Open dataset <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}