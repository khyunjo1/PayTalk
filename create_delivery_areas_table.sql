-- 배달지역별 배달비 관리를 위한 테이블 생성 SQL

-- 1. delivery_areas 테이블: 배달지역과 배달비 정보
CREATE TABLE delivery_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  area_name VARCHAR(255) NOT NULL, -- 배달지역명 (예: "강남구", "서초구", "송파구")
  delivery_fee INTEGER NOT NULL DEFAULT 0, -- 배달비 (원 단위)
  is_active BOOLEAN DEFAULT true, -- 활성화 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 같은 매장에서 같은 지역명은 하나만 존재
  UNIQUE(store_id, area_name)
);

-- 2. orders 테이블에 배달지역 정보 추가 (기존 테이블 수정)
ALTER TABLE orders ADD COLUMN delivery_fee INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN delivery_area_id UUID REFERENCES delivery_areas(id) ON DELETE SET NULL;

-- 인덱스 생성
CREATE INDEX idx_delivery_areas_store ON delivery_areas(store_id);
CREATE INDEX idx_delivery_areas_active ON delivery_areas(is_active);
CREATE INDEX idx_orders_delivery_area ON orders(delivery_area_id);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE delivery_areas ENABLE ROW LEVEL SECURITY;

-- delivery_areas RLS 정책
CREATE POLICY "사장님은 자신의 매장 배달지역을 관리할 수 있음" ON delivery_areas
  FOR ALL USING (store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
  ));

CREATE POLICY "모든 사용자는 활성화된 배달지역을 조회할 수 있음" ON delivery_areas
  FOR SELECT USING (is_active = true);

-- 기존 orders 테이블의 delivery_fee 컬럼을 기본값 0으로 설정 (기존 데이터 호환성)
UPDATE orders SET delivery_fee = 0 WHERE delivery_fee IS NULL;
