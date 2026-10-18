import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export default function DocumentPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="site-doc">
      <SiteNav />

      <main className="site-doc-main">
        <header className="site-doc-hero">
          <div className="site-doc-hero-inner">
            <span className="site-doc-eyebrow">{eyebrow}</span>
            <h1 className="site-doc-title">{title}</h1>
            <span className="site-doc-meta">Last updated {updated}</span>
          </div>
        </header>

        <article className="site-doc-body">{children}</article>
      </main>

      <SiteFooter />
    </div>
  );
}
