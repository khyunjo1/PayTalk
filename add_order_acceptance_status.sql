-- 주문접수 상태 관리 필드 추가
ALTER TABLE stores 
ADD COLUMN order_acceptance_status VARCHAR(20) DEFAULT 'current' CHECK (order_acceptance_status IN ('current', 'tomorrow', 'closed'));

-- 기존 데이터를 현재 상태로 설정
UPDATE stores 
SET order_acceptance_status = 'current';

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_stores_order_acceptance_status ON stores(order_acceptance_status);

-- 주문접수 상태 변경 함수
CREATE OR REPLACE FUNCTION update_order_acceptance_status()
RETURNS void AS $$
DECLARE
    store_record RECORD;
    current_time_value TIME;
    cutoff_time TIME;
    business_start_time TIME;
    is_after_cutoff BOOLEAN;
    is_after_business_start BOOLEAN;
BEGIN
    -- 현재 한국 시간
    current_time_value := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::TIME;
    
    -- 모든 가게에 대해 상태 업데이트
    FOR store_record IN 
        SELECT id, order_cutoff_time, business_hours_start, order_acceptance_status
        FROM stores
    LOOP
        -- 기본값 설정
        cutoff_time := COALESCE(store_record.order_cutoff_time::TIME, '15:00'::TIME);
        business_start_time := COALESCE(store_record.business_hours_start::TIME, '09:00'::TIME);
        
        -- 시간 비교
        is_after_cutoff := current_time_value > cutoff_time;
        is_after_business_start := current_time_value > business_start_time;
        
        -- 상태 업데이트 로직
        IF is_after_cutoff AND store_record.order_acceptance_status = 'current' THEN
            -- 주문마감시간이 지났으면 closed로 변경
            UPDATE stores 
            SET order_acceptance_status = 'closed' 
            WHERE id = store_record.id;
        ELSIF is_after_business_start AND store_record.order_acceptance_status = 'closed' THEN
            -- 영업시작시간이 지났고 현재 closed 상태면 current로 변경
            UPDATE stores 
            SET order_acceptance_status = 'current' 
            WHERE id = store_record.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 주문접수 상태 수동 변경 함수
CREATE OR REPLACE FUNCTION set_order_acceptance_status(store_id UUID, new_status VARCHAR(20))
RETURNS BOOLEAN AS $$
BEGIN
    -- 유효한 상태인지 확인
    IF new_status NOT IN ('current', 'tomorrow', 'closed') THEN
        RETURN FALSE;
    END IF;
    
    -- 상태 업데이트
    UPDATE stores 
    SET order_acceptance_status = new_status 
    WHERE id = store_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 주문접수 상태 조회 함수
CREATE OR REPLACE FUNCTION get_order_acceptance_status(store_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
    status VARCHAR(20);
BEGIN
    SELECT order_acceptance_status INTO status
    FROM stores 
    WHERE id = store_id;
    
    RETURN COALESCE(status, 'current');
END;
$$ LANGUAGE plpgsql;
