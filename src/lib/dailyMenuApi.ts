// 일일 메뉴 페이지 관리 API 함수

import { supabase } from './supabase';
import { 
  MenuDB, 
  DailyMenu, 
  DailyMenuItem, 
  CreateDailyMenuData, 
  CreateDailyMenuItemData 
} from '../types';

// 타입들을 re-export
export type { DailyMenu, DailyMenuItem, CreateDailyMenuItemData };

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
        p_menu_date: menuDate,
        p_store_id: storeId
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

// 어제의 일일 메뉴 페이지 조회 (템플릿용)
export const getYesterdayDailyMenu = async (storeId: string): Promise<DailyMenu | null> => {
  // 한국 표준시간 기준으로 어제 날짜 계산
  const now = new Date();
  const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
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
    // 최근 7일 동안의 메뉴를 확인
    const today = new Date();
    const koreaTime = new Date(today.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
    
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
    
    // 선택된 날짜 이전의 가장 최근 메뉴 찾기
    const { data, error } = await supabase
      .from('daily_menus')
      .select('*')
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
    
    console.log(`${targetDate} 이전의 가장 최근 메뉴를 찾았습니다:`, {
      menu: latestMenu,
      menuDate: latestMenu.menu_date,
      itemsCount: items.length
    });

    return { menu: latestMenu, items };
  } catch (error) {
    console.error('최근 일일메뉴 조회 오류:', error);
    return null;
  }
};
