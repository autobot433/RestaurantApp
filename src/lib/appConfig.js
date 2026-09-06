/**
 * Central place to read configuration flags. Keeping these here avoids
 * scattering `process.env` checks (and typos) across the codebase.
 */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Server-only Stripe check (secret key). Do not call from client components.
export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// Sales tax rate applied server-side when computing order totals.
export const TAX_RATE = 0.08875;
