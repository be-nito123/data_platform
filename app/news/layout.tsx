import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

/*
  The monthly news room is exclusive. It is gated to admins in each page, kept
  out of app/sitemap.ts and disallowed in app/robots.ts; the noindex here is
  belt-and-braces so a future public link cannot leak it into search results.
*/
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <main className="news-main">{children}</main>
      <SiteFooter />
    </>
  );
}
