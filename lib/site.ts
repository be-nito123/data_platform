import type { Metadata } from "next";

export const SITE_NAME = "DataVault";

export const SITE_TAGLINE = "Market data terminal";

export const SITE_DESCRIPTION =
  "Structured price, volume, open interest and CFTC Commitments of Traders data for 20 futures and macro markets — charts, positioning breakdowns and raw data sheets in one terminal.";

export const SITE_CONTACT = "support@datavault.app";

/**
 * The generated social card at `app/opengraph-image.tsx`, referenced explicitly.
 *
 * Defining `openGraph` on a page replaces the layout's entire object, and with
 * it the file-based image Next would otherwise attach — so every page that sets
 * its own social tags has to name the card itself.
 */
export const SOCIAL_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: `${SITE_NAME} — market data terminal for futures, COT positioning and macro`,
};

/**
 * Absolute origin used for canonical URLs, Open Graph tags, robots.txt and the
 * sitemap. Set NEXT_PUBLIC_SITE_URL in the environment; it falls back to
 * localhost so local builds and development stay functional.
 */
export function resolveSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configured) {
    try {
      return new URL(configured);
    } catch {
      console.warn(
        `NEXT_PUBLIC_SITE_URL is not a valid absolute URL ("${configured}"). ` +
          "Falling back to http://localhost:3000."
      );
    }
  }

  return new URL("http://localhost:3000");
}

/** Origin as a plain string, without a trailing slash. */
export const siteUrl = resolveSiteUrl().origin;

/** Build an absolute URL for a path such as "/datasets". */
export function absoluteUrl(path = "/"): string {
  return new URL(path, `${siteUrl}/`).toString();
}

/**
 * Build the metadata for one page.
 *
 * Always use this instead of hand-writing a `metadata` object. Next.js
 * shallowly merges metadata across segments and a page's `openGraph` fully
 * replaces the layout's, so setting `alternates`/`openGraph` in the root
 * layout would leak the site root onto every page that does not override it —
 * every URL would advertise "/" as its canonical, and every og:url point home.
 * Centralising the shape here keeps each page's canonical and og:url its own.
 */
export function pageMetadata({
  title,
  description,
  path,
  socialTitle,
  type = "website",
}: {
  /** Page title. The root layout's `%s · DataVault` template is applied to it. */
  title: string;
  description: string;
  /** Root-relative path, e.g. `/datasets`. */
  path: `/${string}` | "/";
  /** Social title, when it should differ from `title`. Defaults to `title · DataVault`. */
  socialTitle?: string;
  type?: "website" | "article";
}): Metadata {
  const canonical = path;
  const socialCardTitle = socialTitle ?? `${title} · ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type,
      siteName: SITE_NAME,
      title: socialCardTitle,
      description,
      url: canonical,
      images: [SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialCardTitle,
      description,
      images: [SOCIAL_IMAGE.url],
    },
  };
}
