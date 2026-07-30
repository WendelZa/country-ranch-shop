import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const FONT_OPTIONS = [
  { label: "Playfair Display (clássica)", value: "Playfair Display" },
  { label: "Bitter (rústica legível)", value: "Bitter" },
  { label: "Merriweather (editorial)", value: "Merriweather" },
  { label: "Lora (elegante)", value: "Lora" },
  { label: "Oswald (impactante)", value: "Oswald" },
  { label: "Rye (western)", value: "Rye" },
  { label: "Montserrat (moderna)", value: "Montserrat" },
];

export type StoreSettings = {
  logo_url: string | null;
  font_family: string | null;
  color_primary: string | null;
  color_accent: string | null;
  color_background: string | null;
  color_foreground: string | null;
  company_name: string | null;
  cnpj: string | null;
  address: string | null;
  contact_email: string | null;
  whatsapp: string | null;
  delivery_time: string | null;
  free_shipping_over: number | null;
  base_shipping: number | null;
};

export function useStoreSettings() {
  return useQuery({
    queryKey: ["store-settings"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
      return (data ?? null) as StoreSettings | null;
    },
  });
}

function toCss(value: string | null | undefined) {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (v.startsWith("#") || v.startsWith("rgb") || v.startsWith("hsl") || v.startsWith("oklch")) return v;
  return `hsl(${v})`;
}

/** Applies the admin-configured font and palette to the public store, live. */
export function useApplyTheme() {
  const { data } = useStoreSettings();

  useEffect(() => {
    if (typeof document === "undefined" || !data) return;
    const root = document.documentElement;

    const map: Array<[string, string | null]> = [
      ["--primary", toCss(data.color_primary)],
      ["--ring", toCss(data.color_accent)],
      ["--accent", toCss(data.color_accent)],
      ["--gold", toCss(data.color_accent)],
      ["--background", toCss(data.color_background)],
      ["--foreground", toCss(data.color_foreground)],
    ];
    for (const [key, value] of map) {
      if (value) root.style.setProperty(key, value);
      else root.style.removeProperty(key);
    }

    const font = data.font_family?.trim();
    if (font) {
      const id = "store-font";
      let link = document.getElementById(id) as HTMLLinkElement | null;
      const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700&display=swap`;
      if (!link) {
        link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
      if (link.href !== href) link.href = href;
      root.style.setProperty("--font-serif", `"${font}", Georgia, serif`);
    }
  }, [data]);
}
