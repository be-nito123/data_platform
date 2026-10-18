import type { Metadata } from "next";
import Link from "next/link";
import { getAllInstruments } from "@/lib/instruments";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { DatasetExplorer, type DatasetItem } from "@/components/DatasetExplorer";
import { pageMetadata } from "@/lib/site";
import "../datasets.css";

export const metadata: Metadata = pageMetadata({
  title: "Datasets",
  description:
    "Browse every DataVault dataset — price, volume, open interest, COT positioning and treasury yields across commodities, rates, FX, equities, crypto and intermarket ratios.",
  path: "/datasets",
});

function loadDatasets(): DatasetItem[] {
  return getAllInstruments().map((inst) => ({
    id: inst.id,
    name: inst.displayName,
    description: inst.description,
    icon: "◆",
    href: `/terminal/${inst.id}`,
    config: inst,
  }));
}

export default function DatasetsPage() {
  const datasets = loadDatasets();
  const categoryCount = new Set(datasets.map((d) => d.config.category)).size;
  const dataTypeCount = new Set(datasets.flatMap((d) => d.config.availableDataTypes)).size;

  return (
    <main className="terminal-page datasets-page">
      <SiteNav active="datasets" />

      <div className="terminal-content">
        <header className="page-header">
          <div className="header-inner">
            <div className="header-content">
              <div className="ds-eyebrow">Data Library</div>
              <h1 className="page-title">Premium Market Datasets</h1>
              <p className="page-desc">
                Structured COT, futures, and macro datasets for professional analysis — explore,
                visualize, and export each market.
              </p>

              <div className="ds-hero-meta" aria-label="Library summary">
                <span className="ds-hero-chip">
                  <strong>{datasets.length}</strong> datasets
                </span>
                <span className="ds-hero-chip">
                  <strong>{categoryCount}</strong> categories
                </span>
                <span className="ds-hero-chip">
                  <strong>{dataTypeCount}</strong> data types
                </span>
              </div>
            </div>
          </div>
        </header>

        <section className="categories-container">
          <DatasetExplorer datasets={datasets} />
        </section>

        <section className="cta-section">
          <div className="cta-content">
            <h2>Need bulk history or API access?</h2>
            <p>
              Compare plans for full-history exports, programmatic access and team seats — or open
              any dataset in the terminal right now.
            </p>
            <div className="cta-actions">
              <Link href="/#pricing" className="btn btn-primary">
                View pricing →
              </Link>
              <Link href="/terminal/gold" className="btn btn-secondary">
                Open the terminal →
              </Link>
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
