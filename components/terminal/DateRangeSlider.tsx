"use client";

import { useMemo, useRef } from "react";

interface DateRangeSliderProps {
  labels: string[];
  values: number[];
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const MIN_SPAN = 6; // 7 days inclusive
const GRABBER = 16; // px, keep in sync with --ts-g in terminal.css

type Period = { label: string; rows?: number };
const PERIODS: Period[] = [
  { label: "10 days", rows: 10 },
  { label: "1 month", rows: 22 },
  { label: "3 months", rows: 66 },
  { label: "6 months", rows: 130 },
  { label: "1 year", rows: 252 },
  { label: "MAX" },
];

type Drag = { mode: "start" | "end" | "move"; x: number; start: number; end: number } | null;

function indexFromX(el: HTMLElement, x: number, max: number) {
  const rect = el.getBoundingClientRect();
  const inner = Math.max(1, rect.width - GRABBER);
  const rel = Math.min(Math.max(x - rect.left - GRABBER / 2, 0), inner);
  return Math.round((rel / inner) * max);
}

export function DateRangeSlider({ labels, values, value, onChange }: DateRangeSliderProps) {
  const max = labels.length - 1;
  const [start, end] = value;
  const dragRef = useRef<Drag>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const points = useMemo(() => {
    if (values.length < 2) return "";
    let min = Infinity;
    let maxV = -Infinity;
    for (const v of values) {
      if (!Number.isFinite(v)) continue;
      if (v < min) min = v;
      if (v > maxV) maxV = v;
    }
    if (!Number.isFinite(min) || !Number.isFinite(maxV)) return "";
    const span = maxV - min || 1;
    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * 100;
        const y = 4 + (1 - ((Number.isFinite(v) ? v : min) - min) / span) * 32;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [values]);

  const selLeft = `calc(var(--ts-g) / 2 + ${max > 0 ? start / max : 0} * (100% - var(--ts-g)))`;
  const selRight = `calc(var(--ts-g) / 2 + ${max > 0 ? (max - end) / max : 0} * (100% - var(--ts-g)))`;

  const activePreset = useMemo(() => {
    if (end !== max) return null;
    for (const p of PERIODS) {
      const s = p.rows == null || p.rows > max + 1 ? 0 : Math.max(0, max - p.rows + 1);
      if (start === s) return p.label;
    }
    return null;
  }, [start, end, max]);

  if (max < 1) return null;

  const onHandleKey = (mode: "start" | "end") => (e: React.KeyboardEvent) => {
    let d = 0;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") d = e.shiftKey ? -7 : -1;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") d = e.shiftKey ? 7 : 1;
    else return;
    e.preventDefault();
    if (mode === "start") {
      const s = Math.min(Math.max(0, start + d), Math.max(0, end - MIN_SPAN));
      onChange([s, end]);
    } else {
      const en = Math.max(end + d, Math.min(max, start + MIN_SPAN));
      onChange([start, en]);
    }
  };

  const applyPreset = (p: Period) => {
    if (p.rows == null || p.rows > max + 1) {
      onChange([0, max]);
      return;
    }
    onChange([Math.max(0, max - p.rows + 1), max]);
  };

  const style = { "--sel-l": selLeft, "--sel-r": selRight } as React.CSSProperties;

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

      <div
        className="ts-scrollbar"
        ref={trackRef}
        style={style}
        onPointerDown={(e) => {
          if (max < 1 || !trackRef.current) return;
          const idx = indexFromX(trackRef.current, e.clientX, max);
          const span = end - start;
          let s: number;
          if (idx > start && idx < end) {
            s = start;
          } else {
            s = Math.min(Math.max(idx - Math.floor(span / 2), 0), Math.max(0, max - span));
          }
          dragRef.current = { mode: "move", x: e.clientX, start: s, end: s + span };
          e.currentTarget.setPointerCapture(e.pointerId);
          if (s !== start) onChange([s, Math.min(max, s + span)]);
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          if (d?.mode !== "move" || !trackRef.current) return;
          const inner = Math.max(1, trackRef.current.getBoundingClientRect().width - GRABBER);
          const dIdx = Math.round(((e.clientX - d.x) / inner) * max);
          const span = d.end - d.start;
          const s = Math.min(Math.max(d.start + dIdx, 0), Math.max(0, max - span));
          onChange([s, s + span]);
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
      >
        <svg className="ts-spark" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={points} />
        </svg>
        <div className="ts-selection" />
        <svg className="ts-spark ts-spark-selected" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={points} />
        </svg>
        <div
          className="ts-grabber ts-grabber-start"
          role="slider"
          tabIndex={0}
          aria-label="Start date"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={start}
          aria-valuetext={labels[start]}
          onPointerDown={(e) => {
            e.stopPropagation();
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            dragRef.current = { mode: "start", x: e.clientX, start, end };
          }}
          onPointerMove={(e) => {
            if (dragRef.current?.mode !== "start" || !trackRef.current) return;
            const idx = indexFromX(trackRef.current, e.clientX, max);
            onChange([Math.min(idx, Math.max(0, end - MIN_SPAN)), end]);
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
          onKeyDown={onHandleKey("start")}
        />
        <div
          className="ts-grabber ts-grabber-end"
          role="slider"
          tabIndex={0}
          aria-label="End date"
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={end}
          aria-valuetext={labels[end]}
          onPointerDown={(e) => {
            e.stopPropagation();
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            dragRef.current = { mode: "end", x: e.clientX, start, end };
          }}
          onPointerMove={(e) => {
            if (dragRef.current?.mode !== "end" || !trackRef.current) return;
            const idx = indexFromX(trackRef.current, e.clientX, max);
            onChange([start, Math.max(idx, Math.min(max, start + MIN_SPAN))]);
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
          onKeyDown={onHandleKey("end")}
        />
      </div>

      <div className="ts-periods" role="group" aria-label="Quick date ranges">
        {PERIODS.map((p) => (
          <button
            key={p.label}
            type="button"
            className={`ts-period${activePreset === p.label ? " active" : ""}`}
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
