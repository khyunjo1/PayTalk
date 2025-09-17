-- RLS 정책 수정: admin-dashboard에서 매장 조회 가능하도록
-- Supabase SQL 에디터에서 실행하세요.

-- 1. user_stores 테이블 RLS 정책 확인 및 수정
DROP POLICY IF EXISTS "Store owners can insert their own store connections" ON public.user_stores;
DROP POLICY IF EXISTS "Store owners can view their own store connections" ON public.user_stores;
DROP POLICY IF EXISTS "Users can update own stores" ON public.user_stores;
DROP POLICY IF EXISTS "Users can view own stores" ON public.user_stores;

-- 2. user_stores 테이블에 새로운 정책 생성
-- 사용자는 자신의 매장 연결을 조회/수정할 수 있음
CREATE POLICY "Users can manage their own store connections" ON public.user_stores
  FOR ALL USING (auth.uid() = user_id);

-- 3. stores 테이블 RLS 정책 확인 및 수정
DROP POLICY IF EXISTS "Stores are viewable by everyone" ON public.stores;

-- 4. stores 테이블에 새로운 정책 생성
-- 모든 사용자가 매장 정보를 조회할 수 있음 (메뉴 조회용)
CREATE POLICY "Anyone can view stores" ON public.stores
  FOR SELECT USING (true);

-- 매장 소유자는 자신의 매장을 수정할 수 있음
CREATE POLICY "Store owners can update their stores" ON public.stores
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_stores us 
      WHERE us.store_id = stores.id 
      AND us.user_id = auth.uid() 
      AND us.role = 'owner'
    )
  );

-- 5. orders 테이블 RLS 정책 확인 및 수정
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can view their store orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- 6. orders 테이블에 새로운 정책 생성
-- 모든 사용자가 주문을 생성할 수 있음
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

-- 사용자는 자신의 주문을 조회할 수 있음
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- 매장 소유자는 자신의 매장 주문을 조회할 수 있음
CREATE POLICY "Store owners can view their store orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_stores us 
      WHERE us.store_id = orders.store_id 
      AND us.user_id = auth.uid() 
      AND us.role = 'owner'
    )
  );

-- 7. order_items 테이블 RLS 정책 확인 및 수정
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;

-- 8. order_items 테이블에 새로운 정책 생성
-- 사용자는 자신의 주문 아이템을 조회할 수 있음
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = order_items.order_id 
      AND o.user_id = auth.uid()
    )
  );

-- 매장 소유자는 자신의 매장 주문 아이템을 조회할 수 있음
CREATE POLICY "Store owners can view their store order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders o 
      JOIN user_stores us ON o.store_id = us.store_id
      WHERE o.id = order_items.order_id 
      AND us.user_id = auth.uid() 
      AND us.role = 'owner'
    )
  );

-- 9. menus 테이블 RLS 정책 확인 및 수정
DROP POLICY IF EXISTS "Menus are viewable by everyone" ON public.menus;

-- 10. menus 테이블에 새로운 정책 생성
-- 모든 사용자가 메뉴를 조회할 수 있음
CREATE POLICY "Anyone can view menus" ON public.menus
  FOR SELECT USING (true);

-- 매장 소유자는 자신의 매장 메뉴를 관리할 수 있음
CREATE POLICY "Store owners can manage their store menus" ON public.menus
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_stores us 
      WHERE us.store_id = menus.store_id 
      AND us.user_id = auth.uid() 
      AND us.role = 'owner'
    )
  );

-- 11. users 테이블 RLS 정책 확인 및 수정
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can update user status" ON public.users;

-- 12. users 테이블에 새로운 정책 생성
-- 사용자는 자신의 프로필을 조회/수정할 수 있음
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 13. 확인용 쿼리
SELECT 
  schemaname, 
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

