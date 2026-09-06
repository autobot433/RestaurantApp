import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getRewards } from "@/lib/repositories/account";
import styles from "./rewards.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rewards" };

const TIERS = [
  { name: "Bronze", at: 0 },
  { name: "Silver", at: 400 },
  { name: "Gold", at: 1000 },
  { name: "Platinum", at: 2000 },
];

const PERKS = [
  { tier: "Bronze", perk: "Earn 1 point per $1 spent." },
  { tier: "Silver", perk: "Priority pickup and a birthday dessert." },
  { tier: "Gold", perk: "Complimentary small plate every visit." },
  { tier: "Platinum", perk: "Chef's table access and reservation priority." },
];

export default async function RewardsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?redirect=/rewards");

  const rewards = await getRewards(user.id).catch(() => ({ points: 0, tier: "bronze" }));
  const points = rewards.points || 0;

  const nextTier = TIERS.find((t) => t.at > points);
  const currentTier = [...TIERS].reverse().find((t) => points >= t.at) || TIERS[0];
  const progress = nextTier
    ? Math.min(100, Math.round((points / nextTier.at) * 100))
    : 100;

  return (
    <div className="container">
      <header className="page-header">
        <p className="eyebrow">Loyalty</p>
        <h1 className="section-title">Rewards</h1>
      </header>

      <section className={`card ${styles.hero}`}>
        <div>
          <p className="muted">Your balance</p>
          <p className={styles.points}>{points}</p>
          <p className={styles.tier}>{currentTier.name} member</p>
        </div>
        <div className={styles.progressWrap}>
          {nextTier ? (
            <>
              <div className={styles.progressLabels}>
                <span>{currentTier.name}</span>
                <span>{nextTier.name}</span>
              </div>
              <div className={styles.bar}>
                <div className={styles.fill} style={{ width: `${progress}%` }} />
              </div>
              <p className="muted" style={{ marginTop: 8, fontSize: "0.85rem" }}>
                {nextTier.at - points} points to {nextTier.name}
              </p>
            </>
          ) : (
            <p className={styles.maxed}>You&apos;ve reached the highest tier. Bravo.</p>
          )}
        </div>
      </section>

      <div className={styles.perks}>
        {PERKS.map((p) => (
          <div key={p.tier} className={`card ${styles.perk}`}>
            <span className="badge">{p.tier}</span>
            <p style={{ marginTop: 12 }}>{p.perk}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
