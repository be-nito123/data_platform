export const SITE_NAME = "DataVault";

export const SITE_TAGLINE = "Market data terminal";

export const SITE_DESCRIPTION =
  "Structured price, volume, open interest and CFTC Commitments of Traders data for 20 futures and macro markets — charts, positioning breakdowns and raw data sheets in one terminal.";

export const SITE_CONTACT = "support@datavault.app";

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
