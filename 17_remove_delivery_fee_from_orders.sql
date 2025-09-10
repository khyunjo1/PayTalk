-- orders 테이블에서 delivery_fee 컬럼 삭제
ALTER TABLE public.orders
DROP COLUMN delivery_fee;
