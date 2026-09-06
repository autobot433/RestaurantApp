import { requireUser, readJson, withErrorHandling } from "@/lib/apiHelpers";
import { enforceRateLimit } from "@/lib/security/rateLimiter";
import { requireInt, cleanString, assert } from "@/lib/security/validators";
import { createReservation } from "@/lib/repositories/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (req) => {
  const limited = enforceRateLimit(req, "reservations:POST", { limit: 15, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await readJson(req);
  const partySize = requireInt(body.party_size, { min: 1, max: 20, field: "party size" });

  assert(typeof body.reserved_for === "string", "Pick a date and time.");
  const when = new Date(body.reserved_for);
  assert(!Number.isNaN(when.getTime()), "Pick a valid date and time.");
  assert(when.getTime() > Date.now(), "Choose a time in the future.");

  const note = body.note ? cleanString(body.note, { max: 300, field: "note" }) : null;

  const reservation = await createReservation(auth.user.id, {
    party_size: partySize,
    reserved_for: when.toISOString(),
    note,
  });

  return Response.json({ reservation }, { status: 201 });
});
