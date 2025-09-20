import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { getOrderById } from '../../../lib/orderApi';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  order_type: 'delivery' | 'pickup';
  delivery_address?: string;
  delivery_time?: string;
  pickup_time?: string;
  special_requests?: string;
  depositor_name: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: '입금대기' | '입금확인' | '배달완료' | '주문취소';
  created_at: string;
  updated_at: string;
  stores: {
    id: string;
    name: string;
    phone: string;
    address?: string;
  };
  order_items: Array<{
    quantity: number;
    price: number;
    menus: {
      id: string;
      name: string;
      price: number;
      description?: string;
    };
  }>;
}

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrderDetail();
    }
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      console.log('🔍 주문 상세 로드 시작:', orderId);
      const orderData = await getOrderById(orderId!);
      console.log('✅ 주문 데이터 로드 완료:', orderData);
      console.log('🔍 주문 아이템들:', orderData.order_items);
      setOrder(orderData);
    } catch (error) {
      console.error('❌ 주문 상세 로드 실패:', error);
      setError('주문 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return (price || 0).toLocaleString('ko-KR');
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case '입금대기':
        return {
          text: '입금 대기중',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          icon: '💳',
          description: '입금 확인 후 주문이 진행됩니다'
        };
      case '입금확인':
        return {
          text: '입금 확인',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          icon: '👨‍🍳',
          description: '주방에서 준비 중입니다'
        };
      case '배달완료':
        return {
          text: '배달 완료',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: '🎉',
          description: '주문이 완료되었습니다'
        };
      case '주문취소':
        return {
          text: '주문 취소',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: '😢',
          description: '주문이 취소되었습니다'
        };
      default:
        return {
          text: status,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          icon: '❓',
          description: ''
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">주문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <div className="text-6xl mb-4">😔</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">주문을 찾을 수 없습니다</h2>
            <p className="text-gray-600 mb-6">{error || '존재하지 않는 주문입니다.'}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              이전 페이지로
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <i className="ri-arrow-left-line text-xl text-gray-600"></i>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">주문 상세</h1>
          <div className="w-10"></div>
        </div>

        {/* 주문 상태 카드 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">주문 #{order.id.slice(-8)}</h2>
              <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
            </div>
            <div className={`px-4 py-2 rounded-full ${statusInfo.bgColor}`}>
              <span className={`text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <span className="text-3xl">{statusInfo.icon}</span>
            <div>
              <p className="font-medium text-gray-800">{statusInfo.description}</p>
              <p className="text-sm text-gray-600">
                {order.customer_name}님의 주문
              </p>
            </div>
          </div>
        </div>

        {/* 매장 정보 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">매장 정보</h3>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center">
              <i className="ri-store-3-line text-2xl text-orange-500"></i>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-1">{order.stores.name}</h4>
              <p className="text-sm text-gray-600 mb-2">{order.stores.phone}</p>
              {order.stores.address && (
                <p className="text-sm text-gray-500">{order.stores.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* 주문 정보 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">주문 정보</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <i className="ri-user-line text-gray-500 w-5"></i>
              <span className="text-gray-700">{order.customer_name}</span>
              <span className="text-gray-500">({order.customer_phone})</span>
            </div>
            
            <div className="flex items-center gap-3">
              <i className="ri-truck-line text-gray-500 w-5"></i>
              <span className="text-gray-700">
                {order.order_type === 'delivery' ? '배달' : '픽업'}
              </span>
            </div>

            {order.delivery_address && (
              <div className="flex items-start gap-3">
                <i className="ri-map-pin-line text-gray-500 w-5 mt-0.5"></i>
                <span className="text-gray-700">{order.delivery_address}</span>
              </div>
            )}

            {(order.delivery_time || order.pickup_time) && (
              <div className="flex items-center gap-3">
                <i className="ri-time-line text-gray-500 w-5"></i>
                <span className="text-gray-700">
                  {order.delivery_time || order.pickup_time}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <i className="ri-bank-card-line text-gray-500 w-5"></i>
              <span className="text-gray-700">입금자: {order.depositor_name}</span>
            </div>

            {order.special_requests && (
              <div className="flex items-start gap-3">
                <i className="ri-message-3-line text-gray-500 w-5 mt-0.5"></i>
                <div>
                  <p className="text-sm font-medium text-gray-700">특별 요청사항</p>
                  <p className="text-sm text-gray-600">{order.special_requests}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 주문 메뉴 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">주문 메뉴</h3>
          <div className="space-y-3">
            {order.order_items && order.order_items.length > 0 ? (
              order.order_items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{item.menus.name}</h4>
                    {item.menus.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.menus.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">수량: {item.quantity}개</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      {formatPrice(item.price * item.quantity)}원
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatPrice(item.price)}원 × {item.quantity}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-shopping-cart-line text-2xl text-gray-400"></i>
                </div>
                <p className="text-gray-500">주문 상품 정보가 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 결제 정보 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">결제 정보</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">상품 금액</span>
              <span className="text-gray-800">{formatPrice(order.subtotal)}원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">배달비</span>
              <span className="text-gray-800">{formatPrice(order.delivery_fee)}원</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">총 결제금액</span>
                <span className="text-xl font-bold text-orange-600">
                  {formatPrice(order.total)}원
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
