import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getOrdersForUser } from "@/lib/repositories/orders";
import { formatCents, formatDateTime } from "@/lib/formatters";
import styles from "./orders.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

const STATUS_LABEL = {
  pending: "Pending payment",
  paid: "Paid",
  preparing: "Preparing",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function OrdersPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?redirect=/orders");

  let orders = [];
  try {
    orders = await getOrdersForUser(user.id);
  } catch {
    orders = [];
  }

  return (
    <div className="container">
      <header className="page-header">
        <p className="eyebrow">History</p>
        <h1 className="section-title">Your Orders</h1>
      </header>

      {orders.length === 0 ? (
        <div className={styles.empty}>
          <p className="muted">You haven&apos;t placed any orders yet.</p>
          <Link href="/menu" className="btn btn-gold" style={{ marginTop: 16 }}>
            Browse the menu
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {orders.map((order) => (
            <article key={order.id} className={`card ${styles.order}`}>
              <div className={styles.orderHead}>
                <div>
                  <span className={styles.date}>{formatDateTime(order.created_at)}</span>
                  <span className={`badge ${styles.status}`}>
                    {STATUS_LABEL[order.status] || order.status}
                  </span>
                </div>
                <span className={styles.total}>{formatCents(order.total_cents)}</span>
              </div>
              <ul className={styles.items}>
                {order.order_items?.map((li) => (
                  <li key={li.id}>
                    <span>
                      {li.quantity} × {li.name_snapshot}
                    </span>
                    <span className="muted">
                      {formatCents(li.unit_price_cents * li.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className={styles.breakdown}>
                <span>Subtotal {formatCents(order.subtotal_cents)}</span>
                <span>Tax {formatCents(order.tax_cents)}</span>
                {order.tip_cents > 0 && <span>Tip {formatCents(order.tip_cents)}</span>}
                <span className={styles.fulfil}>{order.fulfillment}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
