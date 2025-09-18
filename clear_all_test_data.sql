-- 테스트 데이터 전체 삭제 SQL
-- 주의: 이 스크립트는 모든 데이터를 삭제합니다!

-- 먼저 현재 존재하는 테이블 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 1. 주문 관련 데이터 삭제 (외래키 순서 고려)
-- 테이블이 존재하는 경우에만 삭제
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items' AND table_schema = 'public') THEN
        DELETE FROM order_items;
        RAISE NOTICE 'order_items 테이블 데이터 삭제 완료';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
        DELETE FROM orders;
        RAISE NOTICE 'orders 테이블 데이터 삭제 완료';
    END IF;
END $$;

-- 2. 일일 메뉴 관련 데이터 삭제
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_menu_orders' AND table_schema = 'public') THEN
        DELETE FROM daily_menu_orders;
        RAISE NOTICE 'daily_menu_orders 테이블 데이터 삭제 완료';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_menu_items' AND table_schema = 'public') THEN
        DELETE FROM daily_menu_items;
        RAISE NOTICE 'daily_menu_items 테이블 데이터 삭제 완료';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_menus' AND table_schema = 'public') THEN
        DELETE FROM daily_menus;
        RAISE NOTICE 'daily_menus 테이블 데이터 삭제 완료';
    END IF;
END $$;

-- 3. 사용자-매장 연결 데이터 삭제
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_stores' AND table_schema = 'public') THEN
        DELETE FROM user_stores;
        RAISE NOTICE 'user_stores 테이블 데이터 삭제 완료';
    END IF;
END $$;

-- 4. 메뉴 데이터 삭제
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menus' AND table_schema = 'public') THEN
        DELETE FROM menus;
        RAISE NOTICE 'menus 테이블 데이터 삭제 완료';
    END IF;
END $$;

-- 5. 매장 데이터 삭제
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores' AND table_schema = 'public') THEN
        DELETE FROM stores;
        RAISE NOTICE 'stores 테이블 데이터 삭제 완료';
    END IF;
END $$;

-- 6. 사용자 데이터 삭제 (사장님 계정)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        DELETE FROM users;
        RAISE NOTICE 'users 테이블 데이터 삭제 완료';
    END IF;
END $$;

-- 7. 기타 테이블들 삭제
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_areas' AND table_schema = 'public') THEN
        DELETE FROM delivery_areas;
        RAISE NOTICE 'delivery_areas 테이블 데이터 삭제 완료';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'push_subscriptions' AND table_schema = 'public') THEN
        DELETE FROM push_subscriptions;
        RAISE NOTICE 'push_subscriptions 테이블 데이터 삭제 완료';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inquiries' AND table_schema = 'public') THEN
        DELETE FROM inquiries;
        RAISE NOTICE 'inquiries 테이블 데이터 삭제 완료';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'revenue_records' AND table_schema = 'public') THEN
        DELETE FROM revenue_records;
        RAISE NOTICE 'revenue_records 테이블 데이터 삭제 완료';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'store_contracts' AND table_schema = 'public') THEN
        DELETE FROM store_contracts;
        RAISE NOTICE 'store_contracts 테이블 데이터 삭제 완료';
    END IF;
END $$;

-- 완료 메시지
SELECT '모든 테스트 데이터가 삭제되었습니다.' as message;
