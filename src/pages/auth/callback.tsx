import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL에서 인증 코드 추출
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        
        if (error) {
          console.error('카카오 로그인 오류:', error);
          navigate('/');
          return;
        }
        
        if (code) {
          // 세션 확인
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('세션 확인 오류:', sessionError);
          }
          
          if (session) {
            console.log('로그인 성공:', session.user);
            navigate('/stores');
          } else {
            console.log('세션이 없음, 홈페이지로 이동');
            navigate('/');
          }
        } else {
          console.log('인증 코드 없음, 홈페이지로 이동');
          navigate('/');
        }
      } catch (error) {
        console.error('인증 콜백 처리 오류:', error);
        navigate('/');
      }
    };

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