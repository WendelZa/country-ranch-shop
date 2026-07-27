import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard, type Product } from "@/components/ProductCard";

export const Route = createFileRoute("/categoria/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Rancho Sertanejo` },
      { name: "description", content: `Produtos country/sertanejos da categoria ${params.slug.replace(/-/g, " ")}.` },
    ],
  }),
  component: Cat,
});

function Cat() {
  const { slug } = Route.useParams();
  const { data: cat } = useQuery({
    queryKey: ["cat", slug],
    queryFn: async () => (await supabase.from("categories").select("*").eq("slug", slug).maybeSingle()).data,
  });
  const { data: products = [] } = useQuery({
    queryKey: ["cat-products", cat?.id],
    enabled: !!cat?.id,
    queryFn: async () => (await supabase.from("products").select("id,slug,name,price,compare_at_price,image_url,sales_count,stock").eq("category_id", cat!.id).eq("active", true).order("sales_count", { ascending: false })).data as Product[] ?? [],
  });

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Início</Link> / <Link to="/loja" className="hover:text-primary">Loja</Link> / <span className="text-foreground">{cat?.name ?? "..."}</span>
        </nav>
        <h1 className="font-serif text-4xl font-bold text-primary mb-6">{cat?.name ?? "..."}</h1>
        {products.length === 0 ? (
          <div className="card-rustic p-10 text-center text-muted-foreground">Nenhum produto nesta categoria.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
