import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/datasets", label: "Datasets" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "mailto:support@datavault.app", label: "Contact" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-4 py-8 lg:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="text-sm font-semibold text-text-dim">
              DATA<span className="text-accent">VAULT</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>© {new Date().getFullYear()} DataVault</span>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-text-muted transition hover:text-text-dim"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="max-w-3xl text-[11px] leading-relaxed text-text-muted">
          Market data is compiled from exchange price and volume feeds and CFTC Commitments of
          Traders reports. It is provided for informational purposes only, is not investment advice,
          and may be delayed, incomplete or subject to revision. Verify all data against the
          original source before relying on it.
        </p>
      </div>
    </footer>
  );
}
