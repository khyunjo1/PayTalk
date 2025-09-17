-- 모든 매장에 owner_id 설정하는 SQL 스크립트
-- Supabase SQL 에디터에서 실행하세요.

-- 1. 현재 매장 목록 확인
SELECT id, name, owner_id, phone FROM stores ORDER BY name;

-- 2. 각 매장별로 owner_id 설정
-- (각 사장님의 실제 사용자 ID로 변경해주세요)

-- 방법 1: 매장 ID로 설정 (권장)
-- UPDATE stores 
-- SET owner_id = '사장님_사용자_ID' 
-- WHERE id = '매장_ID';

-- 방법 2: 매장명으로 설정
-- UPDATE stores 
-- SET owner_id = '사장님_사용자_ID' 
-- WHERE name = '매장명';

-- 예시:
-- 장수반찬 매장
-- UPDATE stores 
-- SET owner_id = '장수반찬_사장님_사용자_ID' 
-- WHERE name = '장수반찬';

-- 이천반찬 매장  
-- UPDATE stores 
-- SET owner_id = '이천반찬_사장님_사용자_ID' 
-- WHERE name = '이천반찬';

-- 다른 매장들도 동일하게 추가...
-- UPDATE stores 
-- SET owner_id = '사장님_사용자_ID' 
-- WHERE name = '매장명';

-- 3. 설정 확인
SELECT id, name, owner_id FROM stores ORDER BY name;

-- 4. 모든 매장에 owner_id가 설정되었는지 확인
SELECT COUNT(*) as total_stores, 
       COUNT(owner_id) as stores_with_owner,
       COUNT(*) - COUNT(owner_id) as stores_without_owner
FROM stores;

-- 5. owner_id가 없는 매장 확인
SELECT id, name FROM stores WHERE owner_id IS NULL;
