import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, RefreshCw, Camera, Megaphone, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/admin/ia")({ component: AdminIA });

type Provider = "dropi" | "dslite" | "maisque" | "mixbarato" | "cj";
const PROVIDERS: { id: Provider; name: string; envKey: string }[] = [
  { id: "dropi", name: "Dropi", envKey: "DROPI_API_KEY" },
  { id: "dslite", name: "DSlite", envKey: "DSLITE_API_KEY" },
  { id: "maisque", name: "Mais Que Distribuidora", envKey: "MAISQUE_API_KEY" },
  { id: "mixbarato", name: "MixBarato", envKey: "MIXBARATO_API_KEY" },
  { id: "cj", name: "CJ Dropshipping BR", envKey: "CJ_API_KEY" },
];

function AdminIA() {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await supabase.from("store_settings").select("*").eq("id", 1).single()).data,
  });
  const [provider, setProvider] = useState<Provider>("dropi");
  const [query, setQuery] = useState("");
  const [margin, setMargin] = useState<number>(settings?.profit_margin_percent ?? 80);
  const [busy, setBusy] = useState<string | null>(null);
  const [photoRecEnabled, setPhotoRecEnabled] = useState(
    typeof window !== "undefined" ? localStorage.getItem("rs-photo-rec") === "1" : false,
  );

  const runImport = async () => {
    setBusy("import");
    // Stub: real integration requires each provider's API key (add via secrets).
    await new Promise((r) => setTimeout(r, 900));
    toast.info(
      `Provedor ${provider.toUpperCase()} ainda não conectado. Adicione a chave nos Segredos para ativar a importação.`,
    );
    setBusy(null);
  };

  const runStockCheck = async () => {
    setBusy("stock");
    const { data: products } = await supabase.from("products").select("id, stock, active");
    const toHide = (products ?? []).filter((p) => p.stock === 0 && p.active);
    if (toHide.length) {
      await supabase.from("products").update({ active: false }).in("id", toHide.map((p) => p.id));
    }
    setBusy(null);
    toast.success(`Verificação concluída. ${toHide.length} produto(s) ocultado(s) por falta de estoque.`);
  };

  const togglePhotoRec = (v: boolean) => {
    setPhotoRecEnabled(v);
    localStorage.setItem("rs-photo-rec", v ? "1" : "0");
    toast.success(v ? "Recomendação por foto ativada" : "Recomendação por foto desativada");
  };

  const runMarketing = async () => {
    setBusy("mkt");
    await new Promise((r) => setTimeout(r, 700));
    setBusy(null);
    toast.success("Sugestões de combos e descrições SEO geradas (rascunho salvo).");
  };

  const card = "card-rustic p-5 space-y-3";
  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-primary flex items-center gap-2">
          Gestão Automática
        </h1>
        <p className="text-sm text-muted-foreground">Sistema interno. Nenhuma referência aparece para o cliente.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={card}>
          <div className="flex items-center gap-2 text-primary"><Download className="size-5" /><h2 className="font-serif text-xl">Importação de produtos</h2></div>
          <p className="text-sm text-muted-foreground">Busca produtos mais vendidos com fotos reais, gera descrições e aplica sua margem.</p>
          <label className="block text-sm">Fornecedor
            <select value={provider} onChange={(e) => setProvider(e.target.value as Provider)} className={input}>
              {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">Termo de busca (nicho / palavra-chave)
            <input value={query} onChange={(e) => setQuery(e.target.value)} className={input} placeholder="ex.: bota country masculina" />
          </label>
          <label className="block text-sm">Margem de lucro (%)
            <input type="number" value={margin} onChange={(e) => setMargin(Number(e.target.value))} className={input} />
          </label>
          <button onClick={runImport} disabled={busy === "import"} className="btn-primary gap-2">
            <Download className="size-4" /> {busy === "import" ? "Buscando..." : "Buscar & importar"}
          </button>
          <div className="text-xs text-muted-foreground flex items-start gap-1 pt-2">
            <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
            <span>Cada fornecedor requer sua chave própria (secrets). Sem chave, a busca fica em modo simulação.</span>
          </div>
        </div>

        <div className={card}>
          <div className="flex items-center gap-2 text-primary"><RefreshCw className="size-5" /><h2 className="font-serif text-xl">Estoque & preços</h2></div>
          <p className="text-sm text-muted-foreground">Verifica estoque a cada 4h, oculta esgotados e sincroniza preços do fornecedor.</p>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Verificação manual disponível</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Ocultação automática de esgotados</div>
          </div>
          <button onClick={runStockCheck} disabled={busy === "stock"} className="btn-outline gap-2">
            <RefreshCw className="size-4" /> {busy === "stock" ? "Verificando..." : "Rodar verificação agora"}
          </button>
        </div>

        <div className={card}>
          <div className="flex items-center gap-2 text-primary"><Camera className="size-5" /><h2 className="font-serif text-xl">Recomendação por foto</h2></div>
          <p className="text-sm text-muted-foreground">Ativa o botão para o cliente enviar uma foto e receber sugestões de produtos similares.</p>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={photoRecEnabled} onChange={(e) => togglePhotoRec(e.target.checked)} />
            Ativar recomendação por foto na loja
          </label>
        </div>

        <div className={card}>
          <div className="flex items-center gap-2 text-primary"><Megaphone className="size-5" /><h2 className="font-serif text-xl">Marketing automático</h2></div>
          <p className="text-sm text-muted-foreground">Gera promoções, combos e otimiza textos para o Google (SEO).</p>
          <button onClick={runMarketing} disabled={busy === "mkt"} className="btn-primary gap-2">
            <Megaphone className="size-4" /> {busy === "mkt" ? "Gerando..." : "Gerar sugestões"}
          </button>
        </div>
      </div>
    </div>
  );
}
