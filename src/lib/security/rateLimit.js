import "server-only";

/**
 * Lightweight fixed-window rate limiter.
 *
 * This in-memory implementation is per-process. It is a solid default for a
 * single long-lived Node server and prevents casual spamming / brute force. In
 * a horizontally-scaled or serverless deployment (many cold instances), swap
 * the Map for a shared store (Upstash Redis / Supabase) using the same
 * interface — see `rateLimit()` below.
 */
const buckets = new Map();

// Periodically evict expired buckets so memory can't grow unbounded.
const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = Date.now();

function sweep(now) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(key);
  }
}

/**
 * @param {string} key      Unique identifier for the caller+route (e.g. `orders:POST:1.2.3.4`).
 * @param {object} [opts]
 * @param {number} [opts.limit]      Max requests allowed per window. Default 30.
 * @param {number} [opts.windowMs]   Window length in ms. Default 60_000.
 * @returns {{ ok: boolean, remaining: number, limit: number, retryAfter: number }}
 */
export function rateLimit(key, { limit = 30, windowMs = 60_000 } = {}) {
  const now = Date.now();
  sweep(now);

  let entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    buckets.set(key, entry);
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  const ok = entry.count <= limit;

  return {
    ok,
    remaining,
    limit,
    retryAfter: ok ? 0 : Math.ceil((entry.resetAt - now) / 1000),
  };
}

/**
 * Derives a best-effort client identifier from request headers. Falls back to a
 * constant so the limiter still applies (globally) when no IP is available.
 */
export function clientIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

/**
 * Convenience wrapper for route handlers. Returns a Response (429) to send back
 * when the limit is exceeded, or null when the request may proceed.
 */
export function enforceRateLimit(req, routeKey, opts) {
  const ip = clientIp(req);
  const result = rateLimit(`${routeKey}:${ip}`, opts);
  if (result.ok) return null;

  return Response.json(
    { error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfter),
        "RateLimit-Limit": String(result.limit),
        "RateLimit-Remaining": "0",
      },
    }
  );
}
