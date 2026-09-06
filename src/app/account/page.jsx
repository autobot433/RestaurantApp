import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getProfile, getRewards } from "@/lib/repositories/account";
import AccountProfileForm from "./AccountProfileForm";
import { formatCents } from "@/lib/formatters";
import styles from "./account.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?redirect=/account");

  const [profile, rewards] = await Promise.all([
    getProfile(user.id).catch(() => null),
    getRewards(user.id).catch(() => ({ points: 0, tier: "bronze" })),
  ]);

  return (
    <div className="container">
      <header className="page-header">
        <p className="eyebrow">Your Account</p>
        <h1 className="section-title">Account</h1>
        <p className="muted">{user.email}</p>
      </header>

      <div className={styles.grid}>
        <section className={`card ${styles.panel}`}>
          <h2 className={styles.panelTitle}>Profile</h2>
          <AccountProfileForm
            initial={{
              full_name: profile?.full_name || "",
              phone: profile?.phone || "",
            }}
          />
        </section>

        <aside className={styles.side}>
          <section className={`card ${styles.panel}`}>
            <h2 className={styles.panelTitle}>Rewards</h2>
            <p className={styles.points}>{rewards.points}</p>
            <p className="muted" style={{ textTransform: "capitalize" }}>
              {rewards.tier} tier
            </p>
            <Link href="/rewards" className="btn btn-outline btn-block" style={{ marginTop: 16 }}>
              View rewards
            </Link>
          </section>

          <section className={`card ${styles.panel}`}>
            <h2 className={styles.panelTitle}>Quick links</h2>
            <div className={styles.links}>
              <Link href="/orders">Order history</Link>
              <Link href="/favorites">Favorites</Link>
              <Link href="/reservations">Reservations</Link>
              <Link href="/change-password">Change password</Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
