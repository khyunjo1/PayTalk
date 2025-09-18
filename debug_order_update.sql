-- 주문 상태 업데이트 디버깅
-- 문제가 되는 주문 ID로 테스트

-- 1. 해당 주문이 존재하는지 확인
SELECT id, status, store_id, customer_name, created_at 
FROM orders 
WHERE id = '5a6c6dfd-7665-4418-b150-67760389e000';

-- 2. 해당 주문의 상세 정보 확인
SELECT 
  o.id,
  o.status,
  o.store_id,
  o.customer_name,
  s.name as store_name,
  s.owner_id
FROM orders o
LEFT JOIN stores s ON o.store_id = s.id
WHERE o.id = '5a6c6dfd-7665-4418-b150-67760389e000';

-- 3. 현재 사용자 정보 확인 (관리자 권한)
SELECT id, role, name FROM users WHERE role = 'admin' LIMIT 5;

-- 4. RLS 정책 확인
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

-- 5. 테스트 업데이트 (RLS 비활성화 상태에서)
-- UPDATE orders 
-- SET status = '입금확인', updated_at = NOW()
-- WHERE id = '5a6c6dfd-7665-4418-b150-67760389e000';
