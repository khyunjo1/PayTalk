import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewAuth } from '../../hooks/useNewAuth';
import { getUserOwnedStores } from '../../lib/database';
import Footer from '../../components/Footer';
import PWAInstallButton from '../../components/PWAInstallButton';
import PushNotificationSettings from '../../components/PushNotificationSettings';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useNewAuth();
  const [userStores, setUserStores] = useState<any[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [copiedStoreId, setCopiedStoreId] = useState<string | null>(null);

  useEffect(() => {
    // 권한 확인
    if (!loading && !user) {
      navigate('/admin-login');
      return;
    }

    if (!loading && user && user.role !== 'admin') {
      navigate('/stores');
      return;
    }

    // 사용자의 매장 정보 로드
    if (user && user.role === 'admin') {
      loadUserStores();
    }
  }, [user, loading, navigate]);

  const loadUserStores = async () => {
    try {
      setStoresLoading(true);
      const stores = await getUserOwnedStores(user!.id);
      setUserStores(stores);
      console.log('✅ 사용자 매장 로드됨:', stores);
    } catch (error) {
      console.error('❌ 매장 로드 실패:', error);
    } finally {
      setStoresLoading(false);
    }
  };

  const handleViewMyStore = () => {
    if (userStores && userStores.length > 0) {
      navigate(`/admin/${userStores[0].id}`);
    } else {
      alert('매장 정보를 찾을 수 없습니다.');
    }
  };

  const handleManageStore = () => {
    if (userStores && userStores.length > 0) {
      navigate(`/admin/${userStores[0].id}`);
    } else {
      alert('매장 정보를 찾을 수 없습니다.');
    }
  };

  const copyOrderLink = async (storeId: string, storeName: string) => {
    try {
      const orderLink = `${window.location.origin}/menu/${storeId}`;
      await navigator.clipboard.writeText(orderLink);
      setCopiedStoreId(storeId);
      
      // 2초 후 복사 상태 초기화
      setTimeout(() => {
        setCopiedStoreId(null);
      }, 2000);
    } catch (error) {
      console.error('링크 복사 실패:', error);
    }
  };

  const handleOrderFood = () => {
    navigate('/stores?allow=true');
  };

  const handleLogout = () => {
    // useNewAuth의 logout 함수 사용
    const { logout } = useNewAuth();
    logout();
    navigate('/admin-login');
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
  if (!user || user.role !== 'admin') {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-white">
      {/* 헤더 */}
      <div className="bg-white">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="https://static.readdy.ai/image/912b0945f01d9fdb4ff4544659653c90/2d4890bd82abce85d430bd82d04df8d6.png" 
                alt="페이톡 로고" 
                className="w-12 h-12"
              />
            </div>
            <div className="flex items-center gap-4">
              <PWAInstallButton 
                redirectType="admin" 
                className="text-sm"
              />
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{user.name}님</p>
                <p className="text-xs text-orange-500 font-medium">사장님</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <i className="ri-logout-box-line text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 매장 정보 */}
        {userStores.length > 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {userStores[0]?.name || '매장 정보 없음'}
              </h2>
              <p className="text-gray-500">장수반찬을 운영하고 계시군요! 🍽️</p>
            </div>

            {/* 관리 기능 버튼들 */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <button
                onClick={() => navigate(`/admin/${userStores[0]?.id}/orders`)}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <i className="ri-shopping-cart-line text-lg"></i>
                <span>주문내역</span>
              </button>
              
              <button
                onClick={() => navigate(`/admin/${userStores[0]?.id}/menu`)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <i className="ri-restaurant-line text-lg"></i>
                <span>메뉴관리</span>
              </button>
              
              <button
                onClick={() => navigate(`/admin/${userStores[0]?.id}/analytics`)}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <i className="ri-bar-chart-line text-lg"></i>
                <span>성과분석</span>
              </button>
              
              <button
                onClick={() => navigate(`/admin/${userStores[0]?.id}/store`)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-4 rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <i className="ri-store-line text-lg"></i>
                <span>매장관리</span>
              </button>
            </div>
            
            {/* 주문 링크 복사 섹션 */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <i className="ri-share-line text-white text-xl"></i>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">주문 링크 공유</h3>
                <p className="text-sm text-gray-600">고객들이 이 링크로 주문할 수 있습니다</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200 shadow-sm">
                <div className="font-mono text-sm text-gray-700 break-all">
                  {`${window.location.origin}/menu/${userStores[0]?.id}`}
                </div>
              </div>
              
              <button
                onClick={() => copyOrderLink(userStores[0]?.id, userStores[0]?.name)}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  copiedStoreId === userStores[0]?.id
                    ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {copiedStoreId === userStores[0]?.id ? (
                  <>
                    <i className="ri-check-line text-lg"></i>
                    <span>복사 완료!</span>
                  </>
                ) : (
                  <>
                    <i className="ri-file-copy-line text-lg"></i>
                    <span>링크 복사하기</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 푸시 알림 설정 */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">알림 설정</h2>
            <p className="text-gray-500">새로운 주문이 들어오면 알림을 받으실 수 있습니다</p>
          </div>
          <PushNotificationSettings />
        </div>

      </div>
      
      <Footer />
    </div>
  );
}
