-- orders 테이블에 delivery_address 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- delivery_address 컬럼 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'delivery_address' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_address TEXT;
        RAISE NOTICE 'delivery_address 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'delivery_address 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 완료 메시지
SELECT 'orders 테이블에 delivery_address 컬럼이 추가되었습니다.' as message;
