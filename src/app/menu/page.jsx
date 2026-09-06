import { getMenu } from "@/lib/repositories/menu";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getFavorites } from "@/lib/repositories/account";
import DishCard from "@/components/DishCard";
import styles from "./menu.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Menu" };

export default async function MenuPage() {
  const { categories, source } = await getMenu();

  // Pre-mark favorites when signed in (best-effort).
  let favoriteIds = new Set();
  const user = await getAuthenticatedUser();
  if (user) {
    try {
      const favs = await getFavorites(user.id);
      favoriteIds = new Set(favs.map((f) => f.menu_item_id));
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="container">
      <header className="page-header">
        <p className="eyebrow">Ordering</p>
        <h1 className="section-title">The Menu</h1>
        <p className="muted" style={{ maxWidth: 560 }}>
          Add anything to your order and check out when you&apos;re ready.
        </p>
        {source === "sample" && (
          <p className={styles.demoNote}>
            Showing a sample menu — connect Supabase to load live items.
          </p>
        )}
      </header>

      <nav className={styles.catNav} aria-label="Menu categories">
        {categories.map((c) => (
          <a key={c.id} href={`#${c.slug}`} className={styles.catLink}>
            {c.name}
          </a>
        ))}
      </nav>

      {categories.map((cat) => (
        <section key={cat.id} id={cat.slug} className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>{cat.name}</h2>
            {cat.description && <p className="muted">{cat.description}</p>}
          </div>
          <div className={styles.grid}>
            {cat.items.map((item) => (
              <DishCard
                key={item.id}
                item={item}
                initialFavorite={favoriteIds.has(item.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
