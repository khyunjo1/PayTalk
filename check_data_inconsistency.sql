-- 데이터 불일치 확인 및 수정

-- 1. user_stores에 있지만 users에 없는 user_id 확인
SELECT 'user_stores에 있지만 users에 없는 user_id:' as info;
SELECT DISTINCT us.user_id 
FROM public.user_stores us
LEFT JOIN public.users u ON us.user_id = u.id
WHERE u.id IS NULL;

-- 2. users 테이블의 모든 사용자 확인
SELECT 'users 테이블의 모든 사용자:' as info;
SELECT id, name, role, status FROM public.users ORDER BY created_at;

-- 3. user_stores 테이블의 모든 연결 확인
SELECT 'user_stores 테이블의 모든 연결:' as info;
SELECT 
  us.user_id,
  us.store_id,
  us.role,
  u.name as user_name,
  s.name as store_name
FROM public.user_stores us
LEFT JOIN public.users u ON us.user_id = u.id
LEFT JOIN public.stores s ON us.store_id = s.id
ORDER BY us.created_at;

-- 4. 잘못된 user_stores 데이터 삭제 (users에 없는 user_id)
DELETE FROM public.user_stores 
WHERE user_id NOT IN (SELECT id FROM public.users);

-- 5. 삭제 후 결과 확인
SELECT '수정 후 user_stores:' as info;
SELECT 
  us.user_id,
  us.store_id,
  us.role,
  u.name as user_name,
  s.name as store_name
FROM public.user_stores us
JOIN public.users u ON us.user_id = u.id
JOIN public.stores s ON us.store_id = s.id
ORDER BY us.created_at;
