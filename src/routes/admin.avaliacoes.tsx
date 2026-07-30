import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star, Check, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/avaliacoes")({ component: AdminReviews });

function AdminReviews() {
  const qc = useQueryClient();
  const { data: reviews = [] } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approve = async (id: string) => {
    const { error } = await supabase.from("reviews").update({ approved: true }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Avaliação publicada"); qc.invalidateQueries({ queryKey: ["admin-reviews"] }); }
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Avaliação removida"); qc.invalidateQueries({ queryKey: ["admin-reviews"] }); }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-serif text-3xl font-bold text-primary flex items-center gap-2"><Star /> Avaliações de clientes</h1>
      {reviews.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma avaliação recebida ainda.</p>}
      <div className="grid gap-3">
        {reviews.map((r) => (
          <div key={r.id} className="card-rustic p-4 flex flex-wrap items-start gap-3">
            {r.photo_url && <img src={r.photo_url} alt={`Foto enviada por ${r.author_name}`} className="size-20 rounded object-cover" />}
            <div className="flex-1 min-w-[200px]">
              <div className="font-medium">{r.author_name} · {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
              <p className="text-sm text-muted-foreground">{r.comment}</p>
              <div className="text-xs mt-1">{r.approved ? "Publicada" : "Aguardando aprovação"}</div>
            </div>
            <div className="flex gap-2">
              {!r.approved && <button onClick={() => approve(r.id)} className="btn-primary gap-1 text-sm"><Check className="size-4" /> Aprovar</button>}
              <button onClick={() => remove(r.id)} className="btn-outline gap-1 text-sm"><Trash2 className="size-4" /> Excluir</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
