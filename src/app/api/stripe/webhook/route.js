import { getStripe } from "@/lib/stripe/server";
import { markOrderPaid } from "@/lib/repositories/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook. The signature is verified against STRIPE_WEBHOOK_SECRET so we
 * only ever act on events genuinely sent by Stripe — the raw body is required
 * for that check, so we read req.text() (never req.json()).
 *
 * On payment success the order is marked paid and reward points are granted via
 * privileged server code, independent of anything the browser reports.
 */
export async function POST(req) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return Response.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return Response.json({ error: `Invalid signature: ${err.message}` }, { status: 400 });
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      const orderId = intent.metadata?.order_id;
      if (orderId) {
        await markOrderPaid({ orderId, paymentIntentId: intent.id });
      }
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    // 500 tells Stripe to retry.
    return Response.json({ error: "Handler failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}
