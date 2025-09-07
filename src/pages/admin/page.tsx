import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserStores } from '../../lib/database';
import { getStoreOrders } from '../../lib/orderApi';
import { supabase } from '../../lib/supabase';

interface Order {
  id: string;
  user_id: string;
  store_id: string;
  order_type: 'delivery' | 'pickup';
  delivery_address?: string;
  delivery_time?: string;
  pickup_time?: string;
  special_requests?: string;
  depositor_name?: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: '입금대기' | '입금확인' | '배달완료';
  created_at: string;
  updated_at: string;
  users: {
    id: string;
    name: string;
    phone: string;
  };
  order_items?: Array<{
    id: string;
    menu_id: string;
    quantity: number;
    price: number;
    menus: {
      id: string;
      name: string;
    };
  }>;
}

// Mock 데이터 제거 - 실제 데이터베이스에서 주문 데이터를 가져옴

export default function Admin() {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');
  const [activeTab, setActiveTab] = useState<'orders' | 'menus' | 'statistics'>('orders');

  useEffect(() => {
    // 로딩 중이면 대기
    if (loading) return;

    // 로그인하지 않은 사용자는 로그인 페이지로
    if (!user) {
      navigate('/login');
      return;
    }

    // admin 권한이 없는 사용자는 매장 목록으로
    if (userProfile && userProfile.role !== 'admin') {
      navigate('/stores');
      return;
    }
  }, [user, userProfile, loading, navigate]);

  // 실제 주문 데이터 로드
  useEffect(() => {
    const loadOrders = async () => {
      if (!user || !userProfile || userProfile.role !== 'admin') return;

      try {
        setLoadingOrders(true);
        
        // 사용자가 관리하는 매장들 가져오기
        const userStores = await getUserStores(user.id);
        console.log('사용자 매장 목록:', userStores);

        if (userStores.length === 0) {
          console.log('관리하는 매장이 없습니다.');
          setOrders([]);
          return;
        }

        // 모든 매장의 주문 데이터 가져오기
        const allOrders: Order[] = [];
        for (const store of userStores) {
          const storeOrders = await getStoreOrders(store.id);
          console.log(`매장 ${store.name}의 주문:`, storeOrders);
          allOrders.push(...storeOrders);
        }

        // 주문 아이템 정보도 함께 가져오기
        const ordersWithItems = await Promise.all(
          allOrders.map(async (order) => {
            // 주문 아이템 정보 가져오기
            const { data: orderItems } = await supabase
              .from('order_items')
              .select(`
                *,
                menus (
                  id,
                  name
                )
              `)
              .eq('order_id', order.id);

            return {
              ...order,
              order_items: orderItems || []
            };
          })
        );

        setOrders(ordersWithItems);
        console.log('로드된 주문 데이터:', ordersWithItems);
      } catch (error) {
        console.error('주문 데이터 로드 오류:', error);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [user, userProfile]);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      // 데이터베이스에서 주문 상태 업데이트
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        console.error('주문 상태 변경 오류:', error);
        alert('주문 상태 변경에 실패했습니다.');
        return;
      }

      // 로컬 상태 업데이트
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      console.log(`주문 ${orderId} 상태가 ${newStatus}로 변경되었습니다.`);
    } catch (error) {
      console.error('주문 상태 변경 오류:', error);
      alert('주문 상태 변경에 실패했습니다.');
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm('정말로 주문을 취소하시겠습니까?')) {
      setOrders(orders.filter(order => order.id !== orderId));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  // 날짜 필터링 함수
  const filterOrdersByPeriod = (orders: Order[], period: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= today;
        });
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= weekAgo;
        });
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= monthAgo;
        });
      default:
        return orders;
    }
  };

  // 인기 메뉴 계산 함수
  const getPopularMenus = (orders: Order[]) => {
    const menuCount: { [key: string]: number } = {};
    
    orders.forEach(order => {
      order.order_items?.forEach(item => {
        const menuName = item.menus.name;
        menuCount[menuName] = (menuCount[menuName] || 0) + item.quantity;
      });
    });
    
    return Object.entries(menuCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  };

  const filteredOrdersByPeriod = filterOrdersByPeriod(orders, selectedPeriod);
  const filteredOrders = selectedStatus === 'all'
    ? filteredOrdersByPeriod
    : filteredOrdersByPeriod.filter(order => order.status === selectedStatus);
  
  const popularMenus = getPopularMenus(filteredOrdersByPeriod);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case '입금대기': return 'bg-yellow-100 text-yellow-800';
      case '입금확인': return 'bg-blue-100 text-blue-800';
      case '배달완료': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canCancel = (status: Order['status']) => {
    return status === '입금대기' || status === '입금확인';
  };

  // 주문 번호를 짧게 만드는 함수
  const getShortOrderId = (orderId: string) => {
    return orderId.substring(0, 8) + '...';
  };

  // 배달 시간 정보를 파싱하는 함수
  const parseDeliveryTime = (deliveryTime?: string) => {
    if (!deliveryTime) return null;
    
    try {
      // "2024-01-20 점심배송 (11:00-13:00)" 형태에서 시간대 추출
      const timeMatch = deliveryTime.match(/(점심|저녁)배송/);
      if (timeMatch) {
        return timeMatch[1] + '배송';
      }
      return '배송시간 정보 없음';
    } catch {
      return '배송시간 정보 없음';
    }
  };

  // 통계 계산 함수들
  const calculateStatistics = (orders: Order[]) => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    // 이전 기간과 비교 (간단한 예시 - 실제로는 더 정교한 계산 필요)
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekOrders = orders.filter(order => new Date(order.created_at) >= lastWeek);
    const lastWeekRevenue = lastWeekOrders.reduce((sum, order) => sum + order.total, 0);
    
    const previousWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const previousWeekOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= previousWeek && orderDate < lastWeek;
    });
    const previousWeekRevenue = previousWeekOrders.reduce((sum, order) => sum + order.total, 0);
    
    const revenueGrowthRate = previousWeekRevenue > 0 
      ? Math.round(((lastWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100)
      : 0;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueGrowthRate
    };
  };

  // 로딩 중 (인증 로딩만 체크, 주문 데이터는 백그라운드에서 로드)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 정보를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // 권한 체크
  if (!user || (userProfile && userProfile.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="뒤로가기"
              >
                <i className="ri-arrow-left-line text-xl text-gray-600"></i>
              </button>
              <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: "Pacifico, serif" }}>
                매장 관리자
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center whitespace-nowrap cursor-pointer"
            >
              <i className="ri-logout-box-r-line mr-2"></i>
              로그아웃
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* 탭 메뉴 */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'orders'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <i className="ri-shopping-cart-line mr-2"></i>
            주문 관리
          </button>
          <button
            onClick={() => setActiveTab('menus')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'menus'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <i className="ri-restaurant-line mr-2"></i>
            메뉴 관리
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'statistics'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <i className="ri-bar-chart-line mr-2"></i>
            통계
          </button>
        </div>

        {activeTab === 'orders' && (
          <>


        {/* 기간 필터 버튼 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'today', label: '하루치' },
            { key: 'week', label: '이번주' },
            { key: 'month', label: '이번달' }
          ].map((period) => (
            <button
              key={period.key}
              onClick={() => setSelectedPeriod(period.key)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer ${
                selectedPeriod === period.key
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* 상태 필터 버튼 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['all', '입금대기', '입금확인', '배달완료'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer ${
                selectedStatus === status
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? '전체' : status}
            </button>
          ))}
        </div>

        {/* 주문 목록 */}
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">주문 데이터를 불러오는 중...</p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <div className="text-center text-gray-500">
                <i className="ri-shopping-cart-line text-4xl mb-4"></i>
                <p>선택한 조건에 해당하는 주문이 없습니다.</p>
              </div>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const { date, time } = {
                date: new Date(order.created_at).toLocaleDateString('ko-KR'),
                time: new Date(order.created_at).toLocaleTimeString('ko-KR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              };
              
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">주문번호: {getShortOrderId(order.id)}</h3>
                        <div className="text-sm text-gray-500 mt-1">
                          <div>{date} {time}</div>
                          <div>고객: {order.users.name} ({order.users.phone})</div>
                          <div>주문방식: {order.order_type === 'delivery' ? '배달' : '픽업'}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <i className="ri-bank-line text-gray-500"></i>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="space-y-1 mb-3">
                        {order.order_items?.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.menus.name} x {item.quantity}
                            </span>
                            <span className="text-gray-800">
                              {(item.price * item.quantity).toLocaleString()}원
                            </span>
                          </div>
                        )) || <div className="text-gray-500 text-sm">주문 상품 정보 없음</div>}
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-semibold text-gray-800">총 결제 금액</span>
                        <span className="font-bold text-lg text-orange-500">
                          {order.total.toLocaleString()}원
                        </span>
                      </div>
                    </div>

                    {/* 주문 상세 정보 */}
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {order.delivery_address && (
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="ri-map-pin-line mr-2"></i>
                          <span>배달주소: {order.delivery_address}</span>
                        </div>
                      )}
                      {order.delivery_time && (
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="ri-time-line mr-2"></i>
                          <span>배달시간: {order.delivery_time} ({parseDeliveryTime(order.delivery_time)})</span>
                        </div>
                      )}
                      {order.pickup_time && (
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="ri-time-line mr-2"></i>
                          <span>픽업시간: {order.pickup_time}</span>
                        </div>
                      )}
                      {order.depositor_name && (
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="ri-user-line mr-2"></i>
                          <span>입금자명: {order.depositor_name}</span>
                        </div>
                      )}
                      {order.special_requests && (
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="ri-message-line mr-2"></i>
                          <span>요청사항: {order.special_requests}</span>
                        </div>
                      )}
                    </div>

                    {/* 관리 버튼 */}
                    <div className="mt-4 pt-3 border-t">
                      <div className="flex flex-wrap gap-2">
                        {order.status === '입금대기' && (
                          <button
                            onClick={() => handleStatusChange(order.id, '입금확인')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer"
                          >
                            입금확인
                          </button>
                        )}
                        {order.status === '입금확인' && (
                          <button
                            onClick={() => handleStatusChange(order.id, '배달완료')}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer"
                          >
                            배달완료
                          </button>
                        )}
                        {canCancel(order.status) && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer"
                          >
                            주문취소
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
          </>
        )}

        {activeTab === 'menus' && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">메뉴 관리</h3>
            <div className="text-center text-gray-500 py-8">
              <i className="ri-restaurant-line text-4xl mb-4"></i>
              <p>메뉴 관리 기능은 곧 추가될 예정입니다.</p>
              <p className="text-sm mt-2">현재는 super-admin 페이지에서 메뉴를 관리할 수 있습니다.</p>
            </div>
          </div>
        )}

        {activeTab === 'statistics' && (
          <>
            {/* 통계 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">총 매출</p>
                    <p className="text-lg font-bold text-green-600">{calculateStatistics(filteredOrdersByPeriod).totalRevenue.toLocaleString()}원</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="ri-money-dollar-circle-line text-green-600"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">총 주문수</p>
                    <p className="text-lg font-bold text-blue-600">{calculateStatistics(filteredOrdersByPeriod).totalOrders.toLocaleString()}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="ri-shopping-cart-line text-blue-600"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">평균 주문액</p>
                    <p className="text-lg font-bold text-purple-600">{calculateStatistics(filteredOrdersByPeriod).averageOrderValue.toLocaleString()}원</p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i className="ri-bar-chart-line text-purple-600"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">매출 증가율</p>
                    <p className={`text-lg font-bold ${calculateStatistics(filteredOrdersByPeriod).revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateStatistics(filteredOrdersByPeriod).revenueGrowthRate >= 0 ? '+' : ''}{calculateStatistics(filteredOrdersByPeriod).revenueGrowthRate}%
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <i className="ri-trending-up-line text-orange-600"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* 기간 필터 버튼 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { key: 'today', label: '하루치' },
                { key: 'week', label: '이번주' },
                { key: 'month', label: '이번달' }
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period.key)}
                  className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer ${
                    selectedPeriod === period.key
                      ? 'bg-orange-500 text-white'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* 인기 메뉴 */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">인기 메뉴</h3>
              <div className="space-y-3">
                {popularMenus.length > 0 ? (
                  popularMenus.map((menu, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-600">{menu.name}</span>
                      <div className="flex items-center">
                        <span className="text-sm font-semibold text-orange-600">{menu.count}개</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <i className="ri-restaurant-line text-2xl mb-2"></i>
                    <p>선택한 기간에 주문된 메뉴가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}