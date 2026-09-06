import { requireUser, readJson, withErrorHandling } from "@/lib/api";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { requireUuid } from "@/lib/security/validation";
import { addFavorite, removeFavorite } from "@/lib/repositories/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (req) => {
  const limited = enforceRateLimit(req, "favorites:POST", { limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await readJson(req);
  const menuItemId = requireUuid(body.menu_item_id, "menu item");

  await addFavorite(auth.user.id, menuItemId);
  return Response.json({ ok: true }, { status: 201 });
});

export const DELETE = withErrorHandling(async (req) => {
  const limited = enforceRateLimit(req, "favorites:DELETE", { limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await readJson(req);
  const menuItemId = requireUuid(body.menu_item_id, "menu item");

  await removeFavorite(auth.user.id, menuItemId);
  return Response.json({ ok: true });
});
