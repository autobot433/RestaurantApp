import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client that uses the SERVICE ROLE key and therefore
 * BYPASSES Row-Level Security. It must only ever run on the server.
 *
 * The `server-only` import above makes the build fail if this module is ever
 * imported into a Client Component, so the service role key can never leak into
 * the browser bundle.
 *
 * Use this exclusively for trusted, audited writes (e.g. marking an order paid
 * after Stripe confirms, or awarding reward points) — never for reads that
 * should already be protected by RLS.
 */
let adminClient;

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  if (!adminClient) {
    adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return adminClient;
}
