-- Schéma PostgreSQL complet pour MarchéPlus / OroMall

-- Activer les extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table Utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  mtn_number VARCHAR(50),
  orange_number VARCHAR(50),
  account_type VARCHAR(50) DEFAULT 'client',
  role VARCHAR(50) DEFAULT 'user',
  is_banned BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table Boutiques
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  shop_type VARCHAR(50) NOT NULL DEFAULT 'individual',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  category VARCHAR(100),
  city VARCHAR(100),
  address TEXT,
  whatsapp_number VARCHAR(50) NOT NULL,
  mtn_number VARCHAR(50),
  orange_number VARCHAR(50),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  logo_url TEXT,
  profile_image TEXT,
  cover_image TEXT,
  business_hours TEXT,
  rating NUMERIC(3, 2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  policies JSONB DEFAULT '{}'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table Produits
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  seller_name VARCHAR(255),
  seller_email VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  original_price NUMERIC(12, 2),
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  condition VARCHAR(50) NOT NULL DEFAULT 'neuf',
  city VARCHAR(100),
  neighborhood VARCHAR(100),
  whatsapp_number VARCHAR(50),
  images JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  stock INT DEFAULT 1,
  sold_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  is_promoted BOOLEAN DEFAULT false,
  promotion_expires TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  rating NUMERIC(3, 2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table Logements (Housing)
CREATE TABLE IF NOT EXISTS housing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  property_type VARCHAR(50) DEFAULT 'residential',
  price NUMERIC(12, 2) NOT NULL,
  price_type VARCHAR(20) DEFAULT 'month',
  price_negotiable BOOLEAN DEFAULT false,
  deposit_amount NUMERIC(12, 2) DEFAULT 0,
  payment_frequency VARCHAR(50) DEFAULT 'monthly',
  city VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(100) NOT NULL,
  address TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  surface_sqm NUMERIC(8, 2) DEFAULT 0,
  bedrooms INT DEFAULT 0,
  bathrooms INT DEFAULT 0,
  living_rooms INT DEFAULT 0,
  kitchens INT DEFAULT 0,
  furnished BOOLEAN DEFAULT false,
  air_conditioning BOOLEAN DEFAULT false,
  water_source VARCHAR(50) DEFAULT 'city',
  electricity_source VARCHAR(50) DEFAULT 'grid',
  amenities JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  owner_name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255),
  owner_phone VARCHAR(50),
  whatsapp_number VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'available',
  rating NUMERIC(3, 2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table Commandes (Orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  shop_name VARCHAR(255),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255),
  product_price NUMERIC(12, 2),
  total_amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  items JSONB DEFAULT '[]'::jsonb,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  shipping_address JSONB DEFAULT '{}'::jsonb,
  payment_reference VARCHAR(100),
  payment_proof_url TEXT,
  payment_proof_type VARCHAR(50),
  payment_method VARCHAR(50),
  payment_verified BOOLEAN DEFAULT false,
  withdrawal_status VARCHAR(50) DEFAULT 'pending',
  withdrawal_pin VARCHAR(20),
  pin_code VARCHAR(20),
  promo_code VARCHAR(50),
  discount_amount NUMERIC(12, 2) DEFAULT 0,
  is_p2p BOOLEAN DEFAULT false,
  fee_amount NUMERIC(12, 2) DEFAULT 0,
  message TEXT,
  cancellation_reason TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table Demandes de Visites (Visit Requests)
CREATE TABLE IF NOT EXISTS visit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  housing_id UUID REFERENCES housing(id) ON DELETE CASCADE,
  housing_title VARCHAR(255) NOT NULL,
  housing_city VARCHAR(100),
  housing_image TEXT,
  visitor_name VARCHAR(255) NOT NULL,
  visitor_email VARCHAR(255) NOT NULL,
  visitor_phone VARCHAR(50) NOT NULL,
  package_type VARCHAR(50) NOT NULL DEFAULT 'single',
  package_label VARCHAR(100),
  amount NUMERIC(12, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_proof_url TEXT,
  payment_reference VARCHAR(100),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  visit_date DATE,
  visit_time VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table Logs SMS Gateway MoMo (Payment SMS Logs)
CREATE TABLE IF NOT EXISTS payment_sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender VARCHAR(50) NOT NULL,
  message_raw TEXT NOT NULL,
  amount NUMERIC(12, 2),
  transaction_id VARCHAR(100) UNIQUE,
  sender_phone VARCHAR(50),
  matched BOOLEAN DEFAULT false,
  matched_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  matched_visit_id UUID REFERENCES visit_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Table Abonnements Vendeurs (Subscriptions)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  shop_name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'XAF',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50),
  payment_proof_url TEXT,
  payment_reference VARCHAR(100),
  days_remaining INT DEFAULT 30,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Table Publicités & Bannières (Advertisements)
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  cta_text VARCHAR(100),
  position VARCHAR(50) NOT NULL DEFAULT 'hero',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  badge VARCHAR(50),
  badge_color VARCHAR(50),
  target_city VARCHAR(100) DEFAULT 'Toutes',
  action_type VARCHAR(50),
  whatsapp_phone VARCHAR(50),
  promo_code VARCHAR(50),
  budget_amount NUMERIC(12, 2),
  advertiser_name VARCHAR(255),
  advertiser_contact VARCHAR(255),
  priority INT DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  impressions_count INT DEFAULT 0,
  clicks_count INT DEFAULT 0,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Table Avis (Reviews)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  rating NUMERIC(2, 1) NOT NULL,
  comment TEXT,
  vendor_reply TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Table Favoris (Wishlist)
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_city ON products(city);
CREATE INDEX IF NOT EXISTS idx_housing_city ON housing(city);
CREATE INDEX IF NOT EXISTS idx_shops_city ON shops(city);
CREATE INDEX IF NOT EXISTS idx_orders_payment_ref ON orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_visit_req_payment_ref ON visit_requests(payment_reference);
CREATE INDEX IF NOT EXISTS idx_sms_txn_id ON payment_sms_logs(transaction_id);
