
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import StoreManagement from './components/StoreManagement';
import MenuManagement from './components/MenuManagement';
import UserManagement from './components/UserManagement';
import InquiryManagement from './components/InquiryManagement';
import Statistics from './components/Statistics';

const MENU_ITEMS = [
  { id: 'dashboard', label: '대시보드', icon: 'ri-dashboard-line' },
  { id: 'stores', label: '매장 관리', icon: 'ri-store-line' },
  { id: 'menus', label: '메뉴 관리', icon: 'ri-restaurant-line' },
  { id: 'users', label: '유저 관리', icon: 'ri-user-line' },
  { id: 'inquiries', label: '문의 관리', icon: 'ri-question-line' },
  { id: 'statistics', label: '통계', icon: 'ri-bar-chart-line' }
];

export default function SuperAdmin() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showToast, setShowToast] = useState('');

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);

  const showToastMessage = (message: string) => {
    setShowToast(message);
    setTimeout(() => setShowToast(''), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard showToast={showToastMessage} />;
      case 'stores':
        return <StoreManagement showToast={showToastMessage} />;
      case 'menus':
        return <MenuManagement showToast={showToastMessage} />;
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
      {/* 사이드바 */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 fixed lg:relative h-full z-40`}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h1 className={`font-bold text-xl text-orange-500 ${!sidebarOpen && 'hidden'}`} style={{ fontFamily: "Pacifico, serif" }}>
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
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left hover:bg-orange-50 cursor-pointer ${
                activeMenu === item.id ? 'bg-orange-100 border-r-4 border-orange-500 text-orange-600' : 'text-gray-600'
              }`}
            >
              <i className={`${item.icon} text-xl mr-3`}></i>
              <span className={`${!sidebarOpen && 'hidden'}`}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 메인 컨텐츠 */}
      <div className={`flex-1 ${sidebarOpen ? 'lg:ml-0' : 'ml-16'} transition-all duration-300`}>
        {/* 상단 헤더 */}
        <div className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
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

        {/* 컨텐츠 영역 */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>

      {/* 토스트 메시지 */}
      {showToast && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <i className="ri-check-line mr-2"></i>
            {showToast}
          </div>
        </div>
      )}
    </div>
  );
}
