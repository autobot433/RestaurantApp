"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { Elements } from "@stripe/react-stripe-js";
import toast from "react-hot-toast";
import { selectItems, selectSubtotalCents, clearCart } from "@/store/cartSlice";
import { getStripePromise } from "@/lib/stripe/client";
import { formatCents } from "@/lib/format";
import { TAX_RATE } from "@/lib/config";
import PaymentStep from "./PaymentStep";
import styles from "./checkout.module.css";

const TIP_OPTIONS = [0, 0.15, 0.18, 0.2];

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const items = useSelector(selectItems);
  const subtotal = useSelector(selectSubtotalCents);

  const [fulfillment, setFulfillment] = useState("pickup");
  const [tipPct, setTipPct] = useState(0.18);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Client-side estimate for display only; the server recomputes authoritatively.
  const tipCents = Math.round(subtotal * tipPct);
  const taxCents = Math.round(subtotal * TAX_RATE);
  const totalCents = subtotal + taxCents + tipCents;

  const [checkout, setCheckout] = useState(null); // { clientSecret, orderId, breakdown }
  const stripePromise = useMemo(() => getStripePromise(), []);

  async function startPayment() {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ menu_item_id: i.id, quantity: i.quantity })),
          tip_cents: tipCents,
          fulfillment,
          note,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push("/login?redirect=/checkout");
        return;
      }
      if (!res.ok) {
        toast.error(data.error || "Could not start checkout.");
        return;
      }
      setCheckout(data);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onPaid() {
    dispatch(clearCart());
    toast.success("Payment complete — thank you!");
    router.push("/orders");
  }

  if (items.length === 0 && !checkout) {
    return (
      <div className="container">
        <div className={styles.empty}>
          <h1 className="section-title">Your cart is empty</h1>
          <button className="btn btn-gold" onClick={() => router.push("/menu")}>
            Browse the menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="page-header">
        <p className="eyebrow">Almost there</p>
        <h1 className="section-title">Checkout</h1>
      </header>

      <div className={styles.grid}>
        <section className={styles.left}>
          {!checkout ? (
            <div className={`card ${styles.panel}`}>
              <h2 className={styles.panelTitle}>Order details</h2>

              <div className={styles.field}>
                <span className={styles.label}>Fulfillment</span>
                <div className={styles.toggle}>
                  {["pickup", "delivery"].map((f) => (
                    <button
                      key={f}
                      className={fulfillment === f ? styles.toggleOn : styles.toggleOff}
                      onClick={() => setFulfillment(f)}
                      type="button"
                    >
                      {f[0].toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <span className={styles.label}>Tip</span>
                <div className={styles.toggle}>
                  {TIP_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={tipPct === t ? styles.toggleOn : styles.toggleOff}
                      onClick={() => setTipPct(t)}
                    >
                      {t === 0 ? "None" : `${Math.round(t * 100)}%`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label htmlFor="note">Order note (optional)</label>
                <textarea
                  id="note"
                  className="input"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Allergies, instructions…"
                  maxLength={500}
                />
              </div>

              <button className="btn btn-gold btn-block" onClick={startPayment} disabled={loading}>
                {loading ? <span className="spinner" /> : "Proceed to payment"}
              </button>
            </div>
          ) : stripePromise ? (
            <div className={`card ${styles.panel}`}>
              <h2 className={styles.panelTitle}>Payment</h2>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: checkout.clientSecret,
                  appearance: {
                    theme: "night",
                    variables: { colorPrimary: "#d4af37", colorBackground: "#141414" },
                  },
                }}
              >
                <PaymentStep onPaid={onPaid} />
              </Elements>
            </div>
          ) : (
            <div className={`card ${styles.panel}`}>
              <p className="error-text">Payment library unavailable.</p>
            </div>
          )}
        </section>

        <aside className={`card ${styles.summary}`}>
          <h2 className={styles.panelTitle}>Summary</h2>
          <ul className={styles.items}>
            {items.map((i) => (
              <li key={i.id}>
                <span>
                  {i.quantity} × {i.name}
                </span>
                <span className="muted">{formatCents(i.price_cents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className={styles.totals}>
            <Row label="Subtotal" value={formatCents(checkout?.breakdown.subtotal_cents ?? subtotal)} />
            <Row label="Tax" value={formatCents(checkout?.breakdown.tax_cents ?? taxCents)} />
            <Row label="Tip" value={formatCents(checkout?.breakdown.tip_cents ?? tipCents)} />
            <Row label="Total" value={formatCents(checkout?.breakdown.total_cents ?? totalCents)} strong />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className={strong ? styles.totalRowStrong : styles.totalRow}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
