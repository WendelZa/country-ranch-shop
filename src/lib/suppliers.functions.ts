import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { SupplierTestResult } from "./suppliers.types";
import { testCJ, testGenericBearer, ENDPOINTS } from "./suppliers.server";
export type { SupplierTestResult };

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
      return testCJ(
        key,
        (data.emailEnvVar ? process.env[data.emailEnvVar] : undefined) ??
          process.env.CJ_DROPSHIPPING_EMAIL ??
          process.env.CJ_EMAIL,
      );
    }

    if (data.slug === "fforder" || data.slug === "mixbarato" || data.slug === "dslite") {
      return testGenericBearer(data.slug, key, ENDPOINTS[data.slug]);
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
