import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Shield } from "lucide-react";

export const Route = createFileRoute("/admin/usuarios")({ component: AdminUsers });

function AdminUsers() {
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => (await supabase.from("user_roles").select("*")).data ?? [],
  });

  const isAdmin = (uid: string) => roles.some((r) => r.user_id === uid && r.role === "admin");

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-3xl font-bold text-primary flex items-center gap-2"><Users /> Usuários</h1>

      <div className="card-rustic p-4 flex items-start gap-3 text-sm">
        <Shield className="size-5 text-primary shrink-0 mt-0.5" />
        <div>
          <b>Segurança:</b> bloqueio automático após 5 tentativas de login (15 min).
          Confirmação de e-mail e proteção contra senhas vazadas (HIBP) recomendadas.
        </div>
      </div>

      <div className="card-rustic overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Nome</th><th>Telefone</th><th>Cadastro</th><th>Permissão</th></tr></thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 font-medium">{p.full_name || "—"}</td>
                <td>{p.phone || "—"}</td>
                <td className="text-xs">{p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "—"}</td>
                <td>{isAdmin(p.id) ? <span className="chip">Admin</span> : <span className="chip bg-muted text-muted-foreground">Cliente</span>}</td>
              </tr>
            ))}
            {profiles.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Nenhum usuário cadastrado ainda.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Para conceder permissão de admin a outro usuário, insira o registro em <code>user_roles</code> via banco (Cloud).</p>
    </div>
  );
}
