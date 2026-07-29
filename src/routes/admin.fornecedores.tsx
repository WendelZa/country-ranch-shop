import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Truck } from "lucide-react";

export const Route = createFileRoute("/admin/fornecedores")({ component: AdminSuppliers });

type Supplier = { id: string; name: string; api_key: string; email: string; margin: number; active: boolean };
const DEFAULT: Supplier[] = [
  { id: "dropi", name: "Dropi", api_key: "", email: "", margin: 80, active: false },
  { id: "dslite", name: "DSlite", api_key: "", email: "", margin: 80, active: false },
  { id: "maisque", name: "Mais Que Distribuidora", api_key: "", email: "", margin: 80, active: false },
  { id: "mixbarato", name: "MixBarato", api_key: "", email: "", margin: 80, active: false },
  { id: "cj", name: "CJ Dropshipping BR", api_key: "", email: "", margin: 80, active: false },
];

function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(DEFAULT);

  useEffect(() => {
    const saved = localStorage.getItem("rs-suppliers");
    if (saved) {
      try { setSuppliers(JSON.parse(saved)); } catch {}
    }
  }, []);

  const save = () => {
    localStorage.setItem("rs-suppliers", JSON.stringify(suppliers));
    toast.success("Fornecedores salvos. Chaves sensíveis devem ser adicionadas nos Segredos do projeto.");
  };

  const update = (i: number, patch: Partial<Supplier>) => {
    setSuppliers((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  };

  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-primary flex items-center gap-2"><Truck /> Fornecedores</h1>
        <button onClick={save} className="btn-primary gap-2"><Save className="size-4" /> Salvar</button>
      </div>
      <div className="grid gap-3">
        {suppliers.map((s, i) => (
          <div key={s.id} className="card-rustic p-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_100px_80px]">
            <label className="text-sm">Nome<input className={input} value={s.name} onChange={(e) => update(i, { name: e.target.value })} /></label>
            <label className="text-sm">E-mail da conta<input className={input} value={s.email} onChange={(e) => update(i, { email: e.target.value })} /></label>
            <label className="text-sm">API Key (referência)<input className={input} value={s.api_key} onChange={(e) => update(i, { api_key: e.target.value })} placeholder="use Segredos para chave real" /></label>
            <label className="text-sm">Margem %<input type="number" className={input} value={s.margin} onChange={(e) => update(i, { margin: Number(e.target.value) })} /></label>
            <label className="text-sm flex items-end gap-2"><input type="checkbox" checked={s.active} onChange={(e) => update(i, { active: e.target.checked })} /> Ativo</label>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Por segurança, chaves de API reais devem ser cadastradas nos Segredos do projeto (backend). Este painel armazena apenas dados de referência.</p>
    </div>
  );
}
