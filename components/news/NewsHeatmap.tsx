import type { CSSProperties } from "react";
import Link from "next/link";
import { NEWS_MONTH_SHORT, type NewsEntry } from "@/lib/supabase/data/news";
import { formatNewsPercent } from "@/lib/news/format";

/** The month-on-month percentage that fills the colour scale to its limit. */
const SATURATION_PERCENT = 20;

/** The colour scale, as RGB triples so the alpha can carry the magnitude. */
const RISE_CHANNEL = "0, 200, 81";
const FALL_CHANNEL = "255, 68, 68";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/**
 * Twelve months across, one row per figure. Each cell is that figure's
 * month-on-month change, so a glance shows which month the sheet actually moved
 * and which it did not.
 */
export default function NewsHeatmap({
  year,
  entries,
  metrics,
}: {
  year: number;
  entries: NewsEntry[];
  metrics: { key: string; label: string }[];
}) {
  const byMonth = new Map<number, NewsEntry>();

  for (const entry of entries) {
    if (entry.year === year) byMonth.set(entry.month, entry);
  }

  const rows = metrics
    .map((metric) => ({
      ...metric,
      values: MONTHS.map((month) => percentFor(byMonth.get(month), metric.key)),
    }))
    .filter((row) => row.values.some((value) => value !== null));

  if (rows.length === 0) {
    return (
      <p className="news-label">
        No month-on-month movement to plot for {year} yet.
      </p>
    );
  }

  return (
    <div className="news-heatmap-wrap">
      <table className="news-heatmap">
        <thead>
          <tr>
            <th scope="col">Figure</th>
            {MONTHS.map((month) => (
              <th key={month} scope="col">
                {NEWS_MONTH_SHORT[month - 1]}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th scope="row" className="news-heatmap-row-label">
                {row.label}
              </th>

              {MONTHS.map((month, index) => {
                const value = row.values[index];
                const entry = byMonth.get(month);

                if (!entry) {
                  return <td key={month} className="is-empty" />;
                }

                return (
                  <td key={month}>
                    <Link
                      href={`/news/${entry.year}/${entry.monthSlug}`}
                      className={
                        value === null ? "news-heatmap-cell is-empty" : "news-heatmap-cell"
                      }
                      style={cellBackground(value)}
                      title={`${row.label} · ${NEWS_MONTH_SHORT[month - 1]} ${year} · ${
                        value === null ? "no change data" : formatNewsPercent(value)
                      }`}
                    >
                      {value === null ? "—" : formatNewsPercent(value)}
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/*
        Without this the colours are guesswork. Intensity is a scale rather than
        a fixed pair of colours, so it is worth saying what it tracks.
      */}
      <p className="news-heatmap-legend">
        <span className="news-heatmap-swatch" style={swatch(FALL_CHANNEL)} />
        Fell
        <span className="news-heatmap-swatch" style={swatch(RISE_CHANNEL)} />
        Rose
        <span className="news-label">
          Month on month. Intensity tracks the size of the move.
        </span>
      </p>
    </div>
  );
}

/** Intensity tells the size of the move; hue tells the direction. */
function cellBackground(percent: number | null): CSSProperties {
  if (percent === null || !Number.isFinite(percent)) return {};

  return swatch(percent >= 0 ? RISE_CHANNEL : FALL_CHANNEL, percent);
}

/**
 * A translucent fill for the scale: red when a figure fell, green when it rose,
 * deeper the further it moved. `value` is omitted for the legend swatches, which
 * want the colour at a readable strength rather than at a data point's.
 */
function swatch(channel: string, value?: number): CSSProperties {
  const fraction =
    value === undefined ? 0.6 : Math.min(Math.abs(value) / SATURATION_PERCENT, 1) * 0.45 + 0.15;

  return { background: `rgba(${channel}, ${fraction.toFixed(3)})` };
}

function percentFor(entry: NewsEntry | undefined, key: string): number | null {
  if (!entry) return null;

  return entry.metrics.find((metric) => metric.key === key)?.momPct ?? null;
}
