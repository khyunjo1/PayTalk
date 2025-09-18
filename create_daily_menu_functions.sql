-- 일일 메뉴 관련 RPC 함수들 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. 일일 메뉴 자동 비활성화 함수
CREATE OR REPLACE FUNCTION execute_daily_menu_auto_deactivation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 주문 마감 시간이 지난 일일 메뉴들을 비활성화
  UPDATE daily_menus 
  SET is_active = false, updated_at = NOW()
  WHERE is_active = true 
    AND cutoff_time IS NOT NULL 
    AND cutoff_time < CURRENT_TIME;
    
  -- 로그 출력
  RAISE NOTICE '일일 메뉴 자동 비활성화 실행됨: %', NOW();
END;
$$;

-- 2. 일일 메뉴 생성 함수
CREATE OR REPLACE FUNCTION create_daily_menu(
  p_store_id UUID,
  p_menu_date DATE,
  p_title VARCHAR(255) DEFAULT '오늘의 반찬',
  p_description TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  menu_date DATE,
  title VARCHAR(255),
  description TEXT,
  is_active BOOLEAN,
  cutoff_time TIME,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_daily_menu_id UUID;
BEGIN
  -- 일일 메뉴 생성
  INSERT INTO daily_menus (
    store_id,
    menu_date,
    title,
    description,
    is_active
  ) VALUES (
    p_store_id,
    p_menu_date,
    p_title,
    p_description,
    true
  ) RETURNING id INTO new_daily_menu_id;
  
  -- 생성된 일일 메뉴 반환
  RETURN QUERY
  SELECT 
    dm.id,
    dm.store_id,
    dm.menu_date,
    dm.title,
    dm.description,
    dm.is_active,
    dm.cutoff_time,
    dm.created_at,
    dm.updated_at
  FROM daily_menus dm
  WHERE dm.id = new_daily_menu_id;
END;
$$;

-- 3. 기존 함수 삭제 (충돌 방지)
DROP FUNCTION IF EXISTS get_daily_menu_with_auto_check(UUID, DATE);
DROP FUNCTION IF EXISTS get_daily_menu_with_auto_check(DATE, UUID);

-- 4. 일일 메뉴 조회 및 자동 체크 함수
CREATE OR REPLACE FUNCTION get_daily_menu_with_auto_check(
  p_menu_date DATE,
  p_store_id UUID
)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  menu_date DATE,
  title VARCHAR(255),
  description TEXT,
  is_active BOOLEAN,
  cutoff_time TIME,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 먼저 자동 비활성화 실행
  PERFORM execute_daily_menu_auto_deactivation();
  
  -- 일일 메뉴 조회
  RETURN QUERY
  SELECT 
    dm.id,
    dm.store_id,
    dm.menu_date,
    dm.title,
    dm.description,
    dm.is_active,
    dm.cutoff_time,
    dm.created_at,
    dm.updated_at
  FROM daily_menus dm
  WHERE dm.store_id = p_store_id 
    AND dm.menu_date = p_menu_date;
END;
$$;

-- 5. 일일 메뉴 아이템 수량 차감 함수
CREATE OR REPLACE FUNCTION update_daily_menu_item_quantity(
  p_daily_menu_item_id UUID,
  p_quantity_change INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_quantity INTEGER;
  new_quantity INTEGER;
BEGIN
  -- 현재 수량 조회
  SELECT current_quantity INTO current_quantity
  FROM daily_menu_items
  WHERE id = p_daily_menu_item_id;
  
  -- 수량이 없으면 false 반환
  IF current_quantity IS NULL THEN
    RETURN false;
  END IF;
  
  -- 새 수량 계산
  new_quantity := current_quantity + p_quantity_change;
  
  -- 수량이 음수가 되면 false 반환
  IF new_quantity < 0 THEN
    RETURN false;
  END IF;
  
  -- 수량 업데이트
  UPDATE daily_menu_items
  SET 
    current_quantity = new_quantity,
    is_available = (new_quantity > 0),
    updated_at = NOW()
  WHERE id = p_daily_menu_item_id;
  
  RETURN true;
END;
$$;

-- 6. 일일 메뉴 주문 생성 함수
CREATE OR REPLACE FUNCTION create_daily_menu_order(
  p_daily_menu_id UUID,
  p_order_id UUID,
  p_menu_id UUID,
  p_quantity INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id UUID;
  daily_menu_item_id UUID;
BEGIN
  -- 일일 메뉴 아이템 ID 조회
  SELECT id INTO daily_menu_item_id
  FROM daily_menu_items
  WHERE daily_menu_id = p_daily_menu_id 
    AND menu_id = p_menu_id;
  
  -- 일일 메뉴 아이템이 없으면 오류
  IF daily_menu_item_id IS NULL THEN
    RAISE EXCEPTION '일일 메뉴 아이템을 찾을 수 없습니다';
  END IF;
  
  -- 수량 차감 시도
  IF NOT update_daily_menu_item_quantity(daily_menu_item_id, -p_quantity) THEN
    RAISE EXCEPTION '수량이 부족합니다';
  END IF;
  
  -- 일일 메뉴 주문 생성
  INSERT INTO daily_menu_orders (
    daily_menu_id,
    order_id,
    menu_id,
    quantity
  ) VALUES (
    p_daily_menu_id,
    p_order_id,
    p_menu_id,
    p_quantity
  ) RETURNING id INTO new_order_id;
  
  RETURN new_order_id;
END;
$$;

-- 7. 함수 권한 설정
GRANT EXECUTE ON FUNCTION execute_daily_menu_auto_deactivation() TO authenticated;
GRANT EXECUTE ON FUNCTION create_daily_menu(UUID, DATE, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_menu_with_auto_check(DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_daily_menu_item_quantity(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_daily_menu_order(UUID, UUID, UUID, INTEGER) TO authenticated;

-- 완료 메시지
SELECT '일일 메뉴 관련 RPC 함수들이 생성되었습니다.' as message;
