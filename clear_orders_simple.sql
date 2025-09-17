-- 간단한 주문 데이터 삭제 스크립트 (UUID 사용 테이블용)
-- 이 스크립트는 시퀀스 리셋 없이 데이터만 삭제합니다.

-- 1. 일일 메뉴 주문 데이터 삭제
DELETE FROM daily_menu_orders;

-- 2. 일반 주문 아이템 삭제
DELETE FROM order_items;

-- 3. 주문 데이터 삭제
DELETE FROM orders;

-- 4. 삭제 결과 확인
SELECT 
    '주문 데이터 삭제 완료' as status,
    (SELECT COUNT(*) FROM orders) as remaining_orders,
    (SELECT COUNT(*) FROM order_items) as remaining_order_items,
    (SELECT COUNT(*) FROM daily_menu_orders) as remaining_daily_menu_orders;
