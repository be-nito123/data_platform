import { NextResponse } from "next/server";
import { issueNewsAccess, newsCodeMatches, newsCodeEnabled } from "@/lib/news-access";

/*
  Unlocks the news room for a browser that knows the shared access code.

  POST { code } → 200 with a signed, HttpOnly cookie, or 401 with a generic
  message. The response never distinguishes "wrong code" from "no code
  configured" in a way that helps a guesser, and failures are throttled so the
  endpoint cannot be used to brute-force the value.
*/

/* Cheap in-memory throttle: five wrong tries, then a short wait. */
const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  if (!newsCodeEnabled()) {
    return NextResponse.json({ error: "Not available." }, { status: 404 });
  }

  const key = clientKey(request);
  const record = attempts.get(key);

  if (record && record.lockedUntil > Date.now()) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429 },
    );
  }

  let code: unknown;
  try {
    ({ code } = await request.json());
  } catch {
    code = null;
  }

  if (typeof code !== "string" || !newsCodeMatches(code)) {
    const next = {
      count: (record?.count ?? 0) + 1,
      lockedUntil: record?.lockedUntil ?? 0,
    };
    if (next.count >= MAX_ATTEMPTS) {
      next.lockedUntil = Date.now() + LOCK_MS;
      next.count = 0;
    }
    attempts.set(key, next);

    return NextResponse.json({ error: "That code is not right." }, { status: 401 });
  }

  attempts.delete(key);
  await issueNewsAccess();

  return NextResponse.json({ ok: true });
}
