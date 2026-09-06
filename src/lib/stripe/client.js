"use client";

import { loadStripe } from "@stripe/stripe-js";

let stripePromise;

/** Lazily load Stripe.js with the publishable (public) key. */
export function getStripePromise() {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return null;
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}
