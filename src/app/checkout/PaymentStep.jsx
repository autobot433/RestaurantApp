"use client";

import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

/**
 * Renders Stripe's PaymentElement and confirms the payment. On success the
 * parent clears the cart and navigates away; the Stripe webhook is what
 * actually marks the order paid + awards points server-side.
 */
export default function PaymentStep({ onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError("");
    setProcessing(true);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url:
          typeof window !== "undefined" ? `${window.location.origin}/orders` : undefined,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || "Payment failed.");
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      onPaid();
    } else {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <PaymentElement />
      {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
      <button
        className="btn btn-gold btn-block"
        style={{ marginTop: 20 }}
        disabled={!stripe || processing}
      >
        {processing ? <span className="spinner" /> : "Pay now"}
      </button>
    </form>
  );
}
