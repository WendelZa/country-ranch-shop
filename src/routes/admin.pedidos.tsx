import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/store";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/admin/pedidos")({ component: AdminOrders });

function AdminOrders() {
  const { data: orders = [], refetch } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase.from("orders").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const [open, setOpen] = useState<string | null>(null);

  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status: status as "pending" | "paid" | "shipped" | "delivered" | "cancelled" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Atualizado"); refetch(); }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-3xl font-bold text-primary">Pedidos</h1>
      <div className="card-rustic overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left"><tr><th className="p-3">Nº</th><th>Cliente</th><th>Data</th><th>Total</th><th>Pagamento</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((o) => (
                <>
                  <tr key={o.id} onClick={() => setOpen(open === o.id ? null : o.id)} className="cursor-pointer border-t border-border hover:bg-muted/50">
                    <td className="p-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                    <td>{o.customer_name}</td>
                    <td>{o.created_at ? new Date(o.created_at).toLocaleDateString("pt-BR") : "-"}</td>
                    <td className="font-semibold">{brl(Number(o.total))}</td>
                    <td className="uppercase text-xs">{o.payment_method}</td>
                    <td>
                      <select value={o.status ?? "pending"} onChange={(e) => update(o.id, e.target.value)} onClick={(e) => e.stopPropagation()} className="rounded border border-input bg-background px-2 py-1 text-xs">
                        <option value="pending">Pendente</option><option value="paid">Pago</option><option value="shipped">Enviado</option><option value="delivered">Entregue</option><option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                  {open === o.id && (
                    <tr><td colSpan={6} className="bg-muted/40 p-4">
                      <div className="grid gap-3 md:grid-cols-2 text-xs">
                        <div><b>Contato:</b> {o.customer_email} • {o.customer_phone}</div>
                        <div><b>Endereço:</b> {JSON.stringify(o.shipping_address)}</div>
                        <div className="md:col-span-2"><b>Itens:</b><ul className="list-disc pl-5">{(o.items as { name: string; quantity: number; price: number; size?: string }[]).map((i, idx) => <li key={idx}>{i.quantity}× {i.name}{i.size ? ` (${i.size})` : ""} — {brl(i.price)}</li>)}</ul></div>
                      </div>
                    </td></tr>
                  )}
                </>
              ))}
              {orders.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nenhum pedido.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
