import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { getOrdersByPhone, getStoreInfo } from '../../../lib/orderStatusApi';

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
  delivery_area_id?: string;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

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
    setCurrentPage(1); // 검색 시 첫 페이지로 리셋

    try {
      const result = await getOrdersByPhone(phone.trim(), storeId!, 1, 5);
      console.log('🔍 조회된 주문 데이터:', result);
      console.log('📊 주문 수:', result.orders.length);
      result.orders.forEach((order, index) => {
        console.log(`주문 ${index + 1}:`, {
          id: order.id,
          status: order.status,
          customer_name: order.customer_name,
          created_at: order.created_at
        });
      });
      setOrders(result.orders);
      setPagination(result.pagination);
    } catch (error) {
      console.error('주문 조회 실패:', error);
      setError('주문을 조회할 수 없습니다. 전화번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (page: number) => {
    if (!phone.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getOrdersByPhone(phone.trim(), storeId!, page, 5);
      setOrders(result.orders);
      setPagination(result.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('주문 조회 실패:', error);
      setError('주문을 조회할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const koreaTime = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
    return koreaTime.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <Header />
      

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 전화번호 입력 폼 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 mb-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ri-search-line text-2xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">전화번호로 주문 조회</h2>
          </div>
          
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                전화번호
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const numbers = e.target.value.replace(/[^0-9]/g, '');
                  const limited = numbers.slice(0, 11);
                  setPhone(limited);
                }}
                placeholder="01023432321"
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg transition-all duration-200 hover:border-orange-300 outline-none"
                required
              />
              <div className="text-sm text-gray-500 mt-2">
                숫자만 입력하세요 (예: 01023432321)
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !phone.trim()}
              className="w-full px-8 py-4 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-2xl hover:from-orange-500 hover:to-orange-600 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  조회 중...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <i className="ri-search-line text-xl"></i>
                  주문 조회
                </div>
              )}
            </button>
          </form>
          
          {/* 문의 전화번호 */}
          {storeInfo?.phone && (
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <i className="ri-phone-line"></i>
                <span>문의: {storeInfo.phone}</span>
              </div>
            </div>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <i className="ri-error-warning-line text-red-500 text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-800">조회 실패</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 주문 내역 */}
        {hasSearched && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="ri-shopping-cart-line text-4xl text-orange-400"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  주문이 없어요!
                </h3>
                <p className="text-gray-600 text-lg mb-2">
                  입력하신 전화번호로 주문한 내역이 없습니다.
                </p>
                <p className="text-gray-500">
                  모든 주문 내역을 확인할 수 있어요! ✨
                </p>
              </div>
            ) : (
              <div>
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i className="ri-shopping-cart-line text-white text-lg sm:text-xl"></i>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 whitespace-nowrap">
                          주문 내역
                        </h2>
                        <p className="text-orange-600 font-semibold text-sm sm:text-base">
                          총 {pagination.totalCount}건
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl sm:text-4xl font-bold text-orange-500">
                        {pagination.totalCount}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        주문 건수
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
                      {/* 헤더 - 고객명과 상태 */}
                      <div className={`p-4 sm:p-6 ${
                        order.status === '입금대기' ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                        order.status === '입금확인' ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                        order.status === '배달완료' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                        order.status === '주문취소' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                        'bg-gradient-to-r from-gray-400 to-slate-500'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2 truncate">
                              주문 #{order.id.slice(-8)}
                            </h3>
                            <p className="text-white/90 text-sm sm:text-lg">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            <div className="text-2xl sm:text-4xl">
                              {order.status === '입금대기' && '💳'}
                              {order.status === '입금확인' && '👨‍🍳'}
                              {order.status === '배달완료' && '🎉'}
                              {order.status === '주문취소' && '😢'}
                            </div>
                            <div className="text-right">
                              <div className="text-xs sm:text-sm text-white/80">입금자</div>
                              <div className="text-sm sm:text-base font-semibold text-white">{order.depositor_name}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 상태 버튼들 */}
                      <div className="p-4 bg-gray-50">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <div className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                            order.status === '입금대기' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            입금 대기
                          </div>
                          <div className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                            order.status === '입금확인' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            배달
                          </div>
                          <div className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                            order.status === '배달완료' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            배달완료
                          </div>
                        </div>
                        
                        {order.status === '입금확인' ? (
                          <div className="flex items-center gap-3">
                            <span className="text-xl sm:text-2xl">✅</span>
                            <div className="flex-1">
                              <p className="text-gray-800 font-bold text-sm sm:text-base">
                                입금이 확인되었습니다!
                              </p>
                              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                                배달이 곧 갈거예요! 조금만 기다려주세요! 
                                <span className="animate-bounce ml-1">⏰</span>
                              </p>
                            </div>
                          </div>
                        ) : order.status === '입금대기' ? (
                          <div className="flex items-center gap-3">
                            <span className="text-xl sm:text-2xl">💳</span>
                            <div className="flex-1">
                              <p className="text-gray-800 font-bold text-sm sm:text-base">
                                입금 대기중이에요! 💕
                              </p>
                            </div>
                          </div>
                        ) : order.status === '배달완료' ? (
                          <div className="flex items-center gap-3">
                            <span className="text-xl sm:text-2xl">🎉</span>
                            <div className="flex-1">
                              <p className="text-gray-800 font-bold text-sm sm:text-base">
                                배달이 완료되었어요! 맛있게 드세요! 🍽️
                              </p>
                            </div>
                          </div>
                        ) : order.status === '주문취소' ? (
                          <div className="flex items-center gap-3">
                            <span className="text-xl sm:text-2xl">😢</span>
                            <div className="flex-1">
                              <p className="text-gray-800 font-bold text-sm sm:text-base">
                                주문이 취소되었어요... 😔
                              </p>
                              <p className="text-gray-600 text-xs sm:text-sm mt-1">
                                죄송합니다. 다시 주문해주세요! 💕
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {/* 주문 정보 */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                            {order.order_type === 'delivery' ? '🚚 배달' : '🏃‍♂️ 픽업'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {order.order_type === 'delivery' && order.delivery_address && (
                            <div className="flex items-start gap-2 text-xs sm:text-sm">
                              <i className="ri-map-pin-line text-orange-500 mt-0.5 flex-shrink-0"></i>
                              <div>
                                <div className="text-gray-500 text-xs">배달주소</div>
                                <div className="text-gray-700 break-words">{order.delivery_address}</div>
                              </div>
                            </div>
                          )}
                          
                          {order.order_type === 'pickup' && order.customer_phone && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <i className="ri-phone-line text-orange-500 flex-shrink-0"></i>
                              <div>
                                <div className="text-gray-500 text-xs">연락처</div>
                                <div className="text-gray-700">{order.customer_phone}</div>
                              </div>
                            </div>
                          )}
                          
                          {order.delivery_time && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <i className="ri-time-line text-orange-500 flex-shrink-0"></i>
                              <div>
                                <div className="text-gray-500 text-xs">배달시간</div>
                                <div className="text-gray-700">{order.delivery_time}</div>
                              </div>
                            </div>
                          )}
                          
                          {order.pickup_time && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <i className="ri-time-line text-orange-500 flex-shrink-0"></i>
                              <div>
                                <div className="text-gray-500 text-xs">픽업시간</div>
                                <div className="text-gray-700">{order.pickup_time}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 요청사항 */}
                      {order.special_requests && (
                        <div className="p-4 bg-orange-50">
                          <div className="flex items-start gap-2">
                            <i className="ri-message-3-line text-orange-500 mt-0.5"></i>
                            <div>
                              <p className="text-sm font-medium text-orange-800">특별 요청사항</p>
                              <p className="text-sm text-orange-700 mt-1">{order.special_requests}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 주문 메뉴 */}
                      <div className="p-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                            <i className="ri-restaurant-line text-orange-500"></i>
                            주문 상품
                          </h4>
                        </div>
                        
                        <div className="space-y-2">
                          {order.order_items?.map((item, index) => (
                            <div key={index} className="bg-orange-50 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-800 text-sm sm:text-base break-words">
                                    {item.menus?.name || '메뉴'}
                                  </p>
                                  {item.quantity > 1 && (
                                    <p className="text-xs text-gray-600 mt-1">({item.quantity}개)</p>
                                  )}
                                </div>
                                <p className="font-bold text-orange-600 text-sm sm:text-base ml-2">
                                  {((item.price || 0) * item.quantity).toLocaleString()}원
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="space-y-2 pt-3 mt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">상품 금액</span>
                            <span className="text-gray-800 text-sm">{order.subtotal?.toLocaleString() || '0'}원</span>
                          </div>
                          {order.order_type === 'delivery' && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">배달비</span>
                              <span className="text-gray-800 text-sm">
                                {(order.delivery_fee || (order.total - order.subtotal) || 0).toLocaleString()}원
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <div className="flex items-center gap-2">
                              <i className="ri-money-dollar-circle-line text-orange-500"></i>
                              <span className="font-bold text-sm sm:text-lg text-gray-800">총 결제금액</span>
                            </div>
                            <span className="font-bold text-lg sm:text-xl text-orange-600">
                              {order.total?.toLocaleString() || '0'}원
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 액션 버튼들 */}
                      <div className="p-4 bg-white border-t border-gray-200">
                        <div className="flex gap-2">
                          <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors">
                            입금확인
                          </button>
                          <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors">
                            배달완료
                          </button>
                          <button className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors">
                            주문취소
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 페이지네이션 */}
                {pagination.totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4">
                      <div className="flex items-center gap-3">
                        {/* 이전 페이지 버튼 */}
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!pagination.hasPrevPage || loading}
                          className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                            pagination.hasPrevPage && !loading
                              ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <i className="ri-arrow-left-line text-lg"></i>
                        </button>
                        
                        {/* 페이지 번호들 */}
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            disabled={loading}
                            className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                              page === currentPage
                                ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-orange-300'
                            } ${loading ? 'cursor-not-allowed' : ''}`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        {/* 다음 페이지 버튼 */}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!pagination.hasNextPage || loading}
                          className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                            pagination.hasNextPage && !loading
                              ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <i className="ri-arrow-right-line text-lg"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
