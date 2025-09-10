-- user_stores 연결 수정

-- 1. 현재 상태 확인
SELECT 'user_stores 테이블:' as info;
SELECT * FROM user_stores;

SELECT 'users 테이블:' as info;
SELECT id, name, role FROM users;

SELECT 'stores 테이블:' as info;
SELECT id, name FROM stores;

-- 2. 기존 user_stores 데이터 삭제 (있다면)
DELETE FROM user_stores;

-- 3. 모든 admin 사용자를 모든 매장에 연결
INSERT INTO user_stores (user_id, store_id, role)
SELECT 
  u.id as user_id,
  s.id as store_id,
  'owner' as role
FROM users u
CROSS JOIN stores s
WHERE u.role = 'admin';

-- 4. 결과 확인
SELECT '수정 후 user_stores:' as info;
SELECT 
  us.*,
  u.name as user_name,
  s.name as store_name
FROM user_stores us
JOIN users u ON us.user_id = u.id
JOIN stores s ON us.store_id = s.id;
