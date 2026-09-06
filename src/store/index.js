import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";

export function makeStore() {
  return configureStore({
    reducer: { cart: cartReducer },
  });
}
