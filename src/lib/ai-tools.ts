/**
 * Motor interno de gestão (uso exclusivo do painel SuperAdmin).
 * Nada aqui é exibido para o cliente final.
 */

export const NICHE_KEYWORDS = [
  "bota", "botina", "coturno", "chapéu", "chapeu", "country", "sertanejo", "sertaneja",
  "peão", "peao", "rodeio", "cowboy", "cowgirl", "couro", "fivela", "cinto", "laço", "laco",
  "camisa xadrez", "jeans", "colete", "bandana", "espora", "sela", "rancho", "fazenda",
  "americana", "western", "boiadeiro", "kit", "presente",
];

export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Verdadeiro quando o item pertence ao nicho country/sertanejo. */
export function isNicheProduct(name: string, description?: string | null) {
  const hay = normalize(`${name} ${description ?? ""}`);
  return NICHE_KEYWORDS.some((k) => hay.includes(normalize(k)));
}

/** Similaridade simples por tokens (0 a 1) para achar duplicatas. */
export function similarity(a: string, b: string) {
  const A = new Set(normalize(a).split(" ").filter((w) => w.length > 2));
  const B = new Set(normalize(b).split(" ").filter((w) => w.length > 2));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((w) => { if (B.has(w)) inter++; });
  return inter / Math.min(A.size, B.size);
}

export type Duplicate = { a: string; b: string; score: number };

export function findDuplicates(items: { id: string; name: string; slug: string }[], threshold = 0.8): Duplicate[] {
  const out: Duplicate[] = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const score = items[i].slug === items[j].slug ? 1 : similarity(items[i].name, items[j].name);
      if (score >= threshold) out.push({ a: items[i].name, b: items[j].name, score });
    }
  }
  return out.sort((x, y) => y.score - x.score);
}

/** Preço final = (custo + frete) * (1 + margem). Nunca abaixo do custo. */
export function priceWithMargin(cost: number, freight: number, marginPercent: number) {
  const base = Math.max(0, cost) + Math.max(0, freight);
  const price = base * (1 + Math.max(0, marginPercent) / 100);
  const rounded = Math.max(base, Math.ceil(price * 100) / 100);
  return {
    base,
    price: Number(rounded.toFixed(2)),
    profit: Number((rounded - base).toFixed(2)),
  };
}

/** Datas fortes do calendário sertanejo para alertas de oportunidade. */
export const SEASON_EVENTS: { month: number; label: string }[] = [
  { month: 5, label: "Festas Juninas" },
  { month: 6, label: "Festas Juninas / Arraiá" },
  { month: 7, label: "Jaguariúna Rodeo Festival" },
  { month: 8, label: "Festa do Peão de Barretos" },
  { month: 9, label: "Dia das Crianças" },
  { month: 10, label: "Black Friday (pré-venda)" },
  { month: 11, label: "Natal e Kits Presente" },
];

export function seasonAlert(now = new Date()) {
  const next = SEASON_EVENTS.find((e) => e.month >= now.getMonth()) ?? SEASON_EVENTS[0];
  return next;
}
