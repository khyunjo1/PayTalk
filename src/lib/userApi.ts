// 사용자 관리 API 함수
// 요구사항 1: 카카오 로그인 유저 저장 & 관리자 페이지 표시
// 요구사항 2: 유저 → 사장님 전환

import { supabase } from './supabase';

// 사용자 프로필 가져오기
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('사용자 프로필 가져오기 오류:', error);
    throw error;
  }

  return data;
};

// 사용자 프로필 생성
export const createUserProfile = async (userData: {
  id: string;
  email: string;
  name: string;
  profile_image?: string;
  phone?: string;
}) => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      profile_image: userData.profile_image || '',
      phone: userData.phone || '',
      role: 'customer'
    })
    .select()
    .single();

  if (error) {
    console.error('사용자 프로필 생성 오류:', error);
    throw error;
  }

  return data;
};

// 모든 사용자 목록 가져오기 (관리자용)
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('사용자 목록 가져오기 오류:', error);
    throw error;
  }

  return data || [];
};

// 사용자 역할 변경 (고객 → 사장님)
export const updateUserRole = async (userId: string, role: 'customer' | 'owner' | 'admin' | 'super_admin') => {
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('사용자 역할 변경 오류:', error);
    throw error;
  }

  return data;
};

// 사용자를 매장에 연결 (사장님 전환)
export const addUserToStore = async (userId: string, storeId: string, role: 'owner' | 'manager' = 'owner') => {
  const { data, error } = await supabase
    .from('user_stores')
    .insert({
      user_id: userId,
      store_id: storeId,
      role
    })
    .select()
    .single();

  if (error) {
    console.error('사용자-매장 연결 오류:', error);
    throw error;
  }

  return data;
};

// 사용자의 매장 목록 가져오기
export const getUserStores = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_stores')
    .select(`
      *,
      stores (
        id,
        name,
        category,
        delivery_area,
        delivery_fee,
        phone,
        bank_account,
        account_holder
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('사용자 매장 목록 가져오기 오류:', error);
    throw error;
  }

  return data || [];
};
