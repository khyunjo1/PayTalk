-- PayTalk 애플리케이션에 필요한 모든 테이블 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. stores 테이블 (매장 정보)
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT '반찬',
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  owner_name VARCHAR(255),
  phone VARCHAR(20),
  delivery_area TEXT,
  business_hours_start TIME,
  business_hours_end TIME,
  order_cutoff_time TIME,
  minimum_order_amount INTEGER DEFAULT 0,
  bank_account VARCHAR(50),
  account_holder VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  pickup_time_slots JSONB DEFAULT '[]',
  delivery_time_slots JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. user_stores 테이블 (사용자-매장 연결)
CREATE TABLE IF NOT EXISTS user_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager')),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- 3. menus 테이블 (메뉴 정보)
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  category VARCHAR(100),
  is_available BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. orders 테이블 (주문 정보)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_type VARCHAR(20) DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'pickup')),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_address TEXT,
  delivery_address TEXT,
  delivery_time TIMESTAMP WITH TIME ZONE,
  pickup_time TIMESTAMP WITH TIME ZONE,
  special_requests TEXT,
  depositor_name VARCHAR(255),
  subtotal INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  delivery_fee INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  payment_method VARCHAR(50) DEFAULT 'cash',
  notes TEXT,
  delivery_area_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. order_items 테이블 (주문 아이템)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. inquiries 테이블 (문의)
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT '미확인' CHECK (status IN ('미확인', '확인')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. delivery_areas 테이블 (배달 지역)
CREATE TABLE IF NOT EXISTS delivery_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  area_name VARCHAR(255) NOT NULL,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, area_name)
);

-- 8. push_subscriptions 테이블 (푸시 알림 구독)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. daily_menus 테이블 (일일 메뉴)
CREATE TABLE IF NOT EXISTS daily_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  menu_date DATE NOT NULL,
  title VARCHAR(255) DEFAULT '오늘의 반찬',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  cutoff_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, menu_date)
);

-- 10. daily_menu_items 테이블 (일일 메뉴 아이템)
CREATE TABLE IF NOT EXISTS daily_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_menu_id UUID NOT NULL REFERENCES daily_menus(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  initial_quantity INTEGER NOT NULL DEFAULT 0,
  current_quantity INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(daily_menu_id, menu_id)
);

-- 11. daily_menu_orders 테이블 (일일 메뉴 주문)
CREATE TABLE IF NOT EXISTS daily_menu_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_menu_id UUID NOT NULL REFERENCES daily_menus(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. store_contracts 테이블 (매장 계약)
CREATE TABLE IF NOT EXISTS store_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  initial_fee INTEGER NOT NULL DEFAULT 1000000,
  monthly_fee INTEGER NOT NULL DEFAULT 30000,
  contract_start_date DATE NOT NULL,
  contract_end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. revenue_records 테이블 (수익 기록)
CREATE TABLE IF NOT EXISTS revenue_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  revenue_type VARCHAR(20) NOT NULL CHECK (revenue_type IN ('initial', 'monthly', 'additional')),
  amount INTEGER NOT NULL,
  description TEXT,
  record_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);
CREATE INDEX IF NOT EXISTS idx_user_stores_user ON user_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stores_store ON user_stores(store_id);
CREATE INDEX IF NOT EXISTS idx_menus_store ON menus(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_store ON orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_delivery_areas_store ON delivery_areas(store_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_menus_store ON daily_menus(store_id);
CREATE INDEX IF NOT EXISTS idx_daily_menus_date ON daily_menus(menu_date);
CREATE INDEX IF NOT EXISTS idx_daily_menu_items_daily_menu ON daily_menu_items(daily_menu_id);
CREATE INDEX IF NOT EXISTS idx_daily_menu_orders_daily_menu ON daily_menu_orders(daily_menu_id);
CREATE INDEX IF NOT EXISTS idx_store_contracts_store ON store_contracts(store_id);
CREATE INDEX IF NOT EXISTS idx_revenue_records_store ON revenue_records(store_id);

-- RLS 활성화
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menu_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_records ENABLE ROW LEVEL SECURITY;

-- 기본 RLS 정책 생성 (모든 사용자 접근 허용 - 개발용)
-- 실제 운영에서는 더 엄격한 정책이 필요합니다

-- stores 정책
DROP POLICY IF EXISTS "Anyone can view stores" ON stores;
CREATE POLICY "Anyone can view stores" ON stores FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can update their stores" ON stores;
CREATE POLICY "Store owners can update their stores" ON stores FOR ALL USING (true);

-- orders 정책
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can view their store orders" ON orders;
CREATE POLICY "Store owners can view their store orders" ON orders FOR SELECT USING (true);

-- order_items 정책
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can view their store order items" ON order_items;
CREATE POLICY "Store owners can view their store order items" ON order_items FOR SELECT USING (true);

-- menus 정책
DROP POLICY IF EXISTS "Anyone can view menus" ON menus;
CREATE POLICY "Anyone can view menus" ON menus FOR SELECT USING (true);

DROP POLICY IF EXISTS "Store owners can manage their store menus" ON menus;
CREATE POLICY "Store owners can manage their store menus" ON menus FOR ALL USING (true);

-- inquiries 정책
DROP POLICY IF EXISTS "Anyone can create inquiries" ON inquiries;
CREATE POLICY "Anyone can create inquiries" ON inquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view inquiries" ON inquiries;
CREATE POLICY "Anyone can view inquiries" ON inquiries FOR SELECT USING (true);

-- user_stores 정책
DROP POLICY IF EXISTS "Users can manage their own store connections" ON user_stores;
CREATE POLICY "Anyone can view user_stores" ON user_stores FOR SELECT USING (true);
CREATE POLICY "Anyone can insert user_stores" ON user_stores FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update user_stores" ON user_stores FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete user_stores" ON user_stores FOR DELETE USING (true);

-- 기타 테이블들도 기본 정책 설정
DROP POLICY IF EXISTS "Anyone can access delivery_areas" ON delivery_areas;
CREATE POLICY "Anyone can access delivery_areas" ON delivery_areas FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can access push_subscriptions" ON push_subscriptions;
CREATE POLICY "Anyone can access push_subscriptions" ON push_subscriptions FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can access daily_menus" ON daily_menus;
CREATE POLICY "Anyone can access daily_menus" ON daily_menus FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can access daily_menu_items" ON daily_menu_items;
CREATE POLICY "Anyone can access daily_menu_items" ON daily_menu_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can access daily_menu_orders" ON daily_menu_orders;
CREATE POLICY "Anyone can access daily_menu_orders" ON daily_menu_orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can access store_contracts" ON store_contracts;
CREATE POLICY "Anyone can access store_contracts" ON store_contracts FOR ALL USING (true);

DROP POLICY IF EXISTS "Anyone can access revenue_records" ON revenue_records;
CREATE POLICY "Anyone can access revenue_records" ON revenue_records FOR ALL USING (true);

-- 완료 메시지
SELECT '모든 필요한 테이블이 생성되었습니다.' as message;
