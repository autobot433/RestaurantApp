import { getSupabaseServerClient } from "../supabase/server";

export async function getOrdersForUser(userId) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createOrder({ userId, items, total }) {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      items,
      total,
      status: "pending",
    })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

