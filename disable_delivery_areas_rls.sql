-- delivery_areas 테이블의 RLS 정책 완전 비활성화
-- 애플리케이션 레벨에서 권한 관리

-- 기존 모든 정책 삭제
DROP POLICY IF EXISTS "store_owner_manage_delivery_areas" ON delivery_areas;
DROP POLICY IF EXISTS "public_read_active_delivery_areas" ON delivery_areas;
DROP POLICY IF EXISTS "store_owner_insert_delivery_areas" ON delivery_areas;
DROP POLICY IF EXISTS "store_owner_update_delivery_areas" ON delivery_areas;
DROP POLICY IF EXISTS "store_owner_delete_delivery_areas" ON delivery_areas;
DROP POLICY IF EXISTS "사장님은 자신의 매장 배달지역을 관리할 수 있음" ON delivery_areas;
DROP POLICY IF EXISTS "모든 사용자는 활성화된 배달지역을 조회할 수 있음" ON delivery_areas;

-- RLS 비활성화
ALTER TABLE delivery_areas DISABLE ROW LEVEL SECURITY;
