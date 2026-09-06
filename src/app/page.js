import Link from "next/link";
import { ArrowRight, Sparkles, Gift, CalendarClock } from "lucide-react";
import { getMenu } from "@/lib/repositories/menu";
import MenuItemCard from "@/components/MenuItemCard";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { categories } = await getMenu();
  // Feature one standout from each of the first three categories.
  const featured = categories
    .slice(0, 3)
    .map((c) => c.items?.[0])
    .filter(Boolean);

  return (
    <div>
      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <p className="eyebrow fade-in">Modern Dining, Elevated</p>
          <h1 className={`${styles.heroTitle} slide-up`}>
            A table set for
            <br />
            <span className={styles.accent}>the moment.</span>
          </h1>
          <p className={`${styles.heroSub} slide-up`}>
            Seasonal plates, a considered cellar, and a seamless way to order,
            earn rewards, and reserve your seat — all in one place.
          </p>
          <div className={`${styles.heroCtas} slide-up`}>
            <Link href="/menu" className="btn btn-gold">
              Order now <ArrowRight size={16} />
            </Link>
            <Link href="/reservations" className="btn btn-outline">
              Reserve a table
            </Link>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="container">
        <div className={styles.props}>
          <Prop
            icon={<Sparkles size={22} />}
            title="Chef-driven menu"
            body="Hearth-fired mains and refined small plates, rotated with the seasons."
          />
          <Prop
            icon={<Gift size={22} />}
            title="Rewards that matter"
            body="Earn a point for every dollar. Unlock tiers, perks, and quiet extras."
          />
          <Prop
            icon={<CalendarClock size={22} />}
            title="Reserve in seconds"
            body="Book your table and manage every reservation from your account."
          />
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="container" style={{ marginTop: 72 }}>
          <div className={styles.sectionHead}>
            <div>
              <p className="eyebrow">From the pass</p>
              <h2 className="section-title">Featured tonight</h2>
            </div>
            <Link href="/menu" className={styles.seeAll}>
              See full menu <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.grid}>
            {featured.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Prop({ icon, title, body }) {
  return (
    <div className={styles.prop}>
      <div className={styles.propIcon}>{icon}</div>
      <h3 className={styles.propTitle}>{title}</h3>
      <p className="muted">{body}</p>
    </div>
  );
}
