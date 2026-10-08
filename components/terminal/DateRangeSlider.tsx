"use client";

import { useCallback } from "react";

interface DateRangeSliderProps {
  labels: string[];
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const MIN_SPAN = 6; // 7 days inclusive

export function DateRangeSlider({ labels, value, onChange }: DateRangeSliderProps) {
  const max = labels.length - 1;
  const [start, end] = value;

  const setStart = useCallback(
    (v: number) => {
      const next = max < MIN_SPAN ? Math.min(v, max) : Math.min(v, end - MIN_SPAN);
      onChange([Math.max(0, next), end]);
    },
    [onChange, end, max]
  );

  const setEnd = useCallback(
    (v: number) => {
      const next = max < MIN_SPAN ? Math.max(v, start) : Math.max(v, start + MIN_SPAN);
      onChange([start, Math.min(max, next)]);
    },
    [onChange, start, max]
  );

  if (max < 1) return null;

  return (
    <div className="date-range">
      <div className="date-range-head">
        <span className="date-range-title">Date range</span>
        <span className="date-range-readout">
          <span className="date-range-value">{labels[start]}</span>
          <span className="date-range-arrow" aria-hidden="true">
            &rarr;
          </span>
          <span className="date-range-value">{labels[end]}</span>
          <span className="date-range-count">{end - start + 1} days</span>
        </span>
      </div>
      <div className="date-range-track">
        <div className="date-range-rail" />
        <div
          className="date-range-fill"
          style={{
            left: `calc(var(--thumb) / 2 + ${start / max} * (100% - var(--thumb)))`,
            right: `calc(var(--thumb) / 2 + ${(max - end) / max} * (100% - var(--thumb)))`,
          }}
        />
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={start}
          onChange={(e) => setStart(Number(e.target.value))}
          className="date-range-input date-range-input-start"
          aria-label="Start date"
        />
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={end}
          onChange={(e) => setEnd(Number(e.target.value))}
          className="date-range-input date-range-input-end"
          aria-label="End date"
        />
      </div>
    </div>
  );
}