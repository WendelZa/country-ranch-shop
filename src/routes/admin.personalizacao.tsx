import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Palette, Save, Upload, Trash2, Type } from "lucide-react";
import { FONT_OPTIONS, useStoreSettings } from "@/lib/theme";

export const Route = createFileRoute("/admin/personalizacao")({ component: AdminTheme });

const DEFAULTS = {
  font_family: "Playfair Display",
  color_primary: "#5B3A21",
  color_accent: "#C9992B",
  color_background: "#F7F1E6",
  color_foreground: "#2E2118",
};

function AdminTheme() {
  const { data } = useStoreSettings();
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...DEFAULTS, logo_url: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm({
      font_family: data.font_family || DEFAULTS.font_family,
      color_primary: data.color_primary?.startsWith("#") ? data.color_primary : DEFAULTS.color_primary,
      color_accent: data.color_accent?.startsWith("#") ? data.color_accent : DEFAULTS.color_accent,
      color_background: data.color_background?.startsWith("#") ? data.color_background : DEFAULTS.color_background,
      color_foreground: data.color_foreground?.startsWith("#") ? data.color_foreground : DEFAULTS.color_foreground,
      logo_url: data.logo_url || "",
    });
  }, [data]);

  const persist = async (patch: Partial<{ font_family: string; color_primary: string; color_accent: string; color_background: string; color_foreground: string; logo_url: string | null }>) => {
    const { error } = await supabase.from("store_settings").update(patch).eq("id", 1);
    if (error) {
      toast.error(`Não foi possível salvar: ${error.message}`);
      return false;
    }
    await qc.invalidateQueries({ queryKey: ["store-settings"] });
    return true;
  };

  const save = async () => {
    if (await persist(form)) toast.success("Personalização aplicada na loja imediatamente.");
  };

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const path = `logo/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("store-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: signed, error: sErr } = await supabase.storage
        .from("store-assets")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (sErr || !signed) throw sErr ?? new Error("URL não gerada");
      setForm((f) => ({ ...f, logo_url: signed.signedUrl }));
      if (await persist({ logo_url: signed.signedUrl })) toast.success("Logo atualizada.");
    } catch (e) {
      toast.error(`Falha no envio da logo: ${(e as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    setForm((f) => ({ ...f, logo_url: "" }));
    if (await persist({ logo_url: null })) toast.success("Logo removida.");
  };

  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";
  const colorRow = (label: string, key: keyof typeof DEFAULTS) => (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="size-9 cursor-pointer rounded border border-input bg-background"
        />
        <code className="text-xs text-muted-foreground">{form[key]}</code>
      </span>
    </label>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-primary flex items-center gap-2">
          <Palette /> Personalização da Loja
        </h1>
        <button onClick={save} className="btn-primary gap-2"><Save className="size-4" /> Salvar e aplicar</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-rustic p-5 space-y-3">
          <h2 className="font-serif text-xl text-primary flex items-center gap-2"><Type className="size-5" /> Fonte do site</h2>
          <select className={input} value={form.font_family} onChange={(e) => setForm({ ...form, font_family: e.target.value })}>
            {FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <p style={{ fontFamily: `"${form.font_family}", Georgia, serif` }} className="text-2xl">
            Rancho Sertanejo — Seu Estilo, Nossa Paixão
          </p>
        </div>

        <div className="card-rustic p-5 space-y-3">
          <h2 className="font-serif text-xl text-primary flex items-center gap-2"><Upload className="size-5" /> Logo</h2>
          {form.logo_url ? (
            <div className="flex items-center gap-3">
              <img src={form.logo_url} alt="Logo atual da loja" className="h-14 w-auto rounded bg-background object-contain p-1" />
              <button onClick={removeLogo} className="btn-outline gap-2 text-sm"><Trash2 className="size-4" /> Remover</button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma logo enviada — a loja usa o monograma padrão.</p>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }}
            className={input}
          />
          {uploading && <p className="text-xs text-muted-foreground">Enviando…</p>}
        </div>

        <div className="card-rustic p-5 space-y-3 lg:col-span-2">
          <h2 className="font-serif text-xl text-primary">Paleta de cores</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {colorRow("Cor principal (marrom terroso)", "color_primary")}
            {colorRow("Cor de destaque (dourado)", "color_accent")}
            {colorRow("Fundo (bege)", "color_background")}
            {colorRow("Texto", "color_foreground")}
          </div>
          <button
            onClick={() => setForm((f) => ({ ...f, ...DEFAULTS }))}
            className="btn-outline text-sm"
          >
            Restaurar padrão rústico
          </button>
        </div>
      </div>
    </div>
  );
}
