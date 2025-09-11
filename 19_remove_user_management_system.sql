-- 사장님 권한 부여 시스템 제거

-- 1. user_stores 테이블의 role 컬럼을 'owner'로 고정 (더 이상 'manager' 역할 불필요)
UPDATE public.user_stores SET role = 'owner' WHERE role = 'manager';

-- 2. user_stores 테이블의 role 컬럼에 CHECK 제약 조건 추가
ALTER TABLE public.user_stores
DROP CONSTRAINT IF EXISTS user_stores_role_check;

ALTER TABLE public.user_stores
ADD CONSTRAINT user_stores_role_check CHECK (role = 'owner');

-- 3. users 테이블의 role을 'admin' 또는 'super_admin'만 허용하도록 제약 조건 수정
-- (소비자는 더 이상 users 테이블에 저장되지 않음)
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'super_admin'));

-- 4. 기존 customer 역할 사용자들을 admin으로 변경 (사장님으로 전환)
UPDATE public.users SET role = 'admin' WHERE role = 'customer';

-- 5. 불필요한 RLS 정책 제거
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can update user roles" ON public.users;

-- 6. 새로운 RLS 정책 생성 (admin과 super_admin만 접근 가능)
CREATE POLICY "Admins can view their own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can update their own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Super admins can view all admin profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 7. user_stores 테이블 RLS 정책 업데이트
DROP POLICY IF EXISTS "Users can view their own store connections" ON public.user_stores;
DROP POLICY IF EXISTS "Users can insert their own store connections" ON public.user_stores;
DROP POLICY IF EXISTS "Super admins can manage all store connections" ON public.user_stores;

CREATE POLICY "Store owners can view their own store connections" ON public.user_stores
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Store owners can insert their own store connections" ON public.user_stores
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can manage all store connections" ON public.user_stores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 8. 인덱스 정리
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_user_stores_role ON public.user_stores(role);
