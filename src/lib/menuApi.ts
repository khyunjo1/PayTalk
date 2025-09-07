// 메뉴 관리 API 함수
// 요구사항 3: 사장님 메뉴 등록 (관리자가 대신 입력)

import { supabase } from './supabase';

// 매장의 메뉴 목록 가져오기
export const getMenus = async (storeId: string) => {
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('store_id', storeId)
    .order('category', { ascending: true });

  if (error) {
    console.error('메뉴 목록 가져오기 오류:', error);
    throw error;
  }

  return data || [];
};

// 특정 메뉴 정보 가져오기
export const getMenu = async (menuId: string) => {
  const { data, error } = await supabase
    .from('menus')
    .select('*')
    .eq('id', menuId)
    .single();

  if (error) {
    console.error('메뉴 정보 가져오기 오류:', error);
    throw error;
  }

  return data;
};

// 메뉴 생성
export const createMenu = async (menuData: {
  store_id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  image_url?: string;
  is_available?: boolean;
}) => {
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
    throw error;
  }

  console.log('✅ 데이터베이스에 메뉴 저장 성공:', data);
  return data;
};

// 메뉴 수정
export const updateMenu = async (menuId: string, updateData: {
  name?: string;
  price?: number;
  category?: string;
  description?: string;
  image_url?: string;
  is_available?: boolean;
}) => {
  console.log('📝 메뉴 수정 시작:', { menuId, updateData });
  
  const { data, error } = await supabase
    .from('menus')
    .update(updateData)
    .eq('id', menuId)
    .select()
    .single();

  if (error) {
    console.error('❌ 메뉴 수정 오류:', error);
    throw error;
  }

  console.log('✅ 메뉴 수정 성공:', data);
  return data;
};

// 메뉴 삭제
export const deleteMenu = async (menuId: string) => {
  const { error } = await supabase
    .from('menus')
    .delete()
    .eq('id', menuId);

  if (error) {
    console.error('메뉴 삭제 오류:', error);
    throw error;
  }
};

// 메뉴 가용성 토글
export const toggleMenuAvailability = async (menuId: string, isAvailable: boolean) => {
  const { data, error } = await supabase
    .from('menus')
    .update({ is_available: isAvailable })
    .eq('id', menuId)
    .select()
    .single();

  if (error) {
    console.error('메뉴 가용성 변경 오류:', error);
    throw error;
  }

  return data;
};
