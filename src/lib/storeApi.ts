// 매장 관리 API 함수
// 요구사항 4: 사장님 고유 계좌번호 저장 & 표시
// 사용자별 개인 매장 목록 관리

import { supabase } from './supabase';
import { StoreDB, CreateStoreData, UpdateStoreData } from '../types';
import { cache, CACHE_KEYS } from './cache';

// 모든 매장 목록 가져오기
export const getStores = async (): Promise<StoreDB[]> => {
  console.log('📡 getStores API 호출 시작');
  
  // 캐시에서 먼저 확인
  const cachedData = cache.get<StoreDB[]>(CACHE_KEYS.STORES);
  if (cachedData) {
    console.log('✅ getStores 캐시에서 반환:', cachedData.length, '개');
    return cachedData;
  }
  
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 매장 목록 가져오기 오류:', error);
    throw new Error(`매장 목록을 불러오는데 실패했습니다: ${error.message}`);
  }

  const result = data || [];
  console.log('✅ getStores API 응답:', result);
  
  // 캐시에 저장 (5분 TTL)
  cache.set(CACHE_KEYS.STORES, result, 5 * 60 * 1000);
  
  return result;
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
export const createStore = async (storeData: CreateStoreData, ownerId?: string): Promise<StoreDB> => {
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

  // owner_id 추가
  const storeDataWithOwner = {
    ...storeData,
    owner_id: ownerId || null
  };

  const { data, error } = await supabase
    .from('stores')
    .insert(storeDataWithOwner)
    .select()
    .single();

  if (error) {
    console.error('매장 생성 오류:', error);
    throw new Error(`매장 생성에 실패했습니다: ${error.message}`);
  }

  // 캐시 무효화
  cache.delete(CACHE_KEYS.STORES);
  
  return data;
};

// 매장 정보 수정
export const updateStore = async (storeId: string, updateData: UpdateStoreData): Promise<StoreDB> => {
  console.log('🔄 updateStore API 호출:', storeId, updateData);
  console.log('💰 최소주문금액 API 전송값:', updateData.minimum_order_amount);
  
  if (!storeId) {
    throw new Error('매장 ID가 필요합니다.');
  }
  if (updateData.name !== undefined && !updateData.name?.trim()) {
    throw new Error('매장명을 입력해주세요.');
  }
  if (updateData.category !== undefined && !updateData.category?.trim()) {
    throw new Error('카테고리를 선택해주세요.');
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

  console.log('✅ updateStore API 응답:', data);
  console.log('💰 최소주문금액 API 응답값:', data?.minimum_order_amount);

  // 캐시 무효화
  cache.delete(CACHE_KEYS.STORES);
  
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

  // 캐시 무효화
  cache.delete(CACHE_KEYS.STORES);
};

// 사용자별 개인 매장 목록 가져오기
export const getUserStores = async (userId: string): Promise<StoreDB[]> => {
  console.log('📡 getUserStores API 호출 시작, userId:', userId);
  
  if (!userId) {
    throw new Error('사용자 ID가 필요합니다.');
  }

  // 캐시 키 생성
  const cacheKey = `${CACHE_KEYS.USER_STORES}_${userId}`;
  
  // 캐시에서 먼저 확인
  const cachedData = cache.get<StoreDB[]>(cacheKey);
  if (cachedData) {
    console.log('✅ getUserStores 캐시에서 반환:', cachedData.length, '개');
    return cachedData;
  }

  const { data, error } = await supabase
    .from('user_stores')
    .select(`
      stores (
        id,
        name,
        category,
        delivery_area,
        phone,
        business_hours_start,
        business_hours_end,
        order_cutoff_time,
        minimum_order_amount,
        pickup_time_slots,
        delivery_time_slots,
        bank_account,
        account_holder,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 사용자 매장 목록 가져오기 오류:', error);
    throw new Error(`매장 목록을 불러오는데 실패했습니다: ${error.message}`);
  }

  // 중첩된 구조에서 stores 데이터 추출
  const result = data?.map(item => item.stores).filter(Boolean) || [];
  console.log('✅ getUserStores API 응답:', result);
  
  // 캐시에 저장 (5분 TTL)
  cache.set(cacheKey, result, 5 * 60 * 1000);
  
  return result;
};

// 사용자 매장 목록에 매장 추가
export const addStoreToUser = async (userId: string, storeId: string): Promise<void> => {
  console.log('📡 addStoreToUser API 호출, userId:', userId, 'storeId:', storeId);

  if (!userId) {
    throw new Error('사용자 ID가 필요합니다.');
  }
  if (!storeId) {
    throw new Error('매장 ID가 필요합니다.');
  }

  // upsert 사용으로 중복 에러 방지
  const { error } = await supabase
    .from('user_stores')
    .upsert({
      user_id: userId,
      store_id: storeId
    }, {
      onConflict: 'user_id,store_id'
    });

  if (error) {
    console.error('❌ 사용자 매장 추가 오류:', error);
    throw new Error(`매장을 추가하는데 실패했습니다: ${error.message}`);
  }

  // 캐시 무효화
  const cacheKey = `${CACHE_KEYS.USER_STORES}_${userId}`;
  cache.delete(cacheKey);

  console.log('✅ 매장이 사용자 목록에 추가됨 (중복 체크 완료)');
};

// 사용자 매장 목록에서 매장 제거
export const removeStoreFromUser = async (userId: string, storeId: string): Promise<void> => {
  console.log('📡 removeStoreFromUser API 호출, userId:', userId, 'storeId:', storeId);
  
  if (!userId) {
    throw new Error('사용자 ID가 필요합니다.');
  }
  if (!storeId) {
    throw new Error('매장 ID가 필요합니다.');
  }

  const { error } = await supabase
    .from('user_stores')
    .delete()
    .eq('user_id', userId)
    .eq('store_id', storeId);

  if (error) {
    console.error('❌ 사용자 매장 제거 오류:', error);
    throw new Error(`매장을 제거하는데 실패했습니다: ${error.message}`);
  }

  // 캐시 무효화
  const cacheKey = `${CACHE_KEYS.USER_STORES}_${userId}`;
  cache.delete(cacheKey);
  
  console.log('✅ 매장이 사용자 목록에서 제거됨');
};

// 모든 매장 목록 가져오기 (관리자용 - 기존 함수 유지)
export const getAllStores = async (): Promise<StoreDB[]> => {
  console.log('📡 getAllStores API 호출 시작 (관리자용)');
  
  // 캐시에서 먼저 확인
  const cachedData = cache.get<StoreDB[]>(CACHE_KEYS.ALL_STORES);
  if (cachedData) {
    console.log('✅ getAllStores 캐시에서 반환:', cachedData.length, '개');
    return cachedData;
  }
  
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ 전체 매장 목록 가져오기 오류:', error);
    throw new Error(`매장 목록을 불러오는데 실패했습니다: ${error.message}`);
  }

  const result = data || [];
  console.log('✅ getAllStores API 응답:', result);
  
  // 캐시에 저장 (5분 TTL)
  cache.set(CACHE_KEYS.ALL_STORES, result, 5 * 60 * 1000);
  
  return result;
};

// 매장에 owner_id 설정
export const setStoreOwner = async (storeId: string, ownerId: string): Promise<StoreDB> => {
  console.log('🔄 매장에 owner_id 설정:', { storeId, ownerId });

  // 1. stores 테이블에 owner_id 설정
  const { data, error } = await supabase
    .from('stores')
    .update({ owner_id: ownerId })
    .eq('id', storeId)
    .select()
    .single();

  if (error) {
    console.error('매장 owner_id 설정 오류:', error);
    throw new Error(`매장 owner_id 설정에 실패했습니다: ${error.message}`);
  }

  // 2. user_stores 테이블에 연결 추가
  const { error: userStoreError } = await supabase
    .from('user_stores')
    .upsert({
      user_id: ownerId,
      store_id: storeId,
      role: 'owner'
    }, {
      onConflict: 'user_id,store_id'
    });

  if (userStoreError) {
    console.error('사용자-매장 연결 오류:', userStoreError);
    // 연결 실패해도 owner_id는 설정되었으므로 계속 진행
  } else {
    console.log('✅ 사용자-매장 연결 성공');
  }

  // 캐시 무효화
  cache.delete(CACHE_KEYS.STORES);
  
  console.log('✅ 매장 owner_id 설정 성공:', data);
  return data;
};
