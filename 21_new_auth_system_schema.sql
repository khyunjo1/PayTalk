-- 새로운 인증 시스템을 위한 데이터베이스 스키마 변경

-- 1. users 테이블 구조 완전 변경
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- 해시된 비밀번호
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 슈퍼 어드민 계정 생성 (비밀번호: admin123)
-- 실제 해시된 비밀번호를 생성해야 하므로, 먼저 빈 계정을 만들고 나중에 업데이트
INSERT INTO public.users (name, phone, password, status, role) VALUES 
('조광현', '010-1234-5678', 'temp_password', 'approved', 'super_admin');

-- 3. user_stores 테이블 수정 (사장님 승인 후 연결)
ALTER TABLE public.user_stores 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id);

-- 4. RLS 정책 설정 (개발용으로 단순화)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 임시로 모든 접근 허용 (개발용)
CREATE POLICY "Allow all access for development" ON public.users
  FOR ALL USING (true);

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 6. 기존 데이터 정리 (필요시)
-- DELETE FROM public.user_stores;
-- DELETE FROM public.orders WHERE user_id LIKE 'temp_%';
