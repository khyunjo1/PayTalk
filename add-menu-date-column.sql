-- orders 테이블에 menu_date 컬럼 추가
ALTER TABLE orders ADD COLUMN menu_date text;

-- 기존 주문들의 menu_date 업데이트
UPDATE orders 
SET menu_date = CASE 
  WHEN delivery_time IS NOT NULL AND delivery_time ~ '^\d{4}-\d{2}-\d{2}' 
    THEN (regexp_match(delivery_time, '^\d{4}-\d{2}-\d{2}'))[1]
  WHEN pickup_time IS NOT NULL AND pickup_time ~ '^\d{4}-\d{2}-\d{2}' 
    THEN (regexp_match(pickup_time, '^\d{4}-\d{2}-\d{2}'))[1]
  ELSE to_char(created_at, 'YYYY-MM-DD')
END
WHERE menu_date IS NULL;
