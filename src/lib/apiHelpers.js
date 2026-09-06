import "server-only";
import { getSupabaseServerClient, getAuthenticatedUser } from "./supabase/server";
import { ValidationError } from "./security/validators";

/** Uniform JSON error response. */
export function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status });
}

/**
 * Resolves the authenticated user for a route handler. Returns either
 * { user, supabase } or a ready-to-return 401 Response.
 */
export async function requireUser() {
  const supabase = getSupabaseServerClient();
  const user = await getAuthenticatedUser(supabase);
  if (!user) return { response: jsonError("Unauthorized", 401) };
  return { user, supabase };
}

/** Safely parse a JSON body, returning {} on empty/invalid input. */
export async function readJson(req) {
  try {
    const text = await req.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    throw new ValidationError("Malformed request body.");
  }
}

/**
 * Wraps a handler so ValidationError -> 400 and anything else -> 500 without
 * leaking internal error details to the client.
 */
export function withErrorHandling(handler) {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ValidationError) {
        return jsonError(err.message, 400);
      }
      console.error("[api] unhandled error:", err);
      return jsonError("Something went wrong. Please try again.", 500);
    }
  };
}
