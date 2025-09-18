-- 슈퍼 어드민 계정 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 슈퍼 어드민 계정 삭제 (있다면)
DELETE FROM users WHERE role = 'super_admin';

-- 2. 슈퍼 어드민 계정 생성
INSERT INTO users (
  id,
  email,
  name,
  phone,
  password,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'superadmin@paytalk.com',
  '슈퍼 관리자',
  '010-0000-0000',
  'admin123',
  'super_admin',
  'active',
  NOW(),
  NOW()
);

-- 3. 생성 확인
SELECT * FROM users WHERE role = 'super_admin';
