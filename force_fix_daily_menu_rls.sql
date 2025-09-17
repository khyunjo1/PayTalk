-- 일일 메뉴 테이블 RLS 강제 수정

-- 1. 모든 정책 강제 삭제
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- daily_menus 정책 삭제
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'daily_menus') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON daily_menus';
    END LOOP;
    
    -- daily_menu_items 정책 삭제
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'daily_menu_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON daily_menu_items';
    END LOOP;
    
    -- daily_menu_orders 정책 삭제
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'daily_menu_orders') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON daily_menu_orders';
    END LOOP;
END $$;

-- 2. RLS 완전 비활성화
ALTER TABLE daily_menus DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menu_orders DISABLE ROW LEVEL SECURITY;

-- 3. 테이블 권한 확인 및 수정
GRANT ALL ON daily_menus TO authenticated;
GRANT ALL ON daily_menu_items TO authenticated;
GRANT ALL ON daily_menu_orders TO authenticated;

GRANT ALL ON daily_menus TO anon;
GRANT ALL ON daily_menu_items TO anon;
GRANT ALL ON daily_menu_orders TO anon;

-- 4. 시퀀스 권한도 확인
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
