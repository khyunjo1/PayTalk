-- 주문내역 테스트를 위한 모든 주문 데이터 삭제 SQL
-- 주의: 이 SQL은 모든 주문 데이터를 영구적으로 삭제합니다!

-- 1. 일일 메뉴 주문 삭제 (외래키 제약으로 인해 먼저 삭제)
DELETE FROM daily_menu_orders;

-- 2. 일반 주문 아이템 삭제
DELETE FROM order_items;

-- 3. 주문 삭제
DELETE FROM orders;

-- 4. 삭제 결과 확인
SELECT 'daily_menu_orders' as table_name, COUNT(*) as remaining_count FROM daily_menu_orders
UNION ALL
SELECT 'order_items' as table_name, COUNT(*) as remaining_count FROM order_items
UNION ALL
SELECT 'orders' as table_name, COUNT(*) as remaining_count FROM orders;

-- 5. 일일 메뉴 아이템 수량 초기화 (테스트용)
UPDATE daily_menu_items 
SET 
  current_quantity = initial_quantity,
  is_available = true;

-- 6. 일일 메뉴 아이템 상태 확인
SELECT 
  dmi.id,
  dmi.menu_id,
  m.name as menu_name,
  dmi.initial_quantity,
  dmi.current_quantity,
  dmi.is_available
FROM daily_menu_items dmi
JOIN menus m ON dmi.menu_id = m.id
ORDER BY dmi.id;

-- 완료 메시지
SELECT '모든 주문 데이터가 삭제되었습니다. 일일 메뉴 아이템 수량도 초기화되었습니다.' as message;
