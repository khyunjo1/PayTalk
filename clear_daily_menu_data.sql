-- 일일 주문서 관련 데이터 모두 삭제
-- 주의: 이 SQL은 모든 일일 주문서 데이터를 영구적으로 삭제합니다!

-- 1. 일일 메뉴 주문 데이터 삭제 (외래키 때문에 먼저 삭제)
DELETE FROM daily_menu_orders;

-- 2. 일일 메뉴 아이템 삭제
DELETE FROM daily_menu_items;

-- 3. 일일 메뉴 삭제
DELETE FROM daily_menus;

-- 4. 삭제된 데이터 확인
SELECT 
  'daily_menus' as table_name, 
  COUNT(*) as remaining_count 
FROM daily_menus
UNION ALL
SELECT 
  'daily_menu_items' as table_name, 
  COUNT(*) as remaining_count 
FROM daily_menu_items
UNION ALL
SELECT 
  'daily_menu_orders' as table_name, 
  COUNT(*) as remaining_count 
FROM daily_menu_orders;

-- 완료 메시지
SELECT '일일 주문서 관련 데이터가 모두 삭제되었습니다.' as message;
