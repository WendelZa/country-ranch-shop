import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { brl, useCart } from "@/lib/store";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Rancho Sertanejo" }, { name: "description", content: "Finalize sua compra com Pix, Cartão ou Boleto." }] }),
  component: Checkout,
});

const schema = z.object({
  name: z.string().trim().min(3, "Nome muito curto").max(120),
  email: z.string().trim().email("Email inválido").max(200),
  phone: z.string().trim().min(10, "Telefone inválido").max(20),
  cep: z.string().trim().min(8, "CEP inválido").max(9),
  address: z.string().trim().min(5).max(200),
  number: z.string().trim().min(1).max(10),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(2),
  payment: z.enum(["pix", "cartao", "boleto"]),
  coupon: z.string().optional(),
});

function Checkout() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);
  const [loading, setLoading] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; percent: number } | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await supabase.from("store_settings").select("*").eq("id", 1).single()).data,
  });

  useEffect(() => { if (items.length === 0) router.navigate({ to: "/carrinho" }); }, [items.length, router]);

  const [form, setForm] = useState<{ name: string; email: string; phone: string; cep: string; address: string; number: string; city: string; state: string; payment: "pix" | "cartao" | "boleto" }>({ name: "", email: "", phone: "", cep: "", address: "", number: "", city: "", state: "", payment: "pix" });

  const shipping = settings && subtotal >= Number(settings.free_shipping_over) ? 0 : Number(settings?.base_shipping ?? 29.9);
  const discount = couponApplied ? subtotal * (couponApplied.percent / 100) : 0;
  const total = Math.max(0, subtotal - discount + shipping);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    const { data } = await supabase.from("coupons").select("*").eq("code", couponInput.trim().toUpperCase()).eq("active", true).maybeSingle();
    if (!data) { toast.error("Cupom inválido"); return; }
    setCouponApplied({ code: data.code, percent: data.discount_percent });
    toast.success(`Cupom ${data.code} aplicado — ${data.discount_percent}% off`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ ...form, coupon: couponApplied?.code });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Verifique os dados"); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("orders").insert({
      user_id: user?.id ?? null,
      customer_name: parsed.data.name,
      customer_email: parsed.data.email,
      customer_phone: parsed.data.phone,
      shipping_address: { cep: parsed.data.cep, address: parsed.data.address, number: parsed.data.number, city: parsed.data.city, state: parsed.data.state },
      items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, size: i.size })),
      subtotal, shipping, discount, total,
      payment_method: parsed.data.payment,
      coupon_code: couponApplied?.code ?? null,
    }).select("id").single();
    setLoading(false);
    if (error || !data) { toast.error("Erro ao criar pedido"); return; }
    clear();
    router.navigate({ to: "/pedido/$id", params: { id: data.id } });
  };

  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-serif text-3xl font-bold text-primary mb-6">Finalizar compra</h1>
        <form onSubmit={submit} className="grid gap-6 md:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="card-rustic p-5">
              <h2 className="font-serif text-xl mb-4">Seus dados</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <input required placeholder="Nome completo" className={`${input} md:col-span-2`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input required type="email" placeholder="Email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <input required placeholder="Telefone/WhatsApp" className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </section>
            <section className="card-rustic p-5">
              <h2 className="font-serif text-xl mb-4">Endereço de entrega</h2>
              <div className="grid gap-3 md:grid-cols-6">
                <input required placeholder="CEP" className={`${input} md:col-span-2`} value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} />
                <input required placeholder="Endereço" className={`${input} md:col-span-3`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                <input required placeholder="Nº" className={input} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
                <input required placeholder="Cidade" className={`${input} md:col-span-4`} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                <input required placeholder="UF" maxLength={2} className={`${input} md:col-span-2`} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
              </div>
            </section>
            <section className="card-rustic p-5">
              <h2 className="font-serif text-xl mb-4">Forma de pagamento</h2>
              <div className="grid gap-2 md:grid-cols-3">
                {(["pix", "cartao", "boleto"] as const).map((p) => (
                  <label key={p} className={`cursor-pointer rounded-md border-2 p-4 text-center font-semibold ${form.payment === p ? "border-primary bg-primary/5" : "border-border"}`}>
                    <input type="radio" name="pay" className="sr-only" checked={form.payment === p} onChange={() => setForm({ ...form, payment: p })} />
                    {p === "pix" ? "PIX (5% off no total)" : p === "cartao" ? "Cartão (até 10x)" : "Boleto"}
                  </label>
                ))}
              </div>
              {form.payment === "pix" && settings?.pix_key && (
                <p className="mt-3 text-xs text-muted-foreground">Após confirmar, a chave Pix será exibida na página do pedido.</p>
              )}
            </section>
          </div>

          <aside className="card-rustic p-5 h-fit md:sticky md:top-24 space-y-3">
            <h3 className="font-serif text-xl">Resumo</h3>
            <div className="space-y-1 text-sm max-h-56 overflow-auto">
              {items.map((i) => (
                <div key={`${i.id}-${i.size ?? ""}`} className="flex justify-between gap-2">
                  <span className="truncate">{i.quantity}× {i.name}{i.size ? ` (${i.size})` : ""}</span>
                  <span>{brl(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 flex gap-2">
              <input placeholder="Cupom" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} className={input} />
              <button type="button" onClick={applyCoupon} className="btn-outline shrink-0">Aplicar</button>
            </div>
            <div className="text-sm flex justify-between"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
            {couponApplied && <div className="text-sm flex justify-between text-wine"><span>Cupom {couponApplied.code}</span><span>-{brl(discount)}</span></div>}
            <div className="text-sm flex justify-between"><span>Frete</span><span>{shipping === 0 ? "Grátis" : brl(shipping)}</span></div>
            <div className="text-lg font-bold flex justify-between border-t border-border pt-3"><span>Total</span><span className="text-primary">{brl(total)}</span></div>
            <button disabled={loading} className="btn-gold w-full">{loading ? "Processando..." : "Finalizar pedido"}</button>
            <p className="text-[11px] text-center text-muted-foreground">Compra 100% segura • Envio em até 3 dias úteis</p>
          </aside>
        </form>
      </div>
      <Footer />
    </div>
  );
}
