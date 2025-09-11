-- 문의 테이블 RLS 정책 수정
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can create inquiries" ON public.inquiries;

-- 새로운 정책 생성 (인증 없이도 문의 생성 가능)
CREATE POLICY "Allow anonymous inquiry creation" ON public.inquiries
  FOR INSERT WITH CHECK (true);

-- 기존 정책들도 확인하고 필요시 수정
-- 슈퍼 어드민은 모든 문의를 볼 수 있음
DROP POLICY IF EXISTS "Super admins can view all inquiries" ON public.inquiries;
CREATE POLICY "Super admins can view all inquiries" ON public.inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 슈퍼 어드민은 문의를 수정할 수 있음
DROP POLICY IF EXISTS "Super admins can update inquiries" ON public.inquiries;
CREATE POLICY "Super admins can update inquiries" ON public.inquiries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 슈퍼 어드민은 문의를 삭제할 수 있음
DROP POLICY IF EXISTS "Super admins can delete inquiries" ON public.inquiries;
CREATE POLICY "Super admins can delete inquiries" ON public.inquiries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- RLS가 활성화되어 있는지 확인
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'inquiries';

-- 현재 정책들 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'inquiries';
