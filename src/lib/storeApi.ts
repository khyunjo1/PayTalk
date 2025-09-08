// 매장 관리 API 함수
// 요구사항 4: 사장님 고유 계좌번호 저장 & 표시

import { supabase } from './supabase';
import { StoreDB, CreateStoreData, UpdateStoreData } from '../types';

// 모든 매장 목록 가져오기
export const getStores = async (): Promise<StoreDB[]> => {
  console.log('📡 getStores API 호출 시작');
  
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 매장 목록 가져오기 오류:', error);
    throw new Error(`매장 목록을 불러오는데 실패했습니다: ${error.message}`);
  }

  console.log('✅ getStores API 응답:', data);
  return data || [];
};

// 특정 매장 정보 가져오기
export const getStore = async (storeId: string): Promise<StoreDB> => {
  if (!storeId) {
    throw new Error('매장 ID가 필요합니다.');
  }

  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single();

  if (error) {
    console.error('매장 정보 가져오기 오류:', error);
    throw new Error(`매장 정보를 불러오는데 실패했습니다: ${error.message}`);
  }

  return data;
};

// 매장 생성
export const createStore = async (storeData: CreateStoreData): Promise<StoreDB> => {
  // 입력 데이터 검증
  if (!storeData.name?.trim()) {
    throw new Error('매장명을 입력해주세요.');
  }
  if (!storeData.category?.trim()) {
    throw new Error('카테고리를 선택해주세요.');
  }
  if (!storeData.delivery_area?.trim()) {
    throw new Error('배달지역을 입력해주세요.');
  }
  if (!storeData.phone?.trim()) {
    throw new Error('전화번호를 입력해주세요.');
  }
  if (!storeData.bank_account?.trim()) {
    throw new Error('계좌번호를 입력해주세요.');
  }
  if (!storeData.account_holder?.trim()) {
    throw new Error('예금주명을 입력해주세요.');
  }
  if (storeData.delivery_fee < 0) {
    throw new Error('배달비는 0원 이상이어야 합니다.');
  }

  const { data, error } = await supabase
    .from('stores')
    .insert(storeData)
    .select()
    .single();

  if (error) {
    console.error('매장 생성 오류:', error);
    throw new Error(`매장 생성에 실패했습니다: ${error.message}`);
  }

  return data;
};

// 매장 정보 수정
export const updateStore = async (storeId: string, updateData: UpdateStoreData): Promise<StoreDB> => {
  if (!storeId) {
    throw new Error('매장 ID가 필요합니다.');
  }
  if (updateData.name !== undefined && !updateData.name?.trim()) {
    throw new Error('매장명을 입력해주세요.');
  }
  if (updateData.category !== undefined && !updateData.category?.trim()) {
    throw new Error('카테고리를 선택해주세요.');
  }
  if (updateData.delivery_fee !== undefined && updateData.delivery_fee < 0) {
    throw new Error('배달비는 0원 이상이어야 합니다.');
  }

  const { data, error } = await supabase
    .from('stores')
    .update(updateData)
    .eq('id', storeId)
    .select()
    .single();

  if (error) {
    console.error('매장 수정 오류:', error);
    throw new Error(`매장 수정에 실패했습니다: ${error.message}`);
  }

  return data;
};

// 매장 삭제
export const deleteStore = async (storeId: string): Promise<void> => {
  if (!storeId) {
    throw new Error('매장 ID가 필요합니다.');
  }

  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', storeId);

  if (error) {
    console.error('매장 삭제 오류:', error);
    throw new Error(`매장 삭제에 실패했습니다: ${error.message}`);
  }
};
