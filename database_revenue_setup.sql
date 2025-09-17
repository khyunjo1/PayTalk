-- 수익 관리 테이블 생성
-- Supabase SQL 에디터에서 실행하세요

-- 1. store_contracts 테이블 (매장 계약 정보)
CREATE TABLE IF NOT EXISTS store_contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  initial_fee INTEGER NOT NULL DEFAULT 1000000, -- 첫 계약금 100만원
  monthly_fee INTEGER NOT NULL DEFAULT 30000, -- 월 고정비 3만원
  contract_start_date DATE NOT NULL,
  contract_end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. revenue_records 테이블 (수익 기록)
CREATE TABLE IF NOT EXISTS revenue_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  revenue_type VARCHAR(20) NOT NULL CHECK (revenue_type IN ('initial', 'monthly', 'additional')),
  amount INTEGER NOT NULL,
  description TEXT,
  record_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_store_contracts_store_id ON store_contracts(store_id);
CREATE INDEX IF NOT EXISTS idx_store_contracts_active ON store_contracts(is_active);
CREATE INDEX IF NOT EXISTS idx_revenue_records_store_id ON revenue_records(store_id);
CREATE INDEX IF NOT EXISTS idx_revenue_records_date ON revenue_records(record_date);
CREATE INDEX IF NOT EXISTS idx_revenue_records_type ON revenue_records(revenue_type);

-- 4. RLS 정책 설정
ALTER TABLE store_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_records ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성 (super_admin만 접근 가능)
-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "super_admin_all_access_contracts" ON store_contracts;
DROP POLICY IF EXISTS "super_admin_all_access_revenue" ON revenue_records;

CREATE POLICY "super_admin_all_access_contracts" ON store_contracts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "super_admin_all_access_revenue" ON revenue_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- 6. 기존 매장들에 대한 계약 정보 자동 생성 (선택사항)
-- INSERT INTO store_contracts (store_id, contract_start_date)
-- SELECT id, created_at::date 
-- FROM stores 
-- WHERE NOT EXISTS (
--   SELECT 1 FROM store_contracts WHERE store_contracts.store_id = stores.id
-- );

-- 7. 월별 수익 자동 생성 함수 (선택사항)
-- 기존 함수 삭제 후 재생성
DROP FUNCTION IF EXISTS generate_monthly_revenue();
CREATE OR REPLACE FUNCTION generate_monthly_revenue()
RETURNS void AS $$
DECLARE
  contract_record RECORD;
  current_month DATE;
  current_month_end DATE;
BEGIN
  current_month := DATE_TRUNC('month', CURRENT_DATE);
  current_month_end := (current_month + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  
  FOR contract_record IN 
    SELECT sc.*, s.name as store_name
    FROM store_contracts sc
    JOIN stores s ON sc.store_id = s.id
    WHERE sc.is_active = true
    AND sc.contract_start_date <= current_month_end
    AND (sc.contract_end_date IS NULL OR sc.contract_end_date >= current_month)
  LOOP
    -- 해당 월의 월 고정비가 이미 기록되었는지 확인
    IF NOT EXISTS (
      SELECT 1 FROM revenue_records 
      WHERE store_id = contract_record.store_id 
      AND revenue_type = 'monthly'
      AND DATE_TRUNC('month', record_date) = current_month
    ) THEN
      -- 월 고정비 기록 (3만원)
      INSERT INTO revenue_records (store_id, revenue_type, amount, description, record_date)
      VALUES (
        contract_record.store_id,
        'monthly',
        30000, -- 고정 3만원
        contract_record.store_name || ' 월 고정비 (' || TO_CHAR(current_month, 'YYYY-MM') || ')',
        current_month
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. 트리거 함수 (매장 생성 시 자동으로 계약 정보 생성)
-- 기존 트리거와 함수 삭제 후 재생성
DROP TRIGGER IF EXISTS trigger_create_store_contract ON stores;
DROP FUNCTION IF EXISTS create_store_contract() CASCADE;
CREATE OR REPLACE FUNCTION create_store_contract()
RETURNS TRIGGER AS $$
BEGIN
  -- 매장 생성 시 자동으로 계약 정보 생성 (100만원 + 월 3만원)
  INSERT INTO store_contracts (store_id, initial_fee, monthly_fee, contract_start_date)
  VALUES (NEW.id, 1000000, 30000, NEW.created_at::date);
  
  -- 첫 계약금 수익 기록
  INSERT INTO revenue_records (store_id, revenue_type, amount, description, record_date)
  VALUES (
    NEW.id, 
    'initial', 
    1000000, 
    NEW.name || ' 신규 매장 계약금', 
    NEW.created_at::date
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. 트리거 생성
CREATE TRIGGER trigger_create_store_contract
  AFTER INSERT ON stores
  FOR EACH ROW
  EXECUTE FUNCTION create_store_contract();

-- 10. 뷰 생성 (총 수익 계산용)
-- 기존 뷰 삭제 후 재생성
DROP VIEW IF EXISTS total_revenue_summary;
CREATE OR REPLACE VIEW total_revenue_summary AS
SELECT 
  DATE_TRUNC('month', record_date) as month,
  SUM(CASE WHEN revenue_type = 'initial' THEN amount ELSE 0 END) as initial_revenue,
  SUM(CASE WHEN revenue_type = 'monthly' THEN amount ELSE 0 END) as monthly_revenue,
  SUM(CASE WHEN revenue_type = 'additional' THEN amount ELSE 0 END) as additional_revenue,
  SUM(amount) as total_revenue
FROM revenue_records
GROUP BY DATE_TRUNC('month', record_date)
ORDER BY month DESC;

-- 11. 뷰 생성 (매장별 수익 요약)
-- 기존 뷰 삭제 후 재생성
DROP VIEW IF EXISTS store_revenue_summary;
CREATE OR REPLACE VIEW store_revenue_summary AS
SELECT 
  s.id as store_id,
  s.name as store_name,
  COALESCE(sc.initial_fee, 1000000) as initial_fee,
  COALESCE(sc.monthly_fee, 30000) as monthly_fee,
  COALESCE(SUM(CASE WHEN rr.revenue_type = 'initial' THEN rr.amount ELSE 0 END), 0) as total_initial_revenue,
  COALESCE(SUM(CASE WHEN rr.revenue_type = 'monthly' THEN rr.amount ELSE 0 END), 0) as total_monthly_revenue,
  COALESCE(SUM(CASE WHEN rr.revenue_type = 'additional' THEN rr.amount ELSE 0 END), 0) as total_additional_revenue,
  COALESCE(SUM(rr.amount), 0) as total_revenue,
  COALESCE(sc.contract_start_date, s.created_at::date) as contract_start_date,
  COALESCE(sc.is_active, true) as is_active
FROM stores s
LEFT JOIN store_contracts sc ON s.id = sc.store_id
LEFT JOIN revenue_records rr ON s.id = rr.store_id
GROUP BY s.id, s.name, sc.initial_fee, sc.monthly_fee, sc.contract_start_date, sc.is_active, s.created_at
ORDER BY total_revenue DESC;
