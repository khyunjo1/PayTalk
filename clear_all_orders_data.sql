-- 주문 관련 모든 데이터 삭제 (초기화)
-- 주의: 이 스크립트는 모든 주문 데이터를 영구적으로 삭제합니다!

-- 1. 일일 메뉴 주문 데이터 삭제
DELETE FROM daily_menu_orders;

-- 2. 일반 주문 아이템 삭제
DELETE FROM order_items;

-- 3. 주문 데이터 삭제
DELETE FROM orders;

-- 4. 일일 메뉴 아이템 삭제 (선택사항 - 일일 메뉴도 초기화하려면 주석 해제)
-- DELETE FROM daily_menu_items;

-- 5. 일일 메뉴 삭제 (선택사항 - 일일 메뉴도 초기화하려면 주석 해제)
-- DELETE FROM daily_menus;

-- 6. 시퀀스 리셋 (UUID 사용 테이블이므로 시퀀스가 없음)
-- UUID를 사용하는 테이블들은 gen_random_uuid()로 ID를 생성하므로 시퀀스 리셋이 불필요합니다.

-- 확인용 쿼리
SELECT '주문 데이터 삭제 완료' as status;
SELECT COUNT(*) as remaining_orders FROM orders;
SELECT COUNT(*) as remaining_order_items FROM order_items;
SELECT COUNT(*) as remaining_daily_menu_orders FROM daily_menu_orders;
