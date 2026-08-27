-- Schéma PostgreSQL / Supabase complet pour MarchéPlus / OroMall

-- Activer Row Level Security et extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table Utilisateurs
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  mtn_number TEXT,
  orange_number TEXT,
  account_type TEXT DEFAULT 'client',
  role TEXT DEFAULT 'user',
  is_banned BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Boutiques
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  shop_type TEXT NOT NULL DEFAULT 'individual',
  status TEXT NOT NULL DEFAULT 'active',
  category TEXT,
  city TEXT,
  address TEXT,
  whatsapp_number TEXT NOT NULL,
  mtn_number TEXT,
  orange_number TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  logo_url TEXT,
  profile_image TEXT,
  cover_image TEXT,
  business_hours TEXT,
  rating NUMERIC DEFAULT 0,
  reviews_count INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  policies JSONB DEFAULT '{}'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Produits
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  seller_name TEXT,
  seller_email TEXT,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  category TEXT NOT NULL,
  subcategory TEXT,
  condition TEXT NOT NULL DEFAULT 'neuf',
  city TEXT,
  neighborhood TEXT,
  whatsapp_number TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  stock INT DEFAULT 1,
  sold_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  is_promoted BOOLEAN DEFAULT false,
  promotion_expires TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active',
  rating NUMERIC DEFAULT 0,
  reviews_count INT DEFAULT 0,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Logements (Housing)
CREATE TABLE IF NOT EXISTS public.housing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  property_type TEXT DEFAULT 'residential',
  price NUMERIC NOT NULL,
  price_type TEXT DEFAULT 'month',
  price_negotiable BOOLEAN DEFAULT false,
  deposit_amount NUMERIC DEFAULT 0,
  payment_frequency TEXT DEFAULT 'monthly',
  city TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  surface_sqm NUMERIC DEFAULT 0,
  bedrooms INT DEFAULT 0,
  bathrooms INT DEFAULT 0,
  living_rooms INT DEFAULT 0,
  kitchens INT DEFAULT 0,
  furnished BOOLEAN DEFAULT false,
  air_conditioning BOOLEAN DEFAULT false,
  water_source TEXT DEFAULT 'city',
  electricity_source TEXT DEFAULT 'grid',
  amenities JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  owner_name TEXT NOT NULL,
  owner_email TEXT,
  owner_phone TEXT,
  whatsapp_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  rating NUMERIC DEFAULT 0,
  reviews_count INT DEFAULT 0,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Commandes (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
  shop_name TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT,
  product_price NUMERIC,
  total_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  items JSONB DEFAULT '[]'::jsonb,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  shipping_address JSONB DEFAULT '{}'::jsonb,
  payment_reference TEXT,
  payment_proof_url TEXT,
  payment_proof_type TEXT,
  payment_method TEXT,
  payment_verified BOOLEAN DEFAULT false,
  withdrawal_status TEXT DEFAULT 'pending',
  withdrawal_pin TEXT,
  pin_code TEXT,
  promo_code TEXT,
  discount_amount NUMERIC DEFAULT 0,
  is_p2p BOOLEAN DEFAULT false,
  fee_amount NUMERIC DEFAULT 0,
  message TEXT,
  cancellation_reason TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Demandes de Visites (Visit Requests)
CREATE TABLE IF NOT EXISTS public.visit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  housing_id UUID REFERENCES public.housing(id) ON DELETE CASCADE,
  housing_title TEXT NOT NULL,
  housing_city TEXT,
  housing_image TEXT,
  visitor_name TEXT NOT NULL,
  visitor_email TEXT NOT NULL,
  visitor_phone TEXT NOT NULL,
  package_type TEXT NOT NULL DEFAULT 'single',
  package_label TEXT,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  payment_proof_url TEXT,
  payment_reference TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  visit_date DATE,
  visit_time TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table Logs SMS Gateway MoMo (Payment SMS Logs)
CREATE TABLE IF NOT EXISTS public.payment_sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender TEXT NOT NULL,
  message_raw TEXT NOT NULL,
  amount NUMERIC,
  transaction_id TEXT UNIQUE,
  sender_phone TEXT,
  matched BOOLEAN DEFAULT false,
  matched_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  matched_visit_id UUID REFERENCES public.visit_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer Row Level Security (RLS) avec politiques de lecture publique
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public read access on shops" ON public.shops FOR SELECT USING (true);
CREATE POLICY "Public read access on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read access on housing" ON public.housing FOR SELECT USING (true);
CREATE POLICY "Public read access on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public read access on visit_requests" ON public.visit_requests FOR SELECT USING (true);
CREATE POLICY "Public read access on payment_sms_logs" ON public.payment_sms_logs FOR SELECT USING (true);
