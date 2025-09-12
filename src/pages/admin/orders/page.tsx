import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNewAuth } from '../../../hooks/useNewAuth';
import { getStoreOrders, updateOrderStatus } from '../../../lib/orderApi';
import { getStores } from '../../../lib/storeApi';

interface Order {
  id: string;
  user_id?: string;
  store_id: string;
  order_type: 'delivery' | 'pickup';
  delivery_address?: string;
  delivery_time?: string;
  pickup_time?: string;
  special_requests?: string;
  depositor_name?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  subtotal: number;
  total: number;
  status: '입금대기' | '입금확인' | '배달완료' | '주문취소';
  created_at: string;
  updated_at: string;
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

export default function AdminOrders() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const { user, loading } = useNewAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [storeName, setStoreName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState('');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingChange, setPendingChange] = useState<{
    orderId: string;
    newStatus: string;
    orderNumber: number;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin-login');
      return;
    }

    if (!loading && user && user.role !== 'admin') {
      navigate('/admin-dashboard');
      return;
    }

    if (storeId) {
      loadOrders();
      loadStoreName();
    }
  }, [user, loading, navigate, storeId]);

  // 실시간 동기화를 위한 이벤트 리스너
  useEffect(() => {
    const handleOrderStatusChange = () => {
      if (storeId) {
        loadOrders();
      }
    };

    window.addEventListener('orderStatusChanged', handleOrderStatusChange);
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChange);
    };
  }, [storeId]);

  const loadOrders = async () => {
    if (!storeId) return;
    
    try {
      setOrdersLoading(true);
      const ordersData = await getStoreOrders(storeId);
      setOrders(ordersData);
    } catch (error) {
      console.error('주문 로드 실패:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadStoreName = async () => {
    if (!storeId) return;
    
    try {
      const stores = await getStores();
      const store = stores.find(s => s.id === storeId);
      if (store) {
        setStoreName(store.name);
      }
    } catch (error) {
      console.error('매장명 로드 실패:', error);
    }
  };

  const handlePeriodSelect = (period: 'today' | 'yesterday' | 'custom') => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      setSelectedDate('');
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    if (date) {
      setSelectedPeriod('custom');
    }
  };

  const filterOrdersByPeriod = (orders: Order[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (selectedPeriod) {
      case 'today':
        return orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= today;
        });
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= yesterday && orderDate < today;
        });
      case 'custom':
        if (!selectedDate) return orders;
        const customDate = new Date(selectedDate);
        const nextDay = new Date(customDate);
        nextDay.setDate(nextDay.getDate() + 1);
        return orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= customDate && orderDate < nextDay;
        });
      default:
        return orders;
    }
  };

  const getPeriodTitle = (period: string) => {
    switch (period) {
      case 'today': return '오늘';
      case 'yesterday': return '어제';
      case 'custom': return selectedDate ? new Date(selectedDate).toLocaleDateString('ko-KR') : '날짜 선택';
      default: return '오늘';
    }
  };

  const filteredOrdersByPeriod = filterOrdersByPeriod(orders);
  
  const finalFilteredOrders = filteredOrdersByPeriod.filter(order => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone?.includes(searchTerm) ||
      order.delivery_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.depositor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getOrderNumber = (order: Order, allOrders: Order[]) => {
    const sortedOrders = [...allOrders].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const index = sortedOrders.findIndex(o => o.id === order.id);
    return index + 1;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '입금대기': return 'bg-yellow-100 text-yellow-800';
      case '입금확인': return 'bg-blue-100 text-blue-800';
      case '배달완료': return 'bg-green-100 text-green-800';
      case '주문취소': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const orderNumber = getOrderNumber(order, finalFilteredOrders);
    setPendingChange({ orderId, newStatus, orderNumber });
    setShowConfirmation(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingChange) return;

    try {
      await updateOrderStatus(pendingChange.orderId, pendingChange.newStatus);
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === pendingChange.orderId 
            ? { ...order, status: pendingChange.newStatus as any }
            : order
        )
      );
      
      // 실시간 동기화를 위한 이벤트 발생
      window.dispatchEvent(new CustomEvent('orderStatusChanged'));
      
      setShowConfirmation(false);
      setPendingChange(null);
    } catch (error) {
      console.error('주문 상태 변경 실패:', error);
      alert('주문 상태 변경에 실패했습니다.');
    }
  };

  const cancelStatusChange = () => {
    setShowConfirmation(false);
    setPendingChange(null);
  };

  const handleLogout = () => {
    const { logout } = useNewAuth();
    logout();
    navigate('/admin-login');
  };

  if (loading || ordersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <i className="ri-lock-line text-2xl text-red-600"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600">관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="뒤로가기"
              >
                <i className="ri-arrow-left-line text-xl text-gray-600"></i>
              </button>
              <h1 className="text-lg font-semibold text-gray-800">
                {storeName ? `${storeName} 관리자` : '매장 관리자'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md flex items-center whitespace-nowrap cursor-pointer text-sm"
              >
                <i className="ri-logout-box-r-line mr-1.5 text-xs"></i>
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1">
        {/* 주문 내역 탭 */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">주문 내역</h3>
              <p className="text-sm text-gray-600">모든 주문 정보를 상세하게 확인할 수 있습니다</p>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 섹션 */}
        <div className="space-y-4 mb-6">
          {/* 검색 바 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <i className="ri-search-line text-orange-500"></i>
              <span className="text-sm font-medium text-gray-700">검색</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="입금자명, 배달주소, 고객명, 전화번호로 검색..."
                className="w-full px-4 py-3 pl-10 pr-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all duration-200 hover:bg-gray-100"
              />
              <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>

          {/* 필터 카드 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <i className="ri-filter-3-line text-orange-500"></i>
              <span className="text-sm font-medium text-gray-700">필터</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 기간 필터 */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <i className="ri-calendar-line text-gray-500 text-sm"></i>
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">기간:</span>
                </div>
                
                <div className="flex-1">
                  <div className="relative period-dropdown-container">
                    <button
                      onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer transition-all duration-200 hover:border-gray-400 flex items-center justify-between"
                    >
                      <span>
                        {selectedPeriod === 'today' ? '오늘' : 
                         selectedPeriod === 'yesterday' ? '어제' : 
                         selectedPeriod === 'custom' ? '날짜 선택' : '오늘'}
                      </span>
                      <i className={`ri-arrow-down-s-line text-gray-400 text-sm transition-transform duration-200 ${showPeriodDropdown ? 'rotate-180' : ''}`}></i>
                    </button>
                    
                    {showPeriodDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg z-20 overflow-hidden">
                        <button
                          onClick={() => {
                            handlePeriodSelect('today');
                            setShowPeriodDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors duration-200 hover:bg-gray-50 ${
                            selectedPeriod === 'today' ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                          }`}
                        >
                          오늘
                        </button>
                        <button
                          onClick={() => {
                            handlePeriodSelect('yesterday');
                            setShowPeriodDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors duration-200 hover:bg-gray-50 ${
                            selectedPeriod === 'yesterday' ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                          }`}
                        >
                          어제
                        </button>
                        <button
                          onClick={() => {
                            handlePeriodSelect('custom');
                            setShowPeriodDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors duration-200 hover:bg-gray-50 ${
                            selectedPeriod === 'custom' ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                          }`}
                        >
                          날짜 선택
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {selectedPeriod === 'custom' && (
                  <div className="flex-1">
                    <input
                      type="date"
                      value={selectedDate || ''}
                      onChange={(e) => handleDateSelect(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all duration-200 hover:bg-gray-100"
                      placeholder="날짜를 선택하세요"
                    />
                  </div>
                )}
              </div>

              {/* 상태 필터 */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <i className="ri-filter-line text-gray-500 text-sm"></i>
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">상태:</span>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {[
                    { key: 'all', label: '전체', count: filteredOrdersByPeriod.length },
                    { key: '입금대기', label: '입금대기', count: filteredOrdersByPeriod.filter(order => order.status === '입금대기').length },
                    { key: '입금확인', label: '입금확인', count: filteredOrdersByPeriod.filter(order => order.status === '입금확인').length },
                    { key: '배달완료', label: '배달완료', count: filteredOrdersByPeriod.filter(order => order.status === '배달완료').length },
                    { key: '주문취소', label: '주문취소', count: filteredOrdersByPeriod.filter(order => order.status === '주문취소').length }
                  ].map((status) => (
                    <button
                      key={status.key}
                      onClick={() => setSelectedStatus(status.key)}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                        selectedStatus === status.key
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="hidden sm:inline">{status.label} ({status.count})</span>
                      <span className="sm:hidden">{status.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 오늘 주문 수 표시 - 검색어가 없을 때만 표시 */}
        {finalFilteredOrders.length > 0 && !searchTerm && (
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full">
              <span className="text-gray-700 text-sm">
                <i className="ri-calendar-line mr-1 text-orange-500"></i>
                {getPeriodTitle(selectedPeriod)} {finalFilteredOrders.length}개의 주문이 들어왔습니다
              </span>
            </div>
          </div>
        )}

        {/* 주문 상세 목록 */}
        <div className="space-y-4">
          {ordersLoading ? (
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">주문 데이터를 불러오는 중...</p>
              </div>
            </div>
          ) : finalFilteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <div className="text-center text-gray-500">
                <i className="ri-shopping-cart-line text-4xl mb-4"></i>
                <p>선택한 조건에 해당하는 주문이 없습니다.</p>
              </div>
            </div>
          ) : (
            finalFilteredOrders.map((order) => {
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
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-800">주문번호: {getOrderNumber(order, finalFilteredOrders)}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                            order.order_type === 'delivery' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {order.order_type === 'delivery' ? '배달' : '픽업'}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        <div>주문일시: {date} {time}</div>
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
                          <span>배달시간: {order.delivery_time}</span>
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
                      {order.customer_name && (
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="ri-user-line mr-2"></i>
                          <span>고객명: {order.customer_name}</span>
                        </div>
                      )}
                      {order.customer_phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="ri-phone-line mr-2"></i>
                          <span>연락처: {order.customer_phone}</span>
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
                        {/* 입금대기 상태일 때 */}
                        {order.status === '입금대기' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(order.id, '입금확인')}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer"
                            >
                              입금확인
                            </button>
                            <button
                              onClick={() => handleStatusChange(order.id, '주문취소')}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer"
                            >
                              주문취소
                            </button>
                          </>
                        )}
                        
                        {/* 입금확인 상태일 때 */}
                        {order.status === '입금확인' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(order.id, '입금대기')}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer"
                            >
                              입금대기로
                            </button>
                            {order.order_type === 'delivery' && (
                              <button
                                onClick={() => handleStatusChange(order.id, '배달완료')}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer"
                              >
                                배달완료
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusChange(order.id, '주문취소')}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer"
                            >
                              주문취소
                            </button>
                          </>
                        )}
                        
                        {/* 배달완료 상태일 때 (배달 주문만) */}
                        {order.status === '배달완료' && order.order_type === 'delivery' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(order.id, '입금대기')}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer"
                            >
                              입금대기로
                            </button>
                            <button
                              onClick={() => handleStatusChange(order.id, '입금확인')}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer"
                            >
                              입금확인으로
                            </button>
                            <button
                              onClick={() => handleStatusChange(order.id, '주문취소')}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer"
                            >
                              주문취소
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 확인 모달 */}
      {showConfirmation && pendingChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                <i className="ri-question-line text-2xl text-orange-600"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                주문 상태 변경
              </h3>
              <p className="text-gray-600 mb-6">
                주문 #{pendingChange.orderNumber}의 상태를<br />
                <span className="font-medium text-orange-600">{pendingChange.newStatus}</span>로 변경하시겠습니까?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelStatusChange}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={confirmStatusChange}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}