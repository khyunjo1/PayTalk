-- 일일 메뉴 테이블 RLS 정책 수정

-- 기존 정책 삭제
DROP POLICY IF EXISTS "사장님은 자신의 매장 일일 메뉴를 관리할 수 있음" ON daily_menus;
DROP POLICY IF EXISTS "모든 사용자는 활성화된 일일 메뉴를 조회할 수 있음" ON daily_menus;
DROP POLICY IF EXISTS "사장님은 자신의 매장 일일 메뉴 아이템을 관리할 수 있음" ON daily_menu_items;
DROP POLICY IF EXISTS "모든 사용자는 활성화된 일일 메뉴 아이템을 조회할 수 있음" ON daily_menu_items;
DROP POLICY IF EXISTS "사장님은 자신의 매장 일일 메뉴 주문을 조회할 수 있음" ON daily_menu_orders;
DROP POLICY IF EXISTS "사용자는 자신의 주문을 조회할 수 있음" ON daily_menu_orders;

-- daily_menus 테이블 정책 재생성
CREATE POLICY "사장님은 자신의 매장 일일 메뉴를 관리할 수 있음" ON daily_menus
  FOR ALL USING (
    store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "모든 사용자는 활성화된 일일 메뉴를 조회할 수 있음" ON daily_menus
  FOR SELECT USING (is_active = true);

-- daily_menu_items 테이블 정책 재생성
CREATE POLICY "사장님은 자신의 매장 일일 메뉴 아이템을 관리할 수 있음" ON daily_menu_items
  FOR ALL USING (
    daily_menu_id IN (
      SELECT id FROM daily_menus WHERE store_id IN (
        SELECT id FROM stores WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "모든 사용자는 활성화된 일일 메뉴 아이템을 조회할 수 있음" ON daily_menu_items
  FOR SELECT USING (
    daily_menu_id IN (
      SELECT id FROM daily_menus WHERE is_active = true
    )
  );

-- daily_menu_orders 테이블 정책 재생성
CREATE POLICY "사장님은 자신의 매장 일일 메뉴 주문을 조회할 수 있음" ON daily_menu_orders
  FOR SELECT USING (
    daily_menu_id IN (
      SELECT id FROM daily_menus WHERE store_id IN (
        SELECT id FROM stores WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "사용자는 자신의 주문을 조회할 수 있음" ON daily_menu_orders
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- 추가: 인증된 사용자는 일일 메뉴를 생성할 수 있음 (임시)
CREATE POLICY "인증된 사용자는 일일 메뉴를 생성할 수 있음" ON daily_menus
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 추가: 인증된 사용자는 일일 메뉴 아이템을 생성할 수 있음 (임시)
CREATE POLICY "인증된 사용자는 일일 메뉴 아이템을 생성할 수 있음" ON daily_menu_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 추가: 인증된 사용자는 일일 메뉴 주문을 생성할 수 있음 (임시)
CREATE POLICY "인증된 사용자는 일일 메뉴 주문을 생성할 수 있음" ON daily_menu_orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
