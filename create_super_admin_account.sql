-- 슈퍼 어드민 계정 생성 SQL
-- 비밀번호: Laksjluwie!23#

-- 1. 슈퍼 어드민 사용자 생성
INSERT INTO users (
    id,
    email,
    name,
    password,
    role,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'superadmin@paytalk.com',
    '슈퍼 관리자',
    'Laksjluwie!23#',
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    updated_at = NOW();

-- 2. 생성 결과 확인
SELECT '슈퍼 어드민 계정' as item, COUNT(*) as count FROM users WHERE role = 'admin';

-- 3. 계정 정보 출력
SELECT 
    '슈퍼 어드민 계정 정보' as info,
    email,
    name,
    role,
    created_at
FROM users 
WHERE role = 'super-admin';
