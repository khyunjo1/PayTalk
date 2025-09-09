
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserOrders } from '../../lib/orderApi';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

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
  total: number;
  status: '입금대기' | '입금확인' | '배달완료';
  created_at: string;
  updated_at: string;
  stores: {
    id: string;
    name: string;
    phone: string;
  };
  order_items: Array<{
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

const STATUS_COLORS = {
  '입금대기': 'bg-yellow-100 text-yellow-800',
  '입금확인': 'bg-blue-100 text-blue-800',
  '조리중': 'bg-purple-100 text-purple-800',
  '배달중': 'bg-orange-100 text-orange-800',
  '배달완료': 'bg-green-100 text-green-800'
};

const PAYMENT_ICONS = {
  'bank': 'ri-bank-line',
  'card': 'ri-bank-card-line'
};

export default function Orders() {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    // 로딩 중이면 대기
    if (loading) return;

    // 로그인하지 않은 사용자는 로그인 페이지로
    if (!user) {
      navigate('/login');
      return;
    }

    // 주문 데이터 로드
    const loadOrders = async () => {
      try {
        setLoadingOrders(true);
        const userOrders = await getUserOrders(user.id);
        console.log('사용자 주문 목록:', userOrders);
        setOrders(userOrders);
      } catch (error) {
        console.error('주문 데이터 로드 오류:', error);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [user, loading, navigate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ko-KR'),
      time: date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  // 로딩 중
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

  const completedOrders = orders.filter(order => order.status === '배달완료').length;
  const totalAmount = orders
    .filter(order => order.status === '배달완료')
    .reduce((sum, order) => sum + order.total, 0);

  if (loadingOrders) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 py-4 flex items-center">
            <button
              onClick={() => navigate('/stores')}
              className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <i className="ri-arrow-left-line text-xl"></i>
            </button>
            <h1 className="text-lg font-semibold ml-2">주문내역</h1>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">주문 데이터를 불러오는 중...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 py-4 flex items-center">
            <button
              onClick={() => navigate('/stores')}
              className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <i className="ri-arrow-left-line text-xl"></i>
            </button>
            <h1 className="text-lg font-semibold ml-2">주문내역</h1>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <i className="ri-file-list-line text-6xl text-gray-300 mb-4"></i>
            <h2 className="text-xl font-semibold text-gray-600 mb-2">주문 내역이 없습니다</h2>
            <p className="text-gray-500 mb-4">첫 주문을 시작해보세요</p>
            <button
              onClick={() => navigate('/stores')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg whitespace-nowrap cursor-pointer"
            >
              매장 보러가기
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/stores')}
            className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <i className="ri-arrow-left-line text-xl"></i>
          </button>
          <h1 className="text-lg font-semibold ml-2">주문내역</h1>
        </div>
      </div>

      <div className="p-4">
        {/* 주문 통계 */}
        <div className="bg-white rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">주문 통계</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{orders.length}</div>
              <div className="text-sm text-gray-600">총 주문</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{completedOrders}</div>
              <div className="text-sm text-gray-600">완료된 주문</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {totalAmount.toLocaleString()}원
              </div>
              <div className="text-sm text-gray-600">총 주문 금액</div>
            </div>
          </div>
        </div>

        {/* 주문 목록 */}
        <div className="space-y-4">
          {orders.map((order) => {
            const { date, time } = formatDate(order.created_at);
            return (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{order.stores.name}</h3>
                      <div className="text-sm text-gray-500 mt-1">
                        <div>{date} {time}</div>
                        <div>주문번호: {order.id.substring(0, 8)}...</div>
                        <div>주문방식: {order.order_type === 'delivery' ? '배달' : '픽업'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
                      }`}>
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
                        <span>배달시간: {order.delivery_time}</span>
                      </div>
                    )}
                    {order.pickup_time && (
                      <div className="flex items-center text-sm text-gray-600">
                        <i className="ri-time-line mr-2"></i>
                        <span>픽업시간: {order.pickup_time}</span>
                      </div>
                    )}
                    {order.special_requests && (
                      <div className="flex items-center text-sm text-gray-600">
                        <i className="ri-message-line mr-2"></i>
                        <span>요청사항: {order.special_requests}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <i className="ri-phone-line mr-2"></i>
                      <span>매장 문의: {order.stores.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 여백 */}
        <div className="h-6"></div>
      </div>
      <Footer />
    </div>
  );
}
