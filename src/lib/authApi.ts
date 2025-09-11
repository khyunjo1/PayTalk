// 새로운 인증 시스템 API 함수들

import { supabase } from './supabase';

// 비밀번호 해시 함수 (bcrypt 대신 간단한 해시 사용)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'paytalk_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// 비밀번호 검증 함수
const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const hashed = await hashPassword(password);
  return hashed === hashedPassword;
};

// 사장님 회원가입
export const registerOwner = async (userData: {
  name: string;
  phone: string;
  password: string;
}) => {
  try {
    // 전화번호 중복 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', userData.phone)
      .single();

    if (existingUser) {
      throw new Error('이미 등록된 전화번호입니다.');
    }

    // 4자리 숫자 비밀번호는 해시 없이 저장 (개발용)
    const password = userData.password;

    // 사용자 생성
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: userData.name,
        phone: userData.phone,
        password: password,
        status: 'pending',
        role: 'admin'
      })
      .select()
      .single();

    if (error) {
      console.error('회원가입 오류:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('회원가입 실패:', error);
    throw error;
  }
};

// 사장님 로그인 (비밀번호만으로)
export const loginOwner = async (phone: string, password: string) => {
  try {
    // 모든 admin 사용자 조회
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin');

    if (error) {
      throw new Error('사용자 조회에 실패했습니다.');
    }

    if (!users || users.length === 0) {
      throw new Error('등록된 사장님이 없습니다.');
    }

    // 비밀번호가 일치하는 사용자 찾기
    const user = users.find(u => u.password === password);

    if (!user) {
      throw new Error('비밀번호가 올바르지 않습니다.');
    }

    // 승인 상태 확인
    if (user.status !== 'approved') {
      throw new Error('아직 승인되지 않은 계정입니다. 관리자에게 문의하세요.');
    }

    return user;
  } catch (error) {
    console.error('로그인 실패:', error);
    throw error;
  }
};

// 슈퍼 어드민 로그인
export const loginSuperAdmin = async (password: string) => {
  try {
    console.log('🔍 슈퍼 어드민 로그인 시도...');
    
    // 슈퍼 어드민 조회
    const { data: superAdmin, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'super_admin')
      .single();

    console.log('📊 슈퍼 어드민 조회 결과:', { superAdmin, error });

    if (error) {
      console.error('❌ 데이터베이스 오류:', error);
      throw new Error(`데이터베이스 오류: ${error.message}`);
    }

    if (!superAdmin) {
      console.error('❌ 슈퍼 어드민 계정 없음');
      throw new Error('슈퍼 어드민 계정을 찾을 수 없습니다. 데이터베이스에 계정을 생성해주세요.');
    }

    console.log('✅ 슈퍼 어드민 계정 발견:', superAdmin);

    // 임시: 개발용 비밀번호 검증 (admin123)
    if (password !== 'admin123') {
      console.error('❌ 비밀번호 불일치');
      throw new Error('비밀번호가 올바르지 않습니다.');
    }

    console.log('✅ 로그인 성공');
    return superAdmin;
  } catch (error) {
    console.error('슈퍼 어드민 로그인 실패:', error);
    throw error;
  }
};

// 모든 사용자 목록 조회 (승인 대기 + 승인된 사용자)
export const getPendingUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('사용자 조회 오류:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('사용자 조회 실패:', error);
    throw error;
  }
};

// 사용자 승인
export const approveUser = async (userId: string, storeId: string) => {
  try {
    // 사용자 상태를 승인으로 변경
    const { error: userError } = await supabase
      .from('users')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userError) {
      throw userError;
    }

    // user_stores 테이블에 연결
    const { error: storeError } = await supabase
      .from('user_stores')
      .insert({
        user_id: userId,
        store_id: storeId,
        role: 'owner',
        approved_at: new Date().toISOString()
      });

    if (storeError) {
      throw storeError;
    }

    return { success: true };
  } catch (error) {
    console.error('사용자 승인 실패:', error);
    throw error;
  }
};

// 사용자 거부
export const rejectUser = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ 
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('사용자 거부 실패:', error);
    throw error;
  }
};
