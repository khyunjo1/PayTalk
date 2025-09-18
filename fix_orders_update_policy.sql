-- orders 테이블에 UPDATE 정책 추가
-- 관리자가 주문 상태를 변경할 수 있도록 허용

-- 기존 정책 확인
-- Anyone can create orders (INSERT)
-- Users can view own orders (SELECT)
-- Store owners can view their store orders (SELECT)

-- UPDATE 정책 추가: 관리자가 모든 주문을 수정할 수 있음
CREATE POLICY "Admins can update all orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- 매장 소유자가 자신의 매장 주문을 수정할 수 있음
CREATE POLICY "Store owners can update their store orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_stores us 
      WHERE us.store_id = orders.store_id 
      AND us.user_id = auth.uid() 
      AND us.role = 'owner'
    )
  );

-- DELETE 정책 추가: 관리자가 모든 주문을 삭제할 수 있음
CREATE POLICY "Admins can delete all orders" ON public.orders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- 매장 소유자가 자신의 매장 주문을 삭제할 수 있음
CREATE POLICY "Store owners can delete their store orders" ON public.orders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_stores us 
      WHERE us.store_id = orders.store_id 
      AND us.user_id = auth.uid() 
      AND us.role = 'owner'
    )
  );
