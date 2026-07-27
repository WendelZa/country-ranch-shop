import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/store";
import { Package, ShoppingBag, DollarSign, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, orders, allOrders] = await Promise.all([
        supabase.from("products").select("id, stock", { count: "exact", head: false }),
        supabase.from("orders").select("total, status, created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("orders").select("total, status"),
      ]);
      const revenue = (allOrders.data ?? []).filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
      const outOfStock = (products.data ?? []).filter((p) => p.stock === 0).length;
      return {
        totalProducts: products.data?.length ?? 0,
        outOfStock,
        totalOrders: allOrders.data?.length ?? 0,
        revenue,
        recent: orders.data ?? [],
      };
    },
  });

  const cards = [
    { label: "Faturamento total", value: brl(stats?.revenue ?? 0), icon: DollarSign },
    { label: "Pedidos", value: stats?.totalOrders ?? 0, icon: ShoppingBag },
    { label: "Produtos ativos", value: stats?.totalProducts ?? 0, icon: Package },
    { label: "Sem estoque", value: stats?.outOfStock ?? 0, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-bold text-primary">Visão geral</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card-rustic p-5">
            <div className="flex items-center justify-between text-muted-foreground text-sm"><span>{c.label}</span><c.icon className="size-4" /></div>
            <div className="mt-2 font-serif text-2xl font-bold text-primary">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="card-rustic p-5">
        <h2 className="font-serif text-xl mb-3">Pedidos recentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground border-b border-border">
              <tr><th className="py-2">Data</th><th>Status</th><th className="text-right">Total</th></tr>
            </thead>
            <tbody>
              {(stats?.recent ?? []).slice(0, 10).map((o, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2">{o.created_at ? new Date(o.created_at).toLocaleDateString("pt-BR") : "-"}</td>
                  <td><span className="chip">{o.status}</span></td>
                  <td className="text-right font-semibold">{brl(Number(o.total))}</td>
                </tr>
              ))}
              {(stats?.recent ?? []).length === 0 && <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">Nenhum pedido ainda.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
