-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TYPE public.order_status AS ENUM ('pending','paid','shipped','delivered','cancelled');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid()=id);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid()=id);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid()=id);

-- USER ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid()=user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  icon text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price numeric(10,2),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url text,
  images jsonb DEFAULT '[]'::jsonb,
  sizes jsonb DEFAULT '[]'::jsonb,
  stock int DEFAULT 0,
  active boolean DEFAULT true,
  featured boolean DEFAULT false,
  sales_count int DEFAULT 0,
  supplier text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON public.products(category_id);
CREATE INDEX ON public.products(active);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active products" ON public.products FOR SELECT TO anon, authenticated USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- COUPONS
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percent int NOT NULL CHECK (discount_percent BETWEEN 1 AND 90),
  active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active coupons" ON public.coupons FOR SELECT TO anon, authenticated USING (active = true);
CREATE POLICY "admin manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ORDERS
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  shipping_address jsonb NOT NULL,
  items jsonb NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  shipping numeric(10,2) DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL,
  payment_method text NOT NULL,
  status order_status DEFAULT 'pending',
  coupon_code text,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can create order" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "read own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- SETTINGS
CREATE TABLE public.store_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id=1),
  pix_key text,
  profit_margin_percent int DEFAULT 80,
  free_shipping_over numeric(10,2) DEFAULT 299,
  base_shipping numeric(10,2) DEFAULT 29.90,
  whatsapp text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.store_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin write settings" ON public.store_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.store_settings (id, pix_key, whatsapp) VALUES (1, 'contato@ranchosertanejo.com.br', '5511999999999');

-- SEED CATEGORIES
INSERT INTO public.categories (slug, name, icon, sort_order) VALUES
  ('botas','Botas','Boot',1),
  ('roupas-masculinas','Roupas Masculinas','Shirt',2),
  ('roupas-femininas','Roupas Femininas','Sparkles',3),
  ('chapeus','Chapéus','HardHat',4),
  ('cintos','Cintos','Ribbon',5),
  ('acessorios','Acessórios','Star',6),
  ('decoracao','Decoração','Home',7),
  ('kits-presente','Kits Presente','Gift',8);

-- SEED PRODUCTS (all rows with same column set)
INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'bota-texana-classica-marrom','Bota Texana Clássica Marrom','Bota texana de couro legítimo com bordado artesanal. Solado antiderrapante e conforto premium para o dia todo.',699.90,899.90,id,25,true,340,'["37","38","39","40","41","42","43","44"]'::jsonb FROM public.categories WHERE slug='botas';
INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'bota-country-preta-bordada','Bota Country Preta Bordada','Estilo autêntico country. Couro premium, bordados exclusivos e acabamento impecável.',749.90,999.00,id,18,true,289,'["36","37","38","39","40","41","42"]'::jsonb FROM public.categories WHERE slug='botas';
INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'bota-feminina-caramelo','Bota Feminina Caramelo Salto','Feminina, elegante e resistente. Salto anatômico e couro macio.',589.90,NULL,id,22,false,201,'["34","35","36","37","38","39"]'::jsonb FROM public.categories WHERE slug='botas';

INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'camisa-xadrez-classica','Camisa Xadrez Country Manga Longa','100% algodão, corte tradicional country. Perfeita para cavalgadas e festas sertanejas.',179.90,229.90,id,45,true,512,'["P","M","G","GG","XG"]'::jsonb FROM public.categories WHERE slug='roupas-masculinas';
INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'calca-jeans-country-masculina','Calça Jeans Country Masculina','Modelagem country autêntica, tecido resistente e reforçado. Ideal para o dia a dia no campo ou na cidade.',249.90,NULL,id,60,true,478,'["38","40","42","44","46","48"]'::jsonb FROM public.categories WHERE slug='roupas-masculinas';
INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'camisa-manga-curta-bordada','Camisa Manga Curta Bordada Peão','Camisa country masculina bordada com estilo peão. Tecido leve para o calor.',159.90,NULL,id,38,false,167,'["P","M","G","GG"]'::jsonb FROM public.categories WHERE slug='roupas-masculinas';

INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'vestido-country-floral','Vestido Country Floral Longo','Vestido country feminino floral, tecido fluido e caimento perfeito. Peça exclusiva.',289.90,349.90,id,28,true,398,'["P","M","G","GG"]'::jsonb FROM public.categories WHERE slug='roupas-femininas';
INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'short-jeans-cowgirl','Short Jeans Cowgirl Cintura Alta','Modelagem cintura alta que valoriza a silhueta. Tecido premium.',159.90,NULL,id,55,true,321,'["36","38","40","42","44"]'::jsonb FROM public.categories WHERE slug='roupas-femininas';
INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'blusa-country-bordada-fem','Blusa Country Bordada Feminina','Bordados artesanais, tecido macio e caimento perfeito.',189.90,NULL,id,40,false,245,'["P","M","G","GG"]'::jsonb FROM public.categories WHERE slug='roupas-femininas';

INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'chapeu-cowboy-feltro-marrom','Chapéu Cowboy Feltro Premium Marrom','Chapéu tradicional em feltro de lã premium. Aba clássica, acabamento impecável.',329.90,399.90,id,32,true,289,'[]'::jsonb FROM public.categories WHERE slug='chapeus';
INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'chapeu-palha-verao','Chapéu de Palha Country Verão','Leve e resistente, ideal para dias de sol. Aba larga e conforto.',149.90,NULL,id,50,false,178,'[]'::jsonb FROM public.categories WHERE slug='chapeus';

INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'cinto-couro-fivela-dourada','Cinto de Couro com Fivela Dourada','Cinto masculino em couro genuíno com fivela dourada exclusiva.',189.90,239.90,id,45,true,412,'["85cm","90cm","95cm","100cm","105cm","110cm"]'::jsonb FROM public.categories WHERE slug='cintos';
INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'cinto-feminino-country','Cinto Feminino Country Trançado','Cinto trançado feminino, complemento perfeito para looks country.',129.90,NULL,id,38,false,156,'["S","M","L"]'::jsonb FROM public.categories WHERE slug='cintos';

INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'bandana-country-tradicional','Bandana Country Tradicional','Bandana estampada 100% algodão. Peça essencial do visual country.',39.90,NULL,id,120,true,634,'[]'::jsonb FROM public.categories WHERE slug='acessorios';
INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'carteira-couro-country','Carteira de Couro Country Masculina','Carteira artesanal em couro legítimo, várias divisórias.',149.90,NULL,id,60,false,201,'[]'::jsonb FROM public.categories WHERE slug='acessorios';

INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'quadro-decorativo-sertanejo','Quadro Decorativo Rústico Sertanejo','Quadro em madeira envelhecida com frase sertaneja. Traz aconchego ao ambiente.',129.90,169.90,id,25,true,142,'[]'::jsonb FROM public.categories WHERE slug='decoracao';
INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'caneca-country-esmaltada','Caneca Country Esmaltada','Caneca esmaltada estilo fazendeiro, 400ml. Perfeita para o café da manhã no campo.',49.90,NULL,id,80,false,278,'[]'::jsonb FROM public.categories WHERE slug='decoracao';

INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'kit-presente-peao-completo','Kit Presente Peão Completo','Kit com chapéu, cinto, bandana e carteira. Embalagem presente rústica exclusiva.',549.90,749.90,id,15,true,89,'[]'::jsonb FROM public.categories WHERE slug='kits-presente';
INSERT INTO public.products (slug, name, description, price, compare_at_price, category_id, stock, featured, sales_count, sizes)
SELECT 'kit-presente-cowgirl','Kit Presente Cowgirl','Kit feminino com bandana, cinto e acessórios country. Embalagem exclusiva.',389.90,NULL,id,20,false,124,'[]'::jsonb FROM public.categories WHERE slug='kits-presente';

INSERT INTO public.coupons (code, discount_percent) VALUES ('BEMVINDO10', 10), ('SERTANEJO15', 15);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''));
  IF NEW.email = 'admin@ranchosertanejo.com.br' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();