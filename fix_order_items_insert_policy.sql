-- order_items 테이블에 INSERT 정책 추가
-- 주문 생성 시 주문 아이템을 생성할 수 있도록 허용

-- 기존 정책 확인 (SELECT만 있음)
-- Users can view own order items
-- Store owners can view their store order items

-- INSERT 정책 추가: 모든 사용자가 주문 아이템을 생성할 수 있음
CREATE POLICY "Anyone can create order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

-- UPDATE 정책 추가: 주문 소유자와 매장 소유자가 수정할 수 있음
CREATE POLICY "Order owners can update order items" ON public.order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = order_items.order_id 
      AND o.user_id = auth.uid()
    )
  );

-- 매장 소유자가 자신의 매장 주문 아이템을 수정할 수 있음
CREATE POLICY "Store owners can update their store order items" ON public.order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM orders o 
      JOIN user_stores us ON o.store_id = us.store_id
      WHERE o.id = order_items.order_id 
      AND us.user_id = auth.uid() 
      AND us.role = 'owner'
    )
  );

-- DELETE 정책 추가: 주문 소유자와 매장 소유자가 삭제할 수 있음
CREATE POLICY "Order owners can delete order items" ON public.order_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = order_items.order_id 
      AND o.user_id = auth.uid()
    )
  );

-- 매장 소유자가 자신의 매장 주문 아이템을 삭제할 수 있음
CREATE POLICY "Store owners can delete their store order items" ON public.order_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM orders o 
      JOIN user_stores us ON o.store_id = us.store_id
      WHERE o.id = order_items.order_id 
      AND us.user_id = auth.uid() 
      AND us.role = 'owner'
    )
  );
