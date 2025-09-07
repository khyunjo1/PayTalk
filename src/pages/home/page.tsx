import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithKakao } from '../../lib/auth';
import { useAuth } from '../../hooks/useAuth';

export default function Home() {
  const navigate = useNavigate();
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const { user, userProfile, loading } = useAuth();

  useEffect(() => {
    // 로그인된 사용자는 권한에 따라 다른 페이지로 리다이렉트
    if (!loading && user && userProfile) {
      if (userProfile.role === 'admin') {
        // 관리자(사장님)는 전용 대시보드로
        navigate('/admin-dashboard');
      } else {
        // 일반 고객은 매장 페이지로
        navigate('/stores');
      }
    }
  }, [user, userProfile, loading, navigate]);

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const handleSuperAdminClick = () => {
    navigate('/super-admin');
  };

  const handleKakaoLogin = async () => {
    try {
      const result = await signInWithKakao();
      // 로그인 성공 시 자동으로 리다이렉트됨
    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      setShowLoginMessage(true);
      setTimeout(() => setShowLoginMessage(false), 3000);
    }
  };

  const handleOtherPageAccess = () => {
    setShowLoginMessage(true);
    setTimeout(() => setShowLoginMessage(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* 모바일 최적화 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <img 
                src="https://static.readdy.ai/image/912b0945f01d9fdb4ff4544659653c90/2d4890bd82abce85d430bd82d04df8d6.png" 
                alt="페이톡 로고" 
                className="w-6 h-6"
              />
              <h1 className="text-lg font-bold text-orange-500" style={{ fontFamily: "Pacifico, serif" }}>
                페이톡
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 최적화 메인 콘텐츠 */}
      <div className="px-4 py-8">
        {/* 모바일 최적화 히어로 섹션 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-800 mb-4 leading-tight">
            페이톡과 함께하는<br />
            <span className="text-orange-500">반찬 배달</span>
          </h2>
          <p className="text-sm sm:text-base md:text-xl text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed px-4">
            전문 반찬가게와 고객을 연결하는 스마트한 배달 플랫폼
          </p>
        </div>

        {/* 로그인 섹션 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            페이톡과 함께하는 반찬 배달
          </h2>
          <p className="text-gray-600 mb-6 text-center">
            전문 반찬가게와 고객을 연결하는 스마트한 배달 플랫폼
          </p>
          
          {/* 카카오 로그인 버튼 */}
          <button
            onClick={handleKakaoLogin}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold py-4 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center mb-4"
          >
            <i className="ri-message-3-fill text-xl mr-3"></i>
            카카오톡으로 간편 로그인
          </button>
          
          {/* 로그인 메시지 */}
          {showLoginMessage && (
            <div className="text-center text-red-500 text-sm mb-4">
              로그인이 필요합니다. 카카오톡으로 로그인해주세요.
            </div>
          )}
          
          {/* 다른 페이지 접근 버튼들 */}
          <div className="space-y-2">
            <button
              onClick={handleAdminClick}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm transition-colors duration-200"
            >
              사장님 페이지 (테스트)
            </button>
            <button
              onClick={handleSuperAdminClick}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm transition-colors duration-200"
            >
              슈퍼 어드민 페이지 (테스트)
            </button>
          </div>
        </div>

      </div>

      {/* 모바일 최적화 푸터 */}
      <footer className="bg-gray-50 py-6 mt-8">
        <div className="px-4 max-w-6xl mx-auto">
          <div className="mb-4">
            {/* 회사 정보 - 연락처 바로 위에 */}
            <div className="mb-3">
              <h3 className="text-lg font-bold text-orange-500" style={{ fontFamily: "Pacifico, serif" }}>
                페이톡
              </h3>
            </div>

            {/* 연락처 정보 */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">연락처</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <i className="ri-phone-line text-orange-500"></i>
                  <span>02-1234-5678</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-mail-line text-orange-500"></i>
                  <span>support@paytalk.co.kr</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-time-line text-orange-500"></i>
                  <span>평일 09:00 - 18:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 정보 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-600 text-sm">
                <p>© 2024 페이톡. 모든 권리 보유.</p>
                <p className="mt-1">사업자등록번호: 123-45-67890 | 대표: 김페이톡</p>
              </div>
              <div className="flex gap-4 text-sm text-gray-500">
                <a href="#" className="hover:text-orange-500 transition-colors">이용약관</a>
                <a href="#" className="hover:text-orange-500 transition-colors">개인정보처리방침</a>
                <a href="#" className="hover:text-orange-500 transition-colors">사업자정보확인</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}