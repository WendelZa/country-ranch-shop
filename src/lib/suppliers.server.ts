import type { SupplierTestResult } from "./suppliers.types";

export async function testCJ(apiKey: string, email: string | undefined): Promise<SupplierTestResult> {
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

export const ENDPOINTS: Record<string, string> = {
  fforder: "https://api.fforder.com.br/v1/account",
  mixbarato: "https://api.mixbarato.com.br/v1/me",
  dslite: "https://api.dslite.com.br/v1/account",
};

export async function testGenericBearer(slug: string, token: string, url: string): Promise<SupplierTestResult> {
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    if (res.ok) {
      return { slug, ok: true, status: "connected", message: "Conectado com sucesso ao fornecedor." };
    }
    if (res.status === 401 || res.status === 403) {
      return { slug, ok: false, status: "auth_failed", message: `O fornecedor recusou a credencial (HTTP ${res.status}). Verifique o valor do segredo.` };
    }
    return { slug, ok: false, status: "unreachable", message: `Fornecedor respondeu HTTP ${res.status}. Endpoint pode ter mudado.` };
  } catch (e) {
    return { slug, ok: false, status: "unreachable", message: `Não foi possível contatar o fornecedor: ${(e as Error).message}` };
  }
}

