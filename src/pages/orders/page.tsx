
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Order {
  orderId: string;
  storeInfo: {
    name: string;
    phone: string;
  };
  cart: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  orderDate: string;
  status: string;
  paymentMethod: 'bank' | 'card';
  total: number;
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
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, [navigate]);

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

  const completedOrders = orders.filter(order => order.status === '배달완료').length;
  const totalAmount = orders
    .filter(order => order.status === '배달완료')
    .reduce((sum, order) => sum + order.total, 0);

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            const { date, time } = formatDate(order.orderDate);
            return (
              <div key={order.orderId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{order.storeInfo.name}</h3>
                      <div className="text-sm text-gray-500 mt-1">
                        <div>{date} {time}</div>
                        <div>주문번호: {order.orderId}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]
                      }`}>
                        {order.status}
                      </span>
                      <i className={`${PAYMENT_ICONS[order.paymentMethod]} text-gray-500`}></i>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="space-y-1 mb-3">
                      {order.cart.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.name} x {item.quantity}
                          </span>
                          <span className="text-gray-800">
                            {(item.price * item.quantity).toLocaleString()}원
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-semibold text-gray-800">총 결제 금액</span>
                      <span className="font-bold text-lg text-orange-500">
                        {order.total.toLocaleString()}원
                      </span>
                    </div>
                  </div>

                  {/* 매장 연락처 */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center text-sm text-gray-600">
                      <i className="ri-phone-line mr-2"></i>
                      <span>매장 문의: {order.storeInfo.phone}</span>
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
    </div>
  );
}
