import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserOwnedStores } from '../../lib/database';

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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 환영 메시지 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            안녕하세요, {userProfile.name}님! 👋
          </h2>
          <p className="text-gray-600">
            {userStores.length > 0 
              ? `${userStores[0].name} 매장을 관리하고 계시는군요!`
              : '매장 관리와 주문을 시작해보세요.'
            }
          </p>
        </div>

        {/* 매장 정보 카드 */}
        {userStores.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center">
                <i className="ri-store-2-line text-2xl text-orange-500"></i>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{userStores[0].name}</h3>
                <p className="text-gray-600">{userStores[0].category} • {userStores[0].delivery_area}</p>
                <p className="text-sm text-gray-500">
                  영업시간: {userStores[0].business_hours_start} - {userStores[0].business_hours_end}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <i className="ri-check-line mr-1"></i>
                  운영중
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 메인 액션 버튼들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 내 반찬가게 관리 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="ri-settings-3-line text-2xl text-blue-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">내 반찬가게 관리</h3>
              <p className="text-gray-600 text-sm mb-4">
                내 매장의 주문, 메뉴, 정보를 관리해보세요
              </p>
              <button
                onClick={handleViewMyStore}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                매장 관리
              </button>
            </div>
          </div>

          {/* 주문하기 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="ri-shopping-cart-line text-2xl text-orange-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">주문하기</h3>
              <p className="text-gray-600 text-sm mb-4">
                다른 매장에서 음식을 주문해보세요
              </p>
              <button
                onClick={handleOrderFood}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                매장 목록 보기
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
