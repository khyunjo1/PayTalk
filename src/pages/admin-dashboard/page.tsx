import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewAuth } from '../../hooks/useNewAuth';
import { getUserOwnedStores } from '../../lib/database';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PWAInstallButton from '../../components/PWAInstallButton';
import OwnerPushNotificationSettings from '../../components/OwnerPushNotificationSettings';
import { setStoreOwner } from '../../lib/storeApi';

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


  // 주문 알림 이벤트 리스너
  useEffect(() => {
    const handleNewOrder = (event: CustomEvent) => {
      const orderData = event.detail;
      console.log('새 주문 알림:', orderData);
      
      // 여기서 푸시 알림을 보낼 수 있습니다
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('새 주문이 도착했습니다!', {
          body: `${orderData.customer_name}님이 주문하셨습니다.`,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png'
        });
      }
    };

    window.addEventListener('newOrder', handleNewOrder as EventListener);
    return () => {
      window.removeEventListener('newOrder', handleNewOrder as EventListener);
    };
  }, []);

  const loadUserStores = async () => {
    try {
      setStoresLoading(true);
      const stores = await getUserOwnedStores(user?.id);
      setUserStores(stores);
    } catch (error) {
      console.error('매장 정보 로드 실패:', error);
    } finally {
      setStoresLoading(false);
    }
  };

  const handleStoreOwnerChange = async (storeId: string, newOwnerId: string) => {
    try {
      await setStoreOwner(storeId, newOwnerId);
      await loadUserStores(); // 매장 목록 새로고침
    } catch (error) {
      console.error('매장 소유자 변경 실패:', error);
    }
  };

  const copyStoreId = (storeId: string) => {
    navigator.clipboard.writeText(storeId);
    setCopiedStoreId(storeId);
    setTimeout(() => setCopiedStoreId(null), 2000);
  };

  if (loading || storesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">관리자 대시보드</h1>
          <p className="text-gray-600">매장을 관리하고 주문을 확인하세요</p>
        </div>

        {/* 매장 관리 탭 */}
        {userStores.length > 0 && (
          <>
            {/* 매장 정보 */}
        {userStores.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border-2 border-gray-300 p-8 mb-8">
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
                className="bg-white hover:bg-gray-50 text-gray-800 py-3 px-4 rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 border border-gray-200"
              >
                <i className="ri-shopping-cart-line text-lg text-blue-500"></i>
                <span>주문내역</span>
              </button>
              
              <button
                onClick={() => navigate(`/admin/${userStores[0]?.id}/daily-menu`)}
                className="bg-white hover:bg-gray-50 text-gray-800 py-3 px-4 rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 border border-gray-200"
              >
                <i className="ri-calendar-line text-lg text-indigo-500"></i>
                <span>일일 주문서</span>
              </button>
              
              <button
                onClick={() => navigate(`/admin/${userStores[0]?.id}/analytics`)}
                className="bg-white hover:bg-gray-50 text-gray-800 py-3 px-4 rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 border border-gray-200"
              >
                <i className="ri-bar-chart-line text-lg text-purple-500"></i>
                <span>성과분석</span>
              </button>
              
              <button
                onClick={() => navigate(`/admin/${userStores[0]?.id}/store`)}
                className="bg-white hover:bg-gray-50 text-gray-800 py-3 px-4 rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 border border-gray-200"
              >
                <i className="ri-store-line text-lg text-orange-500"></i>
                <span>매장관리</span>
              </button>
              
            </div>
            
          </div>
        )}
          </>
        )}

        {/* PWA 설치 버튼 */}
        <div className="text-center mb-8">
          <PWAInstallButton />
        </div>

        {/* 알림 설정 */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-300 p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">알림 설정</h2>
          </div>
          <OwnerPushNotificationSettings />
        </div>
      </div>
      
      <Footer />
    </div>
  );
}