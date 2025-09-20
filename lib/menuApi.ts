// 메뉴 관리 API 함수
// 요구사항 3: 사장님 메뉴 등록 (관리자가 대신 입력)

import { supabase } from './supabase';
import { MenuDB, CreateMenuData, UpdateMenuData } from '../types';

// 매장의 메뉴 목록 가져오기
export const getMenus = async (storeId: string): Promise<MenuDB[]> => {
  if (!storeId) {
    throw new Error('매장 ID가 필요합니다.');
  }

  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('store_id', storeId)
    .order('category', { ascending: true })
    .limit(1000);

  if (error) {
    console.error('메뉴 목록 가져오기 오류:', error);
    throw new Error(`메뉴 목록을 불러오는데 실패했습니다: ${error.message}`);
  }

  return data || [];
};

// 특정 메뉴 정보 가져오기
export const getMenu = async (menuId: string): Promise<MenuDB> => {
  if (!menuId) {
    throw new Error('메뉴 ID가 필요합니다.');
  }

  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('id', menuId)
    .single();

  if (error) {
    console.error('메뉴 정보 가져오기 오류:', error);
    throw new Error(`메뉴 정보를 불러오는데 실패했습니다: ${error.message}`);
  }

  return data;
};

// 메뉴 생성
export const createMenu = async (menuData: CreateMenuData): Promise<MenuDB> => {
  // 입력 데이터 검증
  if (!menuData.store_id) {
    throw new Error('매장 ID가 필요합니다.');
  }
  if (!menuData.name?.trim()) {
    throw new Error('메뉴명을 입력해주세요.');
  }
  if (menuData.price === undefined || menuData.price === null || menuData.price < 0) {
    throw new Error('가격은 0원 이상이어야 합니다.');
  }

  console.log('📝 데이터베이스에 메뉴 저장 시작:', menuData);
  
  const insertData = {
    ...menuData,
    category: menuData.category || '인기메뉴'
  };
  
  console.log('💾 실제 저장할 데이터:', insertData);
  
  const { data, error } = await supabase
    .from('menus')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('❌ 메뉴 생성 오류:', error);
    throw new Error(`메뉴 생성에 실패했습니다: ${error.message}`);
  }

  console.log('✅ 데이터베이스에 메뉴 저장 성공:', data);
  return data;
};

// 메뉴 수정
export const updateMenu = async (menuId: string, updateData: UpdateMenuData): Promise<MenuDB> => {
  if (!menuId) {
    throw new Error('메뉴 ID가 필요합니다.');
  }
  if (updateData.name !== undefined && !updateData.name?.trim()) {
    throw new Error('메뉴명을 입력해주세요.');
  }
  if (updateData.price !== undefined && updateData.price < 0) {
    throw new Error('가격은 0원 이상이어야 합니다.');
  }

  console.log('📝 메뉴 수정 시작:', { menuId, updateData });
  
  const { data, error } = await supabase
    .from('menus')
    .update(updateData)
    .eq('id', menuId)
    .select()
    .single();

  if (error) {
    console.error('❌ 메뉴 수정 오류:', error);
    throw new Error(`메뉴 수정에 실패했습니다: ${error.message}`);
  }

  console.log('✅ 메뉴 수정 성공:', data);
  return data;
};

// 메뉴 삭제
export const deleteMenu = async (menuId: string): Promise<void> => {
  if (!menuId) {
    throw new Error('메뉴 ID가 필요합니다.');
  }

  const { error } = await supabase
    .from('menus')
    .delete()
    .eq('id', menuId);

  if (error) {
    console.error('메뉴 삭제 오류:', error);
    throw new Error(`메뉴 삭제에 실패했습니다: ${error.message}`);
  }
};

// 메뉴 가용성 토글
export const toggleMenuAvailability = async (menuId: string, isAvailable: boolean): Promise<MenuDB> => {
  if (!menuId) {
    throw new Error('메뉴 ID가 필요합니다.');
  }

  const { data, error } = await supabase
    .from('menus')
    .update({ is_available: isAvailable })
    .eq('id', menuId)
    .select()
    .single();

  if (error) {
    console.error('메뉴 가용성 변경 오류:', error);
    throw new Error(`메뉴 상태 변경에 실패했습니다: ${error.message}`);
  }

  return data;
};
