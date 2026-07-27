import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/cupons")({ component: AdminCoupons });

function AdminCoupons() {
  const { data = [], refetch } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => (await supabase.from("coupons").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState(10);

  const add = async () => {
    if (!code) return;
    const { error } = await supabase.from("coupons").insert({ code: code.toUpperCase(), discount_percent: percent });
    if (error) toast.error(error.message); else { toast.success("Criado"); setCode(""); refetch(); }
  };
  const del = async (id: string) => { await supabase.from("coupons").delete().eq("id", id); refetch(); };
  const toggle = async (id: string, v: boolean) => { await supabase.from("coupons").update({ active: v }).eq("id", id); refetch(); };
  const input = "rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-3xl font-bold text-primary">Cupons</h1>
      <div className="card-rustic p-4 flex flex-wrap items-end gap-3">
        <input placeholder="Código" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={input} />
        <input type="number" min={1} max={90} value={percent} onChange={(e) => setPercent(Number(e.target.value))} className={`${input} w-24`} />
        <span className="text-sm text-muted-foreground">%</span>
        <button onClick={add} className="btn-primary gap-1"><Plus className="size-4" /> Adicionar</button>
      </div>
      <div className="card-rustic overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Código</th><th>Desconto</th><th>Ativo</th><th></th></tr></thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 font-mono font-bold">{c.code}</td>
                <td>{c.discount_percent}%</td>
                <td><input type="checkbox" checked={c.active} onChange={(e) => toggle(c.id, e.target.checked)} /></td>
                <td className="text-right pr-3"><button onClick={() => del(c.id)} className="p-1 hover:text-wine"><Trash2 className="size-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
