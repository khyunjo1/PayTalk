-- 주문 생성 오류 디버깅
-- Supabase SQL Editor에서 실행하세요

-- 1. orders 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. order_items 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'order_items' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. orders 테이블 RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'orders'
ORDER BY policyname;

-- 4. order_items 테이블 RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'order_items'
ORDER BY policyname;

-- 5. 테스트용 주문 생성 (실제 데이터로)
INSERT INTO orders (
  user_id,
  store_id,
  order_type,
  customer_name,
  customer_phone,
  customer_address,
  depositor_name,
  subtotal,
  total,
  delivery_fee,
  status
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM stores LIMIT 1),
  'delivery',
  '테스트 고객',
  '010-1234-5678',
  '테스트 주소',
  '테스트 입금자',
  10000,
  10000,
  0,
  'pending'
) RETURNING *;

-- 6. 테스트용 주문 아이템 생성
INSERT INTO order_items (
  order_id,
  menu_id,
  quantity,
  price
) VALUES (
  (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1),
  (SELECT id FROM menus LIMIT 1),
  1,
  10000
) RETURNING *;
