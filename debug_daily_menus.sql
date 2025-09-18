-- 일일 메뉴 데이터 확인 및 디버깅

-- 1. 모든 일일 메뉴 조회 (최근 10개)
SELECT 
  id,
  store_id,
  menu_date,
  title,
  is_active,
  created_at,
  updated_at
FROM daily_menus 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. 특정 매장의 모든 일일 메뉴 조회
SELECT 
  id,
  menu_date,
  title,
  is_active,
  created_at,
  updated_at
FROM daily_menus 
WHERE store_id = 'de83fae0-3770-4fee-ad75-f97f6d8b01bc'
ORDER BY menu_date DESC;

-- 3. 9월 18일 메뉴가 있는지 확인
SELECT 
  id,
  menu_date,
  title,
  is_active,
  created_at,
  updated_at
FROM daily_menus 
WHERE menu_date = '2025-09-18'
  AND store_id = 'de83fae0-3770-4fee-ad75-f97f6d8b01bc';

-- 4. 9월 19일 이전의 모든 메뉴 조회
SELECT 
  id,
  menu_date,
  title,
  is_active,
  created_at,
  updated_at
FROM daily_menus 
WHERE menu_date < '2025-09-19'
  AND store_id = 'de83fae0-3770-4fee-ad75-f97f6d8b01bc'
ORDER BY menu_date DESC;

-- 5. 현재 한국 시간 확인
SELECT 
  NOW() as current_utc_time,
  NOW() AT TIME ZONE 'Asia/Seoul' as korea_time,
  (NOW() AT TIME ZONE 'Asia/Seoul')::date as korea_date;
