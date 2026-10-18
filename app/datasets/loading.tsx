import { DatasetSkeleton } from "@/components/DatasetSkeleton";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import "../datasets.css";

export default function DatasetsLoading() {
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
            </div>
          </div>
        </header>

        <section className="categories-container">
          <div className="dataset-explorer">
            <div className="ds-toolbar">
              <div className="ds-filter" aria-hidden="true">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-white/[.05]" />
                ))}
              </div>
            </div>

            <DatasetSkeleton />
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
