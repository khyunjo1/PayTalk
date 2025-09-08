-- 매장 테이블에 이미지 필드 추가
-- 실행 날짜: 2024년

-- 1. stores 테이블에 image_url 컬럼 추가
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. 컬럼 추가 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stores' 
AND column_name = 'image_url';

-- 3. 기존 데이터 확인 (image_url이 NULL인 매장들)
SELECT id, name, image_url 
FROM public.stores 
WHERE image_url IS NULL;

-- 4. menus 테이블의 image_url 컬럼 확인 (이미 존재함)
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'menus' 
AND column_name = 'image_url';

-- 완료 메시지
SELECT '매장 테이블에 image_url 필드가 성공적으로 추가되었습니다.' as message;
