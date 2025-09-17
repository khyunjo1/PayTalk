-- 함수 보안 강화: search_path 설정
-- Supabase SQL 에디터에서 실행하세요.

-- 1. update_updated_at_column 함수 보안 강화
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. handle_new_user 함수 보안 강화
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, profile_image, phone, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'customer',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. create_store_contract 함수 보안 강화
CREATE OR REPLACE FUNCTION create_store_contract(
  p_user_id UUID,
  p_store_id UUID
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_stores (user_id, store_id, role, created_at, updated_at)
  VALUES (p_user_id, p_store_id, 'owner', NOW(), NOW());
END;
$$ LANGUAGE plpgsql;

-- 4. generate_monthly_revenue 함수 보안 강화
CREATE OR REPLACE FUNCTION generate_monthly_revenue(
  p_store_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE(
  store_id UUID,
  year INTEGER,
  month INTEGER,
  total_revenue NUMERIC,
  order_count INTEGER
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.store_id,
    p_year as year,
    p_month as month,
    COALESCE(SUM(o.total), 0) as total_revenue,
    COUNT(*)::INTEGER as order_count
  FROM orders o
  WHERE o.store_id = p_store_id
    AND EXTRACT(YEAR FROM o.created_at) = p_year
    AND EXTRACT(MONTH FROM o.created_at) = p_month
    AND o.status = '배달완료'
  GROUP BY o.store_id;
END;
$$ LANGUAGE plpgsql;

-- 5. update_admin_pin_updated_at 함수 보안 강화
CREATE OR REPLACE FUNCTION update_admin_pin_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

