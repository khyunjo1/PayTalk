-- 푸시 알림 관련 테이블 생성

-- 1. 사용자 푸시 구독 정보 테이블
CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_push_subscriptions_user_id ON public.user_push_subscriptions(user_id);

-- 3. RLS 정책 설정
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 푸시 구독 정보만 볼 수 있음
CREATE POLICY "Users can view their own push subscriptions" ON public.user_push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- 사용자는 자신의 푸시 구독 정보를 생성/수정할 수 있음
CREATE POLICY "Users can manage their own push subscriptions" ON public.user_push_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- 4. updated_at 자동 업데이트 트리거
CREATE OR REPLACE TRIGGER update_user_push_subscriptions_updated_at
  BEFORE UPDATE ON public.user_push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. stores 테이블에 owner_id 컬럼 추가 (없는 경우)
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 6. orders 테이블에 store_id 컬럼 추가 (없는 경우)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- 7. 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
