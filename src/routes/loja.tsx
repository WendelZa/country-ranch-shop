import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard, type Product } from "@/components/ProductCard";
import { useState } from "react";

type Search = { q?: string; sort?: string; min?: number; max?: number; cat?: string };

export const Route = createFileRoute("/loja")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    sort: typeof s.sort === "string" ? s.sort : undefined,
    min: s.min ? Number(s.min) : undefined,
    max: s.max ? Number(s.max) : undefined,
    cat: typeof s.cat === "string" ? s.cat : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Loja completa — Rancho Sertanejo" },
      { name: "description", content: "Explore toda a coleção country/sertanejo: botas, chapéus, roupas e acessórios." },
      { property: "og:title", content: "Loja — Rancho Sertanejo" },
      { property: "og:description", content: "Toda a coleção country em um só lugar." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const search = Route.useSearch();
  const [sort, setSort] = useState(search.sort ?? "sales");
  const [minP, setMinP] = useState<string>(search.min?.toString() ?? "");
  const [maxP, setMaxP] = useState<string>(search.max?.toString() ?? "");

  const { data: cats = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["shop", search.q, sort, minP, maxP, search.cat],
    queryFn: async () => {
      let q = supabase.from("products").select("id,slug,name,price,compare_at_price,image_url,sales_count,stock,category_id").eq("active", true);
      if (search.q) q = q.ilike("name", `%${search.q}%`);
      if (search.cat) {
        const cat = cats.find((c) => c.slug === search.cat);
        if (cat) q = q.eq("category_id", cat.id);
      }
      if (minP) q = q.gte("price", Number(minP));
      if (maxP) q = q.lte("price", Number(maxP));
      if (sort === "price_asc") q = q.order("price", { ascending: true });
      else if (sort === "price_desc") q = q.order("price", { ascending: false });
      else if (sort === "new") q = q.order("created_at", { ascending: false });
      else q = q.order("sales_count", { ascending: false });
      const { data } = await q;
      return (data as Product[]) ?? [];
    },
    enabled: !search.cat || cats.length > 0,
  });

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary mb-2">Nossa Loja</h1>
        <p className="text-muted-foreground mb-6">{products.length} produtos</p>

        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <aside className="card-rustic p-4 h-fit md:sticky md:top-24 space-y-5">
            <div>
              <h3 className="font-semibold mb-2">Categorias</h3>
              <div className="space-y-1">
                <Link to="/loja" className="block text-sm py-1 hover:text-primary">Todas</Link>
                {cats.map((c) => (
                  <Link key={c.id} to="/loja" search={{ cat: c.slug } as never}
                    className={`block text-sm py-1 hover:text-primary ${search.cat === c.slug ? "font-semibold text-primary" : ""}`}>
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Preço</h3>
              <div className="flex gap-2">
                <input value={minP} onChange={(e) => setMinP(e.target.value)} placeholder="Min" className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm" />
                <input value={maxP} onChange={(e) => setMaxP(e.target.value)} placeholder="Max" className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Ordenar por</h3>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm">
                <option value="sales">Mais vendidos</option>
                <option value="new">Novidades</option>
                <option value="price_asc">Menor preço</option>
                <option value="price_desc">Maior preço</option>
              </select>
            </div>
          </aside>

          <div>
            {products.length === 0 ? (
              <div className="card-rustic p-10 text-center text-muted-foreground">Nenhum produto encontrado.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => <ProductCard key={p.id} p={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
