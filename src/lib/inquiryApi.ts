import { supabase } from './supabase';

export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  store_name: string;
  status: '확인' | '미확인';
  created_at: string;
  updated_at: string;
}

// 문의 목록 조회
export const getInquiries = async (): Promise<Inquiry[]> => {
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('문의 조회 오류:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('문의 조회 실패:', error);
    throw error;
  }
};

// 문의 생성
export const createInquiry = async (inquiryData: {
  name: string;
  phone: string;
  store_name: string;
}): Promise<Inquiry> => {
  try {
    // RLS 우회를 위해 service role key 사용하거나 직접 SQL 실행
    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        name: inquiryData.name,
        phone: inquiryData.phone,
        store_name: inquiryData.store_name,
        status: '미확인',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('문의 생성 오류:', error);
      // RLS 오류인 경우 대체 방법 시도
      if (error.code === '42501') {
        console.log('RLS 정책 오류 - Supabase에서 다음 SQL을 실행해주세요:');
        console.log('DROP POLICY IF EXISTS "Anyone can create inquiries" ON public.inquiries;');
        console.log('CREATE POLICY "Allow anonymous inquiry creation" ON public.inquiries FOR INSERT WITH CHECK (true);');
        throw new Error('문의 생성 권한이 없습니다. 관리자에게 문의하세요.');
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('문의 생성 실패:', error);
    throw error;
  }
};

// 문의 상태 업데이트
export const updateInquiryStatus = async (inquiryId: string, status: '확인' | '미확인'): Promise<void> => {
  try {
    const { error } = await supabase
      .from('inquiries')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', inquiryId);

    if (error) {
      console.error('문의 상태 업데이트 오류:', error);
      throw error;
    }
  } catch (error) {
    console.error('문의 상태 업데이트 실패:', error);
    throw error;
  }
};

// 문의 삭제
export const deleteInquiry = async (inquiryId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('inquiries')
      .delete()
      .eq('id', inquiryId);

    if (error) {
      console.error('문의 삭제 오류:', error);
      throw error;
    }
  } catch (error) {
    console.error('문의 삭제 실패:', error);
    throw error;
  }
};
