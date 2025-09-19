-- PayTalk 테스트 데이터 초기화 스크립트
-- 테이블은 유지하고 데이터만 삭제 (super-admin 제외)

-- 1. 주문 관련 데이터 삭제 (외래키 제약으로 인해 순서 중요)
DELETE FROM order_items;
DELETE FROM orders;

-- 2. 일일 메뉴 관련 데이터 삭제
DELETE FROM daily_menu_orders;
DELETE FROM daily_menu_items;
DELETE FROM daily_menus;

-- 3. 메뉴 관련 데이터 삭제
DELETE FROM menus;

-- 4. 매장 관련 데이터 삭제 (super-admin 제외)
DELETE FROM stores WHERE owner_id NOT IN (
    SELECT id FROM users WHERE role = 'super-admin'
);

-- 5. 사용자 데이터 삭제 (super-admin 제외)
DELETE FROM users WHERE role != 'super-admin';

-- 6. 푸시 구독 데이터 삭제
DELETE FROM push_subscriptions;

-- 7. 배송 지역 데이터 삭제
DELETE FROM delivery_areas;

-- 8. 기타 데이터 삭제
DELETE FROM inquiries;
DELETE FROM revenue_records;
DELETE FROM store_contracts;
DELETE FROM user_stores;

-- 8. 시퀀스 리셋 (시퀀스가 존재하는 경우에만)
-- 주문 ID 시퀀스 리셋 (시퀀스가 존재하는 경우에만)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'orders_id_seq') THEN
        PERFORM setval('orders_id_seq', 1, false);
    END IF;
END $$;

-- 9. 삭제 결과 확인
SELECT '주문 데이터' as table_name, COUNT(*) as remaining_count FROM orders
UNION ALL
SELECT '주문 아이템', COUNT(*) FROM order_items
UNION ALL
SELECT '일일 메뉴', COUNT(*) FROM daily_menus
UNION ALL
SELECT '일일 메뉴 아이템', COUNT(*) FROM daily_menu_items
UNION ALL
SELECT '일일 메뉴 주문', COUNT(*) FROM daily_menu_orders
UNION ALL
SELECT '메뉴', COUNT(*) FROM menus
UNION ALL
SELECT '매장 (super-admin 제외)', COUNT(*) FROM stores WHERE owner_id NOT IN (SELECT id FROM users WHERE role = 'super-admin')
UNION ALL
SELECT '사용자 (super-admin 제외)', COUNT(*) FROM users WHERE role != 'super-admin'
UNION ALL
SELECT '푸시 구독', COUNT(*) FROM push_subscriptions
UNION ALL
SELECT '배송 지역', COUNT(*) FROM delivery_areas
UNION ALL
SELECT '문의사항', COUNT(*) FROM inquiries
UNION ALL
SELECT '수익 기록', COUNT(*) FROM revenue_records
UNION ALL
SELECT '매장 계약', COUNT(*) FROM store_contracts
UNION ALL
SELECT '사용자-매장', COUNT(*) FROM user_stores;

-- 10. super-admin 데이터 확인
SELECT 'super-admin 사용자', COUNT(*) FROM users WHERE role = 'super-admin'
UNION ALL
SELECT 'super-admin 매장', COUNT(*) FROM stores WHERE owner_id IN (SELECT id FROM users WHERE role = 'super-admin');
