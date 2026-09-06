import "server-only";
import Stripe from "stripe";

let stripe;

/** Returns a configured Stripe client, or null if the secret key is unset. */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripe) {
    stripe = new Stripe(key, { apiVersion: "2024-06-20" });
  }
  return stripe;
}
