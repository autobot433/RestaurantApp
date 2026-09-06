"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import { addItem } from "@/store/cartSlice";
import { formatCents } from "@/lib/formatters";
import styles from "./favorites.module.css";

export default function SavedDishesGrid({ initialItems }) {
  const dispatch = useDispatch();
  const [items, setItems] = useState(initialItems);

  async function remove(id) {
    const prev = items;
    setItems((list) => list.filter((i) => i.id !== id)); // optimistic
    try {
      const res = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu_item_id: id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Removed from favorites");
    } catch {
      setItems(prev);
      toast.error("Couldn't remove favorite.");
    }
  }

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <article key={item.id} className={`card ${styles.card}`}>
          <div className={styles.top}>
            <h3 className={styles.name}>{item.name}</h3>
            <span className={styles.price}>{formatCents(item.price_cents)}</span>
          </div>
          {item.description && <p className="muted">{item.description}</p>}
          <div className={styles.actions}>
            <button
              className="btn btn-gold"
              onClick={() => {
                dispatch(addItem({ id: item.id, name: item.name, price_cents: item.price_cents }));
                toast.success(`${item.name} added`);
              }}
            >
              <Plus size={16} /> Add
            </button>
            <button
              className={styles.remove}
              onClick={() => remove(item.id)}
              aria-label={`Remove ${item.name} from favorites`}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
