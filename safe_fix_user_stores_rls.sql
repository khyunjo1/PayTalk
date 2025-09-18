-- user_stores 테이블 RLS 정책 안전하게 수정
-- Supabase SQL Editor에서 실행하세요

-- 1. 현재 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_stores'
ORDER BY policyname;

-- 2. 모든 기존 정책 삭제 (동적으로)
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    -- user_stores 테이블의 모든 정책 삭제
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'user_stores'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_stores', policy_record.policyname);
        RAISE NOTICE '정책 삭제됨: %', policy_record.policyname;
    END LOOP;
END $$;

-- 3. 새로운 정책 생성
CREATE POLICY "Anyone can view user_stores" ON user_stores
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert user_stores" ON user_stores
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update user_stores" ON user_stores
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete user_stores" ON user_stores
  FOR DELETE USING (true);

-- 4. 생성된 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_stores'
ORDER BY policyname;

-- 완료 메시지
SELECT 'user_stores 테이블 RLS 정책이 안전하게 수정되었습니다.' as message;
