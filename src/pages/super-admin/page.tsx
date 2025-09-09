
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Dashboard from './components/Dashboard';
import StoreManagement from './components/StoreManagement';
import MenuManagement from './components/MenuManagement';
import UserManagement from './components/UserManagement';
import InquiryManagement from './components/InquiryManagement';
import Statistics from './components/Statistics';
import OrdersManagement from './components/OrdersManagement';
import Footer from '../../components/Footer';

const MENU_ITEMS = [
  { id: 'dashboard', label: '대시보드', icon: 'ri-dashboard-line' },
  { id: 'stores', label: '매장 관리', icon: 'ri-store-line' },
  { id: 'menus', label: '메뉴 관리', icon: 'ri-restaurant-line' },
  { id: 'orders', label: '주문 관리', icon: 'ri-shopping-cart-line' },
  { id: 'users', label: '유저 관리', icon: 'ri-user-line' },
  { id: 'inquiries', label: '문의 관리', icon: 'ri-question-line' },
  { id: 'statistics', label: '통계', icon: 'ri-bar-chart-line' }
];

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showToast, setShowToast] = useState('');

  useEffect(() => {
    // 로딩 중이면 아무것도 하지 않음
    if (loading) return;

    // 사용자가 없으면 로그인 페이지로
    if (!user || !userProfile) {
      navigate('/login');
      return;
    }

    // 슈퍼 어드민 권한 확인
    if (userProfile.role !== 'super_admin') {
      console.log('슈퍼 어드민 권한이 없습니다. /stores로 리다이렉트합니다.');
      alert('슈퍼 어드민만 접근할 수 있는 페이지입니다.');
      navigate('/stores');
      return;
    }
  }, [user, userProfile, loading, navigate]);

  const showToastMessage = (message: string) => {
    setShowToast(message);
    setTimeout(() => setShowToast(''), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 권한 체크 (렌더링 전)
  if (!user || !userProfile || userProfile.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <i className="ri-lock-line text-2xl text-red-600"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">접근 권한 없음</h2>
          <p className="text-gray-600 mb-4">슈퍼 어드민만 접근할 수 있는 페이지입니다.</p>
          <button
            onClick={() => navigate('/stores')}
            className="bg-white hover:bg-orange-500 text-gray-700 hover:text-white px-4 py-2 rounded-lg border border-gray-300 hover:border-orange-500 transition-colors"
          >
            홈으로 이동
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard showToast={showToastMessage} />;
      case 'stores':
        return <StoreManagement showToast={showToastMessage} />;
      case 'menus':
        return <MenuManagement showToast={showToastMessage} />;
      case 'orders':
        return <OrdersManagement showToast={showToastMessage} />;
      case 'users':
        return <UserManagement showToast={showToastMessage} />;
      case 'inquiries':
        return <InquiryManagement showToast={showToastMessage} />;
      case 'statistics':
        return <Statistics showToast={showToastMessage} />;
      default:
        return <Dashboard showToast={showToastMessage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 모바일 헤더 */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm border-b z-50 h-16">
        <div className="px-4 py-3 flex items-center justify-between h-full">
          <div className="flex items-center gap-2">
            <img 
              src="https://static.readdy.ai/image/912b0945f01d9fdb4ff4544659653c90/2d4890bd82abce85d430bd82d04df8d6.png" 
              alt="페이톡 로고" 
              className="w-6 h-6"
            />
            <h1 className="text-lg font-bold text-orange-500" style={{ fontFamily: "Pacifico, serif" }}>
              슈퍼어드민
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <i className="ri-menu-line text-xl"></i>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer text-gray-600"
            >
              <i className="ri-logout-box-r-line text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* 사이드바 */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} lg:w-64 bg-white shadow-lg transition-all duration-300 fixed lg:relative h-full z-50 lg:z-40 overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h1 className={`font-bold text-xl text-orange-500 ${!sidebarOpen && 'lg:block hidden'}`} style={{ fontFamily: "Pacifico, serif" }}>
              Super Admin
            </h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <i className={`ri-${sidebarOpen ? 'close' : 'menu'}-line text-xl`}></i>
            </button>
          </div>
        </div>

        <nav className="mt-4">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveMenu(item.id);
                // 모바일에서는 메뉴 선택 후 사이드바 닫기
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-orange-50 cursor-pointer ${
                activeMenu === item.id ? 'bg-orange-100 border-r-4 border-orange-500 text-orange-600' : 'text-gray-600'
              }`}
            >
              <i className={`${item.icon} text-xl mr-3`}></i>
              <span className={`${!sidebarOpen && 'lg:block hidden'}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col">
        {/* 데스크톱 상단 헤더 */}
        <div className="hidden lg:block bg-white shadow-sm border-b h-16">
          <div className="flex items-center justify-between px-6 h-full">
            <h2 className="text-xl font-semibold text-gray-800">
              {MENU_ITEMS.find(item => item.id === activeMenu)?.label}
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <i className="ri-user-line text-white"></i>
                </div>
                <span className="text-sm font-medium text-gray-700">관리자</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 cursor-pointer"
              >
                <i className="ri-logout-box-r-line text-xl"></i>
              </button>
            </div>
          </div>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="flex-1 p-4 lg:p-6 pt-20 lg:pt-6">
          {renderContent()}
        </div>
        
        {/* 푸터 */}
        <Footer />
      </div>

      {/* 토스트 메시지 */}
      {showToast && (
        <div className="fixed top-20 lg:top-20 right-2 lg:right-4 left-2 lg:left-auto bg-green-500 text-white px-4 lg:px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <i className="ri-check-line mr-2"></i>
            <span className="text-sm lg:text-base">{showToast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
