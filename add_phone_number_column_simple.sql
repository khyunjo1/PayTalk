-- 간단한 버전: phone_number 컬럼만 추가
ALTER TABLE public.user_push_subscriptions 
ADD COLUMN phone_number TEXT;

-- 인덱스 추가
CREATE INDEX idx_user_push_subscriptions_phone_number 
ON public.user_push_subscriptions(phone_number);
