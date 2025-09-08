-- PayTalk 데이터베이스 스키마 생성
-- 사용자 요구사항 5가지에 맞춘 설계

-- 1. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. users 테이블 (요구사항 1: 카카오 로그인 유저 저장)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  profile_image TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. stores 테이블 (요구사항 4: 사장님 고유 계좌번호 저장)
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  delivery_area TEXT NOT NULL,
  delivery_fee INTEGER NOT NULL,
  phone TEXT NOT NULL,
  business_hours_start TIME DEFAULT '09:00',
  business_hours_end TIME DEFAULT '21:00',
  pickup_time_slots TEXT[] DEFAULT ARRAY['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
  delivery_time_slots JSONB DEFAULT '[]'::jsonb,
  bank_account TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. user_stores 테이블 (요구사항 2: 유저 → 사장님 전환)
CREATE TABLE public.user_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- 5. menus 테이블 (요구사항 3: 사장님 메뉴 등록)
CREATE TABLE public.menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price > 0),
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. orders 테이블 (요구사항 5: 주문 상태 변경)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT '입금대기' CHECK (status IN ('입금대기', '입금확인', '배달완료')),
  order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup')),
  delivery_address TEXT,
  delivery_time TEXT,
  pickup_time TEXT,
  special_requests TEXT,
  depositor_name TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  delivery_fee INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. order_items 테이블
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES public.menus(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price INTEGER NOT NULL CHECK (price > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 인덱스 생성
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_user_stores_user_id ON public.user_stores(user_id);
CREATE INDEX idx_user_stores_store_id ON public.user_stores(store_id);
CREATE INDEX idx_menus_store_id ON public.menus(store_id);
CREATE INDEX idx_menus_category ON public.menus(category);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_store_id ON public.orders(store_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

SELECT '데이터베이스 스키마 생성 완료!' as message;
