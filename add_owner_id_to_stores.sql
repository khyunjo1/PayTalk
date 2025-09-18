-- stores 테이블에 owner_id 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

-- owner_id 컬럼이 없으면 추가
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' 
        AND column_name = 'owner_id' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE stores ADD COLUMN owner_id UUID REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE 'owner_id 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'owner_id 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);

-- 완료 메시지
SELECT 'stores 테이블에 owner_id 컬럼이 추가되었습니다.' as message;
