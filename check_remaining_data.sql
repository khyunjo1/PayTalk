-- 남아있는 데이터 확인
-- Supabase SQL Editor에서 실행하세요

-- 1. 모든 테이블의 데이터 개수 확인
SELECT 
  'users' as table_name, 
  COUNT(*) as row_count 
FROM users
UNION ALL
SELECT 
  'stores' as table_name, 
  COUNT(*) as row_count 
FROM stores
UNION ALL
SELECT 
  'user_stores' as table_name, 
  COUNT(*) as row_count 
FROM user_stores
UNION ALL
SELECT 
  'orders' as table_name, 
  COUNT(*) as row_count 
FROM orders
UNION ALL
SELECT 
  'inquiries' as table_name, 
  COUNT(*) as row_count 
FROM inquiries;

-- 2. users 테이블의 모든 데이터 확인
SELECT id, name, phone, role, status, created_at FROM users ORDER BY created_at DESC;

-- 3. stores 테이블의 모든 데이터 확인
SELECT id, name, owner_name, phone, created_at FROM stores ORDER BY created_at DESC;

-- 4. user_stores 테이블의 모든 데이터 확인
SELECT us.id, u.name as user_name, s.name as store_name, us.role, us.created_at 
FROM user_stores us
LEFT JOIN users u ON us.user_id = u.id
LEFT JOIN stores s ON us.store_id = s.id
ORDER BY us.created_at DESC;
