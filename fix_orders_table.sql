-- orders 테이블에 누락된 컬럼들 추가
-- Supabase SQL Editor에서 실행하세요

-- 누락된 컬럼들 추가
DO $$ 
BEGIN
    -- user_id 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'user_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE orders ADD COLUMN user_id UUID;
        RAISE NOTICE 'user_id 컬럼이 추가되었습니다.';
    END IF;
    
    -- order_type 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'order_type' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE orders ADD COLUMN order_type VARCHAR(20) DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'pickup'));
        RAISE NOTICE 'order_type 컬럼이 추가되었습니다.';
    END IF;
    
    -- delivery_time 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'delivery_time' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_time TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'delivery_time 컬럼이 추가되었습니다.';
    END IF;
    
    -- pickup_time 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'pickup_time' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE orders ADD COLUMN pickup_time TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'pickup_time 컬럼이 추가되었습니다.';
    END IF;
    
    -- special_requests 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'special_requests' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE orders ADD COLUMN special_requests TEXT;
        RAISE NOTICE 'special_requests 컬럼이 추가되었습니다.';
    END IF;
    
    -- depositor_name 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'depositor_name' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE orders ADD COLUMN depositor_name VARCHAR(255);
        RAISE NOTICE 'depositor_name 컬럼이 추가되었습니다.';
    END IF;
    
    -- subtotal 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'subtotal' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE orders ADD COLUMN subtotal INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'subtotal 컬럼이 추가되었습니다.';
    END IF;
    
    -- customer_address 컬럼명 수정 (customer_address가 없고 delivery_address만 있는 경우)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_address' 
        AND table_schema = 'public'
    ) THEN
        -- delivery_address를 customer_address로 변경
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'orders' 
            AND column_name = 'delivery_address' 
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE orders RENAME COLUMN delivery_address TO customer_address;
            RAISE NOTICE 'delivery_address 컬럼이 customer_address로 변경되었습니다.';
        ELSE
            ALTER TABLE orders ADD COLUMN customer_address TEXT;
            RAISE NOTICE 'customer_address 컬럼이 추가되었습니다.';
        END IF;
    END IF;
    
    -- total_amount를 total로 변경
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'total_amount' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE orders RENAME COLUMN total_amount TO total;
        RAISE NOTICE 'total_amount 컬럼이 total로 변경되었습니다.';
    END IF;
    
END $$;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_time ON orders(delivery_time);
CREATE INDEX IF NOT EXISTS idx_orders_pickup_time ON orders(pickup_time);

-- 완료 메시지
SELECT 'orders 테이블이 수정되었습니다.' as message;
