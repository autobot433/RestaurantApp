import { getSupabaseServerClient } from "../supabase/server";
import { getSupabaseAdminClient } from "../supabase/admin";
import { getItemsByIds } from "./menu";
import { TAX_RATE } from "../config";

/**
 * Lists the current user's orders (with line items). RLS guarantees only the
 * caller's own rows come back; we also select explicit columns to keep the
 * payload tight.
 */
export async function getOrdersForUser(userId) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, status, subtotal_cents, tax_cents, tip_cents, total_cents,
       fulfillment, created_at,
       order_items ( id, name_snapshot, unit_price_cents, quantity )`
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Prices a cart authoritatively from the database. The client only supplies
 * item ids and quantities; every price and the totals are computed here, so a
 * tampered client payload cannot change what is charged or recorded.
 *
 * @param {Array<{ menu_item_id: string, quantity: number }>} cart
 * @param {number} tipCents  validated, non-negative
 */
export async function priceCart(cart, tipCents = 0) {
  const ids = [...new Set(cart.map((c) => c.menu_item_id))];
  const priceMap = await getItemsByIds(ids);

  const lineItems = [];
  let subtotalCents = 0;

  for (const line of cart) {
    const item = priceMap.get(line.menu_item_id);
    if (!item) {
      throw new Error("One or more items are no longer available.");
    }
    const lineTotal = item.price_cents * line.quantity;
    subtotalCents += lineTotal;
    lineItems.push({
      menu_item_id: item.id,
      name_snapshot: item.name,
      unit_price_cents: item.price_cents,
      quantity: line.quantity,
    });
  }

  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + taxCents + tipCents;

  return { lineItems, subtotalCents, taxCents, tipCents, totalCents };
}

/**
 * Creates a pending order + its line items for the given user, using
 * server-computed pricing. Runs as the user (RLS enforces user_id = auth.uid()).
 */
export async function createPendingOrder({ userId, cart, tipCents, fulfillment, note }) {
  const supabase = getSupabaseServerClient();
  const priced = await priceCart(cart, tipCents);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      status: "pending",
      subtotal_cents: priced.subtotalCents,
      tax_cents: priced.taxCents,
      tip_cents: priced.tipCents,
      total_cents: priced.totalCents,
      fulfillment: fulfillment || "pickup",
      note: note || null,
    })
    .select("id, total_cents, subtotal_cents, tax_cents, tip_cents")
    .single();

  if (orderError) throw new Error(orderError.message);

  const rows = priced.lineItems.map((li) => ({ ...li, order_id: order.id }));
  const { error: itemsError } = await supabase.from("order_items").insert(rows);

  if (itemsError) {
    // Best-effort cleanup so we don't leave an order with no items.
    await supabase.from("orders").delete().eq("id", order.id);
    throw new Error(itemsError.message);
  }

  return { order, priced };
}

/**
 * Marks an order paid and awards loyalty points. PRIVILEGED: uses the service
 * role (bypasses RLS) and must only be called from trusted server code such as
 * the verified Stripe webhook.
 */
export async function markOrderPaid({ orderId, paymentIntentId }) {
  const admin = getSupabaseAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .update({ status: "paid", stripe_payment_intent: paymentIntentId })
    .eq("id", orderId)
    .eq("status", "pending") // idempotent: only the first transition sticks
    .select("id, user_id, total_cents")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!order) return null; // already processed or not found

  await admin.rpc("award_reward_points", {
    p_user_id: order.user_id,
    p_total_cents: order.total_cents,
  });

  return order;
}
