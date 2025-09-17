-- 푸시 알림 테스트용 쿼리
-- Supabase SQL 에디터에서 실행하세요.

-- 1. user_push_subscriptions 테이블 확인
SELECT 
  id,
  user_id,
  subscription->>'endpoint' as endpoint,
  created_at
FROM public.user_push_subscriptions
ORDER BY created_at DESC
LIMIT 5;

-- 2. 특정 사용자의 푸시 구독 확인
SELECT 
  id,
  user_id,
  subscription,
  created_at
FROM public.user_push_subscriptions
WHERE user_id = '636a0bd3-a198-4cd8-9cb0-7fe17c2422e2';

-- 3. 매장 정보 확인
SELECT 
  id,
  name,
  owner_id
FROM public.stores
WHERE owner_id = '636a0bd3-a198-4cd8-9cb0-7fe17c2422e2';
