-- RLS (Row Level Security) 정책 설정
-- 보안을 위한 접근 권한 제어

-- 1. users 테이블 RLS 설정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 정보만 조회/수정 가능
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 관리자는 모든 사용자 조회 가능 (나중에 추가)
-- CREATE POLICY "Admins can view all users" ON public.users
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM public.users 
--       WHERE id = auth.uid() AND role = 'admin'
--     )
--   );

-- 2. stores 테이블 RLS 설정
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 매장 조회 가능 (공개)
CREATE POLICY "Stores are viewable by everyone" ON public.stores
  FOR SELECT USING (true);

-- 3. user_stores 테이블 RLS 설정
ALTER TABLE public.user_stores ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 매장 연결만 조회/수정 가능
CREATE POLICY "Users can view own stores" ON public.user_stores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stores" ON public.user_stores
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. menus 테이블 RLS 설정
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 메뉴 조회 가능 (공개)
CREATE POLICY "Menus are viewable by everyone" ON public.menus
  FOR SELECT USING (true);

-- 5. orders 테이블 RLS 설정
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 주문자는 자신의 주문만 조회 가능
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- 6. order_items 테이블 RLS 설정
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 주문자는 자신의 주문 아이템만 조회 가능
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE id = order_items.order_id 
      AND user_id = auth.uid()
    )
  );

SELECT 'RLS 정책 설정 완료!' as message;
