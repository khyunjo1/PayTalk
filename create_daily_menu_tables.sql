-- 일일 메뉴 페이지 생성 시스템을 위한 테이블 생성 SQL

-- 1. daily_menus 테이블: 일일 메뉴 페이지 정보
CREATE TABLE daily_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  menu_date DATE NOT NULL, -- 메뉴 날짜 (예: 2024-09-16)
  title VARCHAR(255) DEFAULT '오늘의 반찬', -- 페이지 제목
  description TEXT, -- 페이지 설명
  is_active BOOLEAN DEFAULT true, -- 활성화 여부
  cutoff_time TIME, -- 주문 마감 시간 (stores 테이블의 order_cutoff_time 사용)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 같은 매장에서 같은 날짜의 메뉴는 하나만 존재
  UNIQUE(store_id, menu_date)
);

-- 2. daily_menu_items 테이블: 일일 메뉴에 포함된 아이템들
CREATE TABLE daily_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_menu_id UUID NOT NULL REFERENCES daily_menus(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  initial_quantity INTEGER NOT NULL DEFAULT 0, -- 최초 설정 수량
  current_quantity INTEGER NOT NULL DEFAULT 0, -- 현재 남은 수량
  is_available BOOLEAN DEFAULT true, -- 판매 가능 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 같은 일일 메뉴에서 같은 메뉴는 하나만 존재
  UNIQUE(daily_menu_id, menu_id)
);

-- 3. daily_menu_orders 테이블: 일일 메뉴 주문 내역 (수량 차감 추적용)
CREATE TABLE daily_menu_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_menu_id UUID NOT NULL REFERENCES daily_menus(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL, -- 주문 수량
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 같은 주문에서 같은 메뉴는 하나만 존재
  UNIQUE(order_id, menu_id)
);

-- 인덱스 생성
CREATE INDEX idx_daily_menus_store_date ON daily_menus(store_id, menu_date);
CREATE INDEX idx_daily_menus_date_active ON daily_menus(menu_date, is_active);
CREATE INDEX idx_daily_menu_items_daily_menu ON daily_menu_items(daily_menu_id);
CREATE INDEX idx_daily_menu_items_menu ON daily_menu_items(menu_id);
CREATE INDEX idx_daily_menu_orders_daily_menu ON daily_menu_orders(daily_menu_id);
CREATE INDEX idx_daily_menu_orders_order ON daily_menu_orders(order_id);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE daily_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menu_orders ENABLE ROW LEVEL SECURITY;

-- daily_menus RLS 정책
CREATE POLICY "사장님은 자신의 매장 일일 메뉴를 관리할 수 있음" ON daily_menus
  FOR ALL USING (store_id IN (
    SELECT id FROM stores WHERE owner_id = auth.uid()
  ));

CREATE POLICY "모든 사용자는 활성화된 일일 메뉴를 조회할 수 있음" ON daily_menus
  FOR SELECT USING (is_active = true);

-- daily_menu_items RLS 정책
CREATE POLICY "사장님은 자신의 매장 일일 메뉴 아이템을 관리할 수 있음" ON daily_menu_items
  FOR ALL USING (daily_menu_id IN (
    SELECT id FROM daily_menus WHERE store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "모든 사용자는 활성화된 일일 메뉴 아이템을 조회할 수 있음" ON daily_menu_items
  FOR SELECT USING (daily_menu_id IN (
    SELECT id FROM daily_menus WHERE is_active = true
  ));

-- daily_menu_orders RLS 정책
CREATE POLICY "사장님은 자신의 매장 일일 메뉴 주문을 조회할 수 있음" ON daily_menu_orders
  FOR SELECT USING (daily_menu_id IN (
    SELECT id FROM daily_menus WHERE store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "사용자는 자신의 주문을 조회할 수 있음" ON daily_menu_orders
  FOR SELECT USING (order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
  ));

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_daily_menus_updated_at 
  BEFORE UPDATE ON daily_menus 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_menu_items_updated_at 
  BEFORE UPDATE ON daily_menu_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 함수: 일일 메뉴 생성 시 cutoff_time 자동 설정
CREATE OR REPLACE FUNCTION set_daily_menu_cutoff_time()
RETURNS TRIGGER AS $$
BEGIN
  -- stores 테이블에서 order_cutoff_time 가져와서 설정
  SELECT order_cutoff_time INTO NEW.cutoff_time
  FROM stores 
  WHERE id = NEW.store_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER set_daily_menu_cutoff_time_trigger
  BEFORE INSERT ON daily_menus
  FOR EACH ROW EXECUTE FUNCTION set_daily_menu_cutoff_time();

-- 함수: 주문 시 수량 자동 차감
CREATE OR REPLACE FUNCTION update_daily_menu_quantity()
RETURNS TRIGGER AS $$
DECLARE
  daily_menu_uuid UUID;
BEGIN
  -- 주문이 생성될 때 해당 일일 메뉴 찾기
  SELECT dm.id INTO daily_menu_uuid
  FROM daily_menus dm
  JOIN stores s ON dm.store_id = s.id
  WHERE s.id = (SELECT store_id FROM orders WHERE id = NEW.order_id)
    AND dm.menu_date = CURRENT_DATE
    AND dm.is_active = true;
  
  -- 일일 메뉴가 존재하면 수량 차감
  IF daily_menu_uuid IS NOT NULL THEN
    UPDATE daily_menu_items 
    SET current_quantity = current_quantity - NEW.quantity,
        updated_at = NOW()
    WHERE daily_menu_id = daily_menu_uuid 
      AND menu_id = NEW.menu_id;
    
    -- 수량이 0 이하가 되면 품절 처리
    UPDATE daily_menu_items 
    SET is_available = false,
        updated_at = NOW()
    WHERE daily_menu_id = daily_menu_uuid 
      AND menu_id = NEW.menu_id
      AND current_quantity <= 0;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 주문 아이템 생성 시 수량 차감 트리거
CREATE TRIGGER update_daily_menu_quantity_trigger
  AFTER INSERT ON order_items
  FOR EACH ROW EXECUTE FUNCTION update_daily_menu_quantity();

-- 함수: 일일 메뉴 비활성화 (주문 마감 시간 후)
CREATE OR REPLACE FUNCTION deactivate_expired_daily_menus()
RETURNS void AS $$
BEGIN
  UPDATE daily_menus 
  SET is_active = false, updated_at = NOW()
  WHERE is_active = true 
    AND menu_date < CURRENT_DATE
    OR (menu_date = CURRENT_DATE 
        AND cutoff_time < CURRENT_TIME);
END;
$$ language 'plpgsql';

-- 매일 자정에 만료된 일일 메뉴 비활성화 (cron job으로 실행)
-- SELECT cron.schedule('deactivate-daily-menus', '0 0 * * *', 'SELECT deactivate_expired_daily_menus();');

COMMENT ON TABLE daily_menus IS '일일 메뉴 페이지 정보';
COMMENT ON TABLE daily_menu_items IS '일일 메뉴에 포함된 아이템들과 수량 관리';
COMMENT ON TABLE daily_menu_orders IS '일일 메뉴 주문 내역 (수량 차감 추적용)';
COMMENT ON COLUMN daily_menu_items.initial_quantity IS '최초 설정한 수량';
COMMENT ON COLUMN daily_menu_items.current_quantity IS '현재 남은 수량 (주문 시 차감됨)';
COMMENT ON COLUMN daily_menu_orders.quantity IS '주문한 수량 (차감된 수량)';
