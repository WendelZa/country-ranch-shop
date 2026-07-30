import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/politicas/$page")({
  head: ({ params }) => {
    const c = CONTENT[params.page];
    const title = `${c?.title ?? "Informações"} — Rancho Sertanejo`;
    const description = c?.summary ?? "Informações institucionais da loja Rancho Sertanejo.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: Policy,
});

type Section = { heading?: string; paragraphs?: string[]; bullets?: string[] };
type Page = { title: string; summary: string; sections: Section[] };

const CONTENT: Record<string, Page> = {
  sobre: {
    title: "Sobre Nós",
    summary: "Rancho Sertanejo — Seu Estilo, Nossa Paixão.",
    sections: [
      {
        paragraphs: [
          "Rancho Sertanejo — Seu Estilo, Nossa Paixão.",
          "Nascida do amor pela cultura sertaneja e pelo estilo de vida do campo, oferecemos peças selecionadas, qualidade garantida e visual autêntico.",
          "Trabalhamos com os melhores fornecedores para levar botas, chapéus, roupas e acessórios que combinam tradição, conforto e modernidade.",
          "Compromisso com atendimento que entende você, entrega rápida e transparência. Seja bem-vindo ao seu rancho!",
        ],
      },
    ],
  },
  trocas: {
    title: "Política de Troca e Devolução",
    summary: "7 dias de arrependimento, 90 dias de garantia contra defeitos e troca de tamanho sem burocracia.",
    sections: [
      {
        paragraphs: ["Nossa política segue integralmente o Código de Defesa do Consumidor."],
        bullets: [
          "Arrependimento: 7 dias corridos contados do recebimento, com devolução grátis.",
          "Garantia: 90 dias para defeitos de fabricação.",
          "Troca por tamanho ou modelo: em até 7 dias, com o produto sem uso e com todas as etiquetas.",
          "Não realizamos troca de produtos usados ou danificados por uso indevido.",
          "Atendimento via WhatsApp para orientar todo o processo, do pedido à postagem.",
        ],
      },
    ],
  },
  pagamento: {
    title: "Pagamento e Envio",
    summary: "Pix, cartão em até 6x e boleto. Entrega para todo o Brasil em 3 a 10 dias úteis.",
    sections: [
      {
        heading: "Formas de pagamento",
        bullets: [
          "Pix — confirmação imediata.",
          "Cartão de crédito — em até 6x.",
          "Boleto bancário.",
        ],
      },
      {
        heading: "Envio",
        bullets: [
          "Entrega para todo o Brasil via Correios e transportadoras parceiras.",
          "Prazo de 3 a 10 dias úteis, conforme a região.",
          "Frete grátis para pedidos acima de R$ 199,90.",
          "Código de rastreio enviado automaticamente por WhatsApp e e-mail.",
        ],
      },
    ],
  },
  duvidas: {
    title: "Dúvidas Frequentes",
    summary: "Tamanhos, conservação do couro, rastreio, pagamentos e trocas.",
    sections: [
      {
        heading: "Como escolher o tamanho certo?",
        paragraphs: [
          "Use nosso guia de tamanhos: para botas, meça o pé em centímetros no fim do dia; para chapéus, meça a circunferência da cabeça acima das orelhas; para roupas, compare com uma peça que você já usa.",
        ],
      },
      {
        heading: "Como conservar peças de couro?",
        paragraphs: [
          "Limpe com pano seco, evite sol direto e umidade, e aplique hidratante para couro a cada 2 ou 3 meses. Guarde em local arejado, com forma dentro da bota para manter o formato.",
        ],
      },
      {
        heading: "Como acompanho meu pedido?",
        paragraphs: [
          "Assim que o pagamento é confirmado enviamos o código de rastreio por WhatsApp e e-mail. Você também acompanha tudo em Minha Conta › Meus Pedidos.",
        ],
      },
      {
        heading: "Quais formas de pagamento vocês aceitam?",
        paragraphs: ["Pix (confirmação imediata), cartão de crédito em até 6x e boleto bancário."],
      },
      {
        heading: "E se eu quiser trocar?",
        paragraphs: [
          "Você tem 7 dias corridos após o recebimento para arrependimento com devolução grátis, e 90 dias de garantia para defeitos de fabricação.",
        ],
      },
    ],
  },
  tamanhos: {
    title: "Guia de Tamanhos",
    summary: "Tabelas de medidas para botas, chapéus e roupas.",
    sections: [
      {
        heading: "Botas (numeração BR × comprimento do pé)",
        bullets: ["34 — 22,5 cm", "36 — 23,5 cm", "38 — 24,5 cm", "40 — 26,0 cm", "42 — 27,5 cm", "44 — 28,5 cm"],
      },
      {
        heading: "Chapéus (circunferência da cabeça)",
        bullets: ["P — 55 cm", "M — 57 cm", "G — 59 cm", "GG — 61 cm"],
      },
      {
        heading: "Roupas",
        bullets: [
          "P — busto/tórax 88-92 cm · cintura 72-76 cm",
          "M — busto/tórax 96-100 cm · cintura 80-84 cm",
          "G — busto/tórax 104-108 cm · cintura 88-92 cm",
          "GG — busto/tórax 112-116 cm · cintura 96-100 cm",
        ],
      },
    ],
  },
  privacidade: {
    title: "Política de Privacidade",
    summary: "Coletamos apenas o necessário para processar e entregar seu pedido.",
    sections: [
      {
        paragraphs: [
          "Respeitamos totalmente sua privacidade. Coletamos apenas os dados necessários para processar seu pedido e entregá-lo com segurança.",
          "Seus dados nunca são compartilhados com terceiros para fins comerciais e são armazenados em ambiente criptografado.",
          "Você pode solicitar a exclusão dos seus dados a qualquer momento pelo nosso atendimento.",
        ],
      },
    ],
  },
  entrega: {
    title: "Prazo de Entrega",
    summary: "Envio em até 3 dias úteis e entrega em 3 a 10 dias úteis.",
    sections: [
      {
        bullets: [
          "Envio em até 3 dias úteis após a confirmação do pagamento.",
          "Prazo total de 3 a 10 dias úteis conforme a região.",
          "Rastreio enviado por e-mail e WhatsApp.",
          "Frete grátis acima de R$ 199,90.",
        ],
      },
    ],
  },
  contato: {
    title: "Fale Conosco",
    summary: "Atendimento de segunda a sábado, das 9h às 19h.",
    sections: [
      {
        paragraphs: [
          "Nosso atendimento funciona de segunda a sábado, das 9h às 19h.",
          "E-mail: contato@ranchosertanejo.com.br",
        ],
      },
    ],
  },
};

function Policy() {
  const { page } = Route.useParams();
  const c = CONTENT[page];
  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Link to="/" className="text-sm text-muted-foreground hover:text-primary">← Voltar</Link>
        <h1 className="mt-4 font-serif text-4xl font-bold text-primary">{c?.title ?? "Página"}</h1>
        {!c && <p className="mt-4 text-foreground/80">Conteúdo em construção.</p>}
        {c?.sections.map((s, i) => (
          <section key={i} className="mt-8">
            {s.heading && <h2 className="font-serif text-2xl text-primary">{s.heading}</h2>}
            {s.paragraphs?.map((p, j) => (
              <p key={j} className="mt-3 leading-relaxed text-foreground/80">{p}</p>
            ))}
            {s.bullets && (
              <ul className="mt-3 space-y-2">
                {s.bullets.map((b, j) => (
                  <li key={j} className="flex gap-2 text-foreground/80">
                    <span className="text-accent">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
      <Footer />
    </div>
  );
}
