import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { testSupplierConnection, type SupplierTestResult } from "@/lib/suppliers.functions";
import { toast } from "sonner";
import { Truck, PlugZap, CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/fornecedores")({ component: AdminSuppliers });

function AdminSuppliers() {
  const qc = useQueryClient();
  const test = useServerFn(testSupplierConnection);
  const [results, setResults] = useState<Record<string, SupplierTestResult>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const update = async (id: string, patch: Partial<{ name: string; env_var: string; margin: number; active: boolean }>) => {
    const { error } = await supabase.from("suppliers").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["suppliers"] });
  };

  const runTest = async (slug: string, envVar: string) => {
    setBusy(slug);
    try {
      const r = await test({ data: { slug, envVar } });
      setResults((s) => ({ ...s, [slug]: r }));
      r.ok ? toast.success(r.message) : toast.error(r.message);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-3xl font-bold text-primary flex items-center gap-2"><Truck /> Fornecedores</h1>
      <p className="text-sm text-muted-foreground">
        As chaves reais ficam apenas nos <strong>Segredos do projeto</strong>. Aqui você informa somente o
        <em> nome da variável</em> onde a chave está guardada — nunca a chave em si.
      </p>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando fornecedores…</p>}

      <div className="grid gap-3">
        {suppliers.map((s) => {
          const r = results[s.slug];
          return (
            <div key={s.id} className="card-rustic p-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-[1.2fr_1.2fr_110px_100px_auto] md:items-end">
                <label className="text-sm">Fornecedor
                  <input className={input} value={s.name} onChange={(e) => update(s.id, { name: e.target.value })} />
                </label>
                <label className="text-sm">Variável do segredo
                  <input className={input} value={s.env_var}
                    onChange={(e) => update(s.id, { env_var: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} />
                </label>
                <label className="text-sm">Margem %
                  <input type="number" className={input} value={s.margin}
                    onChange={(e) => update(s.id, { margin: Number(e.target.value) })} />
                </label>
                <label className="text-sm flex items-center gap-2 pb-2">
                  <input type="checkbox" checked={s.active} onChange={(e) => update(s.id, { active: e.target.checked })} /> Ativo
                </label>
                <button onClick={() => runTest(s.slug, s.env_var)} disabled={busy === s.slug} className="btn-outline gap-2 text-sm">
                  {busy === s.slug ? <Loader2 className="size-4 animate-spin" /> : <PlugZap className="size-4" />} Testar
                </button>
              </div>
              {r && (
                <div className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm ${r.ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                  {r.ok ? (r.status === "connected" ? <CheckCircle2 className="size-4 mt-0.5" /> : <AlertTriangle className="size-4 mt-0.5" />) : <XCircle className="size-4 mt-0.5" />}
                  <span>{r.message}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
