"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag, Menu as MenuIcon, X } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { selectCount, openCart } from "@/store/cartSlice";
import { isSupabaseConfigured } from "@/lib/config";
import styles from "./Nav.module.css";

const links = [
  { href: "/menu", label: "Menu" },
  { href: "/reservations", label: "Reservations" },
  { href: "/rewards", label: "Rewards" },
];

export default function Nav() {
  const dispatch = useDispatch();
  const count = useSelector(selectCount);
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function signOut() {
    if (isSupabaseConfigured()) {
      await getSupabaseClient().auth.signOut();
    }
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label="Ahar home">
          Ahar
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname.startsWith(l.href) ? styles.activeLink : styles.link}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <button
            className={styles.cartBtn}
            onClick={() => dispatch(openCart())}
            aria-label={`Open cart, ${count} items`}
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {count > 0 && <span className={styles.cartCount}>{count}</span>}
          </button>

          {user ? (
            <div className={styles.authGroup}>
              <Link href="/account" className={`${styles.link} ${styles.hideSm}`}>
                Account
              </Link>
              <button className="btn btn-outline" onClick={signOut}>
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-gold">
              Sign in
            </Link>
          )}

          <button
            className={styles.menuToggle}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className={styles.mobileNav} aria-label="Mobile">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={styles.mobileLink}>
              {l.label}
            </Link>
          ))}
          <Link href={user ? "/account" : "/login"} className={styles.mobileLink}>
            {user ? "Account" : "Sign in"}
          </Link>
        </nav>
      )}
    </header>
  );
}
