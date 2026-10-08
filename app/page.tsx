import Link from "next/link";

export default function Home() {
  return (
    <main className="terminal-page home-page">
      <div className="terminal-content">
        <section className="hero-section">
          <div className="hero-content">
            <div className="label">DATAVAULT TERMINAL</div>
            <h1 className="hero-title">
              Professional Market Data
              <span className="hero-accent">Terminal</span>
            </h1>
            <p className="hero-desc">
              Institutional-grade market data for commodities, crypto, rates, and equities.
              Real-time COT positioning, volume analysis, and open interest tracking.
            </p>
            <div className="hero-actions">
              <Link href="/datasets" className="btn btn-primary btn-lg">Explore Datasets →</Link>
              <Link href="/terminal/gold" className="btn btn-secondary btn-lg">Launch Terminal →</Link>
            </div>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-value">20+</span>
              <span className="stat-label">Instruments</span>
            </div>
            <div className="stat">
              <span className="stat-value">4</span>
              <span className="stat-label">Data Types</span>
            </div>
            <div className="stat">
              <span className="stat-value">Daily</span>
              <span className="stat-label">Updates</span>
            </div>
            <div className="stat">
              <span className="stat-value">100%</span>
              <span className="stat-label">Coverage</span>
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="section-header">
            <div className="label">CAPABILITIES</div>
            <h2>Terminal Features</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Price Analytics</h3>
              <p>Real-time price charts with OHLC, technical overlays, and multi-timeframe views</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Volume Analysis</h3>
              <p>Volume profiles, delta, and relative volume comparisons across instruments</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔓</div>
              <h3>Open Interest</h3>
              <p>OI tracking, changes, and percentile rankings for futures positioning</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>COT Reports</h3>
              <p>Commitment of Traders data with dealer, asset manager, and leveraged money breakdown</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Instrument Switching</h3>
              <p>Instant navigation between 20+ instruments without page reloads</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Global Search</h3>
              <p>Instant instrument search with keyboard shortcuts and fuzzy matching</p>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Access Professional Market Data?</h2>
            <p>Join traders and analysts using DataVault for institutional-grade market intelligence.</p>
            <a href="/register" className="btn btn-primary btn-lg">Get Started Free →</a>
          </div>
        </section>
      </div>
    </main>
  );
}