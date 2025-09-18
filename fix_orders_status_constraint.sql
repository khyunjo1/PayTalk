-- orders 테이블의 status 제약 조건을 한국어 값으로 업데이트
-- 기존 영어 값에서 한국어 값으로 변경

-- 기존 제약 조건 삭제
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- 새로운 한국어 제약 조건 추가
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('입금대기', '입금확인', '배달완료', '주문취소'));

-- 기본값도 한국어로 변경
ALTER TABLE orders ALTER COLUMN status SET DEFAULT '입금대기';
