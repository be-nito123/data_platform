import type { NewsMetric } from "@/lib/supabase/data/news";
import {
  changeClass,
  formatNewsChange,
  formatNewsPercent,
  formatNewsValue,
  newsArrow,
} from "@/lib/news/format";

/* ========================================================= */
/* CARD                                                      */
/* ========================================================= */

/** One figure: the value, then month-on-month and year-on-year beside it. */
export function NewsMetricCard({ metric }: { metric: NewsMetric }) {
  return (
    <article className="news-metric">
      <header className="news-metric-head">
        <h3 className="news-label" style={{ margin: 0 }}>
          {metric.label}
        </h3>
      </header>

      <p className="news-value" style={{ margin: 0 }}>
        {formatNewsValue(metric.value)}
      </p>

      <div className="news-changes">
        <ChangeChip label="MoM" value={metric.mom} percent={metric.momPct} />
        <ChangeChip label="YoY" value={metric.yoy} percent={metric.yoyPct} />
      </div>
    </article>
  );
}

/* ========================================================= */
/* TABLE                                                     */
/* ========================================================= */

/**
 * The dense view of the same numbers — exact values and both deltas, for
 * when the cards are not enough. Values are formatted only here, from the
 * same helpers the cards use.
 */
export function NewsMetricsTable({ metrics }: { metrics: NewsMetric[] }) {
  if (metrics.length === 0) {
    return (
      <p className="news-label">
        No figures were found in this month&apos;s tab.
      </p>
    );
  }

  return (
    <div className="news-table-wrap">
      <table className="news-table">
        <thead>
          <tr>
            <th scope="col">Metric</th>
            <th scope="col">Value</th>
            <th scope="col">MoM</th>
            <th scope="col">MoM %</th>
            <th scope="col">YoY</th>
            <th scope="col">YoY %</th>
          </tr>
        </thead>

        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.key}>
              <th scope="row" style={{ fontWeight: 500 }}>
                {metric.label}
              </th>
              <td>{formatNewsValue(metric.value)}</td>
              <td className={changeClass(metric.mom)}>{formatNewsChange(metric.mom)}</td>
              <td className={changeClass(metric.mom)}>{formatNewsPercent(metric.momPct)}</td>
              <td className={changeClass(metric.yoy)}>{formatNewsChange(metric.yoy)}</td>
              <td className={changeClass(metric.yoy)}>{formatNewsPercent(metric.yoyPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ========================================================= */
/* INTERNALS                                                 */
/* ========================================================= */

function ChangeChip({
  label,
  value,
  percent,
}: {
  label: string;
  value: number | null;
  percent: number | null;
}) {
  const hasValue = value !== null && Number.isFinite(value);

  return (
    <span className={`news-chip ${hasValue ? changeClass(value) : ""}`.trim()}>
      <span className="news-chip-label">{label}</span>
      {hasValue ? (
        <>
          <span aria-hidden="true">{newsArrow(value)}</span>
          <span>{formatNewsPercent(percent)}</span>
        </>
      ) : (
        <span aria-hidden="true">—</span>
      )}
    </span>
  );
}
