import { Link } from "@tanstack/react-router";
import { brl } from "@/lib/store";
import { ShoppingBag } from "lucide-react";

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  sales_count: number | null;
  stock: number;
};

export function ProductCard({ p }: { p: Product }) {
  const discount = p.compare_at_price && p.compare_at_price > p.price
    ? Math.round((1 - p.price / p.compare_at_price) * 100)
    : 0;

  return (
    <Link
      to="/produto/$slug"
      params={{ slug: p.slug }}
      className="card-rustic group overflow-hidden flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary/40">
            <ShoppingBag className="size-16" />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-wine px-2 py-1 text-[10px] font-bold text-wine-foreground">-{discount}%</span>
        )}
        {p.stock === 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-foreground/80 px-2 py-1 text-[10px] font-bold text-background">Esgotado</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{p.name}</h3>
        <div className="mt-auto pt-2">
          {p.compare_at_price && p.compare_at_price > p.price && (
            <div className="text-xs text-muted-foreground line-through">{brl(p.compare_at_price)}</div>
          )}
          <div className="text-lg font-bold text-primary">{brl(p.price)}</div>
        </div>
      </div>
    </Link>
  );
}
