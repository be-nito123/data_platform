# DataVault

A market-data terminal for futures, macro and positioning data. DataVault presents
exchange price / volume / open-interest series alongside CFTC Commitments of Traders
(COT) reporting for 20 instruments, in one dark, keyboard-friendly interface.

## Stack

| Layer      | Choice                                            |
| ---------- | ------------------------------------------------- |
| Framework  | Next.js 16 (App Router, React 19, Turbopack)      |
| Styling    | Tailwind CSS v4 + a small set of hand-written CSS |
| Auth & data| Supabase (Postgres + Row Level Security)          |
| Market data| Google Sheets via a Google Cloud service account  |
| Charts     | Recharts                                          |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env.local
#    then fill in the values — see "Environment variables" below

# 3. Run the dev server
npm run dev
```

Open <http://localhost:3000>.

## Environment variables

Every variable is documented inline in [`.env.example`](./.env.example). The essentials:

| Variable                             | Required | Purpose                                              |
| ------------------------------------ | -------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | yes      | Supabase project URL                                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | yes    | Supabase publishable / anon key (RLS protects data)   |
| `GOOGLE_CLIENT_EMAIL`                | yes      | Service account that can read the spreadsheets        |
| `GOOGLE_PRIVATE_KEY`                 | yes      | Matching private key (starts `BEGIN PRIVATE KEY`)     |
| `GOOGLE_SHEET_ID`                    | yes      | Primary price / volume / OI spreadsheet               |
| `COT_GOOGLE_SHEET_ID`                | yes      | Commitments of Traders spreadsheet                    |
| `NEWS_GOOGLE_SHEET_ID`               | no       | Monthly-news spreadsheet; falls back to `GOOGLE_SHEET_ID` |
| `NEXT_PUBLIC_SITE_URL`               | no       | Public origin for metadata, sitemap and robots.txt    |
| `SHEET_CACHE_TTL_SECONDS`            | no       | Sheets cache lifetime (default `300`)                 |

`GOOGLE_PRIVATE_KEY` must be the complete `private_key` value from the service
account JSON, quotes included, starting with `-----BEGIN PRIVATE KEY-----`. A
`BEGIN RSA PRIVATE KEY` value fails with `error:1E08010C:DECODER routines::unsupported`.

## Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Dev server with Turbopack             |
| `npm run build`   | Production build                      |
| `npm run start`   | Serve the production build            |
| `npm run lint`    | ESLint                                |
| `npm run check:news` | Check the news sheet reader against synthetic grids |
| `npx tsc --noEmit`| Type-check without emitting           |

## Routes

| Route                        | What it is                                                            |
| ---------------------------- | --------------------------------------------------------------------- |
| `/`                          | Marketing home: hero, features, pricing, about                        |
| `/datasets`                  | Dataset library with search and category filters                      |
| `/terminal/[instrument]`     | The terminal itself — charts, statistics and data sheets              |
| `/login`, `/register`        | Authentication                                                        |
| `/forgot-password`           | Request a password-reset email                                        |
| `/reset-password`            | Set a new password (arrives from the email link)                      |
| `/auth/confirm`              | Route handler that verifies an email OTP and redirects                |
| `/profile`                   | Account details and saved datasets                                    |
| `/privacy`, `/terms`         | Legal pages                                                           |
| `/news`                      | Admin-only monthly news room (see below)                              |
| `/crypto-cot-report`         | Legacy crypto COT report index (`/btc`, `/eth`)                       |
| `/weather-condition/*`       | Legacy per-instrument pages                                           |

`/api/terminal-data` serves instrument data to the terminal on instrument switch;
`/api/live-prices` proxies live quotes; `/api/coupons/coupon-redeem` redeems access codes.

## Project structure

```
app/
  api/                 Route handlers (terminal data, live prices, coupons)
  datasets/            Dataset library
  news/                Admin-only monthly news room
  terminal/            Terminal route (do not restyle without review)
  privacy, terms       Legal pages
  robots.ts            robots.txt
  sitemap.ts           sitemap.xml, generated from the instrument registry
  manifest.ts          Web app manifest
  opengraph-image.tsx  Generated social card
  not-found.tsx        Custom 404 (also handles unmatched URLs)
  error.tsx            Route-level error boundary
  global-error.tsx     Last-resort boundary for root layout failures
components/
  news/                Monthly news UI
  terminal/            Terminal UI (charts, tables, shell)
lib/
  access.ts            Viewer lookup and the paid-access gate
  instruments.ts       The instrument registry — the single source of truth
  site.ts              Site name, description and canonical URL helpers
  rate-limit.ts        In-memory fixed-window rate limiter
  supabase/            Auth clients and the Google Sheets data layer
  supabase/data/news-sheet.ts  The news sheet contract (pure, no network)
scripts/
  check-news-sheet.mts Synthetic-grid checks for the news sheet reader
app/*.css              Design tokens (globals.css) plus per-surface stylesheets
```

## Design system

`app/globals.css` holds the Tailwind v4 `@theme` tokens. Use the tokens rather than
raw hex values:

- Surfaces — `bg-bg`, `bg-bg-elevated`, `bg-panel`
- Lines — `border-border`, `border-border-strong`
- Text — `text-text`, `text-text-dim`, `text-text-muted`
- Action — `bg-accent` / `text-accent` (`#0a84ff`)
- Data — `text-green`, `text-red`, `text-blue`, `text-yellow`, `text-cyan`

`--color-accent` is the single brand/action colour for marketing, auth, docs and
account surfaces. The terminal keeps `--color-blue` for its data palette.

## Market data flow

1. Price, volume and open interest come from `GOOGLE_SHEET_ID`;
   COT rows come from `COT_GOOGLE_SHEET_ID`.
2. `lib/supabase/google/sheets.ts` authenticates once, resolves the real tab name,
   then caches both the tab list and the cell values in memory
   (`SHEET_CACHE_TTL_SECONDS`, default 5 minutes) and collapses concurrent
   identical requests into one API call.
3. `lib/instruments.ts` maps each instrument to its sheet keys, data types and
   formatting rules. Add an instrument there and it appears in the terminal,
   the dataset library, the sitemap and the home page counters automatically.
4. `processCotRows` / `processEthRows` normalise raw sheet rows into the shapes
   the charts expect.

## Monthly news (`/news`)

An admin-only room showing what moved each month: every macro release in the
month's tab, what came in against the forecast, and how it moved against the
prior reading.

Access is decided by `profiles.role = 'admin'`, checked server-side in
`lib/access.ts` **before** the spreadsheet is read — a signed-out visitor gets the
locked screen and no sheet data is fetched at all. The section is deliberately
absent from the site navigation, the sitemap, and every public surface; it is
disallowed in `robots.txt` and carries `robots: { index: false, follow: false }`.

Until every account carries that role, `NEWS_ACCESS_CODE` opens a second,
temporary door: the locked screen takes the code, `/news/access` validates it in
constant time and sets a signed, HttpOnly cookie for seven days, and
`canReadNews` accepts either proof before any sheet is read. The code grants the
news room and nothing else — it is not an admin session — and unsetting the
variable removes the door entirely. See `lib/news-access.ts`; delete it, the
route, and the form when the real role grant is in place.

| Route                  | What it shows                                        |
| ---------------------- | ---------------------------------------------------- |
| `/news`                | The latest month, then the years on record           |
| `/news/[year]`         | An event-by-month matrix, plus all twelve month cells |
| `/news/[year]/[month]` | The month's events with surprise, MoM and YoY, and a trend |

### Sheet contract

`NEWS_GOOGLE_SHEET_ID` names a spreadsheet whose **monthly tabs start with a
month**: `October 2026` for a particular month, or `OCT MASTER SHEET` for the tab
that is kept up to date, which is read as the current year. Every other tab in the
workbook — an auction report, a rig count, an EIA report — is left alone.

Each monthly tab is a macro event calendar:

| week   | Event type        | date , time (ist) | US time         | actual | forcast | previous | USD Bias  |
| ------ | ----------------- | ----------------- | --------------- | ------ | ------- | -------- | --------- |
| Week 1 | ISM Manufacturing | Thu 1, 7:30 pm    | Thu 1, 10:00 am | 54.5   | 54.8    | 54.6     | risk-off  |
|        | NFP (Sep)         | Fri 2, 6:00 pm    | Fri 2, 8:30 am  | 29K    | 89K     | 133K     | risk-on   |

- **Columns are matched by heading, never by position.** Two tabs in the same
  workbook already disagree about which columns they carry, and October's header
  reads `week Sep` while the tab holds October — so the tab name wins and the
  heading is only used to find the columns. The header is the first row within
  the first twelve that names an `Event type`; a tab without one is reported
  rather than guessed at.
- **`actual` is the figure that came in.** `forcast` (or `forecast`) gives the
  surprise, and `previous` is the sheet's own prior reading of the same event —
  which is what the month-on-month change is measured against.
- **Week headings carry down.** `Week 1` is written once, on the first row of
  that week, and applies to the rows beneath it.
- **Values keep the unit they were written in** — `197K`, `4.20%`, `6,657 B`,
  accountancy negatives (`(1,234)`) and trailing annotations
  (`0.086% (8 ponts)`). Anything that is not a figure — a worked example, a
  note — parses to nothing rather than to a plausible wrong number.

### How the comparisons are computed

Month-on-month is `actual` minus the sheet's own `previous` reading, so it needs
no earlier tab. Year-on-year matches the same event by name in the same month of
the previous year, and is blank until a tab for that year exists — the page says
so rather than printing a confident zero.

Both are computed in-process from the raw cells; formula cells are never trusted,
so a broken formula surfaces as a gap rather than as a wrong number. Units differ
from row to row, so nothing is summed across events: the matrix tints each cell
for direction and prints the size in the event's own unit.

The reader asks the Sheets API for `FORMATTED_VALUE` rather than the
`UNFORMATTED_VALUE` the rest of the app uses. A cell formatted as a percentage
arrives as `0.042` unformatted — the percent sign is part of the cell's format,
not its value — so unformatted rendering would turn every `4.20%` into `0.042`.

Anything the loader cannot make sense of — a missing tab, a non-numeric column,
no spreadsheet configured — becomes a banner on the page rather than an error.
The parsing lives in `lib/supabase/data/news-sheet.ts`, which is pure and has no
dependencies, so `npm run check:news` exercises the whole contract against
synthetic grids with no credentials and no network.

## Deployment

- Set every required variable from `.env.example` in your hosting provider.
- Set `NEXT_PUBLIC_SITE_URL` to the real origin so metadata, `robots.txt` and
  `sitemap.xml` resolve correctly.
- Every spreadsheet in use — price/OI, COT and monthly news — must be shared with
  `GOOGLE_CLIENT_EMAIL` as a Viewer. Setting `NEWS_GOOGLE_SHEET_ID` is optional;
  without it the news room reads the primary spreadsheet and reports that no
  monthly tabs were found.
- The sheets cache is per-instance and in-memory. On a multi-instance platform
  each instance keeps its own copy; the default 5-minute window keeps Google API
  usage low either way.

## Known gaps

- Online checkout is not wired up. The access gate only redeems coupon codes;
  pricing on the home page is placeholder copy.
- Saved datasets are read on the profile page but nothing writes them yet.
- CSV and bulk exports are advertised on the pricing tiers but are not implemented.
- `/weather-condition/*` and `/crypto-cot-report/*` are legacy surfaces pending a
  decision on whether to keep, fold into the terminal, or remove.
- The rate limiter and the sheets cache are in-memory, so neither is global across
  instances.
