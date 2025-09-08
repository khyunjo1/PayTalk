-- Supabase Storage 설정
-- 이 스크립트는 Supabase Dashboard의 Storage 섹션에서 실행하거나
-- SQL Editor에서 실행할 수 있습니다.

-- 1. public 버킷 생성 (이미 존재한다면 무시됨)
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- 2. public 버킷에 대한 정책 설정
-- 모든 사용자가 이미지를 업로드할 수 있도록 허용
CREATE POLICY "Public images are viewable by everyone" ON storage.objects
FOR SELECT USING (bucket_id = 'public');

CREATE POLICY "Public images are uploadable by everyone" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'public');

CREATE POLICY "Public images are updatable by everyone" ON storage.objects
FOR UPDATE USING (bucket_id = 'public');

CREATE POLICY "Public images are deletable by everyone" ON storage.objects
FOR DELETE USING (bucket_id = 'public');

-- 3. 이미지 파일 타입 제한 (선택사항)
-- CREATE POLICY "Only image files allowed" ON storage.objects
-- FOR INSERT WITH CHECK (
--   bucket_id = 'public' AND 
--   (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'gif', 'webp'))
-- );
