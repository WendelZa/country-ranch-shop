import { Link, useRouter } from "@tanstack/react-router";
import { ShoppingCart, User as UserIcon, Search, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/store";
import { useSession, isAdmin } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const count = useCart((s) => s.count());
  const { user } = useSession();
  const [admin, setAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (user) isAdmin(user.id).then(setAdmin);
    else setAdmin(false);
  }, [user]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.navigate({ to: "/loja", search: { q: q.trim() } as never });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground font-serif text-lg">R</div>
          <div className="hidden sm:block leading-tight">
            <div className="font-serif text-lg font-bold text-primary">Rancho Sertanejo</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Estilo country autêntico</div>
          </div>
        </Link>

        <form onSubmit={submit} className="ml-auto md:ml-6 hidden md:flex flex-1 max-w-xl">
          <div className="flex w-full items-center rounded-full border border-border bg-card px-4">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Busque botas, chapéus, camisas..."
              className="w-full bg-transparent py-2.5 pl-2 text-sm outline-none"
            />
          </div>
        </form>

        <nav className="ml-auto md:ml-0 flex items-center gap-1">
          <Link to="/loja" className="hidden md:inline-flex px-3 py-2 text-sm font-medium hover:text-primary">Loja</Link>
          {admin && (
            <Link to="/admin" className="hidden md:inline-flex px-3 py-2 text-sm font-semibold text-wine">Admin</Link>
          )}
          {user ? (
            <button
              onClick={async () => { await supabase.auth.signOut(); router.navigate({ to: "/" }); }}
              className="hidden md:inline-flex px-3 py-2 text-sm hover:text-primary"
            >Sair</button>
          ) : (
            <Link to="/auth" className="hidden md:inline-flex items-center gap-1 px-3 py-2 text-sm hover:text-primary">
              <UserIcon className="size-4" /> Entrar
            </Link>
          )}
          <Link to="/carrinho" className="relative inline-flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-primary-foreground">
            <ShoppingCart className="size-4" />
            <span className="text-sm font-semibold">{count}</span>
          </Link>
          <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="menu">
            {open ? <X /> : <Menu />}
          </button>
        </nav>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-card px-4 py-3 space-y-2">
          <form onSubmit={submit} className="flex items-center rounded-full border border-border bg-background px-3">
            <Search className="size-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="w-full bg-transparent py-2 pl-2 text-sm outline-none" />
          </form>
          <Link to="/loja" onClick={() => setOpen(false)} className="block py-2 font-medium">Loja</Link>
          {admin && <Link to="/admin" onClick={() => setOpen(false)} className="block py-2 font-semibold text-wine">Painel Admin</Link>}
          {user ? (
            <button onClick={async () => { await supabase.auth.signOut(); setOpen(false); }} className="block py-2 text-left w-full">Sair</button>
          ) : (
            <Link to="/auth" onClick={() => setOpen(false)} className="block py-2">Entrar</Link>
          )}
        </div>
      )}
    </header>
  );
}
