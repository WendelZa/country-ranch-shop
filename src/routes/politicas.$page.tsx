import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/politicas/$page")({
  head: ({ params }) => ({ meta: [{ title: `${params.page} — Rancho Sertanejo` }, { name: "description", content: "Políticas da loja Rancho Sertanejo." }] }),
  component: Policy,
});

const CONTENT: Record<string, { title: string; body: string }> = {
  privacidade: { title: "Política de Privacidade", body: "Respeitamos totalmente sua privacidade. Coletamos apenas os dados necessários para processar seu pedido e entregá-lo com segurança. Seus dados nunca são compartilhados com terceiros para fins comerciais." },
  trocas: { title: "Trocas e Devoluções", body: "Você tem 7 dias corridos após o recebimento para solicitar troca ou devolução, sem burocracia. O produto deve estar sem uso, com etiqueta original. Custos de envio da devolução são gratuitos para defeitos." },
  entrega: { title: "Prazo de Entrega", body: "Enviamos em até 3 dias úteis após confirmação do pagamento. O prazo total varia de 3 a 10 dias úteis conforme região, com rastreio enviado por email/WhatsApp." },
  contato: { title: "Fale Conosco", body: "Nosso atendimento funciona de segunda a sábado, das 9h às 19h. WhatsApp e email: contato@ranchosertanejo.com.br" },
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
        <p className="mt-4 text-foreground/80 leading-relaxed">{c?.body ?? "Conteúdo em construção."}</p>
      </div>
      <Footer />
    </div>
  );
}
