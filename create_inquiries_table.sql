-- 문의 관리 테이블 생성
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  store_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '미확인' CHECK (status IN ('확인', '미확인')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at);

-- RLS 정책 설정 (슈퍼 어드민만 접근 가능)
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 슈퍼 어드민은 모든 문의를 볼 수 있음
CREATE POLICY "Super admins can view all inquiries" ON public.inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 슈퍼 어드민은 문의를 수정할 수 있음
CREATE POLICY "Super admins can update inquiries" ON public.inquiries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 슈퍼 어드민은 문의를 삭제할 수 있음
CREATE POLICY "Super admins can delete inquiries" ON public.inquiries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- 누구나 문의를 생성할 수 있음 (홈페이지에서 문의 제출)
CREATE POLICY "Anyone can create inquiries" ON public.inquiries
  FOR INSERT WITH CHECK (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE TRIGGER update_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
