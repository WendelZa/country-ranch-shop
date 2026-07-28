import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import { toast } from "sonner";
import { Package, Heart, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/conta")({
  head: () => ({
    meta: [
      { title: "Minha Conta — Rancho Sertanejo" },
      { name: "description", content: "Seus pedidos, favoritos e dados pessoais." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

type Tab = "pedidos" | "favoritos" | "dados";

function AccountPage() {
  const { user, loading } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pedidos");

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted-foreground">Carregando...</div>
        <Footer />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "pedidos", label: "Meus Pedidos", icon: Package },
    { id: "favoritos", label: "Favoritos", icon: Heart },
    { id: "dados", label: "Dados Pessoais", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-serif text-3xl font-bold text-primary">Minha Conta</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>

        <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-accent/20"
                  }`}
                >
                  <Icon className="size-4" /> {t.label}
                </button>
              );
            })}
          </nav>

          <div className="card-rustic p-6">
            {tab === "pedidos" && <OrdersPanel userId={user.id} />}
            {tab === "favoritos" && <FavoritesPanel />}
            {tab === "dados" && <ProfilePanel userId={user.id} email={user.email ?? ""} />}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function OrdersPanel({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<any[] | null>(null);
  useEffect(() => {
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, [userId]);

  if (!orders) return <p className="text-sm text-muted-foreground">Carregando pedidos...</p>;
  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="mx-auto size-12 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">Você ainda não fez nenhum pedido.</p>
        <Link to="/loja" className="btn-primary mt-4 inline-flex">Ir às compras</Link>
      </div>
    );
  }

  const statusLabel: Record<string, string> = {
    pending: "Aguardando pagamento",
    paid: "Pago",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };
  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    paid: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-3">
      <h2 className="font-serif text-xl font-bold text-primary">Meus Pedidos</h2>
      {orders.map((o) => (
        <Link
          key={o.id}
          to="/pedido/$id"
          params={{ id: o.id }}
          className="block rounded-md border border-border p-4 hover:border-primary transition-colors"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-mono text-muted-foreground">#{o.id.slice(0, 8)}</div>
              <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[o.status] ?? "bg-gray-100 text-gray-800"}`}>
              {statusLabel[o.status] ?? o.status}
            </span>
            <div className="text-lg font-bold text-primary">
              R$ {Number(o.total).toFixed(2).replace(".", ",")}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function FavoritesPanel() {
  const ids = useFavorites((s) => s.ids);
  const toggle = useFavorites((s) => s.toggle);
  const [products, setProducts] = useState<any[] | null>(null);

  const idsKey = useMemo(() => ids.join(","), [ids]);

  useEffect(() => {
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    supabase
      .from("products")
      .select("id, slug, name, price, image_url")
      .in("id", ids)
      .then(({ data }) => setProducts(data ?? []));
  }, [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!products) return <p className="text-sm text-muted-foreground">Carregando favoritos...</p>;
  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <Heart className="mx-auto size-12 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">Nenhum favorito ainda.</p>
        <Link to="/loja" className="btn-primary mt-4 inline-flex">Explorar produtos</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-primary mb-4">Favoritos</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((p) => (
          <div key={p.id} className="flex gap-3 rounded-md border border-border p-3">
            <Link to="/produto/$slug" params={{ slug: p.slug }} className="shrink-0">
              <img src={p.image_url} alt={p.name} className="size-20 rounded object-cover" />
            </Link>
            <div className="flex-1 min-w-0">
              <Link to="/produto/$slug" params={{ slug: p.slug }} className="text-sm font-medium line-clamp-2 hover:text-primary">
                {p.name}
              </Link>
              <div className="text-primary font-bold mt-1">
                R$ {Number(p.price).toFixed(2).replace(".", ",")}
              </div>
              <button
                onClick={() => { toggle(p.id); toast.success("Removido dos favoritos"); }}
                className="text-xs text-muted-foreground hover:text-destructive mt-1"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilePanel({ userId, email }: { userId: string; email: string }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setFullName(data?.full_name ?? "");
        setPhone(data?.phone ?? "");
        setLoading(false);
      });
  }, [userId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId, full_name: fullName, phone });
    setSaving(false);
    if (error) toast.error("Não foi possível salvar.");
    else toast.success("Dados atualizados!");
  };

  const input = "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <form onSubmit={save} className="space-y-4 max-w-md">
      <h2 className="font-serif text-xl font-bold text-primary">Dados Pessoais</h2>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Email</label>
        <input value={email} disabled className={`${input} opacity-70`} />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Nome completo</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={input} />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Telefone / WhatsApp</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className={input} />
      </div>
      <button disabled={saving} className="btn-primary">
        {saving ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
