-- RLS 비활성화: 모든 테이블에서 RLS 제거
-- Supabase SQL 에디터에서 실행하세요.

-- 1. 모든 테이블에서 RLS 비활성화
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_push_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries DISABLE ROW LEVEL SECURITY;

-- 2. 모든 RLS 정책 삭제
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.user_push_subscriptions;
DROP POLICY IF EXISTS "Users can manage their own store connections" ON public.user_stores;
DROP POLICY IF EXISTS "Anyone can view stores" ON public.stores;
DROP POLICY IF EXISTS "Store owners can update their stores" ON public.stores;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can view their store orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Store owners can view their store order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can view menus" ON public.menus;
DROP POLICY IF EXISTS "Store owners can manage their store menus" ON public.menus;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can update user status" ON public.users;

-- 3. 확인용 쿼리
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
