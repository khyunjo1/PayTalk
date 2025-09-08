-- 매장 및 메뉴 테이블에서 모든 이미지 필드 제거
-- 실행 날짜: 2024년

-- 1. stores 테이블에서 image_url 컬럼 제거
ALTER TABLE public.stores
DROP COLUMN IF EXISTS image_url;

-- 2. menus 테이블에서 image_url 컬럼 제거
ALTER TABLE public.menus
DROP COLUMN IF EXISTS image_url;

-- 3. 컬럼 제거 확인
SELECT 
  'stores' as table_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stores'
AND column_name = 'image_url'

UNION ALL

SELECT 
  'menus' as table_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'menus'
AND column_name = 'image_url';

-- 완료 메시지
SELECT '매장 및 메뉴 테이블에서 모든 image_url 필드가 성공적으로 제거되었습니다.' as message;
