import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { brl } from "@/lib/store";
import { CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pedido/$id")({
  head: () => ({ meta: [{ title: "Pedido confirmado — Rancho Sertanejo" }, { name: "description", content: "Seu pedido foi recebido." }] }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const { data: order } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => (await supabase.from("orders").select("*").eq("id", id).maybeSingle()).data,
  });
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await supabase.from("store_settings").select("*").eq("id", 1).single()).data,
  });

  if (!order) return (<div className="min-h-screen"><Header /><div className="mx-auto max-w-2xl px-4 py-20 text-center text-muted-foreground">Carregando pedido...</div><Footer /></div>);

  const items = order.items as { name: string; price: number; quantity: number; size?: string }[];

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="text-center mb-8">
          <CheckCircle2 className="mx-auto size-16 text-accent" />
          <h1 className="mt-3 font-serif text-3xl md:text-4xl font-bold text-primary">Pedido confirmado!</h1>
          <p className="mt-1 text-muted-foreground">Pedido nº <code className="font-mono">{order.id.slice(0, 8)}</code></p>
        </div>

        {order.payment_method === "pix" && settings?.pix_key && (
          <div className="card-rustic p-5 mb-5">
            <h3 className="font-serif text-xl mb-2">Pague com Pix</h3>
            <p className="text-sm text-muted-foreground mb-3">Copie a chave Pix abaixo e pague no app do seu banco:</p>
            <div className="flex items-center gap-2 rounded-md bg-secondary p-3">
              <code className="flex-1 text-sm font-mono break-all">{settings.pix_key}</code>
              <button onClick={() => { navigator.clipboard.writeText(settings.pix_key!); toast.success("Chave copiada!"); }} className="btn-primary gap-1"><Copy className="size-3" /> Copiar</button>
            </div>
            <p className="mt-3 text-lg font-bold text-primary">Valor: {brl(Number(order.total))}</p>
          </div>
        )}
        {order.payment_method === "boleto" && (
          <div className="card-rustic p-5 mb-5 text-sm">O boleto será enviado para o email <b>{order.customer_email}</b> em até 5 minutos.</div>
        )}
        {order.payment_method === "cartao" && (
          <div className="card-rustic p-5 mb-5 text-sm">Nossa equipe entrará em contato pelo WhatsApp para finalizar o pagamento com cartão em até 10 vezes.</div>
        )}

        <div className="card-rustic p-5 mb-5">
          <h3 className="font-serif text-xl mb-3">Itens</h3>
          <div className="space-y-2 text-sm">
            {items.map((i, idx) => (
              <div key={idx} className="flex justify-between"><span>{i.quantity}× {i.name}{i.size ? ` (${i.size})` : ""}</span><span>{brl(i.price * i.quantity)}</span></div>
            ))}
          </div>
          <div className="mt-4 border-t border-border pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{brl(Number(order.subtotal))}</span></div>
            {Number(order.discount) > 0 && <div className="flex justify-between text-wine"><span>Desconto</span><span>-{brl(Number(order.discount))}</span></div>}
            <div className="flex justify-between"><span>Frete</span><span>{Number(order.shipping) === 0 ? "Grátis" : brl(Number(order.shipping))}</span></div>
            <div className="flex justify-between text-lg font-bold pt-2"><span>Total</span><span className="text-primary">{brl(Number(order.total))}</span></div>
          </div>
        </div>

        <div className="card-rustic p-5 text-sm">
          <h3 className="font-serif text-lg mb-2">Endereço de entrega</h3>
          <p>{order.customer_name} • {order.customer_phone}</p>
          <p>{(order.shipping_address as { address: string }).address}, {(order.shipping_address as { number: string }).number} — {(order.shipping_address as { city: string }).city}/{(order.shipping_address as { state: string }).state}</p>
          <p>CEP {(order.shipping_address as { cep: string }).cep}</p>
        </div>

        <div className="mt-6 text-center"><Link to="/loja" className="btn-primary">Continuar comprando</Link></div>
      </div>
      <Footer />
    </div>
  );
}
