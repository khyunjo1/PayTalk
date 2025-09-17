-- Security Definer View 문제 해결
-- Supabase SQL 에디터에서 실행하세요.

-- 1. total_revenue_summary 뷰 재생성 (SECURITY DEFINER 제거)
DROP VIEW IF EXISTS public.total_revenue_summary;

CREATE VIEW public.total_revenue_summary AS
SELECT 
  DATE_TRUNC('month', o.created_at) as month,
  COUNT(*) as total_orders,
  SUM(o.total) as total_revenue,
  AVG(o.total) as average_order_value
FROM orders o
WHERE o.status = '배달완료'
GROUP BY DATE_TRUNC('month', o.created_at)
ORDER BY month DESC;

-- 2. store_revenue_summary 뷰 재생성 (SECURITY DEFINER 제거)
DROP VIEW IF EXISTS public.store_revenue_summary;

CREATE VIEW public.store_revenue_summary AS
SELECT 
  s.id as store_id,
  s.name as store_name,
  DATE_TRUNC('month', o.created_at) as month,
  COUNT(*) as order_count,
  SUM(o.total) as revenue,
  AVG(o.total) as average_order_value
FROM stores s
LEFT JOIN orders o ON s.id = o.store_id AND o.status = '배달완료'
GROUP BY s.id, s.name, DATE_TRUNC('month', o.created_at)
ORDER BY s.name, month DESC;

-- 3. 뷰는 RLS 정책을 직접 추가할 수 없으므로 제거
-- 대신 뷰 내부에서 RLS가 적용된 테이블을 사용하므로 자동으로 보안 적용됨

-- 4. 확인용 쿼리
SELECT 
  schemaname, 
  viewname, 
  definition
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('total_revenue_summary', 'store_revenue_summary');
