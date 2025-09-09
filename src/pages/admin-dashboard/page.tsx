import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserOwnedStores } from '../../lib/database';
import Footer from '../../components/Footer';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();
  const [userStores, setUserStores] = useState<any[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);

  useEffect(() => {
    // 권한 확인
    if (!loading && (!user || !userProfile)) {
      navigate('/login');
      return;
    }

    if (!loading && userProfile && userProfile.role !== 'admin') {
      navigate('/stores');
      return;
    }

    // 사용자의 매장 정보 로드
    if (userProfile && userProfile.role === 'admin') {
      loadUserStores();
    }
  }, [user, userProfile, loading, navigate]);

  const loadUserStores = async () => {
    try {
      setStoresLoading(true);
      const stores = await getUserOwnedStores(userProfile!.id);
      setUserStores(stores);
      console.log('✅ 사용자 매장 로드됨:', stores);
    } catch (error) {
      console.error('❌ 매장 로드 실패:', error);
    } finally {
      setStoresLoading(false);
    }
  };

  const handleViewMyStore = () => {
    navigate('/admin');
  };

  const handleManageStore = () => {
    navigate('/admin');
  };

  const handleOrderFood = () => {
    navigate('/stores?allow=true');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  // 로딩 중
  if (loading || storesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 권한 체크
  if (!user || !userProfile || userProfile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <i className="ri-lock-line text-2xl text-red-600"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600 mb-4">관리자만 접근할 수 있는 페이지입니다.</p>
          <button
            onClick={() => navigate('/stores')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            매장 목록으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <i className="ri-store-line text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">PayTalk</h1>
                <p className="text-sm text-gray-600">사장님 대시보드</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{userProfile.name}님</p>
                <p className="text-xs text-gray-500">사장님</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <i className="ri-logout-box-line text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 매장 정보 */}
        {userStores.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <i className="ri-store-line text-xl text-orange-500"></i>
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-base font-bold text-gray-800 mb-3">
                {userStores[0]?.name || '매장 정보 없음'}
              </h2>
              <div className="bg-orange-50 rounded-lg p-2 inline-block">
                <div className="flex items-center gap-2">
                  <i className="ri-shopping-cart-line text-orange-500"></i>
                  <span className="text-sm text-gray-700">오늘 주문:</span>
                  <span className="font-bold text-orange-500">0건</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleViewMyStore}
            className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            매장 관리하기
          </button>
          <button
            onClick={handleOrderFood}
            className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
          >
            매장 목록 보기
          </button>
        </div>

      </div>
      
      <Footer />
    </div>
  );
}
