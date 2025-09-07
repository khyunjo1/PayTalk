// 매장 관리 API 함수
// 요구사항 4: 사장님 고유 계좌번호 저장 & 표시

import { supabase } from './supabase';

// 모든 매장 목록 가져오기
export const getStores = async () => {
  console.log('📡 getStores API 호출 시작');
  
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 매장 목록 가져오기 오류:', error);
    throw error;
  }

  console.log('✅ getStores API 응답:', data);
  return data || [];
};

// 특정 매장 정보 가져오기
export const getStore = async (storeId: string) => {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single();

  if (error) {
    console.error('매장 정보 가져오기 오류:', error);
    throw error;
  }

  return data;
};

// 매장 생성
export const createStore = async (storeData: {
  name: string;
  category: string;
  owner_name?: string;
  delivery_area: string;
  delivery_fee: number;
  phone: string;
  business_hours_start?: string;
  business_hours_end?: string;
  pickup_time_slots?: string[];
  delivery_time_slots?: Array<{
    name: string;
    start: string;
    end: string;
    enabled: boolean;
  }>;
  bank_account: string;
  account_holder: string;
  is_active?: boolean;
}) => {
  const { data, error } = await supabase
    .from('stores')
    .insert(storeData)
    .select()
    .single();

  if (error) {
    console.error('매장 생성 오류:', error);
    throw error;
  }

  return data;
};

// 매장 정보 수정
export const updateStore = async (storeId: string, updateData: {
  name?: string;
  category?: string;
  owner_name?: string;
  delivery_area?: string;
  delivery_fee?: number;
  phone?: string;
  business_hours_start?: string;
  business_hours_end?: string;
  pickup_time_slots?: string[];
  delivery_time_slots?: Array<{
    name: string;
    start: string;
    end: string;
    enabled: boolean;
  }>;
  bank_account?: string;
  account_holder?: string;
  is_active?: boolean;
}) => {
  const { data, error } = await supabase
    .from('stores')
    .update(updateData)
    .eq('id', storeId)
    .select()
    .single();

  if (error) {
    console.error('매장 수정 오류:', error);
    throw error;
  }

  return data;
};

// 매장 삭제
export const deleteStore = async (storeId: string) => {
  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', storeId);

  if (error) {
    console.error('매장 삭제 오류:', error);
    throw error;
  }
};
