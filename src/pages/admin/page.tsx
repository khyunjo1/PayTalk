
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  customerName: string;
  items: string;
  total: number;
  status: '입금대기' | '입금확인' | '배달완료';
  orderDate: string;
  phone: string;
}

const MOCK_ORDERS: Order[] = [
  {
    id: '2024001',
    customerName: '김고객',
    items: '김치찌개, 된장찌개',
    total: 15000,
    status: '입금대기',
    orderDate: '2024-01-20 12:30',
    phone: '010-1234-5678'
  },
  {
    id: '2024002',
    customerName: '박고객',
    items: '제육볶음, 계란말이',
    total: 18000,
    status: '입금확인',
    orderDate: '2024-01-20 13:15',
    phone: '010-9876-5432'
  },
  {
    id: '2024003',
    customerName: '이고객',
    items: '부대찌개',
    total: 9000,
    status: '배달완료',
    orderDate: '2024-01-20 11:45',
    phone: '010-5555-7777'
  }
];

export default function Admin() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
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

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

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

  // 통계 계산
  const totalRevenue = orders
    .filter(order => order.status === '배달완료')
    .reduce((sum, order) => sum + order.total, 0);
  
  const totalOrders = orders.filter(order => order.status === '배달완료').length;
  const averageOrderAmount = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  
  // 간단한 증가율 계산 (이전 달 대비)
  const revenueGrowthRate = 12.5; // 실제로는 이전 달 데이터와 비교해야 함
  
  // 인기 카테고리 (간단한 더미 데이터)
  const popularCategories = [
    { name: '메인메뉴', percentage: 83 },
    { name: '국물요리', percentage: 67 },
    { name: '김치류', percentage: 50 },
    { name: '사이드메뉴', percentage: 33 }
  ];

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
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">총 매출</p>
                <p className="text-lg font-bold text-green-600">{totalRevenue.toLocaleString()}원</p>
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
                <p className="text-lg font-bold text-blue-600">{totalOrders.toLocaleString()}</p>
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
                <p className="text-lg font-bold text-purple-600">{averageOrderAmount.toLocaleString()}원</p>
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
                <p className="text-lg font-bold text-orange-600">+{revenueGrowthRate}%</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="ri-trending-up-line text-orange-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* 인기 카테고리 */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">인기 카테고리</h3>
          <div className="space-y-3">
            {popularCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-600">{category.name}</span>
                <div className="flex items-center">
                  <div className="w-20 h-2 bg-gray-200 rounded-full mr-2">
                    <div 
                      className="h-2 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold">{category.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 필터 버튼 */}
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
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">주문번호: {order.id}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{order.orderDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg text-gray-800">{order.total.toLocaleString()}원</p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-600">고객: {order.customerName} ({order.phone})</p>
                <p className="text-sm text-gray-600">주문내용: {order.items}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {order.status === '입금대기' && (
                  <button
                    onClick={() => handleStatusChange(order.id, '입금확인')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap cursor-pointer"
                  >
                    입금확인
                  </button>
                )}
                {order.status === '입금확인' && (
                  <button
                    onClick={() => handleStatusChange(order.id, '배달완료')}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap cursor-pointer"
                  >
                    배달완료
                  </button>
                )}
                {canCancel(order.status) && (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm whitespace-nowrap cursor-pointer"
                  >
                    주문취소
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center">
            <i className="ri-file-list-3-line text-4xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">해당 상태의 주문이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
