"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NavKey = "datasets" | "features" | "pricing" | "about";

const NAV_LINKS: { key: NavKey; label: string; href: string }[] = [
  { key: "datasets", label: "Datasets", href: "/datasets" },
  { key: "features", label: "Features", href: "/#features" },
  { key: "pricing", label: "Pricing", href: "/#pricing" },
  { key: "about", label: "About", href: "/#about" },
];

export default function SiteNav({ active }: { active?: NavKey }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  /*
    Is anybody signed in?

    Read on the client rather than with `getViewer()` in the layout, because a
    server-side check here would turn `/` and `/datasets` from static pages into
    server renders on every hit — for two links in a nav bar. The checks that
    actually protect a page run in that page, so this only has to be right
    about what to draw.

    `onAuthStateChange` announces the session it already has the moment it
    subscribes, so this costs no request on load and stays correct through
    sign-in, sign-out and token refresh.
  */
  const [signedIn, setSignedIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    setOpen(false);
    setSigningOut(true);

    try {
      await createClient().auth.signOut();
    } finally {
      setSigningOut(false);
      // Server-rendered state — the admin card, the /news gate — re-reads.
      router.refresh();
    }
  }

  // Prevent the page behind the drawer from scrolling while it is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const currentKey: NavKey | undefined =
    active ?? (pathname?.startsWith("/datasets") ? "datasets" : undefined);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-2.5 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded border border-accent/40 bg-accent/10 font-mono text-xs font-bold text-accent"
          >
            ›_
          </span>
          <span className="text-lg font-semibold text-text">
            DATA<span className="text-accent">VAULT</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 text-sm md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = currentKey === link.key;
            return (
              <Link
                key={link.key}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`transition ${isActive ? "text-accent" : "text-text-dim hover:text-text"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="rounded px-3 py-2 text-sm text-text-dim transition hover:text-text disabled:opacity-60"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
              <Link
                href="/profile"
                className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
              >
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded px-3 py-2 text-sm text-text-dim transition hover:text-text"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="site-mobile-nav"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-border text-text-dim transition hover:border-border-strong hover:text-text md:hidden"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {open ? (
              <>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </>
            ) : (
              <>
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div id="site-mobile-nav" className="border-t border-border bg-bg-elevated px-4 py-3 md:hidden">
          <div className="flex flex-col">
            {NAV_LINKS.map((link) => {
              const isActive = currentKey === link.key;
              return (
                <Link
                  key={link.key}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`border-b border-border/60 py-3 text-sm transition last:border-b-0 ${
                    isActive ? "text-accent" : "text-text-dim hover:text-text"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {signedIn ? (
              <>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="rounded border border-border px-4 py-2.5 text-center text-sm text-text-dim transition hover:border-border-strong hover:text-text disabled:opacity-60"
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="rounded bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-accent-strong"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded border border-border px-4 py-2.5 text-center text-sm text-text-dim transition hover:border-border-strong hover:text-text"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-accent-strong"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
