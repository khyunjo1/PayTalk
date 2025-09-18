-- orders 테이블의 delivery_time과 pickup_time 컬럼을 TIMESTAMP에서 TEXT로 변경
-- 사용자가 선택한 시간 슬롯 문자열을 그대로 저장

-- 기존 컬럼 삭제
ALTER TABLE orders DROP COLUMN IF EXISTS delivery_time;
ALTER TABLE orders DROP COLUMN IF EXISTS pickup_time;

-- 새로운 TEXT 컬럼 추가
ALTER TABLE orders ADD COLUMN delivery_time TEXT;
ALTER TABLE orders ADD COLUMN pickup_time TEXT;

-- 컬럼에 대한 설명 추가
COMMENT ON COLUMN orders.delivery_time IS '배달 희망 시간 (예: "아침 배송 (09:00-10:00)")';
COMMENT ON COLUMN orders.pickup_time IS '픽업 희망 시간 (예: "14:00")';
