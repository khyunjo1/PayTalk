
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [showLoginMessage, setShowLoginMessage] = useState(false);

  const handleKakaoLogin = () => {
    // 카카오 로그인 시뮬레이션
    localStorage.setItem('isLoggedIn', 'true');
    navigate('/stores');
  };

  const handleOtherPageAccess = () => {
    setShowLoginMessage(true);
    setTimeout(() => setShowLoginMessage(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* 앱 로고 및 브랜딩 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <img 
              src="https://static.readdy.ai/image/912b0945f01d9fdb4ff4544659653c90/2d4890bd82abce85d430bd82d04df8d6.png" 
              alt="페이톡 로고" 
              className="w-12 h-12"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: "Pacifico, serif" }}>
            페이톡
          </h1>
          <p className="text-gray-600 text-sm">
            집밥 같은 반찬을 빠르게 배달받으세요
          </p>
        </div>

        {/* 앱 소개 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">🍽️ 서비스 소개</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <i className="ri-check-line text-orange-500 mr-2"></i>
              <span>신선한 한국식 반찬 배달</span>
            </div>
            <div className="flex items-center">
              <i className="ri-check-line text-orange-500 mr-2"></i>
              <span>매장 픽업 가능</span>
            </div>
            <div className="flex items-center">
              <i className="ri-check-line text-orange-500 mr-2"></i>
              <span>간편한 주문 시스템</span>
            </div>
          </div>
        </div>

        {/* 카카오 로그인 버튼 */}
        <button
          onClick={handleKakaoLogin}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold py-4 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center mb-4 whitespace-nowrap cursor-pointer"
        >
          <i className="ri-message-3-fill text-xl mr-3"></i>
          카카오톡으로 간편 로그인
        </button>

        {/* 로그인 안내 메시지 */}
        {showLoginMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <i className="ri-error-warning-line text-red-500 mr-2"></i>
              <span className="text-red-700 text-sm">로그인이 필요한 서비스입니다</span>
            </div>
          </div>
        )}

        {/* 다른 페이지 접근 시도 버튼들 */}
        <div className="space-y-2">
          <button
            onClick={handleOtherPageAccess}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 px-4 rounded-lg transition-colors duration-200 text-sm whitespace-nowrap cursor-pointer"
          >
            매장 보기 (로그인 필요)
          </button>
          <button
            onClick={handleOtherPageAccess}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 px-4 rounded-lg transition-colors duration-200 text-sm whitespace-nowrap cursor-pointer"
          >
            주문내역 보기 (로그인 필요)
          </button>
        </div>

        {/* 고객센터 정보 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mt-8">
          <p className="text-sm text-gray-600 mb-3 text-center">문의사항이 있으시면</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <i className="ri-phone-line text-orange-500"></i>
              <span>고객센터: 1588-1234</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <i className="ri-mail-line text-orange-500"></i>
              <span>support@paytalk.co.kr</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-700">
              <i className="ri-kakao-talk-line text-orange-500"></i>
              <span>@페이톡고객센터</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 text-center">
            평일 09:00-18:00 | 토요일 10:00-16:00 | 일요일 휴무
          </div>
        </div>
      </div>
    </div>
  );
}
