import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { getUserOwnedStores, getStoreOrders, updateOrderStatus } from '../../../lib/database';
import OwnerPushNotificationSettings from '../../../components/OwnerPushNotificationSettings';

interface Order {
  id: string;
  status: '입금대기' | '입금확인' | '배달완료';
  order_type: 'delivery' | 'pickup';
  delivery_address?: string;
  delivery_time?: string;
  pickup_time?: string;
  special_requests?: string;
  depositor_name: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  users: {
    name: string;
    phone: string;
    email: string;
  };
  order_items: Array<{
    quantity: number;
    price: number;
    menus: {
      name: string;
    };
  }>;
}

interface Store {
  id: string;
  name: string;
  category: string;
  delivery_area: string;
  delivery_fee: number;
  phone: string;
  business_hours_start: string;
  business_hours_end: string;
  pickup_time_slots: string[];
  delivery_time_slots: Array<{
    name: string;
    start: string;
    end: string;
    enabled: boolean;
  }>;
  bank_account: string;
  account_holder: string;
  created_at: string;
  updated_at: string;
}

export default function OwnerOrders() {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | '입금대기' | '입금확인' | '배달완료'>('all');

  useEffect(() => {
    const loadOwnerData = async () => {
      if (!user || !userProfile) return;

      // 사장님 권한 확인
      if (userProfile.role !== 'owner' && userProfile.role !== 'super_admin') {
        navigate('/stores');
        return;
      }

      try {
        setLoading(true);
        const ownedStores = await getUserOwnedStores(user.id);
        setStores(ownedStores);

        if (ownedStores.length > 0) {
          setSelectedStoreId(ownedStores[0].id);
        }
      } catch (error) {
        console.error('사장님 데이터 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadOwnerData();
    }
  }, [user, userProfile, navigate, authLoading]);

  useEffect(() => {
    const loadOrders = async () => {
      if (!selectedStoreId) return;

      try {
        setLoading(true);
        const storeOrders = await getStoreOrders(selectedStoreId);
        setOrders(storeOrders);
      } catch (error) {
        console.error('주문 목록 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [selectedStoreId]);

  const handleStatusChange = async (orderId: string, newStatus: '입금대기' | '입금확인' | '배달완료') => {
    try {
      await updateOrderStatus(orderId, newStatus);
      
      // 주문 목록 업데이트
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));
    } catch (error) {
      console.error('주문 상태 변경 오류:', error);
      alert('주문 상태 변경에 실패했습니다.');
    }
  };

  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case '입금대기': return 'bg-yellow-100 text-yellow-800';
      case '입금확인': return 'bg-blue-100 text-blue-800';
      case '배달완료': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case '입금대기': return '입금확인';
      case '입금확인': return '배달완료';
      default: return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-store-3-line text-6xl text-gray-300 mb-4"></i>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">소유한 매장이 없습니다</h2>
          <p className="text-gray-600 mb-4">관리자에게 매장 등록을 요청해주세요.</p>
          <button
            onClick={() => navigate('/stores')}
            className="bg-white hover:bg-orange-500 text-gray-700 hover:text-white px-6 py-2 rounded-lg border border-gray-300 hover:border-orange-500 transition-colors"
          >
            매장 목록으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/admin-dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <i className="ri-arrow-left-line text-xl"></i>
            </button>
            <h1 className="text-lg font-semibold text-center flex-1">주문내역</h1>
            <div className="w-10"></div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 푸시 알림 설정 */}
        <OwnerPushNotificationSettings />

        {/* 매장 선택 및 필터 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {/* 매장 선택 */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800 mb-3">매장 선택</h2>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            >
              {stores.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>

          {/* 상태 필터 */}
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-3">주문 상태</h2>
            <div className="flex gap-3">
              {['all', '입금대기', '입금확인', '배달완료'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-orange-100 text-orange-700 border border-orange-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? '전체' : status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 주문 목록 */}
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <i className="ri-shopping-cart-line text-4xl text-gray-300 mb-2"></i>
              <p className="text-gray-500">주문이 없습니다.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* 주문 헤더 */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <i className="ri-restaurant-line text-xl text-orange-500"></i>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{order.users.name}님</h3>
                        <p className="text-sm text-gray-500">{order.users.phone}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(new Date(order.created_at).toLocaleString("en-US", {timeZone: "Asia/Seoul"})).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">#{order.id.slice(-8)}</p>
                    </div>
                  </div>
                  
                  {/* 주문 타입 */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <i className="ri-truck-line"></i>
                    <span>{order.order_type === 'delivery' ? '배달' : '픽업'}</span>
                    {order.delivery_address && (
                      <span className="ml-2 text-gray-400">({order.delivery_address})</span>
                    )}
                  </div>
                </div>

                {/* 주문 메뉴 요약 */}
                <div className="p-4">
                  <div className="space-y-2">
                    {order.daily_menu_orders?.slice(0, 2).map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div className="flex-1">
                          <span className="text-gray-700">
                            {item.menus.name} x{item.quantity}
                          </span>
                          <p className="text-xs text-orange-600 mt-1">
                            {item.daily_menus.menu_date} 일일메뉴
                          </p>
                        </div>
                        <span className="font-medium text-gray-800">
                          {((item.menus?.price || 0) * item.quantity).toLocaleString()}원
                        </span>
                      </div>
                    ))}
                    {order.daily_menu_orders && order.daily_menu_orders.length > 2 && (
                      <p className="text-sm text-gray-500">
                        외 {order.daily_menu_orders.length - 2}개 메뉴
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-100">
                    <span className="font-bold text-gray-800">총 금액</span>
                    <span className="font-bold text-lg text-orange-600">
                      {order.total.toLocaleString()}원
                    </span>
                  </div>
                </div>

                {/* 상태 변경 버튼 */}
                {getNextStatus(order.status) && (
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={() => handleStatusChange(order.id, getNextStatus(order.status)!)}
                      className="w-full px-4 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                    >
                      {getNextStatus(order.status)} 처리
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
