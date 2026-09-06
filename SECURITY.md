# Ahar — Security Overview

This document maps each security requirement to exactly how and where it is
implemented in the codebase, so a reviewer can verify it directly.

## Requirement checklist

| # | Requirement | Status | Where |
|---|-------------|--------|-------|
| 1 | **Row-Level Security on every table** | ✅ | `supabase/migrations/20260101000100_row_level_security.sql` — RLS `enable` + `force` on all tables |
| 2 | **Per-user read/write policies (no cross-user access)** | ✅ | Same file — every user-owned table gates on `auth.uid() = user_id` |
| 3 | **Rate limiting per route** | ✅ | `src/lib/security/rateLimit.js`, applied in every mutating API route |
| 4 | **Move keys/secrets server-side** | ✅ | `src/lib/supabase/admin.js`, `src/lib/stripe/server.js` (both `import "server-only"`); `.env.example` documents public vs secret |
| 5 | **Hide API keys** | ✅ | Only `NEXT_PUBLIC_*` publishable values reach the browser; service role / Stripe secret are server-only |
| 6 | **Purge git secrets** | ✅ | Verified: no secret ever committed (see "Git history" below); `.gitignore` covers `.env*.local`, keys, `*.pem` |
| 7 | **Use the public DB key on the client** | ✅ | `src/lib/supabase/client.js` uses the anon (publishable) key — safe by design because RLS gates every table |
| 8 | **Encrypt sensitive data** | ✅ | In transit: HTTPS enforced (HSTS + redirect). At rest: Supabase-managed encryption. Card data is never stored — Stripe holds it (PCI scope minimized) |
| 9 | **Enforce server-side auth** | ✅ | `getAuthenticatedUser()` uses `supabase.auth.getUser()` (verifies the JWT with the auth server) in `src/lib/supabase/server.js`; every API route calls `requireUser()` |
| 10 | **Lock record access** | ✅ | RLS policies (see #1/#2) |
| 11 | **Block field tampering** | ✅ | Order totals are recomputed server-side from DB prices in `src/lib/repositories/orders.js` (`priceCart`); the client only sends item ids + quantities |
| 12 | **Secure session cookies** | ✅ | `secure` + `sameSite=lax` + `path=/` cookie options in `src/lib/supabase/server.js` and `src/middleware.js` |
| 13 | **Hash passwords** | ✅ | Handled by Supabase Auth (bcrypt); the app never sees or stores raw passwords |
| 14 | **Bot protection** | ✅ | Rate limiting (#3) + honeypot fields on auth forms + phone/email OTP; see "Going further" for CAPTCHA |
| 15 | **Parameterized queries** | ✅ | All DB access goes through the Supabase query builder (parameterized); no raw SQL string concatenation anywhere |
| 16 | **Validate all input** | ✅ | `src/lib/security/validation.js` on every request body, plus Postgres `CHECK` constraints in the schema migration |
| 17 | **Escape user content** | ✅ | React auto-escapes all rendered output; no `dangerouslySetInnerHTML` anywhere in the app |
| 18 | **Restrict file uploads** | ✅ (N/A surface) | The app has no user file-upload feature, so there is no upload attack surface. Guidance for adding one safely is below |
| 19 | **Trim API responses** | ✅ | Every query selects explicit columns (no `select *`); response payloads are minimal |
| 20 | **Security headers** | ✅ | `next.config.mjs` — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP |
| 21 | **Force HTTPS** | ✅ | HSTS (2y, preload) + `upgrade-insecure-requests` in CSP + http→https redirect in `src/middleware.js` |
| 22 | **Scan dependencies** | ✅ | `npm audit` run; `next-pwa` (unused) removed, clearing 17 advisories; `ws` patched. See "Dependency status" |

## Detail notes

### Row-Level Security (the core guarantee)
Every table has RLS **enabled and forced**. With RLS on, Postgres denies by
default, so the policies are the *only* way rows become visible. User-owned
tables (`orders`, `order_items`, `favorites`, `rewards`, `reservations`,
`profiles`) all scope to `auth.uid()`. The catalog tables (`menu_categories`,
`menu_items`) are read-only to clients and writable only by the service role.
`rewards` is read-only to clients — points can only be granted by the
`award_reward_points` SECURITY DEFINER function, callable only with the service
role, so a user can never inflate their own balance.

### Server-side authority over money
`priceCart()` looks up each item's price from the database and computes
subtotal, tax, tip and total on the server. The Stripe PaymentIntent is created
for that server-computed amount, and the order is marked `paid` only by the
signature-verified Stripe webhook (`src/app/api/stripe/webhook/route.js`) using
the service role. A tampered cart, price, or total from the browser has no
effect.

### Secrets & keys
- **Public (safe in the browser):** `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- **Secret (server only):** `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`. These are read only in modules that begin with
  `import "server-only"`, which makes the build fail if they are ever pulled
  into a client bundle.

### Git history
`git log --all` was scanned for secret filenames and for secret patterns
(`sk_live`, `sk_test`, `service_role`, private-key headers, AWS keys). None were
ever committed. `.env.local` and key files are git-ignored. If a real secret is
ever committed in future, rotate it immediately and purge with
`git filter-repo`.

### Rate limiting
`rateLimit()` is a fixed-window limiter keyed by client IP + route. Applied to:
`POST /api/checkout` (10/min), `POST /api/reservations` (15/min),
`PATCH /api/account` (30/min), `GET /api/orders` (60/min),
`POST|DELETE /api/favorites` (60/min). The default implementation is in-memory
(per process) — for multi-instance/serverless deployments, back it with Upstash
Redis or similar using the same interface.

### Security headers (verified in a browser)
The production CSP was verified with headless Chromium: pages render with **zero
CSP violations** and full interactivity. Because Next.js inlines per-build
bootstrap scripts, `script-src` allows `'unsafe-inline'`; every other directive
is locked down (`object-src 'none'`, `frame-ancestors 'none'`, vetted
connect/frame origins for Supabase + Stripe). Since the app renders no
user-supplied HTML, the residual inline-script surface is minimal. A stricter
nonce-based policy is the documented next step (requires fully dynamic
rendering).

## Dependency status
`npm audit` after cleanup reports **0 runtime-path vulnerabilities**. The
remaining advisories are all **build/dev-time only** transitive dependencies
(`postcss` and `glob`/`brace-expansion` pulled in by Next's build tooling and
ESLint). Their only "fix" is a major Next 16 upgrade, which is a breaking change
intentionally not applied here; none is reachable in the deployed request path.
Re-audit with `npm audit` after any dependency change.

## Going further (recommended, not yet wired)
- **CAPTCHA / Supabase Attack Protection** on signup + OTP endpoints for
  stronger bot defense (honeypots + rate limits are in place today).
- **Distributed rate limiting** (Upstash Redis) for serverless.
- **Nonce-based CSP** with fully dynamic rendering to drop `'unsafe-inline'`.
- **If you add file uploads:** use Supabase Storage with per-user path prefixes,
  a strict MIME allowlist, a size cap, and RLS on the storage bucket.
