-- 가게 테이블에 최소주문금액 컬럼 추가

-- 1. 최소주문금액 컬럼 추가
ALTER TABLE stores ADD COLUMN minimum_order_amount INTEGER DEFAULT 0;

-- 2. 기존 데이터에 기본값 설정 (0원으로 설정, 필요시 수정)
UPDATE stores SET minimum_order_amount = 0 WHERE minimum_order_amount IS NULL;

-- 3. 컬럼을 NOT NULL로 설정
ALTER TABLE stores ALTER COLUMN minimum_order_amount SET NOT NULL;

-- 4. 최소주문금액이 0 이상이 되도록 제약조건 추가
ALTER TABLE stores ADD CONSTRAINT stores_minimum_order_amount_check 
  CHECK (minimum_order_amount >= 0);

-- 5. 업데이트된 stores 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'stores' 
ORDER BY ordinal_position;
