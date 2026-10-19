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

An admin-only room showing what moved each month: month-on-month and year-on-year
change for every figure the news sheet tracks, plus the commentary behind it.

Access is decided by `profiles.role = 'admin'`, checked server-side in
`lib/access.ts` **before** the spreadsheet is read — a signed-out visitor gets the
locked screen and no sheet data is fetched at all. The section is deliberately
absent from the site navigation, the sitemap, and every public surface; it is
disallowed in `robots.txt` and carries `noindex, nofollow`.

| Route                    | What it shows                                        |
| ------------------------ | ---------------------------------------------------- |
| `/news`                  | Latest month, then the years on record                |
| `/news/[year]`           | A 12-cell month-on-month heatmap and all twelve months |
| `/news/[year]/[month]`   | Commentary, figures, a 12-month trend line, and a YoY/MoM table |

### Sheet contract

`NEWS_GOOGLE_SHEET_ID` names a spreadsheet with twelve tabs, `Jan` … `Dec`. Each
tab holds **every year as a row**:

| Year | <metric> | <metric> | … | Headline | Narrative | Source |
| ---- | -------- | -------- | - | -------- | --------- | ------ |
| 2025 | 110      | …        | … | What happened | A paragraph of context. | Reuters |
| 2026 | 121      | …        | … | What happened next | More detail. | Reuters |

- **`Year` is required** and is found by name anywhere in the header row, which
  the loader looks for within the first ten rows — a title row above the header
  is fine. If there is no `Year` heading, column A is used and a warning is shown.
- **Every other numeric column becomes a figure.** Its heading is the label.
  Adding a column in Sheets makes it appear on the site with no code change, and
  reordering columns is harmless. A column needs ≥ 80% of its values to parse as
  numbers to count; one that does not is reported and left out rather than
  plotted as zeros.
- **Text columns** are matched by heading: `Headline` (`Title`), `Summary`
  (`Narrative`, `Description`, `Details`, `Commentary`, or loosely `Notes`) and
  `Source` (`Link`, `URL`, `Reference`). An exact heading beats a loose one, so a
  sheet carrying both `Narrative` and `Notes` uses `Narrative` and says so.
  `Month`/`Date` columns are ignored — the tab name already carries the month.
- **Values** may be numbers, percentages, thousands separators, currency, short
  scales (`1.2k`, `3M`) or accountancy negatives (`(1,234)`).

### How the deltas are computed

Month-on-month reads the **previous month's tab**, and January rolls back to
December of the year before. Year-on-year reads the **previous year's row in the
same tab**. Both are computed in-process from the raw values; formula cells in
the sheet are never trusted, so a broken formula surfaces as a gap rather than as
a confident wrong number.

A percentage is only reported when the baseline is positive. A figure that moves
from −1,234 to +2,750 is not a rise of 323% of anything, so the absolute change is
shown and the percentage is left blank.

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
