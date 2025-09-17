-- delivery_areas 테이블의 RLS 정책 수정

-- 기존 정책 삭제
DROP POLICY IF EXISTS "사장님은 자신의 매장 배달지역을 관리할 수 있음" ON delivery_areas;
DROP POLICY IF EXISTS "모든 사용자는 활성화된 배달지역을 조회할 수 있음" ON delivery_areas;

-- 새로운 정책 생성
-- 1. 매장 소유자는 자신의 매장 배달지역을 모든 작업(CRUD) 가능
CREATE POLICY "store_owner_manage_delivery_areas" ON delivery_areas
  FOR ALL USING (
    store_id IN (
      SELECT id FROM stores 
      WHERE owner_id = auth.uid()
    )
  );

-- 2. 모든 사용자는 활성화된 배달지역을 조회 가능
CREATE POLICY "public_read_active_delivery_areas" ON delivery_areas
  FOR SELECT USING (is_active = true);

-- 3. 매장 소유자는 자신의 매장 배달지역을 삽입 가능
CREATE POLICY "store_owner_insert_delivery_areas" ON delivery_areas
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores 
      WHERE owner_id = auth.uid()
    )
  );

-- 4. 매장 소유자는 자신의 매장 배달지역을 수정 가능
CREATE POLICY "store_owner_update_delivery_areas" ON delivery_areas
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores 
      WHERE owner_id = auth.uid()
    )
  );

-- 5. 매장 소유자는 자신의 매장 배달지역을 삭제 가능
CREATE POLICY "store_owner_delete_delivery_areas" ON delivery_areas
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM stores 
      WHERE owner_id = auth.uid()
    )
  );
