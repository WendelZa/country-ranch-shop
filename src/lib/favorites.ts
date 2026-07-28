import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type FavState = {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
};

export const useFavorites = create<FavState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id) ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        })),
      has: (id) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
    }),
    { name: "rs-favorites" },
  ),
);

// Avoid SSR/hydration flicker: only report favorite state after mount.
export function useIsFavorite(id: string) {
  const has = useFavorites((s) => s.ids.includes(id));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && has;
}
