-- 사용자별 개인 매장 목록 관리 테이블
CREATE TABLE IF NOT EXISTS user_stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 사용자별로 같은 매장은 중복 등록 불가
  UNIQUE(user_id, store_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_stores_user_id ON user_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stores_store_id ON user_stores(store_id);

-- RLS 정책 설정
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 매장 목록만 조회/수정 가능
CREATE POLICY "Users can view their own stores" ON user_stores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add stores to their list" ON user_stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove stores from their list" ON user_stores
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_user_stores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stores_updated_at
  BEFORE UPDATE ON user_stores
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stores_updated_at();
