-- 메뉴 카테고리 업데이트 SQL
-- 1. "인기메뉴" → "고기반찬"
-- 2. "국물류" → "국"
-- 3. "기타" 카테고리 추가
-- 4. "3000원 반찬" 카테고리 추가

-- 기존 메뉴들의 카테고리 업데이트
UPDATE menus
SET category = '고기반찬'
WHERE category = '인기메뉴';

UPDATE menus
SET category = '국'
WHERE category = '국물류';

-- 변경 사항 확인을 위한 조회 쿼리
SELECT category, COUNT(*) as menu_count
FROM menus
GROUP BY category
ORDER BY category;

-- 참고: 새로 추가된 카테고리들은 새로운 메뉴 추가 시 사용하시면 됩니다.
-- 예시:
-- INSERT INTO menus (name, category, ...) VALUES ('메뉴명', '기타', ...);
-- INSERT INTO menus (name, category, ...) VALUES ('메뉴명', '3000원 반찬', ...);