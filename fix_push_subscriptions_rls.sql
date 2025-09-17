-- user_push_subscriptions 테이블 RLS 문제 해결
-- Supabase SQL 에디터에서 실행하세요.

-- 1. user_push_subscriptions 테이블 RLS 비활성화
ALTER TABLE public.user_push_subscriptions DISABLE ROW LEVEL SECURITY;

-- 2. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.user_push_subscriptions;

-- 3. 확인용 쿼리
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_push_subscriptions';
