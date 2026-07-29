import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreditCard, QrCode, Truck, Save } from "lucide-react";

export const Route = createFileRoute("/admin/integracoes")({ component: AdminIntegrations });

function AdminIntegrations() {
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await supabase.from("store_settings").select("*").eq("id", 1).single()).data,
  });
  const [pix, setPix] = useState("");
  const [card, setCard] = useState({ enabled: false, gateway: "mercadopago" });
  const [shipping, setShipping] = useState({ correios: true, transportadora: false, free_over: 299, base: 29.9 });

  useEffect(() => {
    if (data) {
      setPix(data.pix_key ?? "");
      setShipping((s) => ({ ...s, free_over: Number(data.free_shipping_over ?? 299), base: Number(data.base_shipping ?? 29.9) }));
    }
    const saved = localStorage.getItem("rs-integrations");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setCard(p.card ?? card);
        setShipping((s) => ({ ...s, ...(p.shipping ?? {}) }));
      } catch {}
    }
  }, [data]);

  const save = async () => {
    localStorage.setItem("rs-integrations", JSON.stringify({ card, shipping }));
    const { error } = await supabase.from("store_settings").update({
      pix_key: pix,
      free_shipping_over: shipping.free_over,
      base_shipping: shipping.base,
    }).eq("id", 1);
    if (error) toast.error(error.message); else toast.success("Integrações salvas");
  };

  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";
  const card_ = "card-rustic p-5 space-y-3";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-primary">Integrações</h1>
        <button onClick={save} className="btn-primary gap-2"><Save className="size-4" /> Salvar</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={card_}>
          <div className="flex items-center gap-2 text-primary"><QrCode className="size-5" /><h2 className="font-serif text-xl">Pix</h2></div>
          <label className="block text-sm">Chave Pix<input className={input} value={pix} onChange={(e) => setPix(e.target.value)} /></label>
        </div>
        <div className={card_}>
          <div className="flex items-center gap-2 text-primary"><CreditCard className="size-5" /><h2 className="font-serif text-xl">Cartão de crédito</h2></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={card.enabled} onChange={(e) => setCard({ ...card, enabled: e.target.checked })} /> Ativar pagamento com cartão</label>
          <label className="block text-sm">Gateway
            <select className={input} value={card.gateway} onChange={(e) => setCard({ ...card, gateway: e.target.value })}>
              <option value="mercadopago">Mercado Pago</option>
              <option value="pagseguro">PagSeguro</option>
              <option value="stripe">Stripe</option>
            </select>
          </label>
          <p className="text-xs text-muted-foreground">Adicione as credenciais do gateway nos Segredos do projeto.</p>
        </div>
        <div className={card_}>
          <div className="flex items-center gap-2 text-primary"><Truck className="size-5" /><h2 className="font-serif text-xl">Frete</h2></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={shipping.correios} onChange={(e) => setShipping({ ...shipping, correios: e.target.checked })} /> Correios (PAC/SEDEX)</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={shipping.transportadora} onChange={(e) => setShipping({ ...shipping, transportadora: e.target.checked })} /> Transportadora parceira</label>
          <label className="block text-sm">Frete grátis acima de R$<input type="number" step="0.01" className={input} value={shipping.free_over} onChange={(e) => setShipping({ ...shipping, free_over: Number(e.target.value) })} /></label>
          <label className="block text-sm">Frete base R$<input type="number" step="0.01" className={input} value={shipping.base} onChange={(e) => setShipping({ ...shipping, base: Number(e.target.value) })} /></label>
        </div>
      </div>
    </div>
  );
}
