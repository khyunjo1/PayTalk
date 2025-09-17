// 일일 메뉴 페이지 관리 API 함수

import { supabase } from './supabase';
import { 
  MenuDB, 
  DailyMenu, 
  DailyMenuItem, 
  CreateDailyMenuData, 
  CreateDailyMenuItemData 
} from '../types';

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

    return result;
  } catch (rpcError) {
    console.log('RPC 함수 없음, 직접 insert 시도');
    
    // RPC 함수가 없으면 직접 insert 시도
    const { data: result, error } = await supabase
      .from('daily_menus')
      .insert({
        store_id: data.store_id,
        menu_date: data.menu_date,
        title: data.title || '오늘의 반찬',
        description: data.description || null
      })
      .select()
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
        p_store_id: storeId,
        p_menu_date: menuDate
      });

    if (error) {
      console.error('일일 메뉴 조회 오류 (RPC):', error);
      // RPC 함수가 없으면 기존 방식으로 fallback
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('daily_menus')
        .select('*')
        .eq('store_id', storeId)
        .eq('menu_date', menuDate)
        .single();

      if (fallbackError && fallbackError.code !== 'PGRST116') {
        console.error('일일 메뉴 조회 오류 (fallback):', fallbackError);
        throw new Error(`일일 메뉴 조회에 실패했습니다: ${fallbackError.message}`);
      }

      return fallbackData;
    }

    return data && data.length > 0 ? data[0] : null;
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
  if (data.initial_quantity < 0) {
    throw new Error('수량은 0 이상이어야 합니다.');
  }

  const { data: result, error } = await supabase
    .from('daily_menu_items')
    .insert({
      daily_menu_id: data.daily_menu_id,
      menu_id: data.menu_id,
      initial_quantity: data.initial_quantity,
      current_quantity: data.initial_quantity
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

// 일일 메뉴 아이템 수량 수정
export const updateDailyMenuItemQuantity = async (
  itemId: string, 
  newQuantity: number
): Promise<DailyMenuItem> => {
  if (newQuantity < 0) {
    throw new Error('수량은 0 이상이어야 합니다.');
  }

  // 먼저 현재 아이템 정보를 가져와서 current_quantity 계산
  const { data: currentItem, error: fetchError } = await supabase
    .from('daily_menu_items')
    .select('initial_quantity, current_quantity')
    .eq('id', itemId)
    .single();

  if (fetchError) {
    console.error('아이템 조회 오류:', fetchError);
    throw new Error(`아이템 조회에 실패했습니다: ${fetchError.message}`);
  }

  // 새로운 current_quantity = 기존 current_quantity + (새로운 initial_quantity - 기존 initial_quantity)
  const newCurrentQuantity = currentItem.current_quantity + (newQuantity - currentItem.initial_quantity);

  const { data: result, error } = await supabase
    .from('daily_menu_items')
    .update({
      initial_quantity: newQuantity,
      current_quantity: Math.max(0, newCurrentQuantity),
      is_available: newQuantity > 0
    })
    .eq('id', itemId)
    .select(`
      *,
      menu:menus(*)
    `)
    .single();

  if (error) {
    console.error('일일 메뉴 아이템 수량 수정 오류:', error);
    throw new Error(`수량 수정에 실패했습니다: ${error.message}`);
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

// 고객 주문 시 수량 차감
export const deductDailyMenuItemQuantity = async (
  itemId: string, 
  quantity: number
): Promise<DailyMenuItem> => {
  if (quantity <= 0) {
    throw new Error('차감할 수량은 0보다 커야 합니다.');
  }

  // 먼저 현재 수량 조회
  const { data: currentItem, error: fetchError } = await supabase
    .from('daily_menu_items')
    .select('current_quantity')
    .eq('id', itemId)
    .single();

  if (fetchError) {
    throw new Error(`현재 수량 조회에 실패했습니다: ${fetchError.message}`);
  }

  const newQuantity = Math.max(0, currentItem.current_quantity - quantity);
  const isAvailable = newQuantity > 0;

  const { data: result, error } = await supabase
    .from('daily_menu_items')
    .update({
      current_quantity: newQuantity,
      is_available: isAvailable
    })
    .eq('id', itemId)
    .select(`
      *,
      menu:menus(*)
    `)
    .single();

  if (error) {
    console.error('수량 차감 오류:', error);
    throw new Error(`수량 차감에 실패했습니다: ${error.message}`);
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
  // 한국 표준시간 기준으로 오늘 날짜 계산
  const now = new Date();
  const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
  const today = koreaTime.toISOString().split('T')[0];
  return getDailyMenu(storeId, today);
};

// 내일의 일일 메뉴 페이지 조회 (고객용)
export const getTomorrowDailyMenu = async (storeId: string): Promise<DailyMenu | null> => {
  // 한국 표준시간 기준으로 내일 날짜 계산
  const now = new Date();
  const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
  const tomorrow = new Date(koreaTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  return getDailyMenu(storeId, tomorrowStr);
};
