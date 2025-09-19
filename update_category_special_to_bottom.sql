-- 특별반찬 카테고리를 밑반찬으로 변경하는 SQL 스크립트
-- 실행 전에 백업을 권장합니다

-- 1. 메뉴 테이블의 카테고리 업데이트
UPDATE menus 
SET category = '밑반찬' 
WHERE category = '특별반찬';

-- 2. 업데이트된 레코드 수 확인
SELECT COUNT(*) as updated_menus_count
FROM menus 
WHERE category = '밑반찬';

-- 3. 변경 사항 확인
SELECT id, name, category, created_at
FROM menus 
WHERE category = '밑반찬'
ORDER BY created_at DESC
LIMIT 10;

-- 4. 기존 특별반찬 카테고리가 남아있는지 확인 (0이어야 함)
SELECT COUNT(*) as remaining_special_category
FROM menus 
WHERE category = '특별반찬';
