-- orders 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- orders 테이블 샘플 데이터 확인
SELECT * FROM public.orders LIMIT 5;
