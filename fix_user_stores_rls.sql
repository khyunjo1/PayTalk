-- user_stores 테이블 RLS 정책 수정
-- Supabase SQL Editor에서 실행하세요

-- 기존 정책 삭제 (모든 가능한 정책명 확인 후 삭제)
DROP POLICY IF EXISTS "Users can manage their own store connections" ON user_stores;
DROP POLICY IF EXISTS "Anyone can access user_stores" ON user_stores;
DROP POLICY IF EXISTS "Anyone can view user_stores" ON user_stores;
DROP POLICY IF EXISTS "Anyone can insert user_stores" ON user_stores;
DROP POLICY IF EXISTS "Anyone can update user_stores" ON user_stores;
DROP POLICY IF EXISTS "Anyone can delete user_stores" ON user_stores;
DROP POLICY IF EXISTS "Users can view their own store connections" ON user_stores;
DROP POLICY IF EXISTS "Users can insert their own store connections" ON user_stores;
DROP POLICY IF EXISTS "Users can update their own store connections" ON user_stores;
DROP POLICY IF EXISTS "Users can delete their own store connections" ON user_stores;

-- user_stores 테이블에 대한 RLS 정책 생성
-- 1. 모든 사용자가 user_stores를 조회할 수 있음
CREATE POLICY "Anyone can view user_stores" ON user_stores
  FOR SELECT USING (true);

-- 2. 모든 사용자가 user_stores에 INSERT할 수 있음 (사용자 승인용)
CREATE POLICY "Anyone can insert user_stores" ON user_stores
  FOR INSERT WITH CHECK (true);

-- 3. 모든 사용자가 user_stores를 UPDATE할 수 있음
CREATE POLICY "Anyone can update user_stores" ON user_stores
  FOR UPDATE USING (true);

-- 4. 모든 사용자가 user_stores를 DELETE할 수 있음
CREATE POLICY "Anyone can delete user_stores" ON user_stores
  FOR DELETE USING (true);

-- 완료 메시지
SELECT 'user_stores 테이블 RLS 정책이 수정되었습니다.' as message;
