-- daily_menus 테이블에 매장 설정값 필드들 추가
-- 일일 주문서에서 매일매일 설정할 수 있는 값들

-- 1. 픽업시간 설정 필드 추가 (이미 존재하는지 확인 후 추가)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_menus' AND column_name = 'pickup_time_slots') THEN
        ALTER TABLE daily_menus ADD COLUMN pickup_time_slots JSONB DEFAULT '["09:00", "20:00"]'::jsonb;
    END IF;
END $$;

-- 2. 배달시간 설정 필드 추가 (이미 존재하는지 확인 후 추가)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_menus' AND column_name = 'delivery_time_slots') THEN
        ALTER TABLE daily_menus ADD COLUMN delivery_time_slots JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 3. 배달비 설정은 delivery_areas 테이블을 통해 관리 (별도 필드 불필요)

-- 4. 주문마감시간 필드 추가 (이미 존재하는지 확인 후 추가)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_menus' AND column_name = 'order_cutoff_time') THEN
        ALTER TABLE daily_menus ADD COLUMN order_cutoff_time TIME;
    END IF;
END $$;

-- 5. 최소주문금액 필드 추가 (이미 존재하는지 확인 후 추가)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'daily_menus' AND column_name = 'minimum_order_amount') THEN
        ALTER TABLE daily_menus ADD COLUMN minimum_order_amount INTEGER DEFAULT 0;
    END IF;
END $$;

-- 6. 일일 배달지역 테이블 생성 (이미 존재하는지 확인 후 생성)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name = 'daily_delivery_areas') THEN
        CREATE TABLE daily_delivery_areas (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          daily_menu_id UUID NOT NULL REFERENCES daily_menus(id) ON DELETE CASCADE,
          area_name VARCHAR(255) NOT NULL, -- 배달지역명 (예: "평거동", "이현동", "신앙동")
          delivery_fee INTEGER NOT NULL DEFAULT 0, -- 배달비 (원 단위)
          is_active BOOLEAN DEFAULT true, -- 활성화 여부
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- 같은 일일 메뉴에서 같은 지역명은 하나만 존재
          UNIQUE(daily_menu_id, area_name)
        );
    END IF;
END $$;

-- 7. 컬럼 코멘트 추가
COMMENT ON COLUMN daily_menus.pickup_time_slots IS '픽업 가능 시간대 (시작시간, 종료시간)';
COMMENT ON COLUMN daily_menus.delivery_time_slots IS '배달 시간대 설정 (JSON 배열)';
COMMENT ON COLUMN daily_menus.order_cutoff_time IS '주문 마감 시간';
COMMENT ON COLUMN daily_menus.minimum_order_amount IS '최소 주문 금액 (원)';
COMMENT ON TABLE daily_delivery_areas IS '일일 메뉴별 배달지역과 배달비 관리';

-- 8. 기존 데이터에 기본값 설정 (stores 테이블에서 가져오기)
UPDATE daily_menus 
SET 
  pickup_time_slots = s.pickup_time_slots,
  delivery_time_slots = s.delivery_time_slots,
  order_cutoff_time = s.order_cutoff_time,
  minimum_order_amount = s.minimum_order_amount
FROM stores s 
WHERE daily_menus.store_id = s.id;

-- 9. 기존 daily_menus에 기본 배달지역 복사 (delivery_areas에서)
INSERT INTO daily_delivery_areas (daily_menu_id, area_name, delivery_fee, is_active)
SELECT 
  dm.id as daily_menu_id,
  da.area_name,
  da.delivery_fee,
  da.is_active
FROM daily_menus dm
CROSS JOIN delivery_areas da
WHERE da.store_id = dm.store_id
ON CONFLICT (daily_menu_id, area_name) DO NOTHING;

-- 10. 인덱스 추가 (성능 최적화) - 이미 존재하는지 확인 후 생성
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_daily_menus_settings') THEN
        CREATE INDEX idx_daily_menus_settings ON daily_menus(store_id, menu_date, is_active);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_daily_delivery_areas_daily_menu') THEN
        CREATE INDEX idx_daily_delivery_areas_daily_menu ON daily_delivery_areas(daily_menu_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_daily_delivery_areas_active') THEN
        CREATE INDEX idx_daily_delivery_areas_active ON daily_delivery_areas(is_active);
    END IF;
END $$;

-- 11. RLS 정책 설정
DO $$ 
BEGIN
    -- RLS 활성화
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'daily_delivery_areas' AND relrowsecurity = true) THEN
        ALTER TABLE daily_delivery_areas ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- RLS 정책 생성 (이미 존재하는지 확인 후 생성)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_delivery_areas' AND policyname = '사장님은 자신의 매장 일일 배달지역을 관리할 수 있음') THEN
        CREATE POLICY "사장님은 자신의 매장 일일 배달지역을 관리할 수 있음" ON daily_delivery_areas
          FOR ALL USING (daily_menu_id IN (
            SELECT dm.id FROM daily_menus dm 
            WHERE dm.store_id IN (
              SELECT id FROM stores WHERE owner_id = auth.uid()
            )
          ));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_delivery_areas' AND policyname = '모든 사용자는 활성화된 일일 배달지역을 조회할 수 있음') THEN
        CREATE POLICY "모든 사용자는 활성화된 일일 배달지역을 조회할 수 있음" ON daily_delivery_areas
          FOR SELECT USING (is_active = true);
    END IF;
    
    -- 임시로 모든 사용자가 배달지역을 관리할 수 있도록 허용 (개발 단계)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_delivery_areas' AND policyname = '임시 모든 사용자 접근 허용') THEN
        CREATE POLICY "임시 모든 사용자 접근 허용" ON daily_delivery_areas
          FOR ALL USING (true);
    END IF;
    
    -- 개발 단계에서 RLS 임시 비활성화 (나중에 제거해야 함)
    ALTER TABLE daily_delivery_areas DISABLE ROW LEVEL SECURITY;
END $$;
