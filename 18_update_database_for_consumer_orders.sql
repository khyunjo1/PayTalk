-- 소비자 주문을 위한 데이터베이스 스키마 업데이트

-- 1. orders 테이블에 소비자 정보 필드 추가
ALTER TABLE public.orders
ADD COLUMN customer_name VARCHAR(100),
ADD COLUMN customer_phone VARCHAR(20),
ADD COLUMN customer_address TEXT;

-- 2. orders 테이블의 user_id를 nullable로 변경 (소비자는 로그인하지 않으므로)
ALTER TABLE public.orders
ALTER COLUMN user_id DROP NOT NULL;

-- 3. orders 테이블에 주문 타입 구분 필드 추가 (사장님 주문 vs 소비자 주문)
ALTER TABLE public.orders
ADD COLUMN order_source VARCHAR(20) DEFAULT 'consumer' CHECK (order_source IN ('consumer', 'admin'));

-- 4. 알림톡 발송을 위한 테이블 생성
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  message_type VARCHAR(50) NOT NULL, -- 'order_received', 'payment_confirmed', 'cooking_started', 'delivery_completed', 'order_cancelled', 'status_reverted'
  message_content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 웹푸시 알림을 위한 테이블 생성
CREATE TABLE IF NOT EXISTS public.web_push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_source ON public.orders(order_source);
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON public.notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_phone_number ON public.notifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_web_push_subscriptions_user_id ON public.web_push_subscriptions(user_id);

-- 7. RLS 정책 업데이트 (orders 테이블)
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;

-- 새로운 정책 생성
-- 사장님은 자신의 매장 주문을 볼 수 있음
CREATE POLICY "Store owners can view their store orders" ON public.orders
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM public.user_stores 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- 소비자는 주문 생성 가능 (로그인 없이)
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

-- 슈퍼 어드민은 모든 주문을 볼 수 있음
CREATE POLICY "Super admins can view all orders" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 8. notifications 테이블 RLS 정책
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can view their store notifications" ON public.notifications
  FOR SELECT USING (
    order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.user_stores us ON o.store_id = us.store_id
      WHERE us.user_id = auth.uid() AND us.role = 'owner'
    )
  );

CREATE POLICY "Anyone can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- 9. web_push_subscriptions 테이블 RLS 정책
ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own subscriptions" ON public.web_push_subscriptions
  FOR ALL USING (user_id = auth.uid());
