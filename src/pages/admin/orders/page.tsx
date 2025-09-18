import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNewAuth } from '../../../hooks/useNewAuth';
import { getStoreOrders } from '../../../lib/orderApi';
import { getStores } from '../../../lib/storeApi';
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
  delivery_fee: number;
  total: number;
  delivery_area_id?: string;
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
  daily_menu_orders?: Array<{
    id: string;
    daily_menu_id: string;
    menu_id: string;
    quantity: number;
    daily_menus: {
      id: string;
      menu_date: string;
      title: string;
    };
    menus: {
      id: string;
      name: string;
      price: number;
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
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'yesterday' | 'tomorrow' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState('');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 7;

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

  // 드롭다운 외부 클릭 시 닫기
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
      console.log('🔍 로드된 주문 데이터:', ordersData);
      console.log('📊 주문 수:', ordersData.length);
      
      // 각 주문의 메뉴 정보 확인
      ordersData.forEach((order, index) => {
        console.log(`주문 ${index + 1}:`, {
          id: order.id,
          order_items: order.order_items?.length || 0,
          daily_menu_orders: order.daily_menu_orders?.length || 0,
          subtotal: order.subtotal,
          total: order.total
        });
      });
      
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

  const handlePeriodSelect = (period: 'today' | 'yesterday' | 'tomorrow' | 'custom') => {
    setSelectedPeriod(period);
    setCurrentPage(1); // 페이지 리셋
    if (period !== 'custom') {
      setSelectedDate('');
    } else {
      // 커스텀 날짜 선택 시 오늘 날짜를 기본값으로 설정
      const now = new Date();
      const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
      const today = new Date(koreaTime.getFullYear(), koreaTime.getMonth(), koreaTime.getDate());
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const todayString = `${year}-${month}-${day}`;
      setSelectedDate(todayString);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setCurrentPage(1); // 페이지 리셋
    if (date) {
      setSelectedPeriod('custom');
    }
  };

  const filterOrdersByPeriod = (orders: Order[]) => {
    // 한국 시간 기준으로 오늘 날짜 계산
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
    const today = new Date(koreaTime.getFullYear(), koreaTime.getMonth(), koreaTime.getDate());
    
    const formatDateForComparison = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const getTargetDate = () => {
      switch (selectedPeriod) {
        case 'today':
          return formatDateForComparison(today);
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          return formatDateForComparison(yesterday);
        case 'tomorrow':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return formatDateForComparison(tomorrow);
        case 'custom':
          return selectedDate || formatDateForComparison(today);
        default:
          return formatDateForComparison(today);
      }
    };

    const targetDate = getTargetDate();
    
    return orders.filter(order => {
      // 일일 메뉴 주문인 경우 일일 메뉴 날짜로 필터링
      if (order.daily_menu_orders && order.daily_menu_orders.length > 0) {
        return order.daily_menu_orders.some(dailyOrder => 
          dailyOrder.daily_menus.menu_date === targetDate
        );
      }
      
      // 일반 주문인 경우 주문 생성 시간으로 필터링 (한국 시간 기준)
      const orderDate = new Date(order.created_at);
      const orderDateStr = formatDateForComparison(orderDate);
      return orderDateStr === targetDate;
    });
  };

  const getPeriodTitle = (period: string) => {
    switch (period) {
      case 'today': return '오늘';
      case 'yesterday': return '어제';
      case 'tomorrow': return '내일';
      case 'custom': return selectedDate ? new Date(selectedDate).toLocaleDateString('ko-KR') : '날짜 선택';
      default: return '오늘';
    }
  };

  // 일일 메뉴 주문이 있는 경우 실제 일일 메뉴 날짜를 기준으로 제목 생성
  const getActualPeriodTitle = () => {
    console.log('getActualPeriodTitle 호출됨', {
      finalFilteredOrdersLength: finalFilteredOrders.length,
      selectedPeriod
    });

    if (finalFilteredOrders.length === 0) {
      return getPeriodTitle(selectedPeriod);
    }

    // 일일 메뉴 주문이 있는지 확인
    const hasDailyMenuOrders = finalFilteredOrders.some(order => 
      order.daily_menu_orders && order.daily_menu_orders.length > 0
    );

    console.log('일일 메뉴 주문 확인', { hasDailyMenuOrders });

    if (hasDailyMenuOrders) {
      // 일일 메뉴 주문의 날짜들을 수집
      const menuDates = new Set();
      finalFilteredOrders.forEach(order => {
        if (order.daily_menu_orders) {
          order.daily_menu_orders.forEach(dailyOrder => {
            console.log('일일 메뉴 날짜:', dailyOrder.daily_menus.menu_date);
            menuDates.add(dailyOrder.daily_menus.menu_date);
          });
        }
      });

      // 가장 많은 주문이 있는 날짜를 찾거나, 첫 번째 날짜 사용
      const dates = Array.from(menuDates) as string[];
      console.log('수집된 날짜들:', dates);
      
      if (dates.length > 0) {
        const targetDate = dates[0];
        // YYYY-MM-DD 형식을 한국 시간으로 올바르게 파싱
        const [year, month, day] = targetDate.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month는 0부터 시작
        const result = date.toLocaleDateString('ko-KR');
        console.log('최종 결과:', result);
        return result;
      }
    }

    const fallback = getPeriodTitle(selectedPeriod);
    console.log('fallback 사용:', fallback);
    return fallback;
  };

  // 필터링 로직을 다시 계산
  const filteredOrdersByPeriod = React.useMemo(() => {
    return filterOrdersByPeriod(orders);
  }, [orders, selectedPeriod, selectedDate]);
  
  const finalFilteredOrders = React.useMemo(() => {
    return filteredOrdersByPeriod.filter(order => {
      const matchesSearch = searchTerm === '' || 
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone?.includes(searchTerm) ||
        order.delivery_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.depositor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [filteredOrdersByPeriod, searchTerm]);

  // 입금대기 주문 수 계산
  const unreadOrdersCount = React.useMemo(() => {
    return finalFilteredOrders.filter(order =>
      order.status === '입금대기'
    ).length;
  }, [finalFilteredOrders]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(finalFilteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = finalFilteredOrders.slice(startIndex, endIndex);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod, selectedDate, searchTerm]);

  // 프린트 기능
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const periodTitle = selectedPeriod === 'today' ? '오늘' : 
                       selectedPeriod === 'yesterday' ? '어제' : 
                       selectedPeriod === 'custom' ? (selectedDate ? new Date(selectedDate).toLocaleDateString('ko-KR') : '날짜 선택') : '오늘';

    const statusTitle = '전체';
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>주문내역 - ${periodTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f97316; padding-bottom: 20px; }
            .header h1 { color: #f97316; margin: 0; font-size: 24px; }
            .header p { color: #666; margin: 5px 0; }
            .order-card { border: 1px solid #ddd; margin-bottom: 20px; padding: 15px; border-radius: 8px; }
            .order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
            .order-number { font-weight: bold; font-size: 16px; }
            .order-status { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .status-입금대기 { background: #fef3c7; color: #92400e; }
            .status-입금확인 { background: #dbeafe; color: #1e40af; }
            .status-배달완료 { background: #d1fae5; color: #065f46; }
            .status-주문취소 { background: #fee2e2; color: #991b1b; }
            .order-info { margin: 10px 0; }
            .order-info div { margin: 5px 0; }
            .order-items { margin: 10px 0; }
            .order-item { display: flex; justify-content: space-between; margin: 5px 0; }
            .order-total { font-weight: bold; font-size: 16px; color: #f97316; margin-top: 10px; }
            .order-actions { margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee; }
            .action-buttons { display: flex; gap: 10px; }
            .btn { padding: 8px 16px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .btn-blue { background: #3b82f6; color: white; }
            .btn-yellow { background: #eab308; color: white; }
            .btn-green { background: #10b981; color: white; }
            .btn-red { background: #ef4444; color: white; }
            .print-date { text-align: right; color: #666; font-size: 12px; margin-top: 20px; }
            @media print {
              body { margin: 0; }
              .order-card { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${storeName} 주문내역</h1>
            <p>기간: ${periodTitle} | 상태: ${statusTitle}</p>
            <p>총 ${finalFilteredOrders.length}건의 주문</p>
          </div>
          
          ${finalFilteredOrders.map((order, index) => {
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
                  <div class="order-number">주문번호: ${index + 1}</div>
                  <div class="order-status status-${order.status}">${order.status}</div>
                </div>
                
                <div class="order-info">
                  <div><strong>주문일시:</strong> ${date} ${time}</div>
                  <div><strong>고객명:</strong> ${order.customer_name || '-'}</div>
                  <div><strong>연락처:</strong> ${order.customer_phone || '-'}</div>
                  ${order.depositor_name ? `<div><strong>입금자명:</strong> ${order.depositor_name}</div>` : ''}
                  ${order.delivery_address ? `<div><strong>배달주소:</strong> ${order.delivery_address}</div>` : ''}
                  ${order.delivery_time ? `<div><strong>배달시간:</strong> ${order.delivery_time}</div>` : ''}
                  ${order.pickup_time ? `<div><strong>픽업시간:</strong> ${order.pickup_time}</div>` : ''}
                  ${order.special_requests ? `<div><strong>요청사항:</strong> ${order.special_requests}</div>` : ''}
                </div>
                
                ${order.daily_menu_orders && order.daily_menu_orders.length > 0 ? `
                  <div class="order-items">
                    <strong>일일 메뉴 주문:</strong>
                    ${order.daily_menu_orders.map(item => `
                      <div class="order-item">
                        <span>${item.menus?.name || '메뉴'} x ${item.quantity} (${item.daily_menus.menu_date} 일일메뉴)</span>
                        <span>${((item.menus?.price || 0) * (item.quantity || 0)).toLocaleString()}원</span>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                
                <div class="order-summary">
                  <div>상품 금액: ${(order.subtotal || 0).toLocaleString()}원</div>
                  ${order.order_type === 'delivery' && (order.delivery_fee || 0) > 0 ? 
                    `<div>배달비: ${(order.delivery_fee || 0).toLocaleString()}원</div>` : ''}
                  <div class="order-total">총 주문금액: ${(order.total || 0).toLocaleString()}원</div>
                </div>
              </div>
            `;
          }).join('')}
          
          <div class="print-date">
            인쇄일시: ${new Date().toLocaleString('ko-KR')}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
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
  };

  const getOrderNumber = (order: Order, allOrders: Order[]) => {
    const sortedOrders = [...allOrders].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const index = sortedOrders.findIndex(o => o.id === order.id);
    return index + 1;
  };

  const formatKoreanCurrency = (amount: number) => {
    if (amount >= 100000000) {
      const 억 = Math.floor(amount / 100000000);
      const 만 = Math.floor((amount % 100000000) / 10000);
      if (만 === 0) {
        return `${억}억원`;
      }
      return `${억}억 ${만}만원`;
    } else if (amount >= 10000) {
      const 만 = Math.floor(amount / 10000);
      const 천 = Math.floor((amount % 10000) / 1000);
      if (천 === 0) {
        return `${만}만원`;
      }
      return `${만}만 ${천}천원`;
    } else if (amount >= 1000) {
      const 천 = Math.floor(amount / 1000);
      const 나머지 = amount % 1000;
      if (나머지 === 0) {
        return `${천}천원`;
      }
      return `${천}천 ${나머지}원`;
    } else {
      return `${amount}원`;
    }
  };

  const formatOrderToText = (order: Order) => {
    const orderDate = new Date(order.created_at);
    const formattedDate = orderDate.toLocaleDateString('ko-KR');
    const formattedTime = orderDate.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let orderText = `===== 주문상세내역 =====\n\n`;
    orderText += `📋 주문번호: ${getOrderNumber(order, finalFilteredOrders)}\n`;
    orderText += `📅 주문일시: ${formattedDate} ${formattedTime}\n`;
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

    if (order.daily_menu_orders && order.daily_menu_orders.length > 0) {
      order.daily_menu_orders.forEach((item) => {
        const itemTotal = (item.menus?.price || 0) * item.quantity;
        orderText += `• ${item.menus?.name || '메뉴'} x ${item.quantity}개\n`;
        orderText += `  - 단가: ${(item.menus?.price || 0).toLocaleString()}원\n`;
        orderText += `  - 소계: ${itemTotal.toLocaleString()}원\n`;
        orderText += `  - 날짜: ${item.daily_menus.menu_date} (일일메뉴)\n\n`;
      });
    } else if (order.order_items && order.order_items.length > 0) {
      order.order_items.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        orderText += `• ${item.menus?.name || '메뉴'} x ${item.quantity}개\n`;
        orderText += `  - 단가: ${item.price.toLocaleString()}원\n`;
        orderText += `  - 소계: ${itemTotal.toLocaleString()}원\n\n`;
      });
    } else {
      orderText += `주문 메뉴 정보를 불러올 수 없습니다.\n\n`;
    }

    orderText += `===== 결제정보 =====\n`;
    orderText += `💵 상품금액: ${(order.subtotal || 0).toLocaleString()}원\n`;
    if (order.order_type === 'delivery') {
      const deliveryFee = order.delivery_fee || (order.total - order.subtotal) || 0;
      orderText += `🚛 배달비: ${deliveryFee.toLocaleString()}원\n`;
    }
    orderText += `💰 총 결제금액: ${(order.total || 0).toLocaleString()}원\n\n`;

    orderText += `===== 매장정보 =====\n`;
    orderText += `🏪 매장명: ${storeName}\n`;
    orderText += `📄 생성일시: ${new Date().toLocaleString('ko-KR')}\n`;

    return orderText;
  };

  const copyOrderToClipboard = async (order: Order, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      const orderText = formatOrderToText(order);
      await navigator.clipboard.writeText(orderText);

      alert('주문상세내역이 클립보드에 복사되었습니다!');
    } catch (error) {
      console.error('복사 실패:', error);
      alert('복사에 실패했습니다. 다시 시도해주세요.');
    }
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
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex flex-col">
        {/* 헤더 */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate('/admin-dashboard')}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="뒤로가기"
                >
                  <i className="ri-arrow-left-line text-xl text-gray-600"></i>
                </button>
                <h1 className="text-lg font-semibold text-gray-800">주문내역</h1>
              </div>
            </div>
          </div>
        </div>

      <div className="p-4 flex-1">

        {/* 통합 검색, 필터, 주문 현황 카드 */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl mb-8 overflow-hidden">
          {/* 1. 상단 - 주문 현황 */}
          <div className="p-4 sm:p-6 border-b-2 border-gray-200">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <i className="ri-shopping-cart-line text-orange-500 text-lg sm:text-xl"></i>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    {getActualPeriodTitle()}
                  </p>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                    주문 현황
                  </h3>
                </div>
              </div>
              
              {/* 세로로 깔끔하게 배치된 통계 정보 */}
              <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4 space-y-3 shadow-md">
                <div className="flex justify-between items-center">
                  <span className="text-gray-800 text-sm font-bold">주문 건수</span>
                  <span className="font-bold text-gray-900 text-xl">{finalFilteredOrders.length}건</span>
                </div>
                {unreadOrdersCount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-red-600 text-sm font-bold">입금대기</span>
                    <span className="font-bold text-red-600 text-xl animate-pulse">{unreadOrdersCount}건</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300">
                  <span className="text-gray-800 text-sm font-bold">총 결제금액</span>
                  <span className="font-bold text-orange-600 text-xl">
                    {formatKoreanCurrency(finalFilteredOrders.reduce((sum, order) => sum + (order.total || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 중단 - 필터 영역 */}
          <div className="p-4 sm:p-6 border-b-2 border-gray-200 bg-gray-50">
            <div className="space-y-4">
              {/* 기간 필터 - 모바일 최적화 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <i className="ri-calendar-line text-gray-600 text-lg"></i>
                  <span className="text-sm font-bold text-gray-800">기간 선택</span>
                </div>
                
                <div className="relative period-dropdown-container">
                  <button
                    onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 cursor-pointer transition-all duration-200 hover:border-orange-400 hover:shadow-lg flex items-center justify-between"
                  >
                    <span>
                      {selectedPeriod === 'today' ? '오늘' :
                       selectedPeriod === 'yesterday' ? '어제' :
                       selectedPeriod === 'tomorrow' ? '내일' :
                       selectedPeriod === 'custom' ? '날짜 선택' : '오늘'}
                    </span>
                    <i className={`ri-arrow-down-s-line text-gray-400 text-sm transition-transform duration-200 ${showPeriodDropdown ? 'rotate-180' : ''}`}></i>
                  </button>
                  
                  {showPeriodDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-400 rounded-xl shadow-xl z-20 overflow-hidden">
                      <button
                        onClick={() => {
                          handlePeriodSelect('today');
                          setShowPeriodDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm font-semibold transition-colors duration-200 hover:bg-gray-50 ${
                          selectedPeriod === 'today' ? 'bg-orange-50 text-orange-600' : 'text-gray-800'
                        }`}
                      >
                        오늘
                      </button>
                      <button
                        onClick={() => {
                          handlePeriodSelect('yesterday');
                          setShowPeriodDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm font-semibold transition-colors duration-200 hover:bg-gray-50 ${
                          selectedPeriod === 'yesterday' ? 'bg-orange-50 text-orange-600' : 'text-gray-800'
                        }`}
                      >
                        어제
                      </button>
                      <button
                        onClick={() => {
                          handlePeriodSelect('tomorrow');
                          setShowPeriodDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm font-semibold transition-colors duration-200 hover:bg-gray-50 ${
                          selectedPeriod === 'tomorrow' ? 'bg-orange-50 text-orange-600' : 'text-gray-800'
                        }`}
                      >
                        내일
                      </button>
                      <button
                        onClick={() => {
                          handlePeriodSelect('custom');
                          setShowPeriodDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm font-semibold transition-colors duration-200 hover:bg-gray-50 ${
                          selectedPeriod === 'custom' ? 'bg-orange-50 text-orange-600' : 'text-gray-800'
                        }`}
                      >
                        날짜 선택
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 커스텀 날짜 선택 - 모바일 최적화 */}
              {selectedPeriod === 'custom' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <i className="ri-calendar-check-line text-gray-600 text-lg"></i>
                    <span className="text-sm font-bold text-gray-800">날짜 선택</span>
                  </div>
                  
                  <input
                    type="date"
                    value={selectedDate || ''}
                    onChange={(e) => handleDateSelect(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 hover:border-gray-400"
                    placeholder="날짜를 선택하세요"
                  />
                </div>
              )}
            </div>


            {/* 선택된 필터 칩 요약 */}
            {selectedPeriod !== 'today' && (
              <div className="pt-4 border-t-2 border-gray-300">
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    <i className="ri-calendar-line text-xs"></i>
                    <span>
                      {selectedPeriod === 'yesterday' ? '어제' :
                       selectedPeriod === 'tomorrow' ? '내일' :
                       selectedPeriod === 'custom' ? '날짜 선택' : '오늘'}
                    </span>
                    <button
                      onClick={() => handlePeriodSelect('today')}
                      className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                    >
                      <i className="ri-close-line text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. 하단 - 검색 영역 */}
          <div className="p-4 sm:p-6 bg-white">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <i className="ri-search-line text-gray-500 text-base"></i>
                  <span>검색</span>
                </label>
                <input
                  type="text"
                  placeholder="입금자명, 배달주소, 고객명 등으로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-gray-400 transition-colors shadow-sm"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-md border-2 border-blue-600"
                >
                  <i className="ri-printer-line text-sm"></i>
                  <span>인쇄</span>
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* 주문 상세 목록 */}
        <div className="space-y-6">
          {ordersLoading ? (
            <div className="bg-white rounded-2xl p-12 shadow-xl border-2 border-gray-300">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-6"></div>
                <p className="text-lg text-gray-600 font-medium">주문 데이터를 불러오는 중...</p>
              </div>
            </div>
          ) : finalFilteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-xl border-2 border-gray-300">
              <div className="text-center text-gray-500">
                <i className="ri-shopping-cart-line text-6xl mb-6"></i>
                <p className="text-xl font-medium">선택한 조건에 해당하는 주문이 없습니다.</p>
              </div>
            </div>
          ) : (
            currentOrders.map((order) => {
              
              return (
                <div 
                  key={order.id} 
                  className="bg-white rounded-2xl border-2 border-gray-300 shadow-lg hover:shadow-xl hover:border-orange-400 transition-all duration-300 cursor-pointer group mb-4"
                  onClick={() => navigate(`/admin/${storeId}/order-detail/${order.id}`)}
                >
                  <div className="p-4">
                    {/* 1. 모바일 최적화된 헤더 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">주문 #{getOrderNumber(order, finalFilteredOrders)}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`px-2 py-1 rounded-full text-xs font-bold shadow-sm ${
                            order.status === '입금대기' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                            order.status === '입금확인' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                            order.status === '배달완료' ? 'bg-green-100 text-green-800 border border-green-200' :
                            order.status === '주문취소' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}>
                            {order.status}
                          </div>
                        </div>
                      </div>
                      
                      {/* 버튼 그룹 - 모바일 최적화 */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => copyOrderToClipboard(order, e)}
                          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1 shadow-sm"
                          title="주문상세내역 복사"
                        >
                          <i className="ri-file-copy-line text-xs"></i>
                          <span>복사</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/${storeId}/order-detail/${order.id}`);
                          }}
                          className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1 shadow-sm"
                        >
                          <i className="ri-eye-line text-xs"></i>
                          <span>상세보기</span>
                        </button>
                      </div>
                    </div>

                    {/* 2. 고객 정보 미리보기 - 모바일 최적화 */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl border-2 border-gray-200">
                      <div className="space-y-2 text-sm text-gray-700">
                        {/* 무통장입금일 때는 입금자명, 제로페이일 때는 고객명 표시 */}
                        {(order.payment_method === 'bank_transfer' ? order.depositor_name : order.customer_name) && (
                          <div className="flex items-center gap-2">
                            <i className="ri-user-line text-sm text-gray-500"></i>
                            <span className="font-bold text-gray-900">
                              {order.payment_method === 'bank_transfer' ? order.depositor_name : order.customer_name}
                            </span>
                          </div>
                        )}
                        {order.delivery_address && (
                          <div className="flex items-start gap-2">
                            <i className="ri-map-pin-line text-sm text-gray-500 mt-0.5 flex-shrink-0"></i>
                            <span className="font-semibold text-gray-800 break-words leading-relaxed">{order.delivery_address}</span>
                          </div>
                        )}
                        {/* 결제 방식 표시 */}
                        <div className="flex items-center gap-2">
                          <i className="ri-bank-card-line text-sm text-gray-500"></i>
                          <span className="font-semibold text-gray-800">
                            {order.payment_method === 'bank_transfer' ? '무통장입금' : '제로페이'}
                          </span>
                        </div>
                        {/* 배달/픽업 정보 표시 */}
                        <div className="flex items-center gap-2">
                          <i className={`${order.order_type === 'delivery' ? 'ri-truck-line' : 'ri-walk-line'} text-sm text-gray-500`}></i>
                          <span className="font-semibold text-gray-800">
                            {order.order_type === 'delivery' ? '배달' : '픽업'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3. 주문 상품과 결제 금액 - 모바일 최적화 */}
                    <div className="bg-gray-50 rounded-xl p-3 mb-4 border-2 border-gray-200">
                      <div className="space-y-3">
                        {/* 상품 정보 - 모바일 최적화 */}
                        <div className="space-y-2">
                          {/* 일일 메뉴 주문만 표시 */}
                          {order.daily_menu_orders && order.daily_menu_orders.length > 0 && order.daily_menu_orders.map((item, index) => (
                            <div key={`daily-${index}`} className="flex justify-between items-center py-1">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="font-bold text-gray-900 text-sm truncate">{item.menus?.name || '메뉴'}</span>
                                <span className="text-xs text-gray-600 flex-shrink-0 font-medium">({item.quantity}개)</span>
                              </div>
                              <span className="font-bold text-gray-900 text-sm ml-2">{((item.menus?.price || 0) * (item.quantity || 0)).toLocaleString()}원</span>
                            </div>
                          ))}
                          
                          {/* 일일 메뉴가 없는 경우에만 일반 주문 메뉴 표시 */}
                          {(!order.daily_menu_orders || order.daily_menu_orders.length === 0) && order.order_items && order.order_items.length > 0 && order.order_items.map((item, index) => (
                            <div key={`order-${index}`} className="flex justify-between items-center py-1">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="font-bold text-gray-900 text-sm truncate">{item.menus?.name || '메뉴'}</span>
                                <span className="text-xs text-gray-600 flex-shrink-0 font-medium">({item.quantity}개)</span>
                              </div>
                              <span className="font-bold text-gray-900 text-sm ml-2">{(item.price * item.quantity).toLocaleString()}원</span>
                            </div>
                          ))}
                          
                          {/* 메뉴가 없는 경우 */}
                          {(!order.daily_menu_orders || order.daily_menu_orders.length === 0) && 
                           (!order.order_items || order.order_items.length === 0) && (
                            <div className="text-center py-3 text-gray-500 text-xs">
                              <i className="ri-shopping-cart-line text-xl mb-1 block"></i>
                              <p>주문 메뉴 정보를 불러올 수 없습니다</p>
                            </div>
                          )}
                        </div>
                        
                        {/* 주문 요약 - 모바일 최적화 */}
                        <div className="space-y-2 pt-2 border-t-2 border-gray-400">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 text-sm font-semibold">상품 금액</span>
                            <span className="text-gray-900 text-sm font-bold">{(order.subtotal || 0).toLocaleString()}원</span>
                          </div>
                          {order.order_type === 'delivery' && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700 text-sm font-semibold">배달비</span>
                              <span className="text-gray-900 text-sm font-bold">
                                {(order.delivery_fee || (order.total - order.subtotal) || 0).toLocaleString()}원
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t-2 border-gray-400">
                            <span className="font-bold text-gray-900 text-base">총 결제금액</span>
                            <span className="text-lg font-bold text-orange-600">
                              {formatKoreanCurrency(order.total || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 페이지네이션 - 모바일 최적화 */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-1 sm:gap-2">
              {/* 이전 페이지 버튼 */}
              {currentPage > 1 && (
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-colors bg-white text-gray-600 border-2 border-gray-400 hover:bg-gray-50 hover:border-gray-500 flex items-center justify-center shadow-sm"
                >
                  <i className="ri-arrow-left-s-line text-sm"></i>
                </button>
              )}
              
              {/* 페이지 번호들 - 모바일에서는 최대 5개만 표시 */}
              {(() => {
                const maxVisible = window.innerWidth < 640 ? 3 : 5; // 모바일에서는 3개, 데스크톱에서는 5개
                const start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                const end = Math.min(totalPages, start + maxVisible - 1);
                const adjustedStart = Math.max(1, end - maxVisible + 1);
                
                return Array.from({ length: end - adjustedStart + 1 }, (_, i) => adjustedStart + i).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm ${
                      currentPage === page
                        ? 'bg-orange-500 text-white border-2 border-orange-600'
                        : 'bg-white text-gray-600 border-2 border-gray-400 hover:bg-gray-50 hover:border-gray-500'
                    }`}
                  >
                    {page}
                  </button>
                ));
              })()}
              
              {/* 다음 페이지 버튼 */}
              {currentPage < totalPages && (
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-colors bg-white text-gray-600 border-2 border-gray-400 hover:bg-gray-50 hover:border-gray-500 flex items-center justify-center shadow-sm"
                >
                  <i className="ri-arrow-right-s-line text-sm"></i>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      </div>
    </div>
  );
}