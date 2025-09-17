-- 푸시 알림 구독 정보를 저장하는 테이블 생성
-- Supabase SQL 에디터에서 실행하세요.

-- 1. user_push_subscriptions 테이블 생성
CREATE TABLE IF NOT EXISTS user_push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_user_id ON user_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_created_at ON user_push_subscriptions(created_at);

-- 3. RLS (Row Level Security) 정책 설정
ALTER TABLE user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON user_push_subscriptions;

-- 사용자는 자신의 푸시 구독 정보만 조회/수정 가능
CREATE POLICY "Users can manage their own push subscriptions" ON user_push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- 4. updated_at 자동 업데이트를 위한 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS update_user_push_subscriptions_updated_at ON user_push_subscriptions;

CREATE TRIGGER update_user_push_subscriptions_updated_at
  BEFORE UPDATE ON user_push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. 테이블 생성 확인
SELECT 'user_push_subscriptions 테이블이 성공적으로 생성되었습니다.' as message;
