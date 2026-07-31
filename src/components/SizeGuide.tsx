import { useState } from "react";
import { Ruler } from "lucide-react";

const BOOTS: [string, number][] = [
  ["34", 22.5], ["35", 23.0], ["36", 23.5], ["37", 24.0], ["38", 24.5],
  ["39", 25.2], ["40", 26.0], ["41", 26.8], ["42", 27.5], ["43", 28.0], ["44", 28.5],
];
const HATS: [string, number][] = [["P", 55], ["M", 57], ["G", 59], ["GG", 61]];
const CLOTHES: [string, number][] = [["P", 90], ["M", 98], ["G", 106], ["GG", 114]];

function closest(table: [string, number][], value: number) {
  return table.reduce((best, cur) =>
    Math.abs(cur[1] - value) < Math.abs(best[1] - value) ? cur : best,
  )[0];
}

type Tab = "botas" | "chapeus" | "roupas";

/** Guia de tamanhos interativo: bota, chapéu e vestuário. */
export function SizeGuide() {
  const [tab, setTab] = useState<Tab>("botas");
  const [value, setValue] = useState("");
  const num = Number(value.replace(",", "."));
  const table = tab === "botas" ? BOOTS : tab === "chapeus" ? HATS : CLOTHES;
  const label =
    tab === "botas" ? "Comprimento do pé (cm)"
      : tab === "chapeus" ? "Circunferência da cabeça (cm)"
        : "Busto / tórax (cm)";
  const result = Number.isFinite(num) && num > 0 ? closest(table, num) : null;

  return (
    <div className="card-rustic p-5 space-y-4">
      <h2 className="font-serif text-2xl text-primary flex items-center gap-2">
        <Ruler className="size-5 text-accent" /> Descubra seu tamanho
      </h2>
      <div className="flex flex-wrap gap-2">
        {([["botas", "Botas"], ["chapeus", "Chapéus"], ["roupas", "Roupas"]] as [Tab, string][]).map(([id, name]) => (
          <button
            key={id}
            type="button"
            onClick={() => { setTab(id); setValue(""); }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${tab === id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-muted"}`}
          >
            {name}
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium">
        {label}
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="ex.: 26"
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>

      {result && (
        <div className="rounded-md bg-accent/15 px-4 py-3 text-sm">
          Seu tamanho recomendado é <strong className="font-serif text-lg text-primary">{result}</strong>.
          {tab === "botas" && " Na dúvida entre dois números, prefira o maior."}
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-secondary-foreground">
            <tr><th className="px-3 py-2 text-left">Tamanho</th><th className="px-3 py-2 text-left">Medida (cm)</th></tr>
          </thead>
          <tbody>
            {table.map(([size, cm]) => (
              <tr key={size} className={`border-t border-border ${result === size ? "bg-accent/10 font-semibold" : ""}`}>
                <td className="px-3 py-1.5">{size}</td>
                <td className="px-3 py-1.5">{cm}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Meça o pé no fim do dia, apoiado no chão. Para chapéus, passe a fita acima das orelhas.
      </p>
    </div>
  );
}
