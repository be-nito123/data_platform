import Link from "next/link";
import { Suspense } from "react";
import { getAllInstruments } from "@/lib/instruments";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { DatasetSkeleton } from "@/components/DatasetSkeleton";
import { DatasetExplorer, type DatasetItem } from "@/components/DatasetExplorer";
import "../datasets.css";

async function loadDatasets(): Promise<DatasetItem[]> {
  const instruments = getAllInstruments();
  return instruments.map((inst) => ({
    id: inst.id,
    name: inst.displayName,
    description: inst.description,
    icon: "◆",
    href: `/terminal/${inst.id}`,
    config: inst,
  }));
}

async function DatasetList() {
  const datasets = await loadDatasets();
  const categoryCount = new Set(datasets.map((d) => d.config.category)).size;
  return (
    <>
      <div className="ds-hero-meta" aria-label="Library summary">
        <span className="ds-hero-chip">
          <strong>{datasets.length}</strong> datasets
        </span>
        <span className="ds-hero-chip">
          <strong>{categoryCount}</strong> categories
        </span>
      </div>
      <DatasetExplorer datasets={datasets} />
    </>
  );
}

export default function DatasetsPage() {
  return (
    <main className="terminal-page datasets-page">
      <SiteNav active="datasets" />

      <div className="terminal-content">
        <header className="page-header">
          <div className="header-content">
            <div className="label">DATA LIBRARY</div>
            <h1 className="page-title">Premium Market Datasets</h1>
            <p className="page-desc">
              Structured COT, futures, and macro datasets for professional analysis — explore,
              visualize, and export each market.
            </p>
          </div>
        </header>

        <section className="categories-container">
          <Suspense fallback={<DatasetSkeleton />}>
            <DatasetList />
          </Suspense>
        </section>

        <section className="cta-section">
          <div className="cta-content">
            <h2>Need Multiple Datasets?</h2>
            <p>Explore institutional plans for multi-asset coverage and API access.</p>
            <Link href="/#pricing" className="btn btn-primary">View Pricing →</Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}