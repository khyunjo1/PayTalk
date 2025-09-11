-- user_stores 테이블의 외래키 수정
-- auth.users 대신 public.users를 참조하도록 변경

-- 1. 기존 외래키 제약조건 삭제
ALTER TABLE public.user_stores 
DROP CONSTRAINT IF EXISTS user_stores_user_id_fkey;

-- 2. 새로운 외래키 제약조건 추가 (public.users 참조)
ALTER TABLE public.user_stores 
ADD CONSTRAINT user_stores_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. 결과 확인
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'user_stores';
