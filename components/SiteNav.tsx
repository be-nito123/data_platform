import Link from "next/link";

export default function SiteNav({
  active,
}: {
  active?: "datasets" | "features" | "pricing" | "about";
}) {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-2.5 lg:px-6">

        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded border border-blue/40 bg-blue/10 font-mono text-xs font-bold text-blue">
            ›_
          </div>
          <span className="text-lg font-semibold text-text">
            DATA<span className="text-blue">VAULT</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 text-sm md:flex">
          {(
            [
              ["datasets", "/datasets"],
              ["features", "/#features"],
              ["pricing", "/#pricing"],
              ["about", "/#about"],
            ] as const
          ).map(([key, href]) => (
            <Link
              key={key}
              href={href}
              className={`py-1 transition ${
                active === key
                  ? "border-b-2 border-blue text-blue"
                  : "text-dim hover:text-text"
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm text-dim transition hover:text-text btn btn-secondary"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded border border-blue px-4 py-1.5 text-sm font-semibold text-blue transition hover:bg-blue hover:text-white btn btn-primary"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}