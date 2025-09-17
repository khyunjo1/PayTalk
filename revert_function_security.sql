-- 함수 보안 원래대로 되돌리기
-- Supabase SQL 에디터에서 실행하세요.

-- 1. 함수들을 원래대로 되돌리기 (SECURITY DEFINER 제거)
CREATE OR REPLACE FUNCTION public.get_user_owned_stores(user_id_param UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  phone TEXT,
  bank_account TEXT,
  account_holder TEXT,
  owner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.phone,
    s.bank_account,
    s.account_holder,
    s.owner_id,
    s.created_at,
    s.updated_at
  FROM public.stores s
  JOIN public.user_stores us ON s.id = us.store_id
  WHERE us.user_id = user_id_param AND us.role = 'owner';
END;
$$;

-- 2. 다른 함수들도 원래대로 되돌리기
CREATE OR REPLACE FUNCTION public.get_store_orders(store_id_param UUID)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  store_id UUID,
  total_amount INTEGER,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.user_id,
    o.store_id,
    o.total_amount,
    o.status,
    o.created_at,
    o.updated_at
  FROM public.orders o
  WHERE o.store_id = store_id_param;
END;
$$;

-- 3. 함수 권한 설정 (원래대로)
GRANT EXECUTE ON FUNCTION public.get_user_owned_stores(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_store_orders(UUID) TO authenticated;

-- 4. 확인용 쿼리
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_owned_stores', 'get_store_orders');
