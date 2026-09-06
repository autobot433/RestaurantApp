/**
 * Small, dependency-free input validation helpers.
 *
 * Every value that crosses a trust boundary (HTTP body, query string) is passed
 * through these before it is used. They throw `ValidationError` with a safe,
 * user-facing message on bad input; route handlers translate that into a 400.
 *
 * These run on both server and client (the client uses them for instant form
 * feedback), so this module has no server-only imports.
 */

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.status = 400;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_RE = /^\+?[0-9]{7,15}$/;

export function isEmail(value) {
  return typeof value === "string" && value.length <= 254 && EMAIL_RE.test(value);
}

export function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

export function assert(condition, message) {
  if (!condition) throw new ValidationError(message);
}

/** Trim + collapse whitespace + cap length. Returns a clean string. */
export function cleanString(value, { max = 500, field = "value" } = {}) {
  assert(typeof value === "string", `${field} must be text.`);
  const trimmed = value.trim().replace(/\s+/g, " ");
  assert(trimmed.length <= max, `${field} is too long.`);
  return trimmed;
}

export function requireEmail(value) {
  assert(isEmail(value), "Enter a valid email address.");
  return value.trim().toLowerCase();
}

export function requirePassword(value) {
  assert(typeof value === "string", "Password is required.");
  assert(value.length >= 8, "Password must be at least 8 characters.");
  assert(value.length <= 72, "Password must be 72 characters or fewer.");
  return value;
}

export function requireUuid(value, field = "id") {
  assert(isUuid(value), `Invalid ${field}.`);
  return value;
}

export function optionalPhone(value) {
  if (value === undefined || value === null || value === "") return null;
  assert(typeof value === "string" && PHONE_RE.test(value.replace(/[\s()-]/g, "")),
    "Enter a valid phone number.");
  return value.replace(/[\s()-]/g, "");
}

export function requireInt(value, { min, max, field = "value" } = {}) {
  const n = typeof value === "number" ? value : Number(value);
  assert(Number.isInteger(n), `${field} must be a whole number.`);
  if (min !== undefined) assert(n >= min, `${field} must be at least ${min}.`);
  if (max !== undefined) assert(n <= max, `${field} must be at most ${max}.`);
  return n;
}

/**
 * Validates a cart payload from the client into a normalized list. We ONLY
 * trust the item id and quantity from the client — prices are looked up
 * server-side from the database, so a tampered price is ignored entirely.
 *
 * @returns {Array<{ menu_item_id: string, quantity: number }>}
 */
export function requireCart(items) {
  assert(Array.isArray(items) && items.length > 0, "Your cart is empty.");
  assert(items.length <= 100, "Too many line items.");

  return items.map((item) => {
    assert(item && typeof item === "object", "Invalid cart item.");
    return {
      menu_item_id: requireUuid(item.menu_item_id ?? item.id, "menu item"),
      quantity: requireInt(item.quantity, { min: 1, max: 50, field: "quantity" }),
    };
  });
}
