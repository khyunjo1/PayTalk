-- 알림톡 발송 로그 테이블 생성
CREATE TABLE IF NOT EXISTS alimtalk_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  recipient_phone VARCHAR(20) NOT NULL,
  template_id VARCHAR(100) NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_alimtalk_logs_order_id ON alimtalk_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_alimtalk_logs_recipient_phone ON alimtalk_logs(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_alimtalk_logs_sent_at ON alimtalk_logs(sent_at);

-- RLS 정책 설정
ALTER TABLE alimtalk_logs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (로그 조회용)
CREATE POLICY "Anyone can view alimtalk logs" ON alimtalk_logs
  FOR SELECT USING (true);

-- 관리자만 삽입 가능
CREATE POLICY "Admins can insert alimtalk logs" ON alimtalk_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
