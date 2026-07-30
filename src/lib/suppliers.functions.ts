import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Supplier connectivity checks.
 * Credentials are read EXCLUSIVELY from environment secrets — the admin panel
 * only stores the *name* of the variable, never the key itself.
 */

const TestInput = z.object({
  slug: z.string().min(1).max(40),
  envVar: z.string().regex(/^[A-Z][A-Z0-9_]*$/, "Nome de variável inválido").max(64),
  emailEnvVar: z.string().regex(/^[A-Z][A-Z0-9_]*$/).max(64).optional(),
});

export type SupplierTestResult = {
  slug: string;
  ok: boolean;
  status: "connected" | "missing_secret" | "auth_failed" | "unreachable" | "not_supported";
  message: string;
};

async function testCJ(apiKey: string, email: string | undefined): Promise<SupplierTestResult> {
  if (!email) {
    return {
      slug: "cj",
      ok: false,
      status: "missing_secret",
      message: "Falta o e-mail da conta CJ. Cadastre o segredo CJ_EMAIL.",
    };
  }
  try {
    const res = await fetch(
      "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: apiKey }),
      },
    );
    const json = (await res.json().catch(() => null)) as { result?: boolean; message?: string } | null;
    if (res.ok && json?.result) {
      return { slug: "cj", ok: true, status: "connected", message: "Conectado com sucesso à CJ Dropshipping." };
    }
    return {
      slug: "cj",
      ok: false,
      status: "auth_failed",
      message: `CJ recusou as credenciais (HTTP ${res.status}): ${json?.message ?? "resposta inválida"}.`,
    };
  } catch (e) {
    return {
      slug: "cj",
      ok: false,
      status: "unreachable",
      message: `Não foi possível contatar a CJ: ${(e as Error).message}`,
    };
  }
}

export const testSupplierConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TestInput.parse(input))
  .handler(async ({ data, context }): Promise<SupplierTestResult> => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Acesso restrito ao administrador.");

    const key = process.env[data.envVar];
    if (!key) {
      return {
        slug: data.slug,
        ok: false,
        status: "missing_secret",
        message: `A variável ${data.envVar} não está cadastrada nos segredos do projeto. Cadastre-a para conectar.`,
      };
    }

    if (data.slug === "cj") {
      return testCJ(key, data.emailEnvVar ? process.env[data.emailEnvVar] : process.env.CJ_EMAIL);
    }

    return {
      slug: data.slug,
      ok: true,
      status: "not_supported",
      message:
        `Chave ${data.envVar} encontrada e válida no cofre. Este fornecedor ainda não publica uma API pública ` +
        `de integração — assim que você tiver o endpoint/documentação oficial, ativamos a sincronização automática.`,
    };
  });
