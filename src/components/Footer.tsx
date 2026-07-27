import { Link } from "@tanstack/react-router";
import { Shield, Truck, RotateCcw, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="grid size-10 place-items-center rounded-full bg-accent text-accent-foreground font-serif text-lg">R</div>
              <div>
                <div className="font-serif text-xl font-bold">Rancho Sertanejo</div>
                <div className="text-[10px] uppercase tracking-widest opacity-70">Estilo country autêntico</div>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm opacity-80">
              A maior loja de moda e acessórios country/sertanejo do Brasil. Peças autênticas,
              entrega rápida e garantia total.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-lg mb-3">Institucional</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li><Link to="/politicas/privacidade">Política de Privacidade</Link></li>
              <li><Link to="/politicas/trocas">Trocas & Devoluções</Link></li>
              <li><Link to="/politicas/entrega">Prazo de Entrega</Link></li>
              <li><Link to="/politicas/contato">Fale Conosco</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-lg mb-3">Segurança</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li className="flex items-center gap-2"><Shield className="size-4" /> Site 100% seguro</li>
              <li className="flex items-center gap-2"><Truck className="size-4" /> Envio em até 3 dias</li>
              <li className="flex items-center gap-2"><RotateCcw className="size-4" /> Garantia de 7 dias</li>
              <li className="flex items-center gap-2"><Phone className="size-4" /> Suporte especializado</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-primary-foreground/20 pt-6 text-center text-xs opacity-70">
          © {new Date().getFullYear()} Rancho Sertanejo — Todos os direitos reservados
        </div>
      </div>
    </footer>
  );
}
