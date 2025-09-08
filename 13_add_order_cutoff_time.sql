-- 매장 테이블에 주문접수시간 필드 추가
-- 실행 날짜: 2024년

-- 1. stores 테이블에 order_cutoff_time 컬럼 추가
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS order_cutoff_time TIME DEFAULT '15:00:00';

-- 2. 컬럼 추가 확인
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stores'
AND column_name = 'order_cutoff_time';

-- 3. 기존 매장들에 기본값 설정 (오후 3시)
UPDATE public.stores
SET order_cutoff_time = '15:00:00'
WHERE order_cutoff_time IS NULL;

-- 4. 컬럼에 대한 설명 추가
COMMENT ON COLUMN public.stores.order_cutoff_time IS '주문 접수 마감 시간 (이 시간 이후 주문은 다음날 배송)';

-- 완료 메시지
SELECT '매장 테이블에 order_cutoff_time 필드가 성공적으로 추가되었습니다.' as message;
