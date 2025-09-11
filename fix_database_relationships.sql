-- 데이터베이스 관계 수정 스크립트

-- 1. stores 테이블에 owner_id 컬럼이 있는지 확인하고 없으면 추가
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 2. 기존 stores 데이터에 owner_id 설정 (user_stores 테이블을 통해)
UPDATE public.stores 
SET owner_id = (
  SELECT us.user_id 
  FROM public.user_stores us 
  WHERE us.store_id = stores.id 
  AND us.role = 'admin'
  LIMIT 1
)
WHERE owner_id IS NULL;

-- 3. orders 테이블의 stores 관계 확인 및 수정
-- orders 테이블에 store_id가 있는지 확인
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE;

-- 4. 기존 orders 데이터에 store_id 설정 (필요한 경우)
-- 이 부분은 실제 데이터 구조에 따라 조정이 필요할 수 있습니다

-- 5. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON public.stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);

-- 6. RLS 정책 확인 및 수정
-- stores 테이블 RLS 정책
DROP POLICY IF EXISTS "Users can view their own stores" ON public.stores;
CREATE POLICY "Users can view their own stores" ON public.stores
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.user_stores 
      WHERE store_id = stores.id AND user_id = auth.uid()
    )
  );

-- 7. 현재 테이블 구조 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('stores', 'orders', 'users', 'user_stores')
ORDER BY table_name, ordinal_position;
