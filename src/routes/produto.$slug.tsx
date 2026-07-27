import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { brl, useCart } from "@/lib/store";
import { useState } from "react";
import { ShoppingCart, Truck, Shield, RotateCcw, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/produto/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Rancho Sertanejo` },
      { name: "description", content: "Detalhes do produto country/sertanejo com envio em 3 dias." },
    ],
  }),
  component: Product,
});

function Product() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const add = useCart((s) => s.add);
  const [size, setSize] = useState<string | undefined>();
  const [qty, setQty] = useState(1);

  const { data: p, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => (await supabase.from("products").select("*, categories(name,slug)").eq("slug", slug).eq("active", true).maybeSingle()).data,
  });

  if (isLoading) return (<div className="min-h-screen"><Header /><div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">Carregando...</div><Footer /></div>);
  if (!p) return (<div className="min-h-screen"><Header /><div className="mx-auto max-w-7xl px-4 py-20 text-center"><h1 className="font-serif text-3xl">Produto não encontrado</h1><Link to="/loja" className="btn-primary mt-4 inline-flex">Voltar à loja</Link></div><Footer /></div>);

  const sizes = (p.sizes as string[]) ?? [];
  const needSize = sizes.length > 0;
  const discount = p.compare_at_price && p.compare_at_price > p.price ? Math.round((1 - p.price / p.compare_at_price) * 100) : 0;

  const handleAdd = (goCheckout = false) => {
    if (needSize && !size) { toast.error("Selecione um tamanho"); return; }
    if (p.stock === 0) { toast.error("Produto esgotado"); return; }
    add({ id: p.id, slug: p.slug, name: p.name, price: Number(p.price), image_url: p.image_url, size }, qty);
    toast.success("Adicionado ao carrinho!");
    if (goCheckout) router.navigate({ to: "/checkout" });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Início</Link> / <Link to="/loja" className="hover:text-primary">Loja</Link>
          {p.categories && <> / <Link to="/categoria/$slug" params={{ slug: (p.categories as { slug: string }).slug }} className="hover:text-primary">{(p.categories as { name: string }).name}</Link></>}
        </nav>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="card-rustic overflow-hidden aspect-square bg-secondary flex items-center justify-center">
            {p.image_url ? <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" /> : <ShoppingBag className="size-32 text-primary/30" />}
          </div>

          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-primary">{p.name}</h1>
            <div className="mt-2 text-sm text-muted-foreground">⭐⭐⭐⭐⭐ ({p.sales_count} vendas)</div>

            <div className="mt-4 flex items-baseline gap-3">
              {p.compare_at_price && p.compare_at_price > p.price && <span className="text-lg text-muted-foreground line-through">{brl(Number(p.compare_at_price))}</span>}
              <span className="text-4xl font-bold text-primary">{brl(Number(p.price))}</span>
              {discount > 0 && <span className="chip bg-wine text-wine-foreground">-{discount}%</span>}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">ou 10x de {brl(Number(p.price) / 10)} sem juros</div>

            <p className="mt-6 text-foreground/80 leading-relaxed">{p.description}</p>

            {needSize && (
              <div className="mt-6">
                <div className="text-sm font-semibold mb-2">Tamanho:</div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s) => (
                    <button key={s} onClick={() => setSize(s)}
                      className={`min-w-11 rounded-md border px-3 py-2 text-sm font-medium transition ${size === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <div className="flex items-center rounded-md border border-border">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2">-</button>
                <div className="w-10 text-center">{qty}</div>
                <button onClick={() => setQty(qty + 1)} className="px-3 py-2">+</button>
              </div>
              <div className="text-sm text-muted-foreground">{p.stock} em estoque</div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button onClick={() => handleAdd(true)} className="btn-gold flex-1">Comprar agora</button>
              <button onClick={() => handleAdd(false)} className="btn-primary flex-1 gap-2"><ShoppingCart className="size-4" /> Adicionar ao carrinho</button>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2 text-center">
              <div className="card-rustic p-3"><Truck className="mx-auto size-5 text-accent" /><div className="mt-1 text-xs font-semibold">Envio 3 dias</div></div>
              <div className="card-rustic p-3"><Shield className="mx-auto size-5 text-accent" /><div className="mt-1 text-xs font-semibold">Compra segura</div></div>
              <div className="card-rustic p-3"><RotateCcw className="mx-auto size-5 text-accent" /><div className="mt-1 text-xs font-semibold">7 dias troca</div></div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
