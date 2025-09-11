-- 푸시 구독 테이블에 전화번호 컬럼 추가

-- 1. user_push_subscriptions 테이블에 phone 컬럼 추가
ALTER TABLE public.user_push_subscriptions 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 2. phone 컬럼에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_phone ON public.user_push_subscriptions(phone);

-- 3. phone 컬럼에 대한 RLS 정책 추가
CREATE POLICY "Anyone can create push subscription by phone" ON public.user_push_subscriptions
  FOR INSERT WITH CHECK (true);

-- 4. orders 테이블에 customer_phone 컬럼 추가 (없는 경우)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

-- 5. customer_phone 컬럼에 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
