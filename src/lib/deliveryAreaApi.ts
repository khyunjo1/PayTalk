import { supabase } from './supabase';

export interface DeliveryArea {
  id: string;
  store_id: string;
  area_name: string;
  delivery_fee: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 배달지역 목록 조회 (매장별)
export const getDeliveryAreas = async (storeId: string): Promise<DeliveryArea[]> => {
  const { data, error } = await supabase
    .from('delivery_areas')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .order('area_name');

  if (error) {
    console.error('배달지역 조회 오류:', error);
    throw error;
  }

  return data || [];
};

// 배달지역 생성
export const createDeliveryArea = async (storeId: string, areaName: string, deliveryFee: number): Promise<DeliveryArea> => {
  console.log('🔍 createDeliveryArea 호출:', { storeId, areaName, deliveryFee });
  
  // 임시로 권한 확인 비활성화 (테스트용)
  console.log('⚠️ 권한 확인을 임시로 비활성화했습니다 (테스트용)');
  
  // TODO: 나중에 권한 확인 로직을 다시 활성화해야 함
  /*
  const { data: storeData, error: storeError } = await supabase
    .from('stores')
    .select('id, owner_id')
    .eq('id', storeId)
    .single();

  if (storeError) {
    console.error('❌ 매장 정보 조회 실패:', storeError);
    throw new Error('매장 정보를 찾을 수 없습니다.');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (storeData.owner_id !== user?.id) {
    throw new Error('이 매장의 배달지역을 관리할 권한이 없습니다.');
  }
  */
  
  const { data, error } = await supabase
    .from('delivery_areas')
    .insert({
      store_id: storeId,
      area_name: areaName,
      delivery_fee: deliveryFee,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('❌ 배달지역 생성 오류:', error);
    throw error;
  }

  console.log('✅ 배달지역 생성 성공:', data);
  return data;
};

// 배달지역 수정
export const updateDeliveryArea = async (areaId: string, areaName: string, deliveryFee: number): Promise<DeliveryArea> => {
  // 먼저 해당 배달지역이 속한 매장의 소유자인지 확인
  const { data: areaData, error: areaError } = await supabase
    .from('delivery_areas')
    .select('store_id')
    .eq('id', areaId)
    .single();

  if (areaError) {
    console.error('❌ 배달지역 조회 실패:', areaError);
    throw new Error('배달지역을 찾을 수 없습니다.');
  }

  const { data: storeData, error: storeError } = await supabase
    .from('stores')
    .select('id, owner_id')
    .eq('id', areaData.store_id)
    .single();

  if (storeError) {
    console.error('❌ 매장 정보 조회 실패:', storeError);
    throw new Error('매장 정보를 찾을 수 없습니다.');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (storeData.owner_id !== user?.id) {
    throw new Error('이 배달지역을 수정할 권한이 없습니다.');
  }

  const { data, error } = await supabase
    .from('delivery_areas')
    .update({
      area_name: areaName,
      delivery_fee: deliveryFee,
      updated_at: new Date().toISOString()
    })
    .eq('id', areaId)
    .select()
    .single();

  if (error) {
    console.error('배달지역 수정 오류:', error);
    throw error;
  }

  return data;
};

// 배달지역 삭제 (비활성화)
export const deleteDeliveryArea = async (areaId: string): Promise<void> => {
  // 먼저 해당 배달지역이 속한 매장의 소유자인지 확인
  const { data: areaData, error: areaError } = await supabase
    .from('delivery_areas')
    .select('store_id')
    .eq('id', areaId)
    .single();

  if (areaError) {
    console.error('❌ 배달지역 조회 실패:', areaError);
    throw new Error('배달지역을 찾을 수 없습니다.');
  }

  const { data: storeData, error: storeError } = await supabase
    .from('stores')
    .select('id, owner_id')
    .eq('id', areaData.store_id)
    .single();

  if (storeError) {
    console.error('❌ 매장 정보 조회 실패:', storeError);
    throw new Error('매장 정보를 찾을 수 없습니다.');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (storeData.owner_id !== user?.id) {
    throw new Error('이 배달지역을 삭제할 권한이 없습니다.');
  }

  const { error } = await supabase
    .from('delivery_areas')
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', areaId);

  if (error) {
    console.error('배달지역 삭제 오류:', error);
    throw error;
  }
};

// 배달지역 ID로 배달비 조회
export const getDeliveryFeeByAreaId = async (areaId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('delivery_areas')
    .select('delivery_fee')
    .eq('id', areaId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('배달비 조회 오류:', error);
    return 0;
  }

  return data?.delivery_fee || 0;
};

// 일일 메뉴 배달지역 목록 조회
export const getDailyDeliveryAreas = async (dailyMenuId: string): Promise<any[]> => {
  const { data, error } = await supabase
    .from('daily_delivery_areas')
    .select('*')
    .eq('daily_menu_id', dailyMenuId)
    .eq('is_active', true)
    .order('area_name');

  if (error) {
    console.error('일일 배달지역 조회 오류:', error);
    throw error;
  }

  return data || [];
};

// 일일 메뉴 배달지역 ID로 배달비 조회
export const getDailyDeliveryFeeByAreaId = async (areaId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('daily_delivery_areas')
    .select('delivery_fee')
    .eq('id', areaId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('일일 배달비 조회 오류:', error);
    return 0;
  }

  return data?.delivery_fee || 0;
};
