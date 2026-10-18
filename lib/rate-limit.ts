/**
 * Minimal fixed-window rate limiter.
 *
 * The counter lives in module memory, so on a multi-instance deployment each
 * instance enforces its own budget rather than a global one. That is still
 * enough to blunt drive-by abuse; if you need a hard global limit, move the
 * counter into a shared store (Redis, Upstash, or a Postgres table).
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

// Keep the map from growing without bound on a long-lived process.
const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = Date.now();

function sweep(now: number): void {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;

  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the current window resets. */
  retryAfterSeconds: number;
}

export function rateLimit(options: {
  /** Caller identity, e.g. `"terminal-data:" + ip`. */
  key: string;
  /** Maximum requests allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}): RateLimitResult {
  const { key, limit, windowMs } = options;
  const now = Date.now();

  sweep(now);

  const existing = windows.get(key);
  const window =
    existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + windowMs };

  window.count += 1;
  windows.set(key, window);

  const retryAfterSeconds = Math.max(1, Math.ceil((window.resetAt - now) / 1000));

  return {
    ok: window.count <= limit,
    limit,
    remaining: Math.max(0, limit - window.count),
    retryAfterSeconds,
  };
}

/**
 * Best-effort client IP. Platforms that terminate TLS in front of the app set
 * `x-forwarded-for`; the left-most entry is the original client.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
