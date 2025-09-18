-- 주문 읽음 상태 추가
-- orders 테이블에 read_at 컬럼 추가

-- read_at 컬럼 추가 (관리자가 주문을 읽은 시간)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_orders_read_at ON public.orders(read_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_read_at ON public.orders(status, read_at);

-- 기존 주문들은 모두 읽은 것으로 처리 (선택사항)
-- UPDATE public.orders SET read_at = updated_at WHERE read_at IS NULL;