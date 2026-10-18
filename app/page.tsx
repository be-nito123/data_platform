import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { getAllInstruments, CATEGORIES } from "@/lib/instruments";

/* Minimal monochrome line icons (Lucide-style) */
function Icon({ paths, size = 22 }: { paths: string[]; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

const FEATURES: { title: string; body: string; paths: string[] }[] = [
  {
    title: "Price Analytics",
    body: "OHLC price charts with technical overlays and multi-timeframe views across every covered market.",
    paths: ["M3 3v18h18", "m19 9-5 5-4-4-3 3"],
  },
  {
    title: "Volume Analysis",
    body: "Volume, open interest and session flows so you can read participation behind every move.",
    paths: ["M3 3v18h18", "M7 16v-5", "M12 16V8", "M17 16v-9"],
  },
  {
    title: "Open Interest Tracking",
    body: "Daily open interest change, direction and positioning context for futures-sensitive instruments.",
    paths: ["m12 2 9 5-9 5-9-5 9-5", "m3 12 9 5 9-5", "m3 17 9 5 9-5"],
  },
  {
    title: "COT Positioning",
    body: "Commitments of Traders reports broken down by commercials, non-commercials and net positioning.",
    paths: [
      "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
      "M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z",
      "M8 12h8",
      "M8 16h5",
    ],
  },
  {
    title: "Rates & Yields",
    body: "Treasury yields and bond prices in their native units — basis points for yields, 32nds for bonds.",
    paths: ["M3 17l6-6 4 4 8-8", "M21 7h-5v5"],
  },
  {
    title: "Intermarket Context",
    body: "Ratios and cross-asset relationships — from the gold/silver ratio to the dollar index — in one place.",
    paths: [
      "M3 12a9 9 0 0 1 15-6.7L21 8",
      "M21 3v5h-5",
      "M21 12a9 9 0 0 1-15 6.7L3 16",
      "M3 21v-5h5",
    ],
  },
];

/* Short display names for the coverage line, keyed by category id */
const SHORT_CATEGORY_NAMES: Record<string, string> = {
  commodities: "Commodities",
  rates: "Rates",
  forex: "FX",
  equities: "Equities",
  crypto: "Crypto",
  intermarket: "Intermarket",
};

/* The 6 categories in display order — used for the coverage line */
function categoryLabelList(): string {
  return Object.values(CATEGORIES)
    .sort((a, b) => a.order - b.order)
    .map((c) => SHORT_CATEGORY_NAMES[c.id] ?? c.label)
    .join(" · ");
}

export default function Home() {
  const instruments = getAllInstruments();
  const instrumentCount = instruments.length;
  const categoryCount = Object.keys(CATEGORIES).length;
  const dataTypeCount = new Set(instruments.flatMap((i) => i.availableDataTypes)).size;

  const TIERS: {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    cta: string;
    href: string;
    featured?: boolean;
  }[] = [
    {
      name: "Observer",
      price: "Free",
      period: "",
      description: "Browse the library and preview any instrument in the terminal.",
      features: [
        `All ${instrumentCount} instruments, ${categoryCount} categories`,
        "Price, volume and open interest charts",
        "COT positioning overview",
        "Trailing 30-day history window",
      ],
      cta: "Start exploring",
      href: "/datasets",
    },
    {
      name: "Daily Pass",
      price: "₹349",
      period: "/ 30 days",
      description: "Full access for a month — the quickest way into the full dataset.",
      features: [
        "Full history for every instrument",
        "COT breakdowns by reporting group",
        "Yield & bond views (bps · 32nds)",
        "Raw data sheets with expand",
      ],
      cta: "Get 30-day access",
      href: "/register",
    },
    {
      name: "Pro",
      price: "₹1,499",
      period: "/ month",
      description: "For active traders who want every metric and custom analysis.",
      features: [
        "Everything in Daily Pass",
        "Date-range analysis with custom spans",
        "CSV exports",
        "Limited API access",
        "Priority data refresh",
      ],
      cta: "Start Pro",
      href: "/register",
      featured: true,
    },
    {
      name: "Institutional",
      price: "Custom",
      period: "",
      description: "For desks and research teams that need programmatic access.",
      features: [
        "Everything in Pro",
        "Full JSON API access",
        "Bulk historical exports",
        "Team seats and access controls",
        "Dedicated onboarding and support",
      ],
      cta: "Talk to us",
      href: "/register",
    },
  ];

  return (
    <main className="terminal-page home-page">
      <SiteNav />

      <div className="terminal-content">
        {/* ================= HERO ========================================= */}
        <section className="home-hero">
          <div className="home-hero-inner">
            <span className="home-eyebrow">DataVault Terminal</span>
            <h1 className="home-title">
              Professional market data,
              <br />
              <span className="home-title-accent">in one terminal.</span>
            </h1>
            <p className="home-lede">
              Institutional-grade data for commodities, rates, forex, equities and crypto.
              Real-time COT positioning, volume analysis and open interest tracking — laid out
              like a proper trading terminal, not a spreadsheet.
            </p>

            <div className="home-actions">
              <Link href="/datasets" className="home-btn home-btn-primary">
                Explore Datasets
              </Link>
              <Link href="/terminal/gold" className="home-btn home-btn-ghost">
                Launch Terminal →
              </Link>
            </div>

            <div className="home-chips" aria-label="Platform summary">
              <span className="home-chip">
                <strong>{instrumentCount}</strong> instruments
              </span>
              <span className="home-chip">
                <strong>{categoryCount}</strong> categories
              </span>
              <span className="home-chip">
                <strong>{dataTypeCount}</strong> data types
              </span>
              <span className="home-chip">
                <strong>Daily</strong> updates
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            FEATURES
        ===================================================== */}
        <section id="features" className="home-section">
          <div className="home-section-inner">
            <div className="home-section-head">
              <span className="home-eyebrow">Capabilities</span>
              <h2 className="home-section-title">Everything in the terminal</h2>
              <p className="home-section-desc">
                A focused toolkit built around how market data is actually read — price, volume,
                positioning and context, with no clutter in the way.
              </p>
            </div>

            <div className="home-features">
              {FEATURES.map((feature) => (
                <article className="home-feature" key={feature.title}>
                  <span className="home-feature-icon">
                    <Icon paths={feature.paths} />
                  </span>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* =====================================================
            PRICING
        ===================================================== */}
        <section id="pricing" className="home-section home-section-alt">
          <div className="home-section-inner">
            <div className="home-section-head">
              <span className="home-eyebrow">Pricing</span>
              <h2 className="home-section-title">Simple, transparent plans</h2>
              <p className="home-section-desc">
                Start free and browse the whole library. Upgrade when you need full history, every
                metric, or programmatic access.
              </p>
            </div>

            <div className="home-pricing">
              {TIERS.map((tier) => (
                <article
                  className={`home-tier${tier.featured ? " is-featured" : ""}`}
                  key={tier.name}
                >
                  {tier.featured && <span className="home-tier-badge">Most popular</span>}
                  <h3 className="home-tier-name">{tier.name}</h3>
                  <div className="home-tier-price">
                    <span className="amount">{tier.price}</span>
                    {tier.period && <span className="period">{tier.period}</span>}
                  </div>
                  <p className="home-tier-desc">{tier.description}</p>
                  <ul className="home-tier-list">
                    {tier.features.map((item) => (
                      <li key={item}>
                        <Icon paths={["m5 12 5 5 9-10"]} size={15} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={tier.href}
                    className={`home-btn${
                      tier.featured ? " home-btn-primary" : " home-btn-ghost"
                    } home-tier-cta`}
                  >
                    {tier.cta}
                  </Link>
                </article>
              ))}
            </div>

            <p className="home-price-note">
              All plans include every instrument, daily updates and secure account access. Coupons
              redeem against the Daily Pass.
            </p>
          </div>
        </section>

        {/* =====================================================
            ABOUT
        ===================================================== */}
        <section id="about" className="home-section">
          <div className="home-section-inner">
            <div className="home-about">
              <div className="home-about-copy">
                <span className="home-eyebrow">About DataVault</span>
                <h2 className="home-section-title">
                  Market data, presented the way desks read it
                </h2>
                <p className="home-section-desc">
                  DataVault brings exchange price and volume together with CFTC Commitments of
                  Traders reporting, so positioning and price live in the same view. Each dataset
                  opens as a terminal with charts, a statistics panel, and the underlying sheet —
                  nothing hidden behind a black box.
                </p>
                <div className="home-actions home-about-actions">
                  <Link href="/datasets" className="home-btn home-btn-primary">
                    Explore datasets →
                  </Link>
                  <Link href="/terminal/gold" className="home-btn home-btn-ghost">
                    Open the terminal →
                  </Link>
                </div>
              </div>

              <ul className="home-specs">
                <li>
                  <span className="home-spec-key">Coverage</span>
                  <span className="home-spec-val">{categoryLabelList()}</span>
                </li>
                <li>
                  <span className="home-spec-key">Instruments</span>
                  <span className="home-spec-val">{instrumentCount} datasets</span>
                </li>
                <li>
                  <span className="home-spec-key">Cadence</span>
                  <span className="home-spec-val">Daily, post-settlement</span>
                </li>
                <li>
                  <span className="home-spec-key">Sources</span>
                  <span className="home-spec-val">Exchange price/volume · CFTC COT</span>
                </li>
                <li>
                  <span className="home-spec-key">Delivery</span>
                  <span className="home-spec-val">Web terminal + JSON API</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* =====================================================
            CTA
        ===================================================== */}
        <section className="home-cta">
          <div className="home-cta-inner">
            <h2 className="home-section-title">Start exploring the data</h2>
            <p className="home-section-desc">
              Launch the terminal and open any of the {instrumentCount} covered markets. No setup
              required.
            </p>
            <div className="home-actions home-actions-center">
              <Link href="/terminal/gold" className="home-btn home-btn-primary">
                Launch Terminal →
              </Link>
              <Link href="/datasets" className="home-btn home-btn-ghost">
                Browse Datasets
              </Link>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
