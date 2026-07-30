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
  const [form, setForm] = useState({
    pix_key: "", profit_margin_percent: 45, free_shipping_over: 199.9, base_shipping: 29.9, whatsapp: "",
    company_name: "", cnpj: "", address: "", contact_email: "", delivery_time: "3 a 10 dias úteis",
  });

  useEffect(() => {
    if (data) setForm({
      pix_key: data.pix_key ?? "", profit_margin_percent: data.profit_margin_percent ?? 45,
      free_shipping_over: Number(data.free_shipping_over ?? 199.9), base_shipping: Number(data.base_shipping ?? 29.9),
      whatsapp: data.whatsapp ?? "",
      company_name: data.company_name ?? "", cnpj: data.cnpj ?? "", address: data.address ?? "",
      contact_email: data.contact_email ?? "", delivery_time: data.delivery_time ?? "3 a 10 dias úteis",
    });
  }, [data]);

  const save = async () => {
    const { error } = await supabase.from("store_settings").update(form).eq("id", 1);
    if (error) toast.error(error.message);
    else { toast.success("Configurações salvas"); qc.invalidateQueries({ queryKey: ["store-settings"] }); }
  };
  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="font-serif text-3xl font-bold text-primary">Configurações da loja</h1>
      <div className="card-rustic p-5 space-y-4">
        <h2 className="font-serif text-xl text-primary">Vendas e entrega</h2>
        <label className="block text-sm">Chave Pix<input className={input} value={form.pix_key} onChange={(e) => setForm({ ...form, pix_key: e.target.value })} /></label>
        <label className="block text-sm">Margem de lucro padrão (%)<input type="number" className={input} value={form.profit_margin_percent} onChange={(e) => setForm({ ...form, profit_margin_percent: Number(e.target.value) })} /></label>
        <label className="block text-sm">Frete grátis acima de (R$)<input type="number" step="0.01" className={input} value={form.free_shipping_over} onChange={(e) => setForm({ ...form, free_shipping_over: Number(e.target.value) })} /></label>
        <label className="block text-sm">Frete base (R$)<input type="number" step="0.01" className={input} value={form.base_shipping} onChange={(e) => setForm({ ...form, base_shipping: Number(e.target.value) })} /></label>
        <label className="block text-sm">Prazo médio de entrega<input className={input} value={form.delivery_time} onChange={(e) => setForm({ ...form, delivery_time: e.target.value })} /></label>
      </div>
      <div className="card-rustic p-5 space-y-4">
        <h2 className="font-serif text-xl text-primary">Dados da empresa (rodapé)</h2>
        <label className="block text-sm">Razão social<input className={input} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></label>
        <label className="block text-sm">CNPJ<input className={input} value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></label>
        <label className="block text-sm">Endereço<input className={input} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
        <label className="block text-sm">E-mail de contato<input className={input} value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></label>
        <label className="block text-sm">WhatsApp<input className={input} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="5511999999999" /></label>
        <button onClick={save} className="btn-primary">Salvar</button>
      </div>
    </div>
  );
}
