-- 배달비 관련 컬럼 및 데이터 삭제

-- 1. stores 테이블에서 delivery_fee 컬럼 삭제
ALTER TABLE public.stores DROP COLUMN IF EXISTS delivery_fee;

-- 2. 관련 제약조건 삭제 (있다면)
-- ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS chk_delivery_fee_positive;

-- 3. 기존 데이터 정리 (필요시)
-- UPDATE public.stores SET delivery_fee = 0 WHERE delivery_fee IS NULL;
