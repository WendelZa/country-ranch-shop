// Dropi integration stub.
// Ready-to-wire server function that will call the Dropi API once
// credentials (DROPI_API_KEY, DROPI_EMAIL) are added via secrets.
// Currently returns a "not configured" response so the UI can render
// gracefully. Wire up the real endpoint when you have API access.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SearchInput = z.object({
  query: z.string().trim().min(1).max(100),
  limit: z.number().int().min(1).max(50).default(20),
});

export const dropiSearchProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SearchInput.parse(input))
  .handler(async ({ data, context }) => {
    // Only admins can trigger imports.
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const apiKey = process.env.DROPI_API_KEY;
    if (!apiKey) {
      return {
        configured: false,
        message: "Dropi ainda não configurado. Adicione DROPI_API_KEY nos segredos.",
        products: [] as Array<{ id: string; name: string; price: number; image: string }>,
      };
    }

    // TODO: replace with the real Dropi endpoint when we have API docs.
    // Example structure:
    // const res = await fetch(`https://api.dropi.com.br/products/search?q=${encodeURIComponent(data.query)}`, {
    //   headers: { Authorization: `Bearer ${apiKey}` },
    // });
    // const json = await res.json();
    return {
      configured: true,
      message: "Integração pronta. Endpoint Dropi ainda não implementado.",
      products: [],
      query: data.query,
      limit: data.limit,
    };
  });
