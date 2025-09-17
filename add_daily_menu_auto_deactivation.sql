-- 일일 메뉴 자동 비활성화 시스템

-- 1. 일일 메뉴 자동 비활성화 함수 생성
CREATE OR REPLACE FUNCTION deactivate_expired_daily_menus()
RETURNS void AS $$
BEGIN
  -- 현재 시간이 각 매장의 주문마감시간을 지난 일일 메뉴들을 비활성화
  UPDATE daily_menus 
  SET is_active = false, updated_at = NOW()
  WHERE is_active = true 
    AND menu_date = CURRENT_DATE
    AND store_id IN (
      SELECT s.id 
      FROM stores s 
      WHERE s.order_cutoff_time IS NOT NULL 
        AND CURRENT_TIME > s.order_cutoff_time
    );
END;
$$ LANGUAGE plpgsql;

-- 2. 매일 자정에 실행되는 함수 (오늘 메뉴 비활성화)
CREATE OR REPLACE FUNCTION deactivate_today_daily_menus()
RETURNS void AS $$
BEGIN
  -- 오늘 날짜의 모든 일일 메뉴를 비활성화 (자정에 실행)
  UPDATE daily_menus 
  SET is_active = false, updated_at = NOW()
  WHERE is_active = true 
    AND menu_date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 3. 실시간 비활성화를 위한 함수 (API에서 호출용)
CREATE OR REPLACE FUNCTION check_and_deactivate_daily_menus()
RETURNS TABLE(
  deactivated_count INTEGER,
  deactivated_menus UUID[]
) AS $$
DECLARE
  deactivated_ids UUID[];
  count_result INTEGER;
BEGIN
  -- 비활성화할 메뉴 ID 수집
  SELECT ARRAY_AGG(id) INTO deactivated_ids
  FROM daily_menus 
  WHERE is_active = true 
    AND menu_date = CURRENT_DATE
    AND store_id IN (
      SELECT s.id 
      FROM stores s 
      WHERE s.order_cutoff_time IS NOT NULL 
        AND CURRENT_TIME > s.order_cutoff_time
    );
  
  -- 비활성화 실행
  UPDATE daily_menus 
  SET is_active = false, updated_at = NOW()
  WHERE id = ANY(deactivated_ids);
  
  -- 결과 반환
  GET DIAGNOSTICS count_result = ROW_COUNT;
  
  RETURN QUERY SELECT count_result, deactivated_ids;
END;
$$ LANGUAGE plpgsql;

-- 4. 일일 메뉴 조회 시 자동 비활성화 체크하는 함수
CREATE OR REPLACE FUNCTION get_daily_menu_with_auto_check(p_store_id UUID, p_menu_date DATE)
RETURNS TABLE(
  id UUID,
  store_id UUID,
  menu_date DATE,
  title VARCHAR(255),
  description TEXT,
  is_active BOOLEAN,
  cutoff_time TIME,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- 먼저 만료된 메뉴들 비활성화
  PERFORM deactivate_expired_daily_menus();
  
  -- 메뉴 조회
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
$$ LANGUAGE plpgsql;

-- 5. 일일 메뉴 아이템 조회 시도 자동 비활성화 체크하는 함수
CREATE OR REPLACE FUNCTION get_daily_menu_items_with_auto_check(p_daily_menu_id UUID)
RETURNS TABLE(
  id UUID,
  daily_menu_id UUID,
  menu_id UUID,
  initial_quantity INTEGER,
  current_quantity INTEGER,
  is_available BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  -- 먼저 만료된 메뉴들 비활성화
  PERFORM deactivate_expired_daily_menus();
  
  -- 메뉴 아이템 조회
  RETURN QUERY
  SELECT 
    dmi.id,
    dmi.daily_menu_id,
    dmi.menu_id,
    dmi.initial_quantity,
    dmi.current_quantity,
    dmi.is_available,
    dmi.created_at,
    dmi.updated_at
  FROM daily_menu_items dmi
  WHERE dmi.daily_menu_id = p_daily_menu_id;
END;
$$ LANGUAGE plpgsql;

-- 6. RPC 함수로 자동 비활성화 실행
CREATE OR REPLACE FUNCTION execute_daily_menu_auto_deactivation()
RETURNS JSON AS $$
DECLARE
  result RECORD;
BEGIN
  -- 자동 비활성화 실행
  SELECT * INTO result FROM check_and_deactivate_daily_menus();
  
  -- 결과 반환
  RETURN json_build_object(
    'success', true,
    'deactivated_count', result.deactivated_count,
    'deactivated_menus', result.deactivated_menus
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
