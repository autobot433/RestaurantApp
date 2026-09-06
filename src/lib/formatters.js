/** Format integer cents as USD, e.g. 1600 -> "$16.00". */
export function formatCents(cents) {
  const value = (Number(cents) || 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

/** Human date, e.g. "Jan 4, 2026, 7:30 PM". */
export function formatDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
