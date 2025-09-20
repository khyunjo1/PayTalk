import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNewAuth } from '../../../hooks/useNewAuth';
import { getStoreOrders } from '../../../lib/orderApi';
import { getStores } from '../../../lib/storeApi';
import { getCurrentKoreaTime } from '../../../lib/dateUtils';
import Header from '../../../components/Header';

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
  menu_date?: string | null;
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

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const { user, loading } = useNewAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [storeName, setStoreName] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'thisWeek' | 'thisMonth' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState('');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

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

  // 외부 클릭으로 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.period-dropdown-container')) {
        setShowPeriodDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  // 숫자를 천단위 콤마로 포맷팅하는 함수
  const formatNumber = (num: number): string => {
    return `${num.toLocaleString()}원`;
  };

  const handlePeriodSelect = (period: 'today' | 'thisWeek' | 'thisMonth' | 'custom') => {
    setSelectedPeriod(period);
    setShowPeriodDropdown(false);
    
    if (period !== 'custom') {
      setSelectedDate('');
    } else {
      // 커스텀 날짜 선택 시 오늘 날짜를 기본값으로 설정
      const koreaTime = getCurrentKoreaTime();
      setSelectedDate(koreaTime.toISOString().split('T')[0]);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const filterOrdersByPeriod = (orders: Order[]) => {
    // 한국 시간 기준으로 오늘 날짜 계산
    const koreaTime = getCurrentKoreaTime();
    const today = new Date(koreaTime.getFullYear(), koreaTime.getMonth(), koreaTime.getDate());
    
    const formatDateForComparison = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const getDateRange = () => {
      switch (selectedPeriod) {
        case 'today':
          return {
            start: formatDateForComparison(today),
            end: formatDateForComparison(today)
          };
        case 'thisWeek':
          // 이번 주 월요일부터 일요일까지
          const startOfWeek = new Date(today);
          const day = startOfWeek.getDay();
          const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // 월요일 시작
          startOfWeek.setDate(diff);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return {
            start: formatDateForComparison(startOfWeek),
            end: formatDateForComparison(endOfWeek)
          };
        case 'thisMonth':
          // 이번 달 1일부터 마지막 날까지
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          return {
            start: formatDateForComparison(startOfMonth),
            end: formatDateForComparison(endOfMonth)
          };
        case 'custom':
          return {
            start: selectedDate || formatDateForComparison(today),
            end: selectedDate || formatDateForComparison(today)
          };
        default:
          return {
            start: formatDateForComparison(today),
            end: formatDateForComparison(today)
          };
      }
    };

    const dateRange = getDateRange();
    
    return orders.filter(order => {
      // 일일 메뉴 주문인 경우 메뉴 날짜로 필터링 (menu_date 필드 사용)
      if (order.menu_date) {
        return order.menu_date >= dateRange.start && order.menu_date <= dateRange.end;
      }
      
      // 일반 주문인 경우 주문 생성 시간으로 필터링 (한국 시간 기준)
      const orderDate = new Date(order.created_at);
      const orderDateStr = formatDateForComparison(orderDate);
      return orderDateStr >= dateRange.start && orderDateStr <= dateRange.end;
    });
  };

  const getPeriodTitle = (title: string) => {
    switch (selectedPeriod) {
      case 'today':
        return `오늘 ${title}`;
      case 'thisWeek':
        return `이번주 ${title}`;
      case 'thisMonth':
        return `이번달 ${title}`;
      case 'custom':
        if (selectedDate) {
          // YYYY-MM-DD 형식을 한국 날짜 형식으로 변환
          const [year, month, day] = selectedDate.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return `${date.toLocaleDateString('ko-KR')} ${title}`;
        }
        return `선택된 날짜 ${title}`;
      default:
        return `오늘 ${title}`;
    }
  };

  const calculateStatistics = (orders: Order[], period: string) => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    let previousPeriodRevenue = 0;
    const koreaTime = getCurrentKoreaTime();
    const today = new Date(koreaTime.getFullYear(), koreaTime.getMonth(), koreaTime.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    switch (period) {
      case 'today':
        previousPeriodRevenue = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= yesterday && orderDate < today;
        }).reduce((sum, order) => sum + order.total, 0);
        break;
      case 'yesterday':
        const dayBeforeYesterday = new Date(today);
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
        previousPeriodRevenue = orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= dayBeforeYesterday && orderDate < yesterday;
        }).reduce((sum, order) => sum + order.total, 0);
        break;
      default:
        previousPeriodRevenue = 0;
    }
    
    const revenueGrowthRate = previousPeriodRevenue > 0 
      ? Math.round(((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100)
      : 0;
    
    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueGrowthRate
    };
  };




  // 메뉴 수익성 분석
  const getMenuProfitabilityAnalysis = (orders: Order[]) => {
    const menuData: { [key: string]: { 
      name: string; 
      totalOrders: number; 
      totalQuantity: number; 
      totalRevenue: number; 
      avgPrice: number;
      profitability: number;
    } } = {};
    
    orders.forEach(order => {
      if (order.order_items) {
        order.order_items.forEach(item => {
          const menuName = item.menus.name;
          const itemRevenue = item.price * item.quantity;
          
          if (!menuData[menuName]) {
            menuData[menuName] = {
              name: menuName,
              totalOrders: 0,
              totalQuantity: 0,
              totalRevenue: 0,
              avgPrice: item.price,
              profitability: 0
            };
          }
          
          menuData[menuName].totalOrders += 1;
          menuData[menuName].totalQuantity += item.quantity;
          menuData[menuName].totalRevenue += itemRevenue;
        });
      }
    });
    
    // 수익성 계산 (총 매출 / 총 주문 수)
    Object.values(menuData).forEach(menu => {
      menu.profitability = menu.totalOrders > 0 ? Math.round(menu.totalRevenue / menu.totalOrders) : 0;
    });
    
    return Object.values(menuData)
      .sort((a, b) => b.profitability - a.profitability)
      .slice(0, 5); // 상위 5개 메뉴만
  };

  const filteredOrdersByPeriod = filterOrdersByPeriod(orders);

  const popularMenus = (() => {
    const menuCounts: { [key: string]: { name: string; count: number } } = {};
    
    filteredOrdersByPeriod.forEach(order => {
      if (order.order_items) {
        order.order_items.forEach(item => {
          const menuName = item.menus.name;
          if (!menuCounts[menuName]) {
            menuCounts[menuName] = { name: menuName, count: 0 };
          }
          menuCounts[menuName].count += item.quantity;
        });
      }
    });
    
    return Object.values(menuCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  })();


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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-col">
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/admin-dashboard')}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="뒤로가기"
                >
                  <i className="ri-arrow-left-line text-xl text-gray-600"></i>
                </button>
                <h1 className="text-lg font-semibold text-gray-800">가게매출</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1">

        {/* 필터 카드 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 shadow-lg mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <i className="ri-filter-3-line text-orange-500 text-base sm:text-lg"></i>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-800">필터</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* 기간 필터 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <i className="ri-calendar-line text-gray-600 text-base sm:text-lg"></i>
                <span className="text-sm sm:text-base font-bold text-gray-800 whitespace-nowrap">기간:</span>
              </div>

              <div className="flex-1">
                <div className="relative period-dropdown-container">
                  <button
                    onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                    className="w-full px-3 sm:px-5 py-3 sm:py-4 bg-white border-2 border-gray-200 rounded-2xl text-sm sm:text-base font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer transition-all duration-200 hover:border-orange-300 hover:shadow-md flex items-center justify-between"
                  >
                    <span>
                      {selectedPeriod === 'today' ? '오늘' :
                       selectedPeriod === 'thisWeek' ? '이번주' :
                       selectedPeriod === 'thisMonth' ? '이번달' :
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
                        className={`w-full px-4 py-3 text-left text-base font-semibold transition-colors duration-200 hover:bg-gray-50 ${
                          selectedPeriod === 'today' ? 'bg-orange-50 text-orange-600' : 'text-gray-800'
                        }`}
                      >
                        오늘
                      </button>
                      <button
                        onClick={() => {
                          handlePeriodSelect('thisWeek');
                          setShowPeriodDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-base font-semibold transition-colors duration-200 hover:bg-gray-50 ${
                          selectedPeriod === 'thisWeek' ? 'bg-orange-50 text-orange-600' : 'text-gray-800'
                        }`}
                      >
                        이번주
                      </button>
                      <button
                        onClick={() => {
                          handlePeriodSelect('thisMonth');
                          setShowPeriodDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-base font-semibold transition-colors duration-200 hover:bg-gray-50 ${
                          selectedPeriod === 'thisMonth' ? 'bg-orange-50 text-orange-600' : 'text-gray-800'
                        }`}
                      >
                        이번달
                      </button>
                      <button
                        onClick={() => {
                          handlePeriodSelect('custom');
                          setShowPeriodDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-base font-semibold transition-colors duration-200 hover:bg-gray-50 ${
                          selectedPeriod === 'custom' ? 'bg-orange-50 text-orange-600' : 'text-gray-800'
                        }`}
                      >
                        날짜 선택
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 커스텀 날짜 선택 */}
            {selectedPeriod === 'custom' && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <i className="ri-calendar-check-line text-gray-600 text-base sm:text-lg"></i>
                  <span className="text-sm sm:text-base font-bold text-gray-800 whitespace-nowrap">날짜:</span>
                </div>
                
                <div className="flex-1">
                  <input
                    type="date"
                    value={selectedDate || ''}
                    onChange={(e) => handleDateSelect(e.target.value)}
                    min={getCurrentKoreaTime().toISOString().split('T')[0]}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-0 rounded-xl text-sm sm:text-base font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all duration-200 hover:bg-gray-100"
                    placeholder="날짜를 선택하세요"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 주요 통계 카드 */}
        <div className="mb-6 sm:mb-8">
          <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <i className="ri-dashboard-line text-orange-500 text-base sm:text-lg"></i>
            주요 통계
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <i className="ri-money-dollar-circle-line text-green-600 text-lg sm:text-xl"></i>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-bold text-gray-700 mb-1">{getPeriodTitle('총 매출')}</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600 break-words">
                    {formatNumber(calculateStatistics(filteredOrdersByPeriod, selectedPeriod).totalRevenue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <i className="ri-shopping-cart-line text-blue-600 text-lg sm:text-xl"></i>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-bold text-gray-700 mb-1">{getPeriodTitle('총 주문수')}</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{calculateStatistics(filteredOrdersByPeriod, selectedPeriod).totalOrders.toLocaleString()}건</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <i className="ri-bar-chart-line text-purple-600 text-lg sm:text-xl"></i>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-bold text-gray-700 mb-1">{getPeriodTitle('평균 주문액')}</p>
                  <p className="text-lg sm:text-xl font-bold text-purple-600 break-words">
                    {formatNumber(calculateStatistics(filteredOrdersByPeriod, selectedPeriod).averageOrderValue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <i className="ri-restaurant-line text-orange-600 text-lg sm:text-xl"></i>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-bold text-gray-700 mb-1">{getPeriodTitle('인기메뉴')}</p>
                  <p className="text-sm sm:text-lg font-bold text-orange-600 mb-1 break-words">
                    {popularMenus.length > 0 ? popularMenus[0].name : '없음'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {popularMenus.length > 0 ? `${popularMenus[0].count}개 판매` : '주문 없음'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>




        {/* 메뉴 수익성 분석 */}
        <div className="mb-6 sm:mb-8">
          <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
            <i className="ri-restaurant-line text-orange-500 text-base sm:text-lg"></i>
            메뉴 수익성 분석
          </h4>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="ri-money-dollar-circle-line text-orange-600 text-base sm:text-lg"></i>
              </div>
              <span className="break-words">{getPeriodTitle('메뉴 수익성 분석')}</span>
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {getMenuProfitabilityAnalysis(filteredOrdersByPeriod).map((menu, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200 hover:shadow-md transition-shadow gap-3 sm:gap-0">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm sm:text-base">#{index + 1}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-base sm:text-lg font-bold text-gray-900 mb-1 break-words">{menu.name}</div>
                      <div className="text-sm sm:text-base text-gray-700 font-medium">
                        {menu.totalOrders}회 주문 • {menu.totalQuantity}개 판매
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-lg sm:text-xl font-bold text-orange-600 mb-1 break-words">
                      {formatNumber(menu.profitability)}
                    </div>
                    <div className="text-sm sm:text-base text-gray-700 font-medium mb-1">
                      평균 단가
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 break-words">
                      총 {formatNumber(menu.totalRevenue)}
                    </div>
                  </div>
                </div>
              ))}
              {getMenuProfitabilityAnalysis(filteredOrdersByPeriod).length === 0 && (
                <div className="text-center text-gray-500 py-8 sm:py-12">
                  <i className="ri-restaurant-line text-3xl sm:text-4xl mb-3 sm:mb-4"></i>
                  <p className="text-base sm:text-lg font-medium">선택한 기간에 주문된 메뉴가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}