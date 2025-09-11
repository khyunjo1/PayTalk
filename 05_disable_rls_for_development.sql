-- 개발용 RLS 정책 비활성화
-- 실제 배포 시에는 다시 활성화해야 함

-- 1. users 테이블 RLS 비활성화
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. stores 테이블 RLS 비활성화  
ALTER TABLE public.stores DISABLE ROW LEVEL SECURITY;

-- 3. user_stores 테이블 RLS 비활성화
ALTER TABLE public.user_stores DISABLE ROW LEVEL SECURITY;

-- 4. menus 테이블 RLS 비활성화
ALTER TABLE public.menus DISABLE ROW LEVEL SECURITY;

-- 5. orders 테이블 RLS 비활성화
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- 6. order_items 테이블 RLS 비활성화
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

SELECT 'RLS 정책 비활성화 완료! (개발용)' as message;

