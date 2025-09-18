-- Users 테이블 생성
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  profile_image TEXT,
  phone TEXT UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'inactive', 'suspended', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- RLS 비활성화 (임시로 회원가입 문제 해결)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow owner registration" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can update user status" ON public.users;

-- 기존 테이블 수정 (이미 테이블이 있는 경우)
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

        -- email 컬럼의 NOT NULL 제약조건 제거
        ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;

        -- status 체크 제약조건 수정
        ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
        ALTER TABLE public.users ADD CONSTRAINT users_status_check CHECK (status IN ('pending', 'approved', 'active', 'inactive', 'suspended', 'rejected'));
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
