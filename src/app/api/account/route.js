import { requireUser, readJson, withErrorHandling } from "@/lib/api";
import { enforceRateLimit } from "@/lib/security/rateLimit";
import { cleanString, optionalPhone } from "@/lib/security/validation";
import { updateProfile } from "@/lib/repositories/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const PATCH = withErrorHandling(async (req) => {
  const limited = enforceRateLimit(req, "account:PATCH", { limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireUser();
  if (auth.response) return auth.response;

  const body = await readJson(req);
  const fullName = body.full_name
    ? cleanString(body.full_name, { max: 120, field: "name" })
    : null;
  const phone = optionalPhone(body.phone);

  const profile = await updateProfile(auth.user.id, {
    full_name: fullName,
    phone,
  });

  return Response.json({ profile });
});
