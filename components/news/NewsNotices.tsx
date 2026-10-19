/**
 * Problems found while reading the sheet — a tab that is not named after a
 * month, a header row that is missing, a spreadsheet that could not be opened.
 * Shown rather than swallowed, because a silently empty news room looks like a
 * bug in the site rather than like a sheet that needs a column renamed.
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
 * The screen a new deployment sees before any monthly tab exists.
 *
 * It spells out the contract, because that is the whole distance between an
 * empty room and a working one: name a tab after a month, and give it a header
 * row with an event and its figures.
 */
export function NewsSheetSetup() {
  return (
    <div className="news-empty">
      <p className="news-eyebrow">Nothing to read yet</p>

      <h2 className="news-section-title" style={{ marginTop: 10 }}>
        No monthly tabs were found
      </h2>

      <p className="news-lede">
        The room reads the tabs in{" "}
        <code className="news-code">NEWS_GOOGLE_SHEET_ID</code> whose names start
        with a month. Name one <code className="news-code">October 2026</code>{" "}
        for a month in a specific year, or{" "}
        <code className="news-code">OCT MASTER SHEET</code> for the sheet that is
        kept up to date, which is read as the current year. Every other tab in
        the workbook is left alone.
      </p>

      <div className="news-table-wrap" style={{ marginTop: 18 }}>
        <table className="news-table">
          <thead>
            <tr>
              <th scope="col">week</th>
              <th scope="col">Event type</th>
              <th scope="col">date , time (ist)</th>
              <th scope="col">actual</th>
              <th scope="col">forcast</th>
              <th scope="col">previous</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Week 1</td>
              <td>ISM Manufacturing PMI</td>
              <td>Thu 1, 7:30 pm</td>
              <td>54.5</td>
              <td>54.8</td>
              <td>54.6</td>
            </tr>
            <tr>
              <td />
              <td>NFP (Sep)</td>
              <td>Fri 2, 6:00 pm</td>
              <td>29K</td>
              <td>89K</td>
              <td>133K</td>
            </tr>
          </tbody>
        </table>
      </div>

      <ul className="news-notice-list" style={{ marginTop: 18 }}>
        <li>
          <code className="news-code">Event type</code> names the release. Every
          row with a name is one event.
        </li>
        <li>
          <code className="news-code">actual</code> is the figure that came in.
          It is compared against <code className="news-code">forcast</code> — the
          surprise — and against{" "}
          <code className="news-code">previous</code>, the prior reading of the
          same event, which is the month-on-month change.
        </li>
        <li>
          Columns are found by their heading, not their position, so the extra{" "}
          <code className="news-code">US time</code> column some tabs carry is
          harmless.
        </li>
        <li>
          Year on year compares an event with the same event a year earlier, so
          it fills in once a tab for that year exists —{" "}
          <code className="news-code">July 2025</code> beside{" "}
          <code className="news-code">July 2026</code>.
        </li>
        <li>
          Figures may be written with a unit —{" "}
          <code className="news-code">197K</code>,{" "}
          <code className="news-code">4.20%</code>,{" "}
          <code className="news-code">6,657 B</code> — and are shown back the way
          they were written.
        </li>
      </ul>
    </div>
  );
}
