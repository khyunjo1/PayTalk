-- 기존 stores 테이블에 새로운 컬럼 추가
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS business_hours_start TIME DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS business_hours_end TIME DEFAULT '21:00',
ADD COLUMN IF NOT EXISTS pickup_time_slots TEXT[] DEFAULT ARRAY['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
ADD COLUMN IF NOT EXISTS delivery_time_slots JSONB DEFAULT '[]'::jsonb;

-- 기존 business_hours 컬럼은 제거 (더 이상 사용하지 않음)
-- ALTER TABLE stores DROP COLUMN IF EXISTS business_hours;

-- 샘플 데이터 업데이트
UPDATE stores SET 
  business_hours_start = '09:00',
  business_hours_end = '21:00',
  pickup_time_slots = ARRAY['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
  delivery_time_slots = '[
    {"name": "아침 배송", "start": "08:00", "end": "10:00", "enabled": false},
    {"name": "점심 배송", "start": "11:30", "end": "14:00", "enabled": true},
    {"name": "오후 배송", "start": "14:30", "end": "17:00", "enabled": false},
    {"name": "저녁 배송", "start": "17:30", "end": "20:00", "enabled": true}
  ]'::jsonb
WHERE id IS NOT NULL;
