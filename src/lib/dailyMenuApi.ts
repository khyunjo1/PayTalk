// 일일 메뉴 페이지 관리 API 함수

import { supabase } from './supabase';
import { 
  MenuDB, 
  DailyMenu, 
  DailyMenuItem, 
  CreateDailyMenuData, 
  CreateDailyMenuItemData,
  DeliveryTimeSlot,
  DailyDeliveryArea
} from '../types';

// 타입들을 re-export
export type { DailyMenu, DailyMenuItem, CreateDailyMenuItemData };

// JSONB 데이터를 string[]로 변환하는 헬퍼 함수
const convertPickupTimeSlots = (data: any): string[] => {
  if (Array.isArray(data)) {
    return data;
  }
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : ['09:00', '20:00'];
    } catch {
      return ['09:00', '20:00'];
    }
  }
  return ['09:00', '20:00'];
};

// JSONB 데이터를 DeliveryTimeSlot[]로 변환하는 헬퍼 함수
const convertDeliveryTimeSlots = (data: any): DeliveryTimeSlot[] => {
  if (Array.isArray(data)) {
    return data;
  }
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// 일일 메뉴 페이지 생성
export const createDailyMenu = async (data: CreateDailyMenuData): Promise<DailyMenu> => {
  if (!data.store_id) {
    throw new Error('매장 ID가 필요합니다.');
  }
  if (!data.menu_date) {
    throw new Error('메뉴 날짜가 필요합니다.');
  }

  // RLS 우회를 위해 rpc 함수 사용 시도
  try {
    const { data: result, error } = await supabase
      .rpc('create_daily_menu', {
        p_store_id: data.store_id,
        p_menu_date: data.menu_date,
        p_title: data.title || '오늘의 반찬',
        p_description: data.description || null
      });

    if (error) {
      console.error('RPC 함수 오류, 직접 insert 시도:', error);
      throw error;
    }

    // RPC 함수는 배열을 반환하므로 첫 번째 요소 반환
    return result && result.length > 0 ? result[0] : null;
  } catch (rpcError) {
    console.log('RPC 함수 없음, 직접 insert 시도');
    
    // RPC 함수가 없으면 직접 insert 시도 (설정값들 포함)
    const { data: result, error } = await supabase
      .from('daily_menus')
      .insert({
        store_id: data.store_id,
        menu_date: data.menu_date,
        title: data.title || '오늘의 반찬',
        description: data.description || null,
        pickup_time_slots: data.pickup_time_slots || ['09:00', '20:00'],
        delivery_time_slots: data.delivery_time_slots || [],
        delivery_fee: data.delivery_fee || 0,
        order_cutoff_time: data.order_cutoff_time || null,
        minimum_order_amount: data.minimum_order_amount || 0
      })
      .select(`
        *,
        pickup_time_slots,
        delivery_time_slots,
        delivery_fee,
        order_cutoff_time,
        minimum_order_amount
      `)
      .single();

    if (error) {
      console.error('일일 메뉴 생성 오류:', error);
      throw new Error(`일일 메뉴 생성에 실패했습니다: ${error.message}`);
    }

    return result;
  }
};

// 특정 매장의 일일 메뉴 페이지 조회
export const getDailyMenu = async (storeId: string, menuDate: string): Promise<DailyMenu | null> => {
  if (!menuDate || menuDate.trim() === '') {
    console.warn('빈 날짜로 일일 메뉴 조회 시도');
    return null;
  }

  try {
    // 먼저 자동 비활성화 실행
    await supabase.rpc('execute_daily_menu_auto_deactivation');
    
    // 자동 비활성화 체크가 포함된 함수 사용
    const { data, error } = await supabase
      .rpc('get_daily_menu_with_auto_check', {
        p_menu_date: menuDate,
        p_store_id: storeId
      });

    if (error) {
      console.error('일일 메뉴 조회 오류 (RPC):', error);
      // RPC 함수가 없으면 기존 방식으로 fallback (설정값들 포함)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('daily_menus')
        .select(`
          *,
          pickup_time_slots,
          delivery_time_slots,
          delivery_fee,
          order_cutoff_time,
          minimum_order_amount
        `)
        .eq('store_id', storeId)
        .eq('menu_date', menuDate)
        .single();

      if (fallbackError && fallbackError.code !== 'PGRST116') {
        console.error('일일 메뉴 조회 오류 (fallback):', fallbackError);
        throw new Error(`일일 메뉴 조회에 실패했습니다: ${fallbackError.message}`);
      }

      // 데이터 변환 적용
      if (fallbackData) {
        return {
          ...fallbackData,
          pickup_time_slots: convertPickupTimeSlots(fallbackData.pickup_time_slots),
          delivery_time_slots: convertDeliveryTimeSlots(fallbackData.delivery_time_slots)
        };
      }
      return fallbackData;
    }

    // RPC 함수 결과도 변환 적용
    if (data && data.length > 0) {
      const menuData = data[0];
      return {
        ...menuData,
        pickup_time_slots: convertPickupTimeSlots(menuData.pickup_time_slots),
        delivery_time_slots: convertDeliveryTimeSlots(menuData.delivery_time_slots)
      };
    }
    return null;
  } catch (error) {
    console.error('일일 메뉴 조회 오류:', error);
    throw new Error(`일일 메뉴 조회에 실패했습니다: ${error}`);
  }
};

// 일일 메뉴 아이템 추가
export const addDailyMenuItem = async (data: CreateDailyMenuItemData): Promise<DailyMenuItem> => {
  if (!data.daily_menu_id) {
    throw new Error('일일 메뉴 ID가 필요합니다.');
  }
  if (!data.menu_id) {
    throw new Error('메뉴 ID가 필요합니다.');
  }

  const { data: result, error } = await supabase
    .from('daily_menu_items')
    .insert({
      daily_menu_id: data.daily_menu_id,
      menu_id: data.menu_id,
      is_available: true
    })
    .select(`
      *,
      menu:menus(*)
    `)
    .single();

  if (error) {
    console.error('일일 메뉴 아이템 추가 오류:', error);
    throw new Error(`일일 메뉴 아이템 추가에 실패했습니다: ${error.message}`);
  }

  return result;
};


// 일일 메뉴 아이템 품절 처리
export const toggleDailyMenuItemAvailability = async (
  itemId: string, 
  isAvailable: boolean
): Promise<DailyMenuItem> => {
  const { data: result, error } = await supabase
    .from('daily_menu_items')
    .update({
      is_available: isAvailable
    })
    .eq('id', itemId)
    .select(`
      *,
      menu:menus(*)
    `)
    .single();

  if (error) {
    console.error('일일 메뉴 아이템 품절 처리 오류:', error);
    throw new Error(`품절 처리에 실패했습니다: ${error.message}`);
  }

  return result;
};


// 일일 메뉴 아이템 삭제
export const removeDailyMenuItem = async (itemId: string): Promise<void> => {
  const { error } = await supabase
    .from('daily_menu_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('일일 메뉴 아이템 삭제 오류:', error);
    throw new Error(`아이템 삭제에 실패했습니다: ${error.message}`);
  }
};

// 일일 메뉴의 모든 아이템 조회
export const getDailyMenuItems = async (dailyMenuId: string): Promise<DailyMenuItem[]> => {
  try {
    // 먼저 자동 비활성화 실행
    await supabase.rpc('execute_daily_menu_auto_deactivation');
    
    // 기존 방식으로 조회 (menu 정보 포함)
    const { data, error } = await supabase
      .from('daily_menu_items')
      .select(`
        *,
        menu:menus(*)
      `)
      .eq('daily_menu_id', dailyMenuId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('일일 메뉴 아이템 조회 오류:', error);
      throw new Error(`아이템 조회에 실패했습니다: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('일일 메뉴 아이템 조회 오류:', error);
    throw new Error(`아이템 조회에 실패했습니다: ${error}`);
  }
};

// 일일 메뉴 페이지 비활성화
export const deactivateDailyMenu = async (dailyMenuId: string): Promise<void> => {
  const { error } = await supabase
    .from('daily_menus')
    .update({ is_active: false })
    .eq('id', dailyMenuId);

  if (error) {
    console.error('일일 메뉴 비활성화 오류:', error);
    throw new Error(`메뉴 비활성화에 실패했습니다: ${error.message}`);
  }
};

// 일일 메뉴 페이지 활성화
export const activateDailyMenu = async (dailyMenuId: string): Promise<void> => {
  const { error } = await supabase
    .from('daily_menus')
    .update({ is_active: true })
    .eq('id', dailyMenuId);

  if (error) {
    console.error('일일 메뉴 활성화 오류:', error);
    throw new Error(`메뉴 활성화에 실패했습니다: ${error.message}`);
  }
};

// 매장의 모든 일일 메뉴 페이지 조회 (관리자용)
export const getDailyMenusByStore = async (storeId: string): Promise<DailyMenu[]> => {
  const { data, error } = await supabase
    .from('daily_menus')
    .select('*')
    .eq('store_id', storeId)
    .order('menu_date', { ascending: false });

  if (error) {
    console.error('매장 일일 메뉴 조회 오류:', error);
    throw new Error(`일일 메뉴 목록 조회에 실패했습니다: ${error.message}`);
  }

  return data || [];
};

// 오늘의 일일 메뉴 페이지 조회 (고객용)
export const getTodayDailyMenu = async (storeId: string): Promise<DailyMenu | null> => {
  // UTC+9 (한국 시간) 직접 계산
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const koreaTime = new Date(utcTime + (9 * 3600000)); // UTC+9
  const today = koreaTime.toISOString().split('T')[0];
  return getDailyMenu(storeId, today);
};

// 내일의 일일 메뉴 페이지 조회 (고객용)
export const getTomorrowDailyMenu = async (storeId: string): Promise<DailyMenu | null> => {
  // UTC+9 (한국 시간) 직접 계산
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const koreaTime = new Date(utcTime + (9 * 3600000)); // UTC+9
  const tomorrow = new Date(koreaTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  return getDailyMenu(storeId, tomorrowStr);
};

// 어제의 일일 메뉴 페이지 조회 (템플릿용)
export const getYesterdayDailyMenu = async (storeId: string): Promise<DailyMenu | null> => {
  // UTC+9 (한국 시간) 직접 계산
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const koreaTime = new Date(utcTime + (9 * 3600000)); // UTC+9
  const yesterday = new Date(koreaTime);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  return getDailyMenu(storeId, yesterdayStr);
};

// 어제의 일일 메뉴 아이템들을 템플릿으로 가져오기
export const getYesterdayDailyMenuItems = async (storeId: string): Promise<DailyMenuItem[]> => {
  try {
    const yesterdayMenu = await getYesterdayDailyMenu(storeId);
    if (!yesterdayMenu) {
      console.log('어제의 일일 메뉴가 없습니다.');
      return [];
    }
    
    const items = await getDailyMenuItems(yesterdayMenu.id);
    console.log('어제의 일일 메뉴 아이템들:', items);
    return items;
  } catch (error) {
    console.error('어제의 일일 메뉴 아이템 조회 오류:', error);
    return [];
  }
};

// 최근 일일 메뉴 아이템들을 템플릿으로 가져오기 (어제가 없으면 최근 7일 내에서 찾기)
export const getRecentDailyMenuItems = async (storeId: string): Promise<{ items: DailyMenuItem[], date: string } | null> => {
  try {
    // 최근 7일 동안의 메뉴를 확인 - UTC+9 (한국 시간) 직접 계산
    const today = new Date();
    const utcTime = today.getTime() + (today.getTimezoneOffset() * 60000);
    const koreaTime = new Date(utcTime + (9 * 3600000)); // UTC+9
    
    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date(koreaTime);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const menu = await getDailyMenu(storeId, dateStr);
      if (menu) {
        const items = await getDailyMenuItems(menu.id);
        if (items.length > 0) {
          console.log(`${dateStr}의 일일 메뉴를 찾았습니다:`, items);
          return { items, date: dateStr };
        }
      }
    }
    
    console.log('최근 7일 내에 일일 메뉴가 없습니다.');
    return null;
  } catch (error) {
    console.error('최근 일일 메뉴 아이템 조회 오류:', error);
    return null;
  }
};

// 가장 최근에 수정된 일일메뉴를 찾는 함수 (주문서 자동 로드용)
export const getLatestDailyMenu = async (storeId: string, selectedDate?: string): Promise<{ menu: DailyMenu, items: DailyMenuItem[] } | null> => {
  try {
    // 먼저 자동 비활성화 실행
    await supabase.rpc('execute_daily_menu_auto_deactivation');
    
    // 선택된 날짜가 있으면 그 날짜 이전을 찾고, 없으면 오늘 이전을 찾음
    let targetDate: string;
    
    if (selectedDate) {
      targetDate = selectedDate;
      console.log('선택된 날짜:', targetDate);
    } else {
      // 한국 시간으로 오늘 날짜 계산
      const now = new Date();
      const koreaOffset = 9 * 60; // 9시간을 분으로
      const koreaTime = new Date(now.getTime() + (koreaOffset * 60 * 1000));
      targetDate = koreaTime.toISOString().split('T')[0];
      console.log('오늘 날짜:', targetDate);
    }
    
    // 먼저 해당 매장의 모든 메뉴 조회 (디버깅용)
    const { data: allMenus, error: allMenusError } = await supabase
      .from('daily_menus')
      .select('id, menu_date, title, is_active, created_at')
      .eq('store_id', storeId)
      .order('menu_date', { ascending: false })
      .limit(10);
    
    console.log('해당 매장의 모든 메뉴 (최근 10개):', allMenus);
    
    // 선택된 날짜 이전의 가장 최근 메뉴 찾기 (설정값들 포함)
    const { data, error } = await supabase
      .from('daily_menus')
      .select(`
        *,
        pickup_time_slots,
        delivery_time_slots,
        delivery_fee,
        order_cutoff_time,
        minimum_order_amount
      `)
      .eq('store_id', storeId)
      .lt('menu_date', targetDate) // 선택된 날짜 이전 메뉴만
      .order('menu_date', { ascending: false }) // 날짜 기준으로 최신순
      .limit(1);

    if (error) {
      console.error('최근 일일메뉴 조회 오류:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log(`${targetDate} 이전의 메뉴가 없습니다.`);
      console.log('검색 조건:', {
        storeId,
        targetDate,
        condition: `menu_date < '${targetDate}'`
      });
      return null;
    }

    const latestMenu = data[0];
    const items = await getDailyMenuItems(latestMenu.id);
    
    // 데이터 변환 적용
    const convertedMenu = {
      ...latestMenu,
      pickup_time_slots: convertPickupTimeSlots(latestMenu.pickup_time_slots),
      delivery_time_slots: convertDeliveryTimeSlots(latestMenu.delivery_time_slots)
    };
    
    console.log(`${targetDate} 이전의 가장 최근 메뉴를 찾았습니다:`, {
      menu: convertedMenu,
      menuDate: convertedMenu.menu_date,
      itemsCount: items.length
    });

    return { menu: convertedMenu, items };
  } catch (error) {
    console.error('최근 일일메뉴 조회 오류:', error);
    return null;
  }
};

// 일일 메뉴 설정값 업데이트
export const updateDailyMenuSettings = async (
  dailyMenuId: string, 
  settings: {
    pickup_time_slots?: string[];
    delivery_time_slots?: DeliveryTimeSlot[];
    order_cutoff_time?: string;
    minimum_order_amount?: number;
  }
): Promise<DailyMenu | null> => {
  try {
    console.log('일일 메뉴 설정값 업데이트:', { dailyMenuId, settings });
    
    const { data, error } = await supabase
      .from('daily_menus')
      .update({
        pickup_time_slots: settings.pickup_time_slots ? JSON.stringify(settings.pickup_time_slots) : null,
        delivery_time_slots: settings.delivery_time_slots ? JSON.stringify(settings.delivery_time_slots) : null,
        order_cutoff_time: settings.order_cutoff_time,
        minimum_order_amount: settings.minimum_order_amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', dailyMenuId)
      .select()
      .single();

    if (error) {
      console.error('일일 메뉴 설정값 업데이트 오류:', error);
      throw error;
    }

    console.log('일일 메뉴 설정값 업데이트 성공:', data);
    return data;
  } catch (error) {
    console.error('일일 메뉴 설정값 업데이트 실패:', error);
    throw error;
  }
};

// 매장의 기본 설정값을 일일 메뉴에 복사
export const copyStoreSettingsToDailyMenu = async (
  storeId: string,
  dailyMenuId: string
): Promise<DailyMenu | null> => {
  try {
    console.log('매장 설정값을 일일 메뉴에 복사:', { storeId, dailyMenuId });
    
    // 매장 정보 조회
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('pickup_time_slots, delivery_time_slots, delivery_fee, order_cutoff_time, minimum_order_amount')
      .eq('id', storeId)
      .single();

    if (storeError) {
      console.error('매장 정보 조회 오류:', storeError);
      throw storeError;
    }

    // 일일 메뉴에 설정값 복사
    const { data, error } = await supabase
      .from('daily_menus')
      .update({
        pickup_time_slots: storeData.pickup_time_slots,
        delivery_time_slots: storeData.delivery_time_slots,
        delivery_fee: 0, // 기본 배달비 0원 (delivery_areas 테이블에서 관리)
        order_cutoff_time: storeData.order_cutoff_time,
        minimum_order_amount: storeData.minimum_order_amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', dailyMenuId)
      .select()
      .single();

    if (error) {
      console.error('일일 메뉴 설정값 복사 오류:', error);
      throw error;
    }

    console.log('매장 설정값 복사 성공:', data);
    return data;
  } catch (error) {
    console.error('매장 설정값 복사 실패:', error);
    throw error;
  }
};

// 일일 배달지역 관리 함수들

// 일일 메뉴의 배달지역 목록 조회
export const getDailyDeliveryAreas = async (dailyMenuId: string): Promise<DailyDeliveryArea[]> => {
  try {
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
  } catch (error) {
    console.error('일일 배달지역 조회 실패:', error);
    throw error;
  }
};

// 일일 배달지역 추가
export const addDailyDeliveryArea = async (
  dailyMenuId: string, 
  areaName: string, 
  deliveryFee: number
): Promise<DailyDeliveryArea> => {
  try {
    const { data, error } = await supabase
      .from('daily_delivery_areas')
      .insert({
        daily_menu_id: dailyMenuId,
        area_name: areaName,
        delivery_fee: deliveryFee,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('일일 배달지역 추가 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('일일 배달지역 추가 실패:', error);
    throw error;
  }
};

// 일일 배달지역 수정
export const updateDailyDeliveryArea = async (
  areaId: string, 
  areaName: string, 
  deliveryFee: number
): Promise<DailyDeliveryArea> => {
  try {
    const { data, error } = await supabase
      .from('daily_delivery_areas')
      .update({
        area_name: areaName,
        delivery_fee: deliveryFee,
        updated_at: new Date().toISOString()
      })
      .eq('id', areaId)
      .select()
      .single();

    if (error) {
      console.error('일일 배달지역 수정 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('일일 배달지역 수정 실패:', error);
    throw error;
  }
};

// 일일 배달지역 삭제 (비활성화)
export const removeDailyDeliveryArea = async (areaId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('daily_delivery_areas')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', areaId);

    if (error) {
      console.error('일일 배달지역 삭제 오류:', error);
      throw error;
    }
  } catch (error) {
    console.error('일일 배달지역 삭제 실패:', error);
    throw error;
  }
};

// 매장의 기본 배달지역을 일일 메뉴에 복사
export const copyStoreDeliveryAreasToDailyMenu = async (
  storeId: string,
  dailyMenuId: string
): Promise<DailyDeliveryArea[]> => {
  try {
    // 매장의 기본 배달지역 조회
    const { data: storeAreas, error: storeError } = await supabase
      .from('delivery_areas')
      .select('area_name, delivery_fee')
      .eq('store_id', storeId)
      .eq('is_active', true);

    if (storeError) {
      console.error('매장 배달지역 조회 오류:', storeError);
      throw storeError;
    }

    if (!storeAreas || storeAreas.length === 0) {
      console.log('매장에 기본 배달지역이 없습니다.');
      return [];
    }

    // 일일 메뉴에 배달지역 복사
    const dailyAreas = storeAreas.map(area => ({
      daily_menu_id: dailyMenuId,
      area_name: area.area_name,
      delivery_fee: area.delivery_fee,
      is_active: true
    }));

    const { data, error } = await supabase
      .from('daily_delivery_areas')
      .insert(dailyAreas)
      .select();

    if (error) {
      console.error('일일 배달지역 복사 오류:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('매장 배달지역 복사 실패:', error);
    throw error;
  }
};
