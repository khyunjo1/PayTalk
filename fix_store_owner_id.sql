-- 매장에 owner_id 설정
-- 장수반찬 매장의 owner_id를 설정

-- 1. 현재 매장 상태 확인
SELECT id, name, owner_id, owner_name FROM stores WHERE name = '장수반찬';

-- 2. 사용자 테이블에서 owner_name과 일치하는 사용자 찾기
SELECT id, name, role FROM users WHERE name = '윤순자';

-- 3. 매장에 owner_id 설정 (위에서 찾은 사용자 ID로 변경)
-- UPDATE stores 
-- SET owner_id = '사용자_ID' 
-- WHERE name = '장수반찬';

-- 4. user_stores 테이블에 연결 추가
-- INSERT INTO user_stores (user_id, store_id, role)
-- VALUES ('사용자_ID', '매장_ID', 'owner')
-- ON CONFLICT (user_id, store_id) DO UPDATE SET role = 'owner';

-- 5. 설정 확인
SELECT s.id, s.name, s.owner_id, s.owner_name, u.name as user_name
FROM stores s
LEFT JOIN users u ON s.owner_id = u.id
WHERE s.name = '장수반찬';
