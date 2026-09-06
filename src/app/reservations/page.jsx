import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getReservations } from "@/lib/repositories/account";
import ReservationForm from "./ReservationForm";
import { formatDateTime } from "@/lib/format";
import styles from "./reservations.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reservations" };

const STATUS_LABEL = {
  requested: "Requested",
  confirmed: "Confirmed",
  seated: "Seated",
  cancelled: "Cancelled",
};

export default async function ReservationsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?redirect=/reservations");

  let reservations = [];
  try {
    reservations = await getReservations(user.id);
  } catch {
    reservations = [];
  }

  return (
    <div className="container">
      <header className="page-header">
        <p className="eyebrow">Dine in</p>
        <h1 className="section-title">Reservations</h1>
      </header>

      <div className={styles.grid}>
        <section className={`card ${styles.formPanel}`}>
          <h2 className={styles.panelTitle}>Book a table</h2>
          <ReservationForm />
        </section>

        <section>
          <h2 className={styles.panelTitle}>Upcoming & past</h2>
          {reservations.length === 0 ? (
            <p className="muted">No reservations yet.</p>
          ) : (
            <div className={styles.list}>
              {reservations.map((r) => (
                <div key={r.id} className={`card ${styles.item}`}>
                  <div>
                    <p className={styles.when}>{formatDateTime(r.reserved_for)}</p>
                    <p className="muted">Party of {r.party_size}</p>
                    {r.note && <p className={styles.note}>“{r.note}”</p>}
                  </div>
                  <span className="badge">{STATUS_LABEL[r.status] || r.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
