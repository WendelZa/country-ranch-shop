import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image_url: string | null;
  size?: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (id: string, size?: string) => void;
  setQty: (id: string, size: string | undefined, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

const key = (id: string, size?: string) => `${id}::${size ?? ""}`;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const k = key(item.id, item.size);
          const existing = s.items.find((i) => key(i.id, i.size) === k);
          if (existing) {
            return {
              items: s.items.map((i) =>
                key(i.id, i.size) === k ? { ...i, quantity: i.quantity + qty } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: qty }] };
        }),
      remove: (id, size) =>
        set((s) => ({ items: s.items.filter((i) => key(i.id, i.size) !== key(id, size)) })),
      setQty: (id, size, qty) =>
        set((s) => ({
          items: s.items.map((i) =>
            key(i.id, i.size) === key(id, size) ? { ...i, quantity: Math.max(1, qty) } : i,
          ),
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
      subtotal: () => get().items.reduce((n, i) => n + i.price * i.quantity, 0),
    }),
    { name: "rancho-cart" },
  ),
);

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
