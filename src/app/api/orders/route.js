import { requireUser, withErrorHandling } from "@/lib/apiHelpers";
import { getOrdersForUser } from "@/lib/repositories/orders";
import { enforceRateLimit } from "@/lib/security/rateLimiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List the signed-in user's orders.
export const GET = withErrorHandling(async (req) => {
  const limited = enforceRateLimit(req, "orders:GET", { limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireUser();
  if (auth.response) return auth.response;

  const orders = await getOrdersForUser(auth.user.id);
  return Response.json({ orders });
});
