import { NEWS_MONTH_NAMES, NEWS_MONTH_TABS } from "@/lib/supabase/data/news";

/**
 * Problems found while reading the sheet — a missing tab, a column that is not
 * numeric, no spreadsheet configured. Shown rather than swallowed, because a
 * silently empty news room looks like a bug in the site.
 */
export function NewsWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="news-notice">
      <p className="news-notice-title">
        {warnings.length === 1
          ? "One issue reading the news sheet"
          : `${warnings.length} issues reading the news sheet`}
      </p>

      <ul className="news-notice-list">
        {warnings.slice(0, 8).map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>

      {warnings.length > 8 && (
        <p className="news-label">
          …and {warnings.length - 8} more. Check the server log for the rest.
        </p>
      )}
    </div>
  );
}

/**
 * The screen a new deployment sees before any of the monthly tabs exist.
 *
 * It describes the layout the loader expects, because that contract is what
 * decides whether the numbers render at all.
 */
export function NewsSheetSetup() {
  return (
    <div className="news-empty">
      <p className="news-eyebrow is-muted">Not configured yet</p>

      <h2 className="news-section-title" style={{ marginTop: 10 }}>
        No monthly tabs were found
      </h2>

      <p className="news-lede" style={{ marginTop: 10 }}>
        This room reads twelve tabs —{" "}
        {NEWS_MONTH_NAMES.map((name, index) => (
          <span key={name}>
            <code className="news-code">{NEWS_MONTH_TABS[index]}</code>
            {index < NEWS_MONTH_NAMES.length - 1 ? ", " : ""}
          </span>
        ))}{" "}
        — from the spreadsheet named by{" "}
        <code className="news-code">NEWS_GOOGLE_SHEET_ID</code>. Each tab holds
        every year as a row, so <code className="news-code">Jan</code> looks
        like this:
      </p>

      <div className="news-table-wrap" style={{ marginTop: 18 }}>
        <table className="news-table">
          <thead>
            <tr>
              <th scope="col">Year</th>
              <th scope="col">&lt;metric&gt;</th>
              <th scope="col">…</th>
              <th scope="col">Headline</th>
              <th scope="col">Narrative</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2025</td>
              <td>110</td>
              <td>…</td>
              <td>What happened</td>
              <td>A paragraph of context.</td>
              <td>Reuters</td>
            </tr>
            <tr>
              <td>2026</td>
              <td>121</td>
              <td>…</td>
              <td>What happened next</td>
              <td>A second month of detail.</td>
              <td>Reuters</td>
            </tr>
          </tbody>
        </table>
      </div>

      <ul className="news-notice-list" style={{ marginTop: 18 }}>
        <li>
          <strong className="text-text">Year</strong> is required. It is read by
          name, so a <code className="news-code">Year</code> heading works
          wherever the column sits.
        </li>
        <li>
          Every other numeric column becomes a figure. Add one in Sheets and it
          appears here with no code change.
        </li>
        <li>
          <code className="news-code">Headline</code>,{" "}
          <code className="news-code">Summary</code> and{" "}
          <code className="news-code">Source</code> are optional but expected;
          the aliases are documented in the README.
        </li>
        <li>
          Month-on-month is read from the previous month&apos;s tab, so January
          needs December&apos;s tab to have a row for the year before.
        </li>
      </ul>
    </div>
  );
}
