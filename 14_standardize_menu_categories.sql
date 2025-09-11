-- 메뉴 카테고리 표준화 마이그레이션
-- 8개 표준 카테고리로 통일

-- 1. 기존 카테고리를 표준 카테고리로 매핑
UPDATE menus SET category = 
  CASE 
    -- 메인요리
    WHEN category IN ('덮밥', '볶음밥', '김밥', '메인요리', '메인메뉴', '메인', '특별메뉴') THEN '메인요리'
    
    -- 국물류
    WHEN category IN ('국물류', '국', '탕류', '국류', '오늘의 국', '죽류', '식혜') THEN '국물류'
    
    -- 김치류
    WHEN category IN ('김치류') THEN '김치류'
    
    -- 젓갈류
    WHEN category IN ('젓갈류', '젓갈/짱아찌류', '젓갈/짱아찌류', '장아찌류', '장아찌&기타') THEN '젓갈류'
    
    -- 나물류
    WHEN category IN ('무침류', '나물류', '볶음류', '기본반찬', '기본', '나물반찬류', '나물류/무침류/볶음류', '구이전부추류') THEN '나물류'
    
    -- 조림류
    WHEN category IN ('조림류', '찜류', '절임류', '볶음&조림류', '조림/절임반찬류', '조림류/찜류', '조림/절임반찬류 및 젓갈류', '건어물밑반찬류') THEN '조림류'
    
    -- 특별반찬
    WHEN category IN ('5000원 반찬', '4000원 반찬', '오늘의 반찬', '샐러드 및 다이어트류', '기타') THEN '특별반찬'
    
    -- 인기메뉴
    WHEN category IN ('인기메뉴', '베스트메뉴', '추천메뉴') THEN '인기메뉴'
    
    -- 기타는 특별반찬으로 분류
    ELSE '특별반찬'
  END;

-- 2. 카테고리 제약조건 추가 (향후 데이터 무결성 보장)
ALTER TABLE menus DROP CONSTRAINT IF EXISTS menus_category_check;
ALTER TABLE menus ADD CONSTRAINT menus_category_check 
  CHECK (category IN (
    '메인요리', 
    '국물류', 
    '김치류', 
    '젓갈류', 
    '나물류', 
    '조림류', 
    '특별반찬', 
    '인기메뉴'
  ));

-- 3. 업데이트된 카테고리 통계 확인
SELECT 
  category,
  COUNT(*) as menu_count,
  COUNT(DISTINCT store_id) as store_count
FROM menus 
GROUP BY category 
ORDER BY menu_count DESC;
