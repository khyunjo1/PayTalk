-- 푸시 알림 정책 수정 (기존 정책 삭제 후 재생성)

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.user_push_subscriptions;
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.user_push_subscriptions;

-- 2. 새로운 정책 생성
CREATE POLICY "Users can view their own push subscriptions" ON public.user_push_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own push subscriptions" ON public.user_push_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- 3. 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_push_subscriptions';
