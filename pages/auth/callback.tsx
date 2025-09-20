import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 OAuth 콜백 처리 시작');
        
        // Supabase OAuth 콜백 처리
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ 세션 확인 오류:', error);
          navigate('/');
          return;
        }
        
        if (data.session) {
          console.log('✅ 로그인 성공:', data.session.user.email);
          
          // 사용자 프로필 확인 (빠른 체크)
          try {
            const { data: profileData } = await supabase
              .from('users')
              .select('role')
              .eq('id', data.session.user.id)
              .single();
            
            console.log('👤 사용자 역할:', profileData?.role);
            
            // 권한별 리다이렉트
            if (profileData?.role === 'admin') {
              console.log('🏪 관리자 - admin-dashboard로 이동');
              navigate('/admin-dashboard');
            } else {
              console.log('👥 일반 사용자 - admin-dashboard로 이동');
              navigate('/admin-dashboard');
            }
          } catch (profileError) {
            console.log('⚠️ 프로필 확인 실패, 기본적으로 admin-dashboard로 이동');
            navigate('/admin-dashboard');
          }
        } else {
          console.log('❌ 세션이 없음, 홈페이지로 이동');
          navigate('/');
        }
      } catch (error) {
        console.error('❌ 인증 콜백 처리 오류:', error);
        navigate('/');
      }
    };

    // 즉시 실행 (지연 제거)
    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}