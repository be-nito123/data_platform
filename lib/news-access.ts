import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Viewer } from "@/lib/access";

/* ========================================================= */
/* TEMPORARY NEWS ACCESS CODE                                */
/* ========================================================= */

/*
  A second door into the news room, opened by a shared code instead of a
  `profiles.role` value.

  Why it exists: every account should eventually carry `role = 'admin'` on its
  own profile row, but until that is true there is no way in from the browser.
  This is the deliberate stopgap — not a widening of the admin surface:

    * it unlocks the news room and nothing else. It does not make the viewer
      an admin, does not bypass Daily Access purchases, does not appear on any
      page that is not the locked news screen;
    * it is off completely when NEWS_ACCESS_CODE is unset, so a deployment
      that never sets it behaves exactly as before;
    * the code is never stored anywhere. What the browser holds is a signed
      cookie, and what the cookie carries is an expiry plus a MAC — the code
      itself is not in it;
    * comparisons are constant-time and digests are compared rather than raw
      strings, so neither the code nor its length leaks through timing.

  Delete this file, the route under app/news/access, and the form on
  NewsLocked when the real role grant is in place.
*/

const ENV_KEY = "NEWS_ACCESS_CODE";
const COOKIE_NAME = "dv-news-access";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // seven days, then the door relocks

/** Read the configured code without letting the bundler inline the value. */
function configuredCode(): string | null {
  const raw = process.env[ENV_KEY];
  const code = raw?.trim();
  return code ? code : null;
}

/** Is the code door even installed on this deployment? */
export function newsCodeEnabled(): boolean {
  return configuredCode() !== null;
}

/** Domain-separated digest, so the same string never signs two things. */
function digest(key: string, message: string): Buffer {
  return createHmac("sha256", key).update(message).digest();
}

/** Constant-time comparison of two buffers of equal expected length. */
function sameBytes(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Does this candidate match the configured code?
 *
 * Digests are compared, not the strings, so a wrong guess reveals neither the
 * code nor how many characters it is.
 */
export function newsCodeMatches(candidate: string): boolean {
  const secret = configuredCode();
  if (!secret) return false;

  return sameBytes(
    digest(secret, "news-access-proof"),
    digest(candidate.trim(), "news-access-proof"),
  );
}

/**
 * Write the signed cookie that remembers a successful unlock.
 *
 * Called from a route handler after `newsCodeMatches` passes. The value is
 * `<expiry>.<mac>`; the MAC is keyed by the access code, so a cookie cannot be
 * forged without knowing it, and it dies on its own at the expiry.
 */
export async function issueNewsAccess(): Promise<void> {
  const secret = configuredCode();
  if (!secret) return;

  const expiresAt = Date.now() + COOKIE_MAX_AGE;
  const mac = digest(secret, `news-access:${expiresAt}`).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${expiresAt}.${mac}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/** Does the request carry a cookie that is still signed and unexpired? */
export async function hasNewsAccess(): Promise<boolean> {
  const secret = configuredCode();
  if (!secret) return false;

  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return false;

  const separator = raw.indexOf(".");
  if (separator < 1) return false;

  const expiresAt = Number(raw.slice(0, separator));
  const mac = raw.slice(separator + 1);

  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;

  return sameBytes(
    Buffer.from(mac, "hex"),
    digest(secret, `news-access:${expiresAt}`),
  );
}

/**
 * The one question the news pages ask: may this viewer read the sheet?
 *
 * Admins pass on the strength of their role; everyone else needs a live
 * access cookie. Either way it is answered before the spreadsheet is touched.
 */
export async function canReadNews(viewer: Viewer): Promise<boolean> {
  if (viewer.isAdmin) return true;
  return hasNewsAccess();
}
