-- 모든 데이터 초기화 SQL
-- 주의: 이 SQL은 모든 데이터를 삭제합니다!

-- 1. 외래키 제약조건을 무시하고 모든 데이터 삭제
SET session_replication_role = replica;

-- 2. 모든 테이블 데이터 삭제 (순서 중요)
DELETE FROM notifications;
DELETE FROM web_push_subscriptions;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM menus;
DELETE FROM user_stores;
DELETE FROM stores;
DELETE FROM users;

-- 3. 외래키 제약조건 복원
SET session_replication_role = DEFAULT;

-- 4. 시퀀스 리셋 (PostgreSQL)
-- 주문 ID 시퀀스 리셋
ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;

-- 5. 슈퍼 어드민 계정 재생성
INSERT INTO users (name, phone, password, status, role) 
VALUES ('조광현', '010-1234-5678', 'admin123', 'approved', 'super_admin');

-- 6. 결과 확인
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Stores', COUNT(*) FROM stores
UNION ALL
SELECT 'Menus', COUNT(*) FROM menus
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Order Items', COUNT(*) FROM order_items
UNION ALL
SELECT 'User Stores', COUNT(*) FROM user_stores
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'Web Push Subscriptions', COUNT(*) FROM web_push_subscriptions;
