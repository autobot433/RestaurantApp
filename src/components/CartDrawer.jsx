"use client";

import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2, X } from "lucide-react";
import {
  selectItems,
  selectSubtotalCents,
  setQuantity,
  removeItem,
  closeCart,
} from "@/store/cartSlice";
import { formatCents } from "@/lib/format";
import styles from "./CartDrawer.module.css";

export default function CartDrawer() {
  const dispatch = useDispatch();
  const router = useRouter();
  const isOpen = useSelector((s) => s.cart.isOpen);
  const items = useSelector(selectItems);
  const subtotal = useSelector(selectSubtotalCents);

  function goCheckout() {
    dispatch(closeCart());
    router.push("/checkout");
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(closeCart())}
          />
          <motion.aside
            className={styles.drawer}
            role="dialog"
            aria-label="Your cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
          >
            <div className={styles.head}>
              <h2 className={styles.title}>Your Order</h2>
              <button
                className={styles.close}
                onClick={() => dispatch(closeCart())}
                aria-label="Close cart"
              >
                <X size={22} />
              </button>
            </div>

            {items.length === 0 ? (
              <div className={styles.empty}>
                <p>Your cart is empty.</p>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    dispatch(closeCart());
                    router.push("/menu");
                  }}
                >
                  Browse the menu
                </button>
              </div>
            ) : (
              <>
                <div className={styles.items}>
                  {items.map((item) => (
                    <div key={item.id} className={styles.item}>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemName}>{item.name}</span>
                        <span className={styles.itemPrice}>
                          {formatCents(item.price_cents)}
                        </span>
                      </div>
                      <div className={styles.qtyRow}>
                        <div className={styles.qty}>
                          <button
                            aria-label="Decrease quantity"
                            onClick={() =>
                              dispatch(
                                setQuantity({ id: item.id, quantity: item.quantity - 1 })
                              )
                            }
                          >
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            aria-label="Increase quantity"
                            onClick={() =>
                              dispatch(
                                setQuantity({ id: item.id, quantity: item.quantity + 1 })
                              )
                            }
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          className={styles.remove}
                          aria-label={`Remove ${item.name}`}
                          onClick={() => dispatch(removeItem(item.id))}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.footer}>
                  <div className={styles.subtotal}>
                    <span>Subtotal</span>
                    <span>{formatCents(subtotal)}</span>
                  </div>
                  <p className={styles.note}>Tax & tip calculated at checkout.</p>
                  <button className="btn btn-gold btn-block" onClick={goCheckout}>
                    Checkout
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
