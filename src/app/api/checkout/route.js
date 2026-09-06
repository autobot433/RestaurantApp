import { requireUser, jsonError, readJson, withErrorHandling } from "@/lib/apiHelpers";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { requireCart, requireInt, cleanString, assert } from "@/lib/security/validators";
import { createPendingOrder } from "@/lib/repositories/orders";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Starts checkout:
 *   1. rate-limit + authenticate
 *   2. validate the client payload (ids + quantities + tip only)
 *   3. create a pending order priced entirely server-side
 *   4. create a Stripe PaymentIntent for that authoritative amount
 * Returns the PaymentIntent client secret + the server's price breakdown.
 */
export const POST = withErrorHandling(async (req) => {
  const limited = enforceRateLimit(req, "checkout:POST", { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await readJson(req);
  const cart = requireCart(body.items);
  const tipCents = requireInt(body.tip_cents ?? 0, { min: 0, max: 100000, field: "tip" });
  const fulfillment = body.fulfillment === "delivery" ? "delivery" : "pickup";
  const note = body.note ? cleanString(body.note, { max: 500, field: "note" }) : null;

  const { order, priced } = await createPendingOrder({
    userId: auth.user.id,
    cart,
    tipCents,
    fulfillment,
    note,
  });

  const stripe = getStripe();
  if (!stripe) {
    // Payments aren't configured; surface a clear, non-sensitive message.
    return jsonError(
      "Payments are not configured on this environment yet.",
      503
    );
  }

  const intent = await stripe.paymentIntents.create({
    amount: priced.totalCents,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: { order_id: order.id, user_id: auth.user.id },
  });

  return Response.json({
    orderId: order.id,
    clientSecret: intent.client_secret,
    breakdown: {
      subtotal_cents: priced.subtotalCents,
      tax_cents: priced.taxCents,
      tip_cents: priced.tipCents,
      total_cents: priced.totalCents,
    },
  });
});
