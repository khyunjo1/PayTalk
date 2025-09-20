import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNewAuth } from '../../../../hooks/useNewAuth';
import { getStoreOrders, updateOrderStatus } from '../../../../lib/orderApi';
import { getStores } from '../../../../lib/storeApi';
import Header from '../../../../components/Header';

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
  delivery_fee: number;
  total: number;
  payment_method: 'bank_transfer' | 'zeropay';
  status: '입금대기' | '입금확인' | '배달완료' | '주문취소';
  read_at?: string;
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

export default function OrderDetail() {
  const navigate = useNavigate();
  const { orderId, storeId } = useParams<{ orderId: string; storeId: string }>();
  const { user, loading } = useNewAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [storeName, setStoreName] = useState('');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingChange, setPendingChange] = useState<{
    orderId: string;
    newStatus: string;
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

    if (storeId && orderId) {
      console.log('주문 상세 페이지 로드:', { storeId, orderId });
      loadOrder();
      loadStoreName();
    }
  }, [user, loading, navigate, storeId, orderId]);

  const loadOrder = async () => {
    if (!storeId || !orderId) return;
    
    try {
      setOrdersLoading(true);
      console.log('주문 로드 시작:', { storeId, orderId });
      
      const ordersData = await getStoreOrders(storeId);
      console.log('로드된 주문들:', ordersData);
      console.log('찾는 주문 ID:', orderId);
      
      setAllOrders(ordersData); // 모든 주문 목록 저장
      const foundOrder = ordersData.find(o => o.id === orderId);
      if (foundOrder) {
        console.log('주문 찾음:', foundOrder);
        console.log('주문 아이템들:', foundOrder.order_items);
        console.log('🔍 배달비 정보:', { 
          order_type: foundOrder.order_type, 
          delivery_fee: foundOrder.delivery_fee,
          delivery_fee_type: typeof foundOrder.delivery_fee 
        });
        setOrder(foundOrder);
      } else {
        console.error('주문을 찾을 수 없습니다.');
        console.log('전체 주문 목록:', ordersData.map(o => ({ id: o.id, status: o.status })));
        setOrder(null);
      }
    } catch (error) {
      console.error('주문 로드 실패:', error);
      setOrder(null);
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

  // 주문 번호 계산 함수
  const getOrderNumber = (order: Order, allOrders: Order[]) => {
    const sortedOrders = [...allOrders].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const index = sortedOrders.findIndex(o => o.id === order.id);
    return index + 1;
  };

  // 주문 정보를 텍스트로 포맷팅하는 함수
  const formatOrderToText = (order: Order) => {
    const orderNumber = getOrderNumber(order, allOrders);
    const date = new Date(order.created_at).toLocaleDateString('ko-KR');
    const time = new Date(order.created_at).toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    let orderText = '';
    orderText += `📋 주문번호: ${orderNumber}\n`;
    orderText += `📊 주문상태: ${order.status}\n`;
    orderText += `🚚 주문타입: ${order.order_type === 'delivery' ? '배달' : '픽업'}\n\n`;

    orderText += `===== 고객정보 =====\n`;
    if (order.customer_name) orderText += `👤 고객명: ${order.customer_name}\n`;
    if (order.customer_phone) orderText += `📞 연락처: ${order.customer_phone}\n`;
    if (order.depositor_name) orderText += `💳 입금자명: ${order.depositor_name}\n`;
    if (order.delivery_address) orderText += `📍 배달주소: ${order.delivery_address}\n`;
    if (order.delivery_time) orderText += `⏰ 배달시간: ${order.delivery_time}\n`;
    if (order.pickup_time) orderText += `⏰ 픽업시간: ${order.pickup_time}\n`;
    if (order.special_requests) orderText += `📝 요청사항: ${order.special_requests}\n`;
    orderText += `💰 결제방식: ${order.payment_method === 'bank_transfer' ? '무통장입금' : '제로페이'}\n\n`;

    orderText += `===== 주문메뉴 =====\n`;

    // 일일 메뉴 주문 표시
    if (order.daily_menu_orders && order.daily_menu_orders.length > 0) {
      order.daily_menu_orders.forEach((item, index) => {
        orderText += `${index + 1}. ${item.menus?.name || '메뉴'} (${item.quantity}개) - ${((item.menus?.price || 0) * (item.quantity || 0)).toLocaleString()}원\n`;
      });
    }

    // 일반 주문 메뉴 표시
    if (order.order_items && order.order_items.length > 0) {
      order.order_items.forEach((item, index) => {
        orderText += `${index + 1}. ${item.menus?.name || '메뉴'} (${item.quantity}개) - ${(item.price * item.quantity).toLocaleString()}원\n`;
      });
    }

    orderText += `\n===== 결제정보 =====\n`;
    orderText += `🛒 상품금액: ${(order.subtotal || 0).toLocaleString()}원\n`;
    if (order.order_type === 'delivery') {
      orderText += `🚚 배달비: ${(order.delivery_fee || (order.total - order.subtotal) || 0).toLocaleString()}원\n`;
    }
    orderText += `💵 총 결제금액: ${(order.total || 0).toLocaleString()}원\n\n`;

    orderText += `📅 주문일시: ${date} ${time}\n`;
    orderText += `📄 생성일시: ${new Date().toLocaleString('ko-KR')}\n`;

    return orderText;
  };

  // 주문 복사 함수
  const copyOrderToClipboard = async () => {
    if (!order) return;

    try {
      const orderText = formatOrderToText(order);
      await navigator.clipboard.writeText(orderText);

      alert('주문상세내역이 클립보드에 복사되었습니다!');
    } catch (error) {
      console.error('복사 실패:', error);
      alert('복사에 실패했습니다. 다시 시도해주세요.');
    }
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
    setPendingChange({ orderId, newStatus });
    setShowConfirmation(true);
  };


  const confirmStatusChange = async () => {
    if (!pendingChange) return;

    try {
      await updateOrderStatus(pendingChange.orderId, pendingChange.newStatus);
      setOrder(prevOrder => 
        prevOrder ? { ...prevOrder, status: pendingChange.newStatus as any } : null
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

  if (!ordersLoading && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <i className="ri-error-warning-line text-2xl text-red-600"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">주문을 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-4">주문 ID: {orderId}</p>
          <p className="text-gray-600">해당 주문이 존재하지 않습니다.</p>
          <button
            onClick={() => navigate(`/admin/${storeId}/orders`)}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            주문 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }


  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">주문 정보를 불러오는 중...</p>
          <p className="text-sm text-gray-500 mt-2">주문 ID: {orderId}</p>
        </div>
      </div>
    );
  }

  const { date, time } = {
    date: new Date(order.created_at).toLocaleDateString('ko-KR'),
    time: new Date(order.created_at).toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* 헤더 - 모바일 최적화 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/admin/${storeId}/orders`)}
              className="mr-3 sm:mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i className="ri-arrow-left-line text-lg sm:text-xl text-gray-600"></i>
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">주문 상세</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
        <div className="space-y-6">
          
          {/* 상단 영역 - 주문 번호 & 상태 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  {order.customer_name ? `${order.customer_name}님의 주문` : '주문 상세'}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <div className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold ${
                    order.order_type === 'delivery' 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {order.order_type === 'delivery' ? '배달' : '픽업'}
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-sm text-gray-500">{date}</p>
                  <p className="text-sm text-gray-500">{time}</p>
                </div>
                {/* 복사 버튼 - 제목과 같은 가로선상의 오른쪽 */}
                <button
                  onClick={copyOrderToClipboard}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 border border-blue-200 flex-shrink-0"
                  title="주문상세내역 복사"
                >
                  <i className="ri-file-copy-line text-sm"></i>
                  <span className="hidden sm:inline">주문 복사</span>
                  <span className="sm:hidden">복사</span>
                </button>
              </div>
            </div>
            
            {/* 상태 변경 버튼들 - 날짜 바로 밑에 배치 */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row gap-3 items-start">
                {/* 상태 변경 버튼들 */}
                <div className="flex flex-wrap gap-2">
                {(() => {
                  const getAvailableStatuses = () => {
                    switch (order.status) {
                      case '입금대기':
                        return ['입금확인', '주문취소'];
                      case '입금확인':
                        // 픽업은 입금확인이 최종 상태, 배달만 배달완료 가능
                        return order.order_type === 'delivery' ? ['배달완료', '주문취소'] : ['주문취소'];
                      case '배달완료':
                        return []; // 완료된 상태는 변경 불가
                      case '주문취소':
                        return []; // 취소된 상태는 변경 불가
                      default:
                        return [];
                    }
                  };

                  return getAvailableStatuses().map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(order.id, status)}
                      className={`flex-1 px-4 sm:px-6 py-3 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                        status === '입금확인' 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-400'
                          :                         status === '배달완료' 
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border border-teal-400'
                          : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border border-red-400'
                      }`}
                    >
                      <i className={`mr-2 ${
                        status === '입금확인' ? 'ri-check-line' :
                        status === '배달완료' ? 'ri-truck-line' :
                        'ri-close-line'
                      }`}></i>
                      {status}
                    </button>
                  ));
                })()}
                </div>
              </div>
            </div>
          </div>

          {/* 주문자 정보 영역 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <i className="ri-user-line text-gray-600 text-sm sm:text-lg"></i>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">주문자 정보</h2>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {/* 무통장입금일 때는 입금자명, 제로페이일 때는 고객명 표시 */}
              {(order.payment_method === 'bank_transfer' ? order.depositor_name : order.customer_name) && (
                <div className="flex items-start gap-3">
                  <span className="text-xl sm:text-2xl">👤</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">
                      {order.payment_method === 'bank_transfer' ? '입금자' : '고객명'}
                    </p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">
                      {order.payment_method === 'bank_transfer' ? order.depositor_name : order.customer_name}
                    </p>
                  </div>
                </div>
              )}
              
              
              {order.customer_phone && (
                <div className="flex items-start gap-3">
                  <span className="text-xl sm:text-2xl">📞</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">연락처</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">{order.customer_phone}</p>
                  </div>
                </div>
              )}
              
              {order.delivery_address && (
                <div className="flex items-start gap-3">
                  <span className="text-xl sm:text-2xl">📍</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">배달주소</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">{order.delivery_address}</p>
                  </div>
                </div>
              )}
              
              {/* 결제 방식 표시 */}
              <div className="flex items-start gap-3">
                <span className="text-xl sm:text-2xl">💳</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-gray-500">결제방식</p>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    {order.payment_method === 'bank_transfer' ? '무통장입금' : '제로페이'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 배달 정보 영역 */}
          {(order.delivery_time || order.pickup_time) && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="ri-truck-line text-orange-600 text-sm sm:text-lg"></i>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">배달 정보</h2>
              </div>
              
              <div className="p-3 sm:p-4 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <i className="ri-time-line text-xl sm:text-2xl text-gray-600"></i>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">
                      {order.order_type === 'delivery' ? '배달 시간' : '픽업 시간'}
                    </p>
                    <p className="text-base sm:text-lg font-bold break-words text-gray-900">
                      {order.delivery_time || order.pickup_time}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 주문 메뉴 영역 */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="ri-restaurant-line text-orange-600 text-sm sm:text-lg"></i>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">주문 메뉴</h2>
            </div>
            
            <div className="space-y-3">
              {/* 일반 주문 아이템 표시 */}
              {order.order_items && order.order_items.length > 0 ? (
                <>
                  {order.order_items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start sm:items-center py-3 gap-3">
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <span className="text-base sm:text-lg">🍽️</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">{item.menus?.name || '메뉴'}</p>
                          <p className="text-xs sm:text-sm text-gray-500">{item.quantity || 0}개</p>
                        </div>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-gray-900 whitespace-nowrap">
                        {((item.price || 0) * (item.quantity || 0)).toLocaleString()}원
                      </span>
                    </div>
                  ))}
                </>
              ) : null}
              
              {/* 일일 메뉴 주문 표시 */}
              {order.daily_menu_orders && order.daily_menu_orders.length > 0 ? (
                <>
                  {order.daily_menu_orders.map((item, index) => (
                    <div key={`daily-${index}`} className="flex justify-between items-start sm:items-center py-3 gap-3">
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <span className="text-base sm:text-lg">🍽️</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">{item.menus?.name || '메뉴'}</p>
                          <p className="text-xs sm:text-sm text-gray-500">{item.quantity || 0}개</p>
                        </div>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-gray-900 whitespace-nowrap">
                        {((item.menus?.price || 0) * (item.quantity || 0)).toLocaleString()}원
                      </span>
                    </div>
                  ))}
                  
                  {/* 주문 요약 */}
                  <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
                    {/* 상품 금액 */}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <i className="ri-shopping-bag-line text-lg text-gray-500"></i>
                        <span className="text-sm sm:text-base text-gray-700">상품 금액</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm sm:text-base text-gray-800">{(order.subtotal || 0).toLocaleString()}원</span>
                      </div>
                    </div>
                    
                    {/* 배달비 */}
                    {order.order_type === 'delivery' && (
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <i className="ri-truck-line text-lg text-gray-500"></i>
                          <span className="text-sm sm:text-base text-gray-700">배달비</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm sm:text-base text-gray-800">
                            {(order.delivery_fee || (order.total - order.subtotal) || 0).toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* 총 결제 금액 */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <i className="ri-money-dollar-circle-line text-lg sm:text-xl text-orange-500"></i>
                        <span className="text-base sm:text-lg font-semibold text-gray-900">총 결제 금액</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xl sm:text-2xl font-bold text-orange-500">{(order.total || 0).toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
              
              {/* 빈 상태 표시 - 일반 주문 아이템과 일일 메뉴 주문이 모두 없을 때만 */}
              {(!order.order_items || order.order_items.length === 0) && 
               (!order.daily_menu_orders || order.daily_menu_orders.length === 0) && (
                <div className="text-center py-8 sm:py-12 text-gray-500">
                  <i className="ri-shopping-cart-line text-4xl sm:text-6xl mb-4"></i>
                  <p className="text-base sm:text-lg">주문 상품 정보가 없습니다.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 확인 모달 - 모바일 최적화 */}
      {showConfirmation && pendingChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full mx-auto">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-orange-100 mb-4 sm:mb-6">
                <i className="ri-question-line text-xl sm:text-2xl text-orange-600"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                주문 상태 변경
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                {pendingChange.customerName ? `${pendingChange.customerName}님의 주문을` : '이 주문을'} <span className="font-semibold text-orange-500">{pendingChange.newStatus}</span>로 변경하시겠습니까?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={cancelStatusChange}
                  className="flex-1 px-4 sm:px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm sm:text-base font-semibold hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={confirmStatusChange}
                  className="flex-1 px-4 sm:px-6 py-3 bg-orange-500 text-white rounded-xl text-sm sm:text-base font-semibold hover:bg-orange-600 transition-colors"
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
