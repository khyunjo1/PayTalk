-- 뷰 보안 원래대로 되돌리기
-- Supabase SQL 에디터에서 실행하세요.

-- 1. 기존 뷰 삭제
DROP VIEW IF EXISTS public.store_analytics CASCADE;
DROP VIEW IF EXISTS public.user_analytics CASCADE;
DROP VIEW IF EXISTS public.order_analytics CASCADE;

-- 2. 뷰를 원래대로 재생성 (SECURITY DEFINER 없이)
CREATE VIEW public.store_analytics AS
SELECT 
  s.id as store_id,
  s.name as store_name,
  COUNT(o.id) as total_orders,
  COALESCE(SUM(o.total), 0) as total_revenue,
  COALESCE(AVG(o.total), 0) as avg_order_value,
  COUNT(CASE WHEN o.status = '입금확인' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN o.status = '입금대기' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN o.status = '주문취소' THEN 1 END) as cancelled_orders
FROM public.stores s
LEFT JOIN public.orders o ON s.id = o.store_id
GROUP BY s.id, s.name;

CREATE VIEW public.user_analytics AS
SELECT 
  u.id as user_id,
  u.phone,
  COUNT(o.id) as total_orders,
  COALESCE(SUM(o.total), 0) as total_spent,
  COALESCE(AVG(o.total), 0) as avg_order_value,
  MAX(o.created_at) as last_order_date
FROM public.users u
LEFT JOIN public.orders o ON u.id = o.user_id
GROUP BY u.id, u.phone;

CREATE VIEW public.order_analytics AS
SELECT 
  DATE(o.created_at) as order_date,
  COUNT(o.id) as total_orders,
  COALESCE(SUM(o.total), 0) as total_revenue,
  COALESCE(AVG(o.total), 0) as avg_order_value,
  COUNT(CASE WHEN o.status = '입금확인' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN o.status = '입금대기' THEN 1 END) as pending_orders
FROM public.orders o
GROUP BY DATE(o.created_at)
ORDER BY order_date DESC;

-- 3. 뷰 권한 설정 (원래대로)
GRANT SELECT ON public.store_analytics TO authenticated;
GRANT SELECT ON public.user_analytics TO authenticated;
GRANT SELECT ON public.order_analytics TO authenticated;

-- 4. 확인용 쿼리
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%analytics%';
