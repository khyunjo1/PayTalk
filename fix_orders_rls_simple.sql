-- orders 테이블 RLS 정책 간단하게 수정
-- 복잡한 정책 대신 간단한 정책 사용

-- 1. 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can view their store orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can update their store orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can delete all orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can delete their store orders" ON public.orders;

-- 2. 간단한 정책 생성
-- 모든 사용자가 주문을 생성할 수 있음
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 주문을 조회할 수 있음
CREATE POLICY "Anyone can view orders" ON public.orders
  FOR SELECT USING (true);

-- 모든 사용자가 주문을 수정할 수 있음 (임시)
CREATE POLICY "Anyone can update orders" ON public.orders
  FOR UPDATE USING (true);

-- 모든 사용자가 주문을 삭제할 수 있음 (임시)
CREATE POLICY "Anyone can delete orders" ON public.orders
  FOR DELETE USING (true);

-- 3. 정책 확인
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'orders' 
ORDER BY policyname;
