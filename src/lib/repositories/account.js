import { getSupabaseServerClient } from "../supabase/server";

/** Profile — all queries run under the user's session, so RLS scopes them. */
export async function getProfile(userId) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateProfile(userId, { full_name, phone }) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name, phone })
    .eq("id", userId)
    .select("id, full_name, phone")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Rewards — read-only for clients; writes happen via the service-role RPC. */
export async function getRewards(userId) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("rewards")
    .select("points, tier, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data || { points: 0, tier: "bronze" };
}

/** Favorites. */
export async function getFavorites(userId) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("menu_item_id, created_at, menu_items ( id, name, description, price_cents, tags )")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function addFavorite(userId, menuItemId) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, menu_item_id: menuItemId });
  if (error) throw new Error(error.message);
}

export async function removeFavorite(userId, menuItemId) {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("menu_item_id", menuItemId);
  if (error) throw new Error(error.message);
}

/** Reservations. */
export async function getReservations(userId) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("id, party_size, reserved_for, status, note, created_at")
    .eq("user_id", userId)
    .order("reserved_for", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data;
}

export async function createReservation(userId, { party_size, reserved_for, note }) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("reservations")
    .insert({ user_id: userId, party_size, reserved_for, note: note || null })
    .select("id, party_size, reserved_for, status, note")
    .single();
  if (error) throw new Error(error.message);
  return data;
}
