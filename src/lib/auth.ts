import { supabase } from './supabase'

export const signInWithKakao = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (error) {
      console.error('카카오 로그인 오류:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Supabase OAuth 실패, 직접 카카오 로그인 시도:', error);
    
    // Supabase OAuth가 실패하면 직접 카카오 로그인 URL로 이동
    const kakaoClientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/callback`;
    
    if (kakaoClientId) {
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
      window.location.href = kakaoAuthUrl;
    } else {
      throw new Error('카카오 클라이언트 ID가 설정되지 않았습니다.');
    }
  }
}

// 로그아웃
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('로그아웃 오류:', error)
    throw error
  }
}

// 현재 사용자 가져오기
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('사용자 정보 가져오기 오류:', error)
    return null
  }
  
  return user
}

// 현재 세션 가져오기
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('세션 가져오기 오류:', error)
    return null
  }
  
  return session
}