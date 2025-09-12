-- user_push_subscriptions 테이블에 phone_number 컬럼 추가
ALTER TABLE public.user_push_subscriptions 
ADD COLUMN phone_number TEXT;

-- phone_number 컬럼에 인덱스 추가
CREATE INDEX idx_user_push_subscriptions_phone_number 
ON public.user_push_subscriptions(phone_number);

-- 제약조건 추가: user_id 또는 phone_number 중 하나는 반드시 있어야 함
-- 먼저 기존 제약조건이 있는지 확인하고 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_user_or_phone' 
        AND table_name = 'user_push_subscriptions'
    ) THEN
        ALTER TABLE public.user_push_subscriptions 
        ADD CONSTRAINT check_user_or_phone 
        CHECK (
            (user_id IS NOT NULL AND phone_number IS NULL) OR 
            (user_id IS NULL AND phone_number IS NOT NULL)
        );
    END IF;
END $$;

-- 전화번호 기반 푸시 구독을 위한 RLS 정책 추가
-- 먼저 기존 정책이 있는지 확인하고 추가
DO $$
BEGIN
    -- Anyone can view phone-based push subscriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Anyone can view phone-based push subscriptions' 
        AND tablename = 'user_push_subscriptions'
    ) THEN
        CREATE POLICY "Anyone can view phone-based push subscriptions" 
        ON public.user_push_subscriptions
        FOR SELECT USING (phone_number IS NOT NULL);
    END IF;

    -- Anyone can insert phone-based push subscriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Anyone can insert phone-based push subscriptions' 
        AND tablename = 'user_push_subscriptions'
    ) THEN
        CREATE POLICY "Anyone can insert phone-based push subscriptions" 
        ON public.user_push_subscriptions
        FOR INSERT WITH CHECK (phone_number IS NOT NULL);
    END IF;

    -- Anyone can update phone-based push subscriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Anyone can update phone-based push subscriptions' 
        AND tablename = 'user_push_subscriptions'
    ) THEN
        CREATE POLICY "Anyone can update phone-based push subscriptions" 
        ON public.user_push_subscriptions
        FOR UPDATE USING (phone_number IS NOT NULL);
    END IF;

    -- Anyone can delete phone-based push subscriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Anyone can delete phone-based push subscriptions' 
        AND tablename = 'user_push_subscriptions'
    ) THEN
        CREATE POLICY "Anyone can delete phone-based push subscriptions" 
        ON public.user_push_subscriptions
        FOR DELETE USING (phone_number IS NOT NULL);
    END IF;
END $$;
