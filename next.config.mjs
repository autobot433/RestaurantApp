/** @type {import('next').NextConfig} */

// Content-Security-Policy.
//
// Next.js inlines small bootstrap/hydration scripts whose content changes every
// build, so a nonce- or hash-based script policy would require rendering every
// page dynamically per request (nonces can't be baked into statically
// pre-rendered HTML). To keep static optimization AND a working app, script-src
// allows 'unsafe-inline' but the rest of the policy is locked down: no plugins
// (object-src none), the page can't be framed (frame-ancestors none), and only
// vetted origins can be contacted (connect/frame/img/font). There is no
// user-generated HTML anywhere in the app (React escapes all output; no
// dangerouslySetInnerHTML), so the residual inline-script surface is minimal.
// To harden further later, switch to a nonce policy with fully dynamic
// rendering.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://m.stripe.network",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

// Static security headers applied to every response.
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Force HTTPS for 2 years, including subdomains; eligible for preload lists.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Disallow MIME-type sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Legacy clickjacking protection (CSP frame-ancestors covers modern browsers).
  { key: "X-Frame-Options", value: "DENY" },
  // Send only the origin on cross-origin requests.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Lock down powerful browser features by default.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Isolate the browsing context.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  poweredByHeader: false, // don't advertise the framework
  reactStrictMode: true,

  images: {
    // Only optimize images from explicitly trusted hosts.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
