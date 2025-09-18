-- Users 테이블 생성
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  profile_image TEXT,
  phone TEXT UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (기존 정책이 있으면 삭제 후 재생성)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 사장님 회원가입을 위한 정책 (id를 명시적으로 생성하여 설정)
DROP POLICY IF EXISTS "Allow owner registration" ON public.users;
CREATE POLICY "Allow owner registration" ON public.users
  FOR INSERT WITH CHECK (role = 'admin' AND status IN ('active', 'pending'));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;
CREATE POLICY "Super admins can view all users" ON public.users
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );

DROP POLICY IF EXISTS "Super admins can update user status" ON public.users;
CREATE POLICY "Super admins can update user status" ON public.users
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'super_admin'
  );

-- 기존 테이블에 password 컬럼 추가 (이미 테이블이 있는 경우)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        -- password 컬럼이 없으면 추가
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password' AND table_schema = 'public') THEN
            ALTER TABLE public.users ADD COLUMN password TEXT;
            -- 기존 데이터가 있다면 기본값 설정
            UPDATE public.users SET password = 'default_password' WHERE password IS NULL;
            -- NOT NULL 제약조건 추가
            ALTER TABLE public.users ALTER COLUMN password SET NOT NULL;
        END IF;
    END IF;
END $$;

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 기존 트리거가 있으면 삭제 후 재생성
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
