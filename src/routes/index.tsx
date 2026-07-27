import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard, type Product } from "@/components/ProductCard";
import { Truck, ShieldCheck, RotateCcw, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rancho Sertanejo — Moda Country e Sertaneja Autêntica" },
      { name: "description", content: "Botas, chapéus, roupas country e acessórios sertanejos com envio em até 3 dias. Garantia de 7 dias e frete para todo Brasil." },
      { property: "og:title", content: "Rancho Sertanejo — Moda Country e Sertaneja Autêntica" },
      { property: "og:description", content: "A maior loja country do Brasil. Botas, chapéus, roupas e acessórios com garantia total." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: cats = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const { data: featured = [] } = useQuery({
    queryKey: ["featured"],
    queryFn: async () => (await supabase.from("products").select("id,slug,name,price,compare_at_price,image_url,sales_count,stock").eq("active", true).eq("featured", true).limit(8)).data as Product[] ?? [],
  });
  const { data: bestsellers = [] } = useQuery({
    queryKey: ["bestsellers"],
    queryFn: async () => (await supabase.from("products").select("id,slug,name,price,compare_at_price,image_url,sales_count,stock").eq("active", true).order("sales_count", { ascending: false }).limit(8)).data as Product[] ?? [],
  });

  return (
    <div className="min-h-screen">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary via-primary to-wine" />
        <div className="absolute inset-0 -z-10 opacity-15" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, oklch(0.75 0.15 78) 0px, transparent 300px), radial-gradient(circle at 80% 70%, oklch(0.7 0.15 25) 0px, transparent 400px)" }} />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 md:py-24 md:grid-cols-2 items-center">
          <div className="text-primary-foreground">
            <span className="chip bg-accent text-accent-foreground">⭐ Nº 1 em moda country no Brasil</span>
            <h1 className="mt-4 font-serif text-4xl md:text-6xl font-bold leading-tight">
              O autêntico estilo <span className="text-accent">sertanejo</span> chegou até você
            </h1>
            <p className="mt-4 text-lg opacity-90 max-w-lg">
              Botas, chapéus, roupas e acessórios country com qualidade premium. Envio rápido para todo o Brasil.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/loja" className="btn-gold">Ver toda a coleção</Link>
              <Link to="/categoria/$slug" params={{ slug: "botas" }} className="btn-outline text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10">Comprar botas</Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-md text-primary-foreground">
              <div className="text-center"><Truck className="mx-auto size-6 text-accent" /><div className="mt-1 text-xs font-medium">Envio 3 dias</div></div>
              <div className="text-center"><ShieldCheck className="mx-auto size-6 text-accent" /><div className="mt-1 text-xs font-medium">Compra segura</div></div>
              <div className="text-center"><RotateCcw className="mx-auto size-6 text-accent" /><div className="mt-1 text-xs font-medium">7 dias garantia</div></div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="grid grid-cols-2 gap-3">
              {featured.slice(0, 4).map((p) => (
                <div key={p.id} className="aspect-square rounded-2xl border-4 border-accent/30 bg-card shadow-2xl overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center font-serif text-primary/50 text-lg p-4 text-center">{p.name}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary">Nossas categorias</h2>
          <p className="text-muted-foreground mt-2">Encontre tudo do universo country/sertanejo em um só lugar</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cats.map((c) => (
            <Link key={c.id} to="/categoria/$slug" params={{ slug: c.slug }}
              className="card-rustic group flex flex-col items-center justify-center gap-2 p-6 text-center hover:border-accent">
              <div className="grid size-14 place-items-center rounded-full bg-accent/20 text-primary text-2xl font-bold group-hover:bg-accent group-hover:text-accent-foreground transition">
                {c.name.charAt(0)}
              </div>
              <div className="font-semibold text-sm text-foreground">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* BESTSELLERS */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-serif text-3xl font-bold text-primary flex items-center gap-2"><Star className="text-accent" /> Mais vendidos</h2>
            <p className="text-muted-foreground text-sm">Os favoritos dos nossos clientes</p>
          </div>
          <Link to="/loja" className="text-sm font-semibold text-primary hover:text-wine">Ver todos →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {bestsellers.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* GUARANTEES BANNER */}
      <section className="mx-auto max-w-7xl px-4 mt-12">
        <div className="rounded-2xl bg-gradient-to-r from-accent to-gold p-8 text-accent-foreground grid md:grid-cols-3 gap-6 text-center">
          <div><Truck className="mx-auto size-8" /><div className="font-serif text-xl mt-2 font-bold">Envio em até 3 dias úteis</div><div className="text-sm opacity-80">Para todo o Brasil</div></div>
          <div><ShieldCheck className="mx-auto size-8" /><div className="font-serif text-xl mt-2 font-bold">Compra 100% segura</div><div className="text-sm opacity-80">Pix, Cartão e Boleto</div></div>
          <div><RotateCcw className="mx-auto size-8" /><div className="font-serif text-xl mt-2 font-bold">Garantia de 7 dias</div><div className="text-sm opacity-80">Troca sem burocracia</div></div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
