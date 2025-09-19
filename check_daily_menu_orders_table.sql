-- daily_menu_orders 테이블 존재 여부 확인

-- 1. 테이블 존재 여부 확인
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename = 'daily_menu_orders';

-- 2. 테이블 구조 확인 (테이블이 존재하는 경우)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'daily_menu_orders' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. 테이블이 없으면 생성
DO $$
BEGIN
  -- 테이블이 존재하지 않으면 생성
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'daily_menu_orders'
  ) THEN
    CREATE TABLE daily_menu_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      daily_menu_id UUID NOT NULL REFERENCES daily_menus(id) ON DELETE CASCADE,
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL, -- 주문 수량
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- 같은 주문에서 같은 메뉴는 하나만 존재
      UNIQUE(order_id, menu_id)
    );
    
    -- 인덱스 생성
    CREATE INDEX idx_daily_menu_orders_daily_menu ON daily_menu_orders(daily_menu_id);
    CREATE INDEX idx_daily_menu_orders_order ON daily_menu_orders(order_id);
    
    -- RLS 활성화
    ALTER TABLE daily_menu_orders ENABLE ROW LEVEL SECURITY;
    
    -- RLS 정책 생성
    CREATE POLICY "모든 사용자는 일일 메뉴 주문을 생성할 수 있음" ON daily_menu_orders
      FOR INSERT WITH CHECK (true);
      
    CREATE POLICY "사장님은 자신의 매장 일일 메뉴 주문을 조회할 수 있음" ON daily_menu_orders
      FOR SELECT USING (daily_menu_id IN (
        SELECT id FROM daily_menus WHERE store_id IN (
          SELECT id FROM stores WHERE owner_id = auth.uid()
        )
      ));
    
    RAISE NOTICE 'daily_menu_orders 테이블이 생성되었습니다.';
  ELSE
    RAISE NOTICE 'daily_menu_orders 테이블이 이미 존재합니다.';
  END IF;
END $$;
