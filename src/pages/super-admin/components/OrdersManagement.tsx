import { useState, useEffect } from 'react';
import { getStores } from '../../../lib/storeApi';
import { getStoreOrders, updateOrderStatus } from '../../../lib/orderApi';
import { supabase } from '../../../lib/supabase';
import type { Store } from '../../../types';

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
  customer_name?: string;
  customer_phone?: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: '입금대기' | '입금확인' | '배달완료' | '주문취소';
  created_at: string;
  updated_at: string;
  stores?: {
    id: string;
    name: string;
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

interface OrdersManagementProps {
  showToast: (message: string) => void;
}

export default function OrdersManagement({ showToast }: OrdersManagementProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showStatusConfirm, setShowStatusConfirm] = useState<boolean>(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{orderId: string, newStatus: Order['status'], orderNumber: number} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 7;

  // 모든 매장의 주문 데이터 로드
  useEffect(() => {
    const loadAllOrders = async () => {
      try {
        setLoading(true);
        
        // 모든 매장 가져오기
        const allStores = await getStores();
        setStores(allStores);
        
        // 모든 매장의 주문 데이터 가져오기
        const allOrders: Order[] = [];
        for (const store of allStores) {
          const storeOrders = await getStoreOrders(store.id);
          // 매장 정보 추가
          const ordersWithStore = storeOrders.map(order => ({
            ...order,
            stores: { id: store.id, name: store.name }
          }));
          allOrders.push(...ordersWithStore);
        }

        // 주문 아이템 정보도 함께 가져오기
        const ordersWithItems = await Promise.all(
          allOrders.map(async (order) => {
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

        // 최신 주문부터 정렬
        ordersWithItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setOrders(ordersWithItems);
        console.log('모든 매장 주문 데이터:', ordersWithItems);
      } catch (error) {
        console.error('주문 데이터 로드 오류:', error);
        showToast('주문 데이터를 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    loadAllOrders();
  }, [showToast]);

  // 달력 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showDatePicker && !target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // 기간 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showPeriodDropdown && !target.closest('.period-dropdown-container')) {
        setShowPeriodDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPeriodDropdown]);


  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedPeriod('custom');
    setShowDatePicker(false);
  };

  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
    if (period !== 'custom') {
      setSelectedDate('');
    }
  };

  // 날짜 필터링 함수
  const filterOrdersByPeriod = (orders: Order[], period: string, customDate?: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= today;
        });
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayEnd = new Date(today);
        return orders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= yesterday && orderDate < yesterdayEnd;
        });
      case 'custom':
        if (!customDate) return orders;
        return orders.filter(order => {
          const orderDate = new Date(order.created_at);
          const orderDateString = orderDate.toISOString().split('T')[0];
          return orderDateString === customDate;
        });
      default:
        return orders;
    }
  };

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    const order = orders.find(o => o.id === orderId);
    const orderNumber = order ? getOrderNumber(order, orders) : 0;
    setPendingStatusChange({ orderId, newStatus, orderNumber });
    setShowStatusConfirm(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;

    try {
      const { orderId, newStatus } = pendingStatusChange;
      
      // updateOrderStatus API 사용 (알림톡 발송 포함)
      const updatedOrder = await updateOrderStatus(orderId, newStatus);
      
      // 로컬 상태 업데이트
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      showToast(`주문 상태가 "${newStatus}"로 변경되었습니다`);
      console.log('주문 상태 변경 성공:', updatedOrder);
    } catch (error) {
      console.error('주문 상태 변경 오류:', error);
      showToast('주문 상태 변경에 실패했습니다');
    } finally {
      setShowStatusConfirm(false);
      setPendingStatusChange(null);
    }
  };

  const cancelStatusChange = () => {
    setShowStatusConfirm(false);
    setPendingStatusChange(null);
  };


  // 주문 상태 변경 이벤트 감지 (다른 페이지에서 상태 변경 시 자동 새로고침)
  useEffect(() => {
    const handleOrderStatusChanged = (event: CustomEvent) => {
      const { orderId, status, updatedOrder } = event.detail;
      console.log(`다른 페이지에서 주문 ${orderId} 상태가 ${status}로 변경됨. 데이터 새로고침 중...`);
      
      // 로컬 상태 업데이트
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status } : order
        )
      );
    };

    window.addEventListener('orderStatusChanged', handleOrderStatusChanged as EventListener);
    
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChanged as EventListener);
    };
  }, []);

  const filteredOrdersByPeriod = filterOrdersByPeriod(orders, selectedPeriod, selectedDate);
  const filteredOrdersByStatus = selectedStatus === 'all'
    ? filteredOrdersByPeriod
    : filteredOrdersByPeriod.filter(order => order.status === selectedStatus);
  
  // 검색 기능 적용
  const filteredOrders = filteredOrdersByStatus.filter(order => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      order.depositor_name?.toLowerCase().includes(searchLower) ||
      order.delivery_address?.toLowerCase().includes(searchLower) ||
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.customer_phone?.includes(searchTerm) ||
      order.stores?.name?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case '입금대기': return 'bg-yellow-100 text-yellow-800';
      case '입금확인': return 'bg-blue-100 text-blue-800';
      case '배달완료': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getShortOrderId = (orderId: string) => {
    return orderId.substring(0, 8) + '...';
  };

  // 주문 번호를 최신 주문이 큰 숫자가 되도록 만드는 함수
  const getOrderNumber = (order: Order, allOrders: Order[]) => {
    // 한국 표준시간 기준으로 주문 날짜 계산
    const orderDateObj = new Date(order.created_at);
    const koreaOrderDate = new Date(orderDateObj.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
    const orderDate = koreaOrderDate.toISOString().split('T')[0];
    const sameDayOrders = allOrders.filter(o => {
      const oDateObj = new Date(o.created_at);
      const koreaODate = new Date(oDateObj.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
      return koreaODate.toISOString().split('T')[0] === orderDate;
    });
    const orderIndex = sameDayOrders.findIndex(o => o.id === order.id);
    return sameDayOrders.length - orderIndex; // 최신 주문이 큰 숫자가 되도록
  };

  const parseDeliveryTime = (deliveryTime?: string) => {
    if (!deliveryTime) return null;
    
    try {
      const timeMatch = deliveryTime.match(/(점심|저녁)배송/);
      if (timeMatch) {
        return timeMatch[1] + '배송';
      }
      return '배송시간 정보 없음';
    } catch {
      return '배송시간 정보 없음';
    }
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, selectedPeriod, selectedDate, searchTerm]);

  // 인쇄 기능
  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>전체 주문 내역</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .store-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .period { font-size: 16px; color: #666; margin-bottom: 20px; }
            .order-card { border: 1px solid #ddd; margin-bottom: 20px; padding: 15px; border-radius: 8px; }
            .order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .order-number { font-weight: bold; font-size: 18px; }
            .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .status-입금대기 { background: #fef3c7; color: #92400e; }
            .status-입금확인 { background: #dbeafe; color: #1e40af; }
            .status-배달완료 { background: #d1fae5; color: #065f46; }
            .status-주문취소 { background: #fee2e2; color: #991b1b; }
            .order-type { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .order-type-delivery { background: #dbeafe; color: #1e40af; }
            .order-type-pickup { background: #d1fae5; color: #065f46; }
            .order-details { margin: 10px 0; }
            .order-details div { margin: 5px 0; font-size: 14px; }
            .order-items { margin: 10px 0; }
            .order-item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; font-size: 16px; text-align: right; margin-top: 10px; }
            .print-date { text-align: right; color: #666; font-size: 12px; margin-top: 20px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">전체 주문 내역</div>
            <div class="period">
              ${selectedPeriod === 'today' ? '오늘' : 
                selectedPeriod === 'yesterday' ? '어제' : 
                selectedPeriod === 'custom' ? selectedDate : '오늘'} 
              ${selectedStatus !== 'all' ? `- ${selectedStatus}` : ''}
            </div>
          </div>
          
          ${currentOrders.map(order => {
            const { date, time } = {
              date: new Date(order.created_at).toLocaleDateString('ko-KR'),
              time: new Date(order.created_at).toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            };
            
            return `
              <div class="order-card">
                <div class="order-header">
                  <div class="order-number">주문번호: ${getOrderNumber(order, orders)}</div>
                  <div>
                    <span class="status status-${order.status}">${order.status}</span>
                    <span class="order-type order-type-${order.order_type}">${order.order_type === 'delivery' ? '배달' : '픽업'}</span>
                  </div>
                </div>
                
                <div class="order-details">
                  <div>주문일시: ${date} ${time}</div>
                  <div>매장: ${order.stores?.name || '알 수 없는 매장'}</div>
                  ${order.delivery_address ? `<div>배달주소: ${order.delivery_address}</div>` : ''}
                  ${order.delivery_time ? `<div>배달시간: ${order.delivery_time}</div>` : ''}
                  ${order.pickup_time ? `<div>픽업시간: ${order.pickup_time}</div>` : ''}
                  ${order.depositor_name ? `<div>입금자명: ${order.depositor_name}</div>` : ''}
                  ${order.customer_name ? `<div>고객명: ${order.customer_name}</div>` : ''}
                  ${order.customer_phone ? `<div>연락처: ${order.customer_phone}</div>` : ''}
                  ${order.special_requests ? `<div>요청사항: ${order.special_requests}</div>` : ''}
                </div>
                
                <div class="order-items">
                  ${order.order_items?.map(item => `
                    <div class="order-item">
                      <span>${item.menus.name} x ${item.quantity}</span>
                      <span>${(item.price * item.quantity).toLocaleString()}원</span>
                    </div>
                  `).join('') || '<div>주문 상품 정보 없음</div>'}
                </div>
                
                <div class="total">총 결제 금액: ${order.total.toLocaleString()}원</div>
              </div>
            `;
          }).join('')}
          
          <div class="print-date">
            인쇄일시: ${new Date().toLocaleString('ko-KR')}
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // 인쇄 후 뒤로가기 버튼 추가
      printWindow.addEventListener('afterprint', () => {
        const backButton = printWindow.document.createElement('div');
        backButton.innerHTML = `
          <div style="position: fixed; top: 20px; right: 20px; z-index: 1000;">
            <button onclick="window.close()" style="
              background: #f97316; 
              color: white; 
              border: none; 
              padding: 10px 20px; 
              border-radius: 8px; 
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">
              <i class="ri-arrow-left-line" style="margin-right: 5px;"></i>
              뒤로가기
            </button>
          </div>
        `;
        printWindow.document.body.appendChild(backButton);
      });
      
      printWindow.print();
    }
  };

  // 기간 제목 생성
  const getPeriodTitle = (period: string) => {
    switch (period) {
      case 'today': return '오늘';
      case 'yesterday': return '어제';
      case 'custom': return selectedDate ? selectedDate : '날짜 선택';
      default: return '오늘';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">주문 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h2 className="text-lg lg:text-2xl font-bold text-gray-800">전체 주문 관리</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md flex items-center whitespace-nowrap cursor-pointer text-sm"
            title="주문내역 인쇄"
          >
            <i className="ri-printer-line mr-1.5 text-xs"></i>
            인쇄
          </button>
          <div className="text-xs lg:text-sm text-gray-600">
            총 {orders.length}건의 주문
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
              placeholder="입금자명, 배달주소, 고객명, 전화번호, 매장명으로 검색..."
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
          
          <div className="space-y-4">
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
                value={selectedDate}
                onChange={(e) => handleDateSelect(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all duration-200 hover:bg-gray-100"
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

              <div className="flex gap-1 flex-1">
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
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                      selectedStatus === status.key
                        ? 'bg-gray-800 text-white'
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 주문 현황 */}
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl p-3 text-white w-fit">
        <div className="flex items-center gap-2">
          <i className="ri-shopping-cart-line text-lg"></i>
          <div>
            <h3 className="text-sm font-bold">
              {getPeriodTitle(selectedPeriod)} 주문 현황
            </h3>
            <p className="text-orange-100 font-medium text-xs">
              {selectedStatus === 'all' 
                ? `총 ${filteredOrders.length}개의 주문이 들어왔습니다`
                : `${selectedStatus} ${filteredOrders.length}개`
              }
            </p>
          </div>
        </div>
      </div>

      {/* 주문 목록 */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg p-6 lg:p-8 shadow-sm">
            <div className="text-center text-gray-500">
              <i className="ri-shopping-cart-line text-3xl lg:text-4xl mb-3 lg:mb-4"></i>
              <p className="text-sm lg:text-base">선택한 조건에 해당하는 주문이 없습니다.</p>
            </div>
          </div>
        ) : (
          currentOrders.map((order) => {
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
                      <h3 className="font-semibold text-gray-800">주문번호: {getOrderNumber(order, filteredOrders)}</h3>
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
                      <div>매장: {order.stores?.name || '알 수 없는 매장'}</div>
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
                              className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer shadow-md hover:shadow-lg transition-all duration-200"
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
                      
                      {/* 배달완료 상태일 때 */}
                      {order.status === '배달완료' && (
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
                      
                      {/* 주문취소 상태일 때 */}
                      {order.status === '주문취소' && (
                        <button
                          onClick={() => handleStatusChange(order.id, '입금대기')}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer"
                        >
                          입금대기로
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

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 상태 변경 확인 모달 */}
      {showStatusConfirm && pendingStatusChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-question-line text-2xl text-orange-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">주문 상태 변경</h3>
              <p className="text-gray-600 mb-4">
                주문 #{pendingStatusChange.orderNumber}의 상태를 <span className="font-semibold text-orange-600">{pendingStatusChange.newStatus}</span>로 변경하시겠습니까?
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <p className="text-blue-800 text-sm flex items-center gap-2">
                  <i className="ri-information-line"></i>
                  고객 주문조회 페이지에 실시간으로 반영됩니다
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelStatusChange}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={confirmStatusChange}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
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
