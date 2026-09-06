"use client";

import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { makeStore } from "@/store";
import { hydrate } from "@/store/cartSlice";

const CART_KEY = "ahar.cart.v1";

export default function Providers({ children }) {
  const storeRef = useRef(null);
  if (!storeRef.current) storeRef.current = makeStore();

  // Load persisted cart once, then persist on every change.
  useEffect(() => {
    const store = storeRef.current;
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) store.dispatch(hydrate(JSON.parse(saved)));
    } catch {
      /* ignore corrupt storage */
    }

    const unsubscribe = store.subscribe(() => {
      try {
        localStorage.setItem(
          CART_KEY,
          JSON.stringify({ items: store.getState().cart.items })
        );
      } catch {
        /* storage may be unavailable (private mode) */
      }
    });
    return unsubscribe;
  }, []);

  // Register the service worker for PWA/offline shell.
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <Provider store={storeRef.current}>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#1a1a1a",
            color: "#f5f0e8",
            border: "1px solid rgba(212,175,55,0.35)",
          },
        }}
      />
    </Provider>
  );
}
