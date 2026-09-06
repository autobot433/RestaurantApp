import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getFavorites } from "@/lib/repositories/account";
import FavoritesGrid from "./FavoritesGrid";
import styles from "./favorites.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Favorites" };

export default async function FavoritesPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?redirect=/favorites");

  let favorites = [];
  try {
    favorites = await getFavorites(user.id);
  } catch {
    favorites = [];
  }

  const items = favorites
    .filter((f) => f.menu_items)
    .map((f) => ({ ...f.menu_items }));

  return (
    <div className="container">
      <header className="page-header">
        <p className="eyebrow">Saved</p>
        <h1 className="section-title">Favorites</h1>
      </header>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p className="muted">No favorites yet. Tap the heart on any dish to save it.</p>
          <Link href="/menu" className="btn btn-gold" style={{ marginTop: 16 }}>
            Explore the menu
          </Link>
        </div>
      ) : (
        <FavoritesGrid initialItems={items} />
      )}
    </div>
  );
}
