-- 수량 관련 컬럼 제거 SQL 스크립트

-- 1. 수량 차감 트리거 제거
DROP TRIGGER IF EXISTS update_daily_menu_quantity_trigger ON order_items;

-- 2. 수량 차감 함수 제거
DROP FUNCTION IF EXISTS update_daily_menu_quantity();

-- 3. daily_menu_items 테이블에서 수량 관련 컬럼 제거
ALTER TABLE daily_menu_items 
DROP COLUMN IF EXISTS initial_quantity,
DROP COLUMN IF EXISTS current_quantity;

-- 4. daily_menu_orders 테이블 제거 (수량 추적용이므로 더 이상 필요 없음)
DROP TABLE IF EXISTS daily_menu_orders;

-- 5. daily_menu_items 테이블의 is_available 컬럼을 NOT NULL로 변경 (품절/판매가능만 관리)
ALTER TABLE daily_menu_items 
ALTER COLUMN is_available SET NOT NULL,
ALTER COLUMN is_available SET DEFAULT true;

-- 6. 테이블 코멘트 업데이트
COMMENT ON TABLE daily_menu_items IS '일일 메뉴에 포함된 아이템들의 판매 가능 여부 관리';
COMMENT ON COLUMN daily_menu_items.is_available IS '판매 가능 여부 (true: 판매가능, false: 품절)';
