import { createSlice } from "@reduxjs/toolkit";

/**
 * Cart state lives on the client for a snappy UX, but it is NEVER trusted for
 * money: at checkout only item ids + quantities are sent to the server, which
 * re-prices everything from the database. Prices held here are display-only.
 */
const initialState = {
  items: [], // { id, name, price_cents, quantity }
  isOpen: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrate(state, action) {
      const items = Array.isArray(action.payload?.items) ? action.payload.items : [];
      state.items = items.filter(
        (i) => i && typeof i.id === "string" && Number.isFinite(i.quantity)
      );
    },
    addItem(state, action) {
      const { id, name, price_cents } = action.payload;
      const existing = state.items.find((i) => i.id === id);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + 1, 50);
      } else {
        state.items.push({ id, name, price_cents, quantity: 1 });
      }
      state.isOpen = true;
    },
    setQuantity(state, action) {
      const { id, quantity } = action.payload;
      const item = state.items.find((i) => i.id === id);
      if (!item) return;
      const q = Math.max(0, Math.min(50, Math.round(quantity)));
      if (q === 0) {
        state.items = state.items.filter((i) => i.id !== id);
      } else {
        item.quantity = q;
      }
    },
    removeItem(state, action) {
      state.items = state.items.filter((i) => i.id !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
    openCart(state) {
      state.isOpen = true;
    },
    closeCart(state) {
      state.isOpen = false;
    },
  },
});

export const {
  hydrate,
  addItem,
  setQuantity,
  removeItem,
  clearCart,
  openCart,
  closeCart,
} = cartSlice.actions;

export const selectItems = (s) => s.cart.items;
export const selectCount = (s) =>
  s.cart.items.reduce((n, i) => n + i.quantity, 0);
export const selectSubtotalCents = (s) =>
  s.cart.items.reduce((n, i) => n + i.price_cents * i.quantity, 0);

export default cartSlice.reducer;
