-- 일일 메뉴 테이블 상태 확인

-- 1. 테이블 존재 확인
SELECT table_name, is_insertable_into 
FROM information_schema.tables 
WHERE table_name IN ('daily_menus', 'daily_menu_items', 'daily_menu_orders');

-- 2. RLS 상태 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('daily_menus', 'daily_menu_items', 'daily_menu_orders');

-- 3. 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('daily_menus', 'daily_menu_items', 'daily_menu_orders');

-- 4. 권한 확인
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name IN ('daily_menus', 'daily_menu_items', 'daily_menu_orders');
