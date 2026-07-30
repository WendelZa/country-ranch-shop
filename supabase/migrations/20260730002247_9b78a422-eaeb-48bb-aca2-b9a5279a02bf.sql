ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Playfair Display',
  ADD COLUMN IF NOT EXISTS color_primary text DEFAULT '28 40% 24%',
  ADD COLUMN IF NOT EXISTS color_accent text DEFAULT '40 65% 48%',
  ADD COLUMN IF NOT EXISTS color_background text DEFAULT '38 40% 96%',
  ADD COLUMN IF NOT EXISTS color_foreground text DEFAULT '28 30% 16%',
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS delivery_time text DEFAULT '3 a 10 dias úteis';

UPDATE public.store_settings SET profit_margin_percent = 45, free_shipping_over = 199.90 WHERE id = 1;

CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  env_var text NOT NULL,
  margin integer NOT NULL DEFAULT 45,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage suppliers" ON public.suppliers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.suppliers (slug, name, env_var) VALUES
  ('dropi','Dropi','DROPI_API_KEY'),
  ('dslite','DSlite','DSLITE_API_KEY'),
  ('maisque','Mais Que Distribuidora','MAISQUE_API_KEY'),
  ('mixbarato','MixBarato','MIXBARATO_API_KEY'),
  ('cj','CJ Dropshipping BR','CJ_API_KEY')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  photo_url text,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read approved reviews" ON public.reviews FOR SELECT TO anon, authenticated
  USING (approved = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "anyone can submit review" ON public.reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin manage reviews" ON public.reviews FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete reviews" ON public.reviews FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS suppliers_updated_at ON public.suppliers;
CREATE TRIGGER suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "public read store assets" ON storage.objects FOR SELECT USING (bucket_id = 'store-assets');
CREATE POLICY "admin write store assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'store-assets' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update store assets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'store-assets' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete store assets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'store-assets' AND public.has_role(auth.uid(),'admin'));