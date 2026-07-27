import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { brl, useCart } from "@/lib/store";
import { Trash2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/carrinho")({
  head: () => ({ meta: [{ title: "Carrinho — Rancho Sertanejo" }, { name: "description", content: "Seu carrinho de compras." }] }),
  component: Cart,
});

function Cart() {
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);
  const setQty = useCart((s) => s.setQty);
  const subtotal = useCart((s) => s.subtotal());

  if (items.length === 0) {
    return (<div className="min-h-screen"><Header /><div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <ShoppingBag className="mx-auto size-16 text-primary/40" />
      <h1 className="mt-4 font-serif text-3xl text-primary">Seu carrinho está vazio</h1>
      <p className="text-muted-foreground mt-2">Que tal dar uma olhada na nossa loja?</p>
      <Link to="/loja" className="btn-primary mt-6 inline-flex">Ver produtos</Link>
    </div><Footer /></div>);
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-serif text-3xl font-bold text-primary mb-6">Meu Carrinho</h1>
        <div className="grid gap-6 md:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {items.map((i) => (
              <div key={`${i.id}-${i.size ?? ""}`} className="card-rustic p-3 flex gap-3">
                <div className="size-24 shrink-0 overflow-hidden rounded bg-secondary">
                  {i.image_url ? <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-primary/40"><ShoppingBag /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to="/produto/$slug" params={{ slug: i.slug }} className="font-semibold text-foreground hover:text-primary line-clamp-2">{i.name}</Link>
                  {i.size && <div className="text-xs text-muted-foreground">Tamanho: {i.size}</div>}
                  <div className="mt-1 font-bold text-primary">{brl(i.price)}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded-md border border-border">
                      <button onClick={() => setQty(i.id, i.size, i.quantity - 1)} className="px-3">-</button>
                      <div className="w-10 text-center text-sm">{i.quantity}</div>
                      <button onClick={() => setQty(i.id, i.size, i.quantity + 1)} className="px-3">+</button>
                    </div>
                    <button onClick={() => remove(i.id, i.size)} className="text-wine hover:opacity-70"><Trash2 className="size-4" /></button>
                  </div>
                </div>
                <div className="font-bold text-primary">{brl(i.price * i.quantity)}</div>
              </div>
            ))}
          </div>
          <aside className="card-rustic p-5 h-fit md:sticky md:top-24">
            <h3 className="font-serif text-xl font-bold mb-4">Resumo</h3>
            <div className="flex justify-between text-sm py-2"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
            <div className="flex justify-between text-sm py-2 text-muted-foreground"><span>Frete</span><span>Calculado no checkout</span></div>
            <div className="mt-3 border-t border-border pt-3 flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary">{brl(subtotal)}</span></div>
            <Link to="/checkout" className="btn-gold mt-4 w-full">Finalizar compra</Link>
            <Link to="/loja" className="btn-outline mt-2 w-full">Continuar comprando</Link>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
