import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/store";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/admin/relatorios")({ component: AdminReports });

function AdminReports() {
  const { data } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const [ordersRes, productsRes] = await Promise.all([
        supabase.from("orders").select("total, status, created_at, items"),
        supabase.from("products").select("id, name, sales_count, stock").order("sales_count", { ascending: false }).limit(10),
      ]);
      const orders = ordersRes.data ?? [];
      const paid = orders.filter((o) => o.status !== "cancelled");
      const revenue = paid.reduce((s, o) => s + Number(o.total), 0);
      const now = new Date();
      const byMonth: Record<string, number> = {};
      for (const o of paid) {
        if (!o.created_at) continue;
        const d = new Date(o.created_at);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        byMonth[k] = (byMonth[k] ?? 0) + Number(o.total);
      }
      return {
        revenue,
        totalOrders: orders.length,
        avgTicket: paid.length ? revenue / paid.length : 0,
        topProducts: productsRes.data ?? [],
        byMonth,
        month: now.toISOString().slice(0, 7),
      };
    },
  });

  const kpi = (label: string, v: string | number) => (
    <div className="card-rustic p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 font-serif text-2xl font-bold text-primary">{v}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-primary flex items-center gap-2"><BarChart3 /> Relatórios</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {kpi("Faturamento total", brl(data?.revenue ?? 0))}
        {kpi("Pedidos", data?.totalOrders ?? 0)}
        {kpi("Ticket médio", brl(data?.avgTicket ?? 0))}
      </div>

      <div className="card-rustic p-5">
        <h2 className="font-serif text-xl mb-3">Faturamento por mês</h2>
        <div className="space-y-2">
          {Object.entries(data?.byMonth ?? {}).sort().map(([k, v]) => (
            <div key={k} className="flex items-center gap-3">
              <div className="w-20 text-sm">{k}</div>
              <div className="flex-1 h-3 rounded bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, (v / (data?.revenue || 1)) * 100)}%` }} />
              </div>
              <div className="w-28 text-right text-sm font-semibold">{brl(v)}</div>
            </div>
          ))}
          {Object.keys(data?.byMonth ?? {}).length === 0 && <p className="text-sm text-muted-foreground">Sem dados ainda.</p>}
        </div>
      </div>

      <div className="card-rustic p-5">
        <h2 className="font-serif text-xl mb-3">Produtos mais vendidos</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground border-b border-border"><tr><th className="py-2">Produto</th><th>Vendas</th><th>Estoque</th></tr></thead>
          <tbody>
            {(data?.topProducts ?? []).map((p) => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="py-2">{p.name}</td>
                <td>{p.sales_count ?? 0}</td>
                <td className={p.stock === 0 ? "text-wine font-bold" : ""}>{p.stock}</td>
              </tr>
            ))}
            {(data?.topProducts ?? []).length === 0 && <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">Sem dados.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
