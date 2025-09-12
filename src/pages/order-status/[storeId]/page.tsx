import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { getOrdersByPhone, getStoreInfo, getOrderStatusText, getOrderStatusColor } from '../../../lib/orderStatusApi';

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
  total: number;
  status: '입금대기' | '입금확인' | '배달완료' | '주문취소';
  created_at: string;
  updated_at: string;
  stores: {
    id: string;
    name: string;
    phone: string;
  };
  order_items: Array<{
    quantity: number;
    price: number;
    menus: {
      id: string;
      name: string;
      price: number;
    };
  }>;
}

interface StoreInfo {
  id: string;
  name: string;
  phone: string;
  delivery_area?: string;
  category?: string;
}

export default function OrderStatus() {
  const { storeId } = useParams<{ storeId: string }>();
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // 매장 정보 로드
  useEffect(() => {
    if (storeId && storeId !== 'undefined') {
      loadStoreInfo();
    } else {
      setError('잘못된 매장 ID입니다.');
    }
  }, [storeId]);

  const loadStoreInfo = async () => {
    try {
      const store = await getStoreInfo(storeId!);
      setStoreInfo(store);
    } catch (error) {
      console.error('매장 정보 로드 실패:', error);
      setError('매장 정보를 불러올 수 없습니다.');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const ordersData = await getOrdersByPhone(phone.trim(), storeId!);
      setOrders(ordersData);
    } catch (error) {
      console.error('주문 조회 실패:', error);
      setError('주문을 조회할 수 없습니다. 전화번호를 확인해주세요.');
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
    return price.toLocaleString('ko-KR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 매장 정보 */}
        {storeInfo && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {storeInfo.name} 주문 조회
            </h1>
            <p className="text-gray-600 mb-4">
              전화번호를 입력하여 주문 내역을 확인하세요
            </p>
            {storeInfo.phone && (
              <div className="flex items-center text-sm text-gray-500">
                <i className="ri-phone-line mr-2"></i>
                <span>문의: {storeInfo.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* 전화번호 입력 폼 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전화번호
              </label>
              <div className="flex gap-3">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const numbers = e.target.value.replace(/[^0-9]/g, '');
                    const limited = numbers.slice(0, 11);
                    setPhone(limited);
                  }}
                  placeholder="01023432321"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  required
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                숫자만 입력하세요 (예: 01023432321)
              </div>
              <button
                type="submit"
                disabled={loading || !phone.trim()}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    조회 중...
                  </div>
                ) : (
                  '주문 조회'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <i className="ri-error-warning-line text-red-500 text-xl mr-3"></i>
              <div>
                <h3 className="text-sm font-medium text-red-800">조회 실패</h3>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 주문 내역 */}
        {hasSearched && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-gradient-to-br from-orange-50 to-pink-50 border border-orange-200 rounded-xl p-8 text-center">
                <div className="text-6xl mb-4">🌅</div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  오늘 주문이 없어요!
                </h3>
                <p className="text-gray-600 mb-2">
                  입력하신 전화번호로 오늘 주문한 내역이 없습니다.
                </p>
                <p className="text-sm text-gray-500">
                  오늘 주문하신 내역만 확인할 수 있어요! ✨
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🍽️</span>
                  오늘 주문 내역 ({orders.length}건)
                </h2>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      {/* 주문 헤더 */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
                              <i className="ri-user-heart-line text-white text-lg"></i>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800">
                                {order.customer_name}님의 주문
                              </h3>
                              <p className="text-sm text-gray-500">
                                {formatDate(order.created_at)}
                              </p>
                            </div>
                          </div>
                          
                          {/* 귀여운 상태 메시지 */}
                          <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl p-4 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">
                                {order.status === '입금대기' && '💳'}
                                {order.status === '입금확인' && '👨‍🍳'}
                                {order.status === '배달완료' && '🎉'}
                                {order.status === '주문취소' && '😢'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">
                                  {order.status === '입금대기' && `${order.customer_name}님의 주문이 입금 대기중이에요! 💕`}
                                  {order.status === '입금확인' && `조리사님이 열심히 요리하고 있어요! 🔥`}
                                  {order.status === '배달완료' && `배달이 완료되었어요! 맛있게 드세요! 🍽️`}
                                  {order.status === '주문취소' && `주문이 취소되었어요 😢`}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {order.order_type === 'delivery' ? '🚚 배달 주문' : '🏃‍♂️ 픽업 주문'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="text-sm text-gray-500 space-y-1">
                            {order.order_type === 'delivery' && order.delivery_address && (
                              <div className="flex items-center gap-2">
                                <i className="ri-map-pin-line text-orange-500"></i>
                                <span>배달주소: {order.delivery_address}</span>
                              </div>
                            )}
                            {order.delivery_time && (
                              <div className="flex items-center gap-2">
                                <i className="ri-time-line text-orange-500"></i>
                                <span>배달시간: {order.delivery_time}</span>
                              </div>
                            )}
                            {order.pickup_time && (
                              <div className="flex items-center gap-2">
                                <i className="ri-time-line text-orange-500"></i>
                                <span>픽업시간: {order.pickup_time}</span>
                              </div>
                            )}
                            {order.depositor_name && (
                              <div className="flex items-center gap-2">
                                <i className="ri-user-line text-orange-500"></i>
                                <span>입금자명: {order.depositor_name}</span>
                              </div>
                            )}
                            {order.customer_phone && (
                              <div className="flex items-center gap-2">
                                <i className="ri-phone-line text-orange-500"></i>
                                <span>연락처: {order.customer_phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 요청사항 */}
                      {order.special_requests && (
                        <div className="mb-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center text-sm text-blue-800">
                              <i className="ri-message-line mr-2 text-blue-500"></i>
                              <span className="font-medium">💬 요청사항:</span>
                            </div>
                            <p className="text-sm text-blue-700 mt-1 ml-6">
                              {order.special_requests}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 주문 메뉴 */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <span className="text-lg">🍽️</span>
                          주문 메뉴
                        </h4>
                        <div className="space-y-2">
                          {order.order_items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg border border-orange-100">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">🍴</span>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {item.menus.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatPrice(item.price)}원 × {item.quantity}개
                                  </p>
                                </div>
                              </div>
                              <p className="text-sm font-bold text-orange-600">
                                {formatPrice(item.price * item.quantity)}원
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 총 금액 */}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <span className="text-lg font-bold text-gray-800 flex items-center gap-2">
                          <span className="text-xl">💰</span>
                          총 금액
                        </span>
                        <span className="text-xl font-bold text-orange-600">
                          {formatPrice(order.total)}원
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
