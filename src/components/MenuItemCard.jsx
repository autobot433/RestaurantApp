"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { Plus, Heart } from "lucide-react";
import { addItem } from "@/store/cartSlice";
import { formatCents } from "@/lib/format";
import { isUuid } from "@/lib/security/validation";
import styles from "./MenuItemCard.module.css";

const TAG_LABELS = { v: "Vegetarian", gf: "Gluten-free", na: "Zero-proof" };

export default function MenuItemCard({ item, initialFavorite = false }) {
  const dispatch = useDispatch();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [busy, setBusy] = useState(false);

  function add() {
    dispatch(
      addItem({ id: item.id, name: item.name, price_cents: item.price_cents })
    );
    toast.success(`${item.name} added`);
  }

  async function toggleFavorite() {
    // Favorites require a real DB id; sample items can't be saved.
    if (!isUuid(item.id)) {
      toast("Connect a database to save favorites.");
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !favorite;
    setFavorite(next); // optimistic
    try {
      const res = await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_item_id: item.id }),
      });
      if (res.status === 401) {
        setFavorite(!next);
        toast.error("Sign in to save favorites.");
        return;
      }
      if (!res.ok) throw new Error();
      toast.success(next ? "Saved to favorites" : "Removed from favorites");
    } catch {
      setFavorite(!next);
      toast.error("Couldn't update favorite.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.body}>
        <div className={styles.top}>
          <h3 className={styles.name}>{item.name}</h3>
          <span className={styles.price}>{formatCents(item.price_cents)}</span>
        </div>
        {item.description && <p className={styles.desc}>{item.description}</p>}
        {item.tags?.length > 0 && (
          <div className={styles.tags}>
            {item.tags.map((t) => (
              <span key={t} className="badge">
                {TAG_LABELS[t] || t}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className={styles.actions}>
        <button className="btn btn-gold" onClick={add}>
          <Plus size={16} /> Add
        </button>
        <button
          className={`${styles.heart} ${favorite ? styles.heartOn : ""}`}
          onClick={toggleFavorite}
          aria-label={favorite ? "Remove from favorites" : "Save to favorites"}
          aria-pressed={favorite}
        >
          <Heart size={18} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
}
