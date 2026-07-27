import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/store";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, X } from "lucide-react";

export const Route = createFileRoute("/admin/produtos")({ component: AdminProducts });

type ProductRow = {
  id: string; slug: string; name: string; description: string | null;
  price: number; compare_at_price: number | null; category_id: string | null;
  image_url: string | null; stock: number; active: boolean; featured: boolean;
  sizes: string[] | null;
};

function AdminProducts() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<ProductRow> | null>(null);
  const { data: products = [], refetch } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await supabase.from("products").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: cats = [] } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const del = async (id: string) => {
    if (!confirm("Excluir produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Excluído"); refetch(); }
  };

  const save = async () => {
    if (!editing?.name || !editing?.slug || !editing?.price) { toast.error("Nome, slug e preço obrigatórios"); return; }
    const payload = {
      slug: editing.slug, name: editing.name, description: editing.description ?? "",
      price: Number(editing.price), compare_at_price: editing.compare_at_price ? Number(editing.compare_at_price) : null,
      category_id: editing.category_id ?? null, image_url: editing.image_url ?? null,
      stock: Number(editing.stock ?? 0), active: editing.active ?? true, featured: editing.featured ?? false,
      sizes: typeof editing.sizes === "string" ? (editing.sizes as string).split(",").map((s) => s.trim()).filter(Boolean) : (editing.sizes ?? []),
    };
    const { error } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) toast.error(error.message); else { toast.success("Salvo"); setEditing(null); qc.invalidateQueries({ queryKey: ["admin-products"] }); }
  };

  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-primary">Produtos</h1>
        <button onClick={() => setEditing({ active: true, featured: false, stock: 0, price: 0 })} className="btn-primary gap-1"><Plus className="size-4" /> Novo produto</button>
      </div>

      <div className="card-rustic overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left"><tr><th className="p-3">Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td>{cats.find((c) => c.id === p.category_id)?.name ?? "-"}</td>
                  <td>{brl(Number(p.price))}</td>
                  <td className={p.stock === 0 ? "text-wine font-bold" : ""}>{p.stock}</td>
                  <td>{p.active ? <span className="chip">Ativo</span> : <span className="chip bg-muted text-muted-foreground">Inativo</span>}</td>
                  <td className="text-right pr-3">
                    <button onClick={() => setEditing(p)} className="p-1 hover:text-primary"><Pencil className="size-4" /></button>
                    <button onClick={() => del(p.id)} className="p-1 hover:text-wine"><Trash2 className="size-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div className="card-rustic max-h-[90vh] w-full max-w-2xl overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-2xl">{editing.id ? "Editar" : "Novo"} produto</h2>
              <button onClick={() => setEditing(null)}><X /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="md:col-span-2 text-sm">Nome<input className={input} value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></label>
              <label className="text-sm">Slug (url)<input className={input} value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></label>
              <label className="text-sm">Categoria
                <select className={input} value={editing.category_id ?? ""} onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })}>
                  <option value="">—</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="text-sm">Preço R$<input type="number" step="0.01" className={input} value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></label>
              <label className="text-sm">Preço "de" (opcional)<input type="number" step="0.01" className={input} value={editing.compare_at_price ?? ""} onChange={(e) => setEditing({ ...editing, compare_at_price: e.target.value ? Number(e.target.value) : null })} /></label>
              <label className="text-sm">Estoque<input type="number" className={input} value={editing.stock ?? 0} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} /></label>
              <label className="text-sm">URL da imagem<input className={input} value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://..." /></label>
              <label className="md:col-span-2 text-sm">Tamanhos (separados por vírgula)<input className={input} value={Array.isArray(editing.sizes) ? editing.sizes.join(",") : (editing.sizes as string ?? "")} onChange={(e) => setEditing({ ...editing, sizes: e.target.value as unknown as string[] })} placeholder="P,M,G,GG" /></label>
              <label className="md:col-span-2 text-sm">Descrição<textarea className={input} rows={4} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Ativo</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.featured ?? false} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /> Destaque na home</label>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button onClick={() => setEditing(null)} className="btn-outline">Cancelar</button><button onClick={save} className="btn-primary">Salvar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
