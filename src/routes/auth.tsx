import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
import { getLockStatus, registerFailure, registerSuccess } from "@/lib/login-guard";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — Rancho Sertanejo" }, { name: "description", content: "Acesse sua conta." }] }),
  component: Auth,
});

function Auth() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockInfo, setLockInfo] = useState<{ locked: boolean; minutesLeft: number; remaining: number }>({
    locked: false,
    minutesLeft: 0,
    remaining: 5,
  });

  useEffect(() => {
    setLockInfo(getLockStatus());
    const t = setInterval(() => setLockInfo(getLockStatus()), 30000);
    return () => clearInterval(t);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      const status = getLockStatus();
      if (status.locked) {
        toast.error(`Acesso bloqueado. Tente novamente em ${status.minutesLeft} min.`);
        setLockInfo(status);
        return;
      }
    }
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name }, emailRedirectTo: window.location.origin },
      });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Conta criada! Você já está logado.");
      router.navigate({ to: "/" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        const r = registerFailure();
        setLockInfo({ locked: r.locked, minutesLeft: r.minutesLeft, remaining: r.remaining });
        if (r.locked) {
          toast.error(`Muitas tentativas. Acesso bloqueado por ${r.minutesLeft} minutos.`);
        } else {
          toast.error(`Credenciais inválidas. ${r.remaining} tentativa(s) restante(s).`);
        }
        return;
      }
      registerSuccess();
      toast.success("Bem-vindo!");
      router.navigate({ to: "/" });
    }
  };

  const input = "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-60";
  const isLocked = mode === "login" && lockInfo.locked;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="card-rustic p-6">
          <h1 className="font-serif text-3xl font-bold text-primary text-center">{mode === "login" ? "Entrar" : "Criar conta"}</h1>

          {isLocked && (
            <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Acesso temporariamente bloqueado neste dispositivo por segurança.
              Tente novamente em <strong>{lockInfo.minutesLeft} min</strong>.
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-3">
            {mode === "signup" && (
              <input required placeholder="Nome completo" className={input} value={name} onChange={(e) => setName(e.target.value)} />
            )}
            <input required type="email" placeholder="Email" className={input} disabled={isLocked} value={email} onChange={(e) => setEmail(e.target.value)} />
            <input required type="password" placeholder="Senha" className={input} disabled={isLocked} value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
            <button disabled={loading || isLocked} className="btn-primary w-full">
              {loading ? "Aguarde..." : isLocked ? "Bloqueado" : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          {mode === "login" && !isLocked && lockInfo.remaining < 5 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {lockInfo.remaining} tentativa(s) restante(s) antes de bloqueio temporário.
            </p>
          )}

          <div className="mt-4 text-center text-sm">
            {mode === "login" ? (
              <button onClick={() => setMode("signup")} className="text-primary hover:underline">Não tem conta? Cadastre-se</button>
            ) : (
              <button onClick={() => setMode("login")} className="text-primary hover:underline">Já tem conta? Entre</button>
            )}
          </div>
          <div className="mt-6 text-center"><Link to="/" className="text-xs text-muted-foreground hover:text-primary">← Voltar à loja</Link></div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
