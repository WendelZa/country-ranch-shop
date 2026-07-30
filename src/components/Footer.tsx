import { Link } from "@tanstack/react-router";
import { Shield, Truck, RotateCcw, Phone } from "lucide-react";
import { useStoreSettings } from "@/lib/theme";

export function Footer() {
  const { data } = useStoreSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-border/60 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              {data?.logo_url ? (
                <img src={data.logo_url} alt="Rancho Sertanejo" className="h-10 w-auto object-contain" />
              ) : (
                <div className="grid size-10 place-items-center rounded-full bg-accent text-accent-foreground font-serif text-lg">R</div>
              )}
              <div>
                <div className="font-serif text-xl font-bold">Rancho Sertanejo</div>
                <div className="text-[10px] uppercase tracking-widest opacity-70">Estilo country autêntico</div>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm opacity-80">
              Peças selecionadas de moda e acessórios country/sertanejo. Qualidade garantida,
              entrega para todo o Brasil e atendimento que entende você.
            </p>
            <ul className="mt-4 space-y-1 text-sm opacity-80">
              {data?.company_name && <li>{data.company_name}</li>}
              {data?.cnpj && <li>CNPJ: {data.cnpj}</li>}
              {data?.address && <li>{data.address}</li>}
              {data?.whatsapp && <li>WhatsApp: {data.whatsapp}</li>}
              <li>E-mail: {data?.contact_email || "contato@ranchosertanejo.com.br"}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-lg mb-3">Institucional</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li><Link to="/politicas/$page" params={{ page: "sobre" }}>Sobre Nós</Link></li>
              <li><Link to="/politicas/$page" params={{ page: "trocas" }}>Troca e Devolução</Link></li>
              <li><Link to="/politicas/$page" params={{ page: "pagamento" }}>Pagamento e Envio</Link></li>
              <li><Link to="/politicas/$page" params={{ page: "duvidas" }}>Dúvidas Frequentes</Link></li>
              <li><Link to="/politicas/$page" params={{ page: "tamanhos" }}>Guia de Tamanhos</Link></li>
              <li><Link to="/politicas/$page" params={{ page: "privacidade" }}>Política de Privacidade</Link></li>
              <li><Link to="/politicas/$page" params={{ page: "contato" }}>Fale Conosco</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-lg mb-3">Segurança</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li className="flex items-center gap-2"><Shield className="size-4" /> Site 100% seguro</li>
              <li className="flex items-center gap-2"><Truck className="size-4" /> Envio em até 3 dias úteis</li>
              <li className="flex items-center gap-2"><RotateCcw className="size-4" /> Garantia de 7 dias</li>
              <li className="flex items-center gap-2"><Phone className="size-4" /> Suporte especializado</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-primary-foreground/20 pt-6 text-center text-xs opacity-70">
          © {year} {data?.company_name || "Rancho Sertanejo"} — Todos os direitos reservados
        </div>
      </div>
    </footer>
  );
}
