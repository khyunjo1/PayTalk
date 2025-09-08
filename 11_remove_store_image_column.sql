-- 매장 테이블에서 image_url 컬럼 제거
-- 실행 날짜: 2024년

-- 1. stores 테이블에서 image_url 컬럼 제거
ALTER TABLE public.stores 
DROP COLUMN IF EXISTS image_url;

-- 2. 컬럼 제거 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND column_name = 'image_url';

-- 완료 메시지
SELECT '매장 테이블에서 image_url 컬럼이 성공적으로 제거되었습니다.' as message;
