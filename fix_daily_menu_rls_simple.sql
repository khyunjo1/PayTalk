-- 일일 메뉴 테이블 RLS 정책 간단 수정

-- 1. 모든 기존 정책 삭제
DROP POLICY IF EXISTS "사장님은 자신의 매장 일일 메뉴를 관리할 수 있음" ON daily_menus;
DROP POLICY IF EXISTS "모든 사용자는 활성화된 일일 메뉴를 조회할 수 있음" ON daily_menus;
DROP POLICY IF EXISTS "인증된 사용자는 일일 메뉴를 생성할 수 있음" ON daily_menus;
DROP POLICY IF EXISTS "사장님은 자신의 매장 일일 메뉴 아이템을 관리할 수 있음" ON daily_menu_items;
DROP POLICY IF EXISTS "모든 사용자는 활성화된 일일 메뉴 아이템을 조회할 수 있음" ON daily_menu_items;
DROP POLICY IF EXISTS "인증된 사용자는 일일 메뉴 아이템을 생성할 수 있음" ON daily_menu_items;
DROP POLICY IF EXISTS "사장님은 자신의 매장 일일 메뉴 주문을 조회할 수 있음" ON daily_menu_orders;
DROP POLICY IF EXISTS "사용자는 자신의 주문을 조회할 수 있음" ON daily_menu_orders;
DROP POLICY IF EXISTS "인증된 사용자는 일일 메뉴 주문을 생성할 수 있음" ON daily_menu_orders;

-- 2. 임시로 RLS 비활성화 (개발용)
ALTER TABLE daily_menus DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menu_orders DISABLE ROW LEVEL SECURITY;

-- 3. 또는 간단한 정책으로 재설정
-- ALTER TABLE daily_menus ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_menu_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_menu_orders ENABLE ROW LEVEL SECURITY;

-- -- 모든 인증된 사용자가 모든 작업 가능 (개발용)
-- CREATE POLICY "모든 인증된 사용자 접근 허용" ON daily_menus
--   FOR ALL USING (auth.uid() IS NOT NULL);

-- CREATE POLICY "모든 인증된 사용자 접근 허용" ON daily_menu_items
--   FOR ALL USING (auth.uid() IS NOT NULL);

-- CREATE POLICY "모든 인증된 사용자 접근 허용" ON daily_menu_orders
--   FOR ALL USING (auth.uid() IS NOT NULL);
