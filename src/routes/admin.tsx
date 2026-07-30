import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Package, ShoppingBag, Ticket, Settings as SettingsIcon, LogOut, Store, Sparkles, Truck, Users, BarChart3, Plug, Palette, Star } from "lucide-react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!data) throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const router = useRouter();
  const nav = [
    { to: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
    { to: "/admin/produtos", label: "Produtos", icon: Package },
    { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
    { to: "/admin/cupons", label: "Cupons", icon: Ticket },
    { to: "/admin/ia", label: "Gestão Automática", icon: Sparkles },
    { to: "/admin/fornecedores", label: "Fornecedores", icon: Truck },
    { to: "/admin/integracoes", label: "Integrações", icon: Plug },
    { to: "/admin/personalizacao", label: "Personalização", icon: Palette },
    { to: "/admin/avaliacoes", label: "Avaliações", icon: Star },
    { to: "/admin/usuarios", label: "Usuários", icon: Users },
    { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
    { to: "/admin/config", label: "Configurações", icon: SettingsIcon },
  ];
  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2"><div className="grid size-9 place-items-center rounded-full bg-accent text-accent-foreground font-serif font-bold">R</div><div><div className="font-serif font-bold">Painel Admin</div><div className="text-[10px] opacity-70">Rancho Sertanejo</div></div></Link>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/" className="text-sm inline-flex items-center gap-1 opacity-80 hover:opacity-100"><Store className="size-4" /> Ver loja</Link>
            <button onClick={async () => { await supabase.auth.signOut(); router.navigate({ to: "/" }); }} className="text-sm inline-flex items-center gap-1 opacity-80 hover:opacity-100"><LogOut className="size-4" /> Sair</button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="card-rustic p-3 h-fit md:sticky md:top-6">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: n.exact }}
              activeProps={{ className: "bg-primary text-primary-foreground" }}
              className="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium hover:bg-muted">
              <n.icon className="size-4" /> {n.label}
            </Link>
          ))}
        </aside>
        <main><Outlet /></main>
      </div>
    </div>
  );
}
