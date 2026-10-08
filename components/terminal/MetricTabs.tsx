"use client";

import type { InstrumentConfig } from "@/lib/instruments";

interface MetricTabsProps {
  instrument: InstrumentConfig;
  activeMetric: string;
  onMetricChange: (metric: string) => void;
}

interface MetricDef {
  key: string;
  label: string;
  requires?: keyof InstrumentConfig;
}

const METRIC_ORDER: MetricDef[] = [
  { key: "overview", label: "OVERVIEW" },
  { key: "price", label: "PRICE", requires: "hasVolume" },
  { key: "volume", label: "VOLUME", requires: "hasVolume" },
  { key: "openInterest", label: "OPEN INTEREST", requires: "hasOpenInterest" },
  { key: "cot", label: "COT", requires: "hasCOT" },
  { key: "yield", label: "YIELD", requires: "hasYield" },
  { key: "dailyBps", label: "DAILY BPS", requires: "isYield" },
  { key: "weeklyBps", label: "WEEKLY BPS", requires: "isYield" },
  { key: "historical", label: "HISTORICAL" },
];

export function MetricTabs({ instrument, activeMetric, onMetricChange }: MetricTabsProps) {
  const availableMetrics = METRIC_ORDER.filter((m) => !m.requires || Boolean(instrument[m.requires]));

  return (
    <nav className="metric-tabs" role="tablist" aria-label="Data metric">
      {availableMetrics.map((metric) => (
        <button
          key={metric.key}
          role="tab"
          aria-selected={activeMetric === metric.key}
          onClick={() => onMetricChange(metric.key)}
          className={`metric-tab ${activeMetric === metric.key ? "active" : ""}`}
        >
          {metric.label}
        </button>
      ))}
    </nav>
  );
}
