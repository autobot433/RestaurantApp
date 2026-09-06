import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { isSupabaseConfigured } from "../config";

/**
 * Cookie hardening for the auth session cookies.
 *
 *   secure   -> only sent over HTTPS in production
 *   sameSite -> "lax" blocks the cookie on cross-site POSTs (CSRF hardening)
 *   path "/" -> scoped to the whole app
 *
 * Note: these cookies are intentionally NOT httpOnly. The @supabase/ssr browser
 * client must read the session from cookies to keep the UI in sync; the token
 * is a short-lived JWT and every privileged action is re-verified server-side
 * with getUser() + RLS, so the security boundary does not rely on the cookie
 * being unreadable by JS.
 */
const cookieOptions = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

/**
 * Supabase client bound to the current request's cookies. Runs with the user's
 * own privileges, so every query is still constrained by Row-Level Security.
 * Safe to use in Server Components and Route Handlers.
 */
export function getSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions,
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component render (read-only cookie store).
            // Session refresh cookies are re-issued by middleware, so ignore.
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          } catch {
            /* read-only context — see set() */
          }
        },
      },
    }
  );
}

/**
 * Returns the authenticated user or null. Uses getUser(), which validates the
 * JWT with the Supabase Auth server on every call — unlike getSession(), which
 * trusts whatever is in the cookie. Always use this to gate protected actions.
 */
export async function getAuthenticatedUser(supabase) {
  if (!isSupabaseConfigured()) return null;
  const client = supabase || getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) return null;
  return user;
}
