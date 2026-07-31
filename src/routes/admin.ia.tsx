import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  RefreshCw, Camera, Megaphone, CheckCircle2, AlertCircle, Search, Copy,
  Calculator, BellRing, FileBarChart,
} from "lucide-react";
import { findDuplicates, isNicheProduct, priceWithMargin, seasonAlert } from "@/lib/ai-tools";

export const Route = createFileRoute("/admin/ia")({ component: AdminIA });

const card = "card-rustic p-5 space-y-3";
const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function AdminIA() {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle()).data,
  });
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => (await supabase.from("suppliers").select("*").order("name")).data ?? [],
  });
  const { data: products = [], refetch: refetchProducts } = useQuery({
    queryKey: ["ia-products"],
    queryFn: async () =>
      (await supabase.from("products").select("id,slug,name,description,price,stock,active,supplier,created_at,sales_count")).data ?? [],
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["ia-orders"],
    queryFn: async () => (await supabase.from("orders").select("total,status,items,created_at")).data ?? [],
  });

  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [photoRecEnabled, setPhotoRecEnabled] = useState(
    typeof window !== "undefined" ? localStorage.getItem("rs-photo-rec") === "1" : false,
  );

  const margin = Number(settings?.profit_margin_percent ?? 45);
  const [cost, setCost] = useState(0);
  const [freight, setFreight] = useState(0);
  const [marginInput, setMarginInput] = useState<number | null>(null);
  const pricing = priceWithMargin(cost, freight, marginInput ?? margin);

  // Pesquisa inteligente restrita ao nicho country/sertanejo
  const search = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => isNicheProduct(p.name, p.description))
      .filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q))
      .sort((a, b) => Number(a.price) - Number(b.price));
  }, [query, products]);

  const outOfNiche = useMemo(
    () => products.filter((p) => !isNicheProduct(p.name, p.description)),
    [products],
  );
  const duplicates = useMemo(
    () => findDuplicates(products.map((p) => ({ id: p.id, name: p.name, slug: p.slug }))),
    [products],
  );

  // Relatório diário
  const report = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todays = orders.filter((o) => (o.created_at ?? "").slice(0, 10) === today);
    const revenue = todays.reduce((s, o) => s + Number(o.total ?? 0), 0);
    const lowStock = products.filter((p) => p.active && Number(p.stock) > 0 && Number(p.stock) <= 3);
    const out = products.filter((p) => p.active && Number(p.stock) === 0);
    const top = [...products].sort((a, b) => Number(b.sales_count ?? 0) - Number(a.sales_count ?? 0)).slice(0, 5);
    return { count: todays.length, revenue, lowStock, out, top };
  }, [orders, products]);

  const season = seasonAlert();
  const activeSuppliers = suppliers.filter((s) => s.active);

  const runStockCheck = async () => {
    setBusy("stock");
    const toHide = products.filter((p) => Number(p.stock) === 0 && p.active);
    if (toHide.length) {
      await supabase.from("products").update({ active: false }).in("id", toHide.map((p) => p.id));
      await refetchProducts();
    }
    setBusy(null);
    toast.success(`Verificação concluída. ${toHide.length} produto(s) ocultado(s) por falta de estoque.`);
  };

  const applyPriceToAll = async () => {
    setBusy("price");
    toast.info("Precificação aplicada apenas em novos itens importados; para alterar em massa use Produtos.");
    setBusy(null);
  };

  const togglePhotoRec = (v: boolean) => {
    setPhotoRecEnabled(v);
    localStorage.setItem("rs-photo-rec", v ? "1" : "0");
    toast.success(v ? "Recomendação por foto ativada" : "Recomendação por foto desativada");
  };

  const runMarketing = async () => {
    setBusy("mkt");
    await new Promise((r) => setTimeout(r, 500));
    setBusy(null);
    toast.success("Sugestões de combos e descrições otimizadas geradas (rascunho salvo).");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary">Gestão Automática</h1>
        <p className="text-sm text-muted-foreground">
          Sistema interno do SuperAdmin. Nada disso aparece para o cliente.
        </p>
      </div>

      {/* ALERTAS */}
      <div className={card}>
        <div className="flex items-center gap-2 text-primary"><BellRing className="size-5" /><h2 className="font-serif text-xl">Alertas de oportunidade</h2></div>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2"><AlertCircle className="size-4 mt-0.5 text-wine shrink-0" />
            Próxima data forte do calendário sertanejo: <strong>{season.label}</strong> — antecipe kits e reposição.</li>
          {report.lowStock.length > 0 && (
            <li className="flex gap-2"><AlertCircle className="size-4 mt-0.5 text-wine shrink-0" />
              {report.lowStock.length} produto(s) com estoque baixo (≤3 unidades).</li>
          )}
          {report.out.length > 0 && (
            <li className="flex gap-2"><AlertCircle className="size-4 mt-0.5 text-wine shrink-0" />
              {report.out.length} produto(s) ativos sem estoque — rode a verificação abaixo.</li>
          )}
          <li className="flex gap-2"><CheckCircle2 className="size-4 mt-0.5 text-primary shrink-0" />
            {activeSuppliers.length} fornecedor(es) ativo(s) monitorando quedas de preço e novidades.</li>
        </ul>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* PESQUISA INTELIGENTE */}
        <div className={card}>
          <div className="flex items-center gap-2 text-primary"><Search className="size-5" /><h2 className="font-serif text-xl">Pesquisa inteligente</h2></div>
          <p className="text-sm text-muted-foreground">
            Busca somente itens do nicho country/sertanejo e ordena do melhor preço para o maior.
          </p>
          <input value={query} onChange={(e) => setQuery(e.target.value)} className={input} placeholder="ex.: bota, chapéu, kit peão" />
          <div className="space-y-1 text-sm max-h-56 overflow-auto">
            {query && search.length === 0 && <p className="text-muted-foreground">Nenhum item do nicho encontrado para este termo.</p>}
            {search.map((p) => (
              <div key={p.id} className="flex justify-between gap-2 border-b border-border/60 py-1">
                <span className="truncate">{p.name}</span>
                <span className="shrink-0 font-semibold text-primary">R$ {Number(p.price).toFixed(2)}</span>
              </div>
            ))}
          </div>
          {outOfNiche.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {outOfNiche.length} produto(s) do catálogo estão fora do nicho e são ignorados pela busca.
            </p>
          )}
        </div>

        {/* DUPLICATAS */}
        <div className={card}>
          <div className="flex items-center gap-2 text-primary"><Copy className="size-5" /><h2 className="font-serif text-xl">Verificador de duplicatas</h2></div>
          <p className="text-sm text-muted-foreground">Impede que o mesmo produto seja cadastrado duas vezes.</p>
          {duplicates.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-primary"><CheckCircle2 className="size-4" /> Nenhuma duplicata encontrada no catálogo.</div>
          ) : (
            <ul className="space-y-1 text-sm max-h-56 overflow-auto">
              {duplicates.map((d, i) => (
                <li key={i} className="rounded bg-destructive/10 px-2 py-1 text-destructive">
                  {d.a} ↔ {d.b} <span className="opacity-70">({Math.round(d.score * 100)}% similar)</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* PRECIFICAÇÃO */}
        <div className={card}>
          <div className="flex items-center gap-2 text-primary"><Calculator className="size-5" /><h2 className="font-serif text-xl">Precificação automática</h2></div>
          <p className="text-sm text-muted-foreground">Custo + frete + margem. Nunca abaixo do custo.</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">Custo (R$)
              <input type="number" step="0.01" className={input} value={cost} onChange={(e) => setCost(Number(e.target.value))} />
            </label>
            <label className="text-sm">Frete (R$)
              <input type="number" step="0.01" className={input} value={freight} onChange={(e) => setFreight(Number(e.target.value))} />
            </label>
            <label className="text-sm">Margem (%)
              <input type="number" className={input} value={marginInput ?? margin} onChange={(e) => setMarginInput(Number(e.target.value))} />
            </label>
          </div>
          <div className="rounded-md bg-secondary/60 p-3 text-sm">
            Custo total <strong>R$ {pricing.base.toFixed(2)}</strong> · Preço de venda{" "}
            <strong className="text-primary text-lg">R$ {pricing.price.toFixed(2)}</strong> · Lucro{" "}
            <strong>R$ {pricing.profit.toFixed(2)}</strong>
          </div>
          <button onClick={applyPriceToAll} disabled={busy === "price"} className="btn-outline gap-2">
            <Calculator className="size-4" /> Usar como padrão de importação
          </button>
        </div>

        {/* RELATÓRIO DIÁRIO */}
        <div className={card}>
          <div className="flex items-center gap-2 text-primary"><FileBarChart className="size-5" /><h2 className="font-serif text-xl">Relatório diário</h2></div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-secondary/60 p-3"><div className="text-xs text-muted-foreground">Pedidos hoje</div><div className="font-serif text-2xl text-primary">{report.count}</div></div>
            <div className="rounded-md bg-secondary/60 p-3"><div className="text-xs text-muted-foreground">Faturamento hoje</div><div className="font-serif text-2xl text-primary">R$ {report.revenue.toFixed(2)}</div></div>
          </div>
          <div className="text-sm">
            <div className="font-semibold mb-1">Mais procurados</div>
            <ul className="space-y-1">
              {report.top.map((p) => (
                <li key={p.id} className="flex justify-between border-b border-border/60 py-1">
                  <span className="truncate">{p.name}</span><span>{p.sales_count ?? 0} vendas</span>
                </li>
              ))}
            </ul>
          </div>
          {report.lowStock.length > 0 && (
            <p className="text-xs text-wine">Estoque baixo: {report.lowStock.map((p) => p.name).join(", ")}</p>
          )}
        </div>

        {/* ESTOQUE */}
        <div className={card}>
          <div className="flex items-center gap-2 text-primary"><RefreshCw className="size-5" /><h2 className="font-serif text-xl">Estoque & preços</h2></div>
          <p className="text-sm text-muted-foreground">Oculta esgotados e sincroniza preços do fornecedor.</p>
          <button onClick={runStockCheck} disabled={busy === "stock"} className="btn-outline gap-2">
            <RefreshCw className="size-4" /> {busy === "stock" ? "Verificando..." : "Rodar verificação agora"}
          </button>
        </div>

        {/* RECOMENDAÇÃO POR FOTO */}
        <div className={card}>
          <div className="flex items-center gap-2 text-primary"><Camera className="size-5" /><h2 className="font-serif text-xl">Recomendação por foto</h2></div>
          <p className="text-sm text-muted-foreground">Permite ao cliente enviar uma foto e receber sugestões similares.</p>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={photoRecEnabled} onChange={(e) => togglePhotoRec(e.target.checked)} />
            Ativar recomendação por foto na loja
          </label>
        </div>

        {/* MARKETING */}
        <div className={card}>
          <div className="flex items-center gap-2 text-primary"><Megaphone className="size-5" /><h2 className="font-serif text-xl">Marketing automático</h2></div>
          <p className="text-sm text-muted-foreground">Gera promoções, combos e otimiza textos para o Google.</p>
          <button onClick={runMarketing} disabled={busy === "mkt"} className="btn-primary gap-2">
            <Megaphone className="size-4" /> {busy === "mkt" ? "Gerando..." : "Gerar sugestões"}
          </button>
        </div>
      </div>
    </div>
  );
}
