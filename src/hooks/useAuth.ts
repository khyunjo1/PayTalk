import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getUserProfile, createUserProfile } from '../lib/userApi';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  profile_image: string;
  phone: string;
  role: 'customer' | 'owner' | 'admin' | 'super_admin';
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      try {
        return await getUserProfile(userId);
      } catch (error) {
        console.log('사용자 프로필이 없습니다. 새로 생성합니다.');
        return null;
      }
    };

    const createUserProfileData = async (user: User) => {
      try {
        return await createUserProfile({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name || '사용자',
          profile_image: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          phone: user.user_metadata?.phone_number || '',
        });
      } catch (error) {
        console.error('사용자 프로필 생성 실패:', error);
        // 에러가 발생해도 기본 프로필 반환
        return {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name || '사용자',
          profile_image: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          phone: user.user_metadata?.phone_number || '',
          role: 'customer' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    };

    const getInitialSession = async () => {
      try {
        console.log('🔍 초기 세션 확인 중...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ 세션 확인 오류:', error);
          setUser(null);
          setUserProfile(null);
        } else if (session?.user) {
          console.log('✅ 세션 발견:', session.user.email);
          setUser(session.user);
          
          // 사용자 프로필 확인/생성 (타임아웃 추가)
          try {
            const profilePromise = fetchUserProfile(session.user.id);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('프로필 로드 타임아웃')), 5000)
            );
            
            let profile = await Promise.race([profilePromise, timeoutPromise]) as any;
            
            if (!profile) {
              console.log('📝 프로필이 없어서 새로 생성합니다.');
              profile = await createUserProfileData(session.user);
            } else {
              console.log('✅ 프로필 발견:', profile.role);
            }
            setUserProfile(profile);
          } catch (profileError) {
            console.error('❌ 프로필 로드 실패:', profileError);
            // 프로필 로드 실패 시 기본 프로필 생성
            const defaultProfile = await createUserProfileData(session.user);
            setUserProfile(defaultProfile);
          }
        } else {
          console.log('❌ 세션이 없습니다.');
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('❌ 초기 세션 로드 실패:', error);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 인증 상태 변경:', event, session?.user?.email);
        
        // 초기 로딩이 완료되지 않았으면 로딩 상태 유지
        if (!initialLoadComplete) {
          return;
        }
        
        if (session?.user) {
          console.log('✅ 로그인 상태:', session.user.email);
          setUser(session.user);
          
          // 사용자 프로필 확인/생성
          let profile = await fetchUserProfile(session.user.id);
          if (!profile) {
            console.log('📝 프로필이 없어서 새로 생성합니다.');
            profile = await createUserProfileData(session.user);
          } else {
            console.log('✅ 프로필 로드됨:', profile.role);
          }
          setUserProfile(profile);
        } else {
          console.log('❌ 로그아웃 상태');
          setUser(null);
          setUserProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [initialLoadComplete]);

  return { user, userProfile, loading };
};