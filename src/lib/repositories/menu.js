import { getSupabaseServerClient } from "../supabase/server";
import { isSupabaseConfigured } from "../appConfig";
import { sampleMenu } from "../data/demoMenu";

/**
 * Loads the public menu grouped by category. Selects only the columns the UI
 * needs (trimmed responses — no `select *`). Falls back to the bundled sample
 * catalog when Supabase is not configured or the request fails, so the page
 * always renders.
 *
 * @returns {Promise<{ categories: Array, source: 'db'|'sample' }>}
 */
export async function getMenu() {
  if (!isSupabaseConfigured()) {
    return { categories: sampleMenu, source: "sample" };
  }

  try {
    const supabase = getSupabaseServerClient();

    const { data: categories, error: catError } = await supabase
      .from("menu_categories")
      .select("id, name, slug, description, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (catError) throw catError;

    const { data: items, error: itemError } = await supabase
      .from("menu_items")
      .select("id, category_id, name, description, price_cents, image_url, tags")
      .eq("is_available", true)
      .order("sort_order", { ascending: true });

    if (itemError) throw itemError;

    if (!categories?.length) {
      return { categories: sampleMenu, source: "sample" };
    }

    const grouped = categories.map((cat) => ({
      ...cat,
      items: (items || []).filter((it) => it.category_id === cat.id),
    }));

    return { categories: grouped, source: "db" };
  } catch {
    // Never crash the storefront over a menu fetch — degrade to samples.
    return { categories: sampleMenu, source: "sample" };
  }
}

/**
 * Looks up authoritative prices for a set of menu item ids. Used at checkout so
 * the server — never the client — decides what each line costs.
 *
 * @param {string[]} ids
 * @returns {Promise<Map<string, { id: string, name: string, price_cents: number }>>}
 */
export async function getItemsByIds(ids) {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, price_cents")
    .in("id", ids)
    .eq("is_available", true);

  if (error) throw new Error(error.message);

  const map = new Map();
  for (const row of data || []) map.set(row.id, row);
  return map;
}
