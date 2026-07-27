import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/config")({ component: AdminConfig });

function AdminConfig() {
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await supabase.from("store_settings").select("*").eq("id", 1).single()).data,
  });
  const [form, setForm] = useState({ pix_key: "", profit_margin_percent: 80, free_shipping_over: 299, base_shipping: 29.9, whatsapp: "" });

  useEffect(() => {
    if (data) setForm({
      pix_key: data.pix_key ?? "", profit_margin_percent: data.profit_margin_percent ?? 80,
      free_shipping_over: Number(data.free_shipping_over ?? 299), base_shipping: Number(data.base_shipping ?? 29.9),
      whatsapp: data.whatsapp ?? "",
    });
  }, [data]);

  const save = async () => {
    const { error } = await supabase.from("store_settings").update(form).eq("id", 1);
    if (error) toast.error(error.message); else toast.success("Configurações salvas");
  };
  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="font-serif text-3xl font-bold text-primary">Configurações da loja</h1>
      <div className="card-rustic p-5 space-y-4">
        <label className="block text-sm">Chave Pix<input className={input} value={form.pix_key} onChange={(e) => setForm({ ...form, pix_key: e.target.value })} /></label>
        <label className="block text-sm">WhatsApp de contato<input className={input} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="5511999999999" /></label>
        <label className="block text-sm">Margem de lucro padrão (%)<input type="number" className={input} value={form.profit_margin_percent} onChange={(e) => setForm({ ...form, profit_margin_percent: Number(e.target.value) })} /></label>
        <label className="block text-sm">Frete grátis acima de (R$)<input type="number" step="0.01" className={input} value={form.free_shipping_over} onChange={(e) => setForm({ ...form, free_shipping_over: Number(e.target.value) })} /></label>
        <label className="block text-sm">Frete base (R$)<input type="number" step="0.01" className={input} value={form.base_shipping} onChange={(e) => setForm({ ...form, base_shipping: Number(e.target.value) })} /></label>
        <button onClick={save} className="btn-primary">Salvar</button>
      </div>
    </div>
  );
}
