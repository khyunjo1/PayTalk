-- 일일 메뉴 생성 RPC 함수 (RLS 우회)

CREATE OR REPLACE FUNCTION create_daily_menu(
  p_store_id UUID,
  p_menu_date DATE,
  p_title TEXT DEFAULT '오늘의 반찬',
  p_description TEXT DEFAULT NULL
)
RETURNS daily_menus
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result daily_menus;
BEGIN
  INSERT INTO daily_menus (store_id, menu_date, title, description)
  VALUES (p_store_id, p_menu_date, p_title, p_description)
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;

-- 일일 메뉴 아이템 추가 RPC 함수
CREATE OR REPLACE FUNCTION add_daily_menu_item(
  p_daily_menu_id UUID,
  p_menu_id UUID,
  p_initial_quantity INTEGER
)
RETURNS daily_menu_items
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result daily_menu_items;
BEGIN
  INSERT INTO daily_menu_items (daily_menu_id, menu_id, initial_quantity, current_quantity)
  VALUES (p_daily_menu_id, p_menu_id, p_initial_quantity, p_initial_quantity)
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;

-- 권한 설정
GRANT EXECUTE ON FUNCTION create_daily_menu TO authenticated;
GRANT EXECUTE ON FUNCTION create_daily_menu TO anon;
GRANT EXECUTE ON FUNCTION add_daily_menu_item TO authenticated;
GRANT EXECUTE ON FUNCTION add_daily_menu_item TO anon;
