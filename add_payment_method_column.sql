-- orders 테이블에 결제 방식 컬럼이 이미 존재하는지 확인하고 처리
DO $$ 
BEGIN
    -- payment_method 컬럼이 존재하지 않는 경우에만 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE orders 
        ADD COLUMN payment_method VARCHAR(20) DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'zeropay'));
    END IF;
END $$;

-- 기존 데이터 중 payment_method가 NULL인 경우 무통장입금으로 설정
UPDATE orders SET payment_method = 'bank_transfer' WHERE payment_method IS NULL;

-- 결제 방식 컬럼을 NOT NULL로 설정 (이미 NOT NULL이 아닌 경우에만)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'payment_method' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE orders ALTER COLUMN payment_method SET NOT NULL;
    END IF;
END $$;

-- 인덱스 추가 (성능 최적화) - 이미 존재하는 경우 무시
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
