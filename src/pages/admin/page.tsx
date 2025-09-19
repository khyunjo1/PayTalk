import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNewAuth } from '../../hooks/useNewAuth';
import { getUserStores } from '../../lib/database';
import { getStores } from '../../lib/storeApi';
import { getStoreOrders, updateOrderStatus } from '../../lib/orderApi';
import { getMenus, createMenu, updateMenu, deleteMenu } from '../../lib/menuApi';
import { supabase } from '../../lib/supabase';
import Footer from '../../components/Footer';

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
  status: '입금대기' | '입금확인' | '배달완료';
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

interface Menu {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

// Mock 데이터 제거 - 실제 데이터베이스에서 주문 데이터를 가져옴

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading } = useNewAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('입금대기');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState<boolean>(false);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'statistics' | 'menus' | 'store'>('orders');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(15);
  const [showStatusConfirm, setShowStatusConfirm] = useState<boolean>(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{orderId: string, orderNumber: number, newStatus: Order['status']} | null>(null);
  
  // 표준 카테고리 정의
  const STANDARD_CATEGORIES = [
    '메인요리',
    '국물류', 
    '김치류',
    '젓갈류',
    '나물류',
    '조림류',
    '특별반찬',
    '인기메뉴',
    '세트메뉴',
    '월식메뉴'
  ];

  // 메뉴 관련 상태
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>('메인요리');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    is_available: true
  });
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showStoreEditModal, setShowStoreEditModal] = useState(false);
  const [storeEditForm, setStoreEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    description: '',
    business_hours_start: '',
    business_hours_end: '',
    order_deadline_hour: '',
    order_deadline_minute: '',
    delivery_area: '',
    delivery_fee: 0
  });
  
  
  // URL에서 매장 정보 가져오기
  const { storeId } = useParams<{ storeId: string }>();
  const [storeName, setStoreName] = useState<string>('');
  
  // storeId가 없으면 admin-dashboard로 리다이렉트
  useEffect(() => {
    if (!storeId) {
      console.log('⚠️ storeId가 없어서 admin-dashboard로 리다이렉트');
      navigate('/admin-dashboard');
    }
  }, [storeId, navigate]);
  
  // 사용자의 매장 정보
  const [currentStore, setCurrentStore] = useState<any>(null);

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


  // 필터나 검색어 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, selectedPeriod, selectedDate, searchTerm]);

  // 주문 상태 변경 이벤트 감지 (다른 페이지에서 상태 변경 시 자동 새로고침)
  useEffect(() => {
    const handleOrderStatusChanged = (event: CustomEvent) => {
      const { orderId, status } = event.detail;
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

  // 메뉴 데이터 로드
  const loadMenus = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingMenus(true);
      
      // storeId가 있으면 해당 매장의 메뉴를, 없으면 사용자의 첫 번째 매장 메뉴를 로드
      let targetStoreId = storeId;
      
      if (!targetStoreId) {
        if (user.role === 'admin') {
          // admin 사용자의 경우 user_stores 테이블을 통해 소유한 매장을 가져오기
          const { data: userStores } = await supabase
            .from('user_stores')
            .select(`
              stores (
                id,
                name,
                category,
                delivery_area,
                phone,
                business_hours_start,
                business_hours_end,
                pickup_time_slots,
                delivery_time_slots,
                bank_account,
                account_holder
              )
            `)
            .eq('user_id', user.id)
            .eq('role', 'owner');
          
          if (userStores && userStores.length > 0) {
            targetStoreId = userStores[0].stores?.[0]?.id;
          } else {
            console.log('관리하는 매장이 없습니다.');
            setMenus([]);
            return;
          }
        } else if (user.role === 'super_admin') {
          // 슈퍼 어드민의 경우 모든 매장에서 첫 번째 매장 사용
          const allStores = await getStores();
          if (allStores.length > 0) {
            targetStoreId = allStores[0].id;
          } else {
            console.log('등록된 매장이 없습니다.');
            setMenus([]);
            return;
          }
        }
      }
      
      console.log('🎯 메뉴 로드 대상 매장 ID:', targetStoreId);
      if (targetStoreId) {
        const menusData = await getMenus(targetStoreId);
        console.log('📋 로드된 메뉴 데이터:', menusData);
        setMenus(menusData);
      } else {
        console.log('⚠️ 매장 ID가 없어서 메뉴를 로드할 수 없습니다.');
        setMenus([]);
      }
    } catch (error) {
      console.error('❌ 메뉴 데이터 로드 실패:', error);
    } finally {
      setLoadingMenus(false);
    }
  };

  // 메뉴 탭이 활성화될 때 메뉴 데이터 로드
  useEffect(() => {
    if (activeTab === 'menus' && user?.id) {
      loadMenus();
    }
  }, [activeTab, user?.id]);


  // currentStore 변경 시 로그 출력
  useEffect(() => {
    if (currentStore) {
      console.log('🏪 currentStore 업데이트:', currentStore);
      console.log('💰 최소주문금액:', currentStore.minimum_order_amount);
    }
  }, [currentStore]);

  // 매장 정보 로드 함수
  const loadStoreInfo = async () => {
    if (storeId) {
      try {
        console.log('🔍 매장 정보 로드 시도, storeId:', storeId);
        const { data: storeData, error } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .single();
        
        if (error) {
          console.error('❌ 매장 정보 로드 실패:', error);
          return;
        }
        
        if (storeData) {
          setCurrentStore(storeData);
          setStoreName(storeData.name); // 매장 이름 설정
          console.log('✅ 매장 정보 로드됨:', storeData);
        } else {
          console.log('⚠️ 매장 데이터 없음');
        }
      } catch (error) {
        console.error('❌ 매장 정보 로드 오류:', error);
      }
    } else {
      console.log('⚠️ storeId 없음');
    }
  };

  // URL의 storeId로 매장 정보 가져오기 (매장 관리 탭용)
  useEffect(() => {
    loadStoreInfo();
  }, [storeId]);

  // 매장 정보 수정 함수들
  const handleEditStore = () => {
    if (currentStore) {
      setStoreEditForm({
        name: currentStore.name || '',
        phone: currentStore.phone || '',
        address: currentStore.address || '',
        description: currentStore.description || '',
        business_hours_start: currentStore.business_hours_start || '',
        business_hours_end: currentStore.business_hours_end || '',
        order_deadline_hour: currentStore.order_deadline_hour || '',
        order_deadline_minute: currentStore.order_deadline_minute || '',
        delivery_area: currentStore.delivery_area || '',
        delivery_fee: currentStore.delivery_fee || 0
      });
      setShowStoreEditModal(true);
    }
  };

  const handleStoreEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;

    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: storeEditForm.name,
          phone: storeEditForm.phone,
          address: storeEditForm.address,
          description: storeEditForm.description,
          business_hours_start: storeEditForm.business_hours_start,
          business_hours_end: storeEditForm.business_hours_end,
          order_deadline_hour: storeEditForm.order_deadline_hour,
          order_deadline_minute: storeEditForm.order_deadline_minute,
          delivery_area: storeEditForm.delivery_area,
          delivery_fee: storeEditForm.delivery_fee,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId);

      if (error) throw error;

      // 매장 정보 다시 로드
      await loadStoreInfo();
      setShowStoreEditModal(false);
      alert('매장 정보가 수정되었습니다.');
    } catch (error) {
      console.error('매장 정보 수정 실패:', error);
      alert('매장 정보 수정에 실패했습니다.');
    }
  };

  // 주문 링크 복사 함수
  const copyOrderLink = async () => {
    console.log('🔗 주문 링크 복사 시도');
    console.log('🏪 URL storeId:', storeId);
    console.log('🏪 URL storeName:', storeName);
    
    // storeId가 없으면 리다이렉트되므로 여기서는 체크하지 않음
    if (!storeId) {
      console.error('❌ URL에 storeId가 없습니다');
      return;
    }
    
    try {
      const orderLink = `${window.location.origin}/menu/${storeId}`;
      console.log('🔗 복사할 링크:', orderLink);
      
      await navigator.clipboard.writeText(orderLink);
      setCopiedLink(true);
      
      // 2초 후 복사 상태 초기화
      setTimeout(() => {
        setCopiedLink(false);
      }, 2000);
      
      console.log('✅ 링크 복사 성공');
    } catch (error) {
      console.error('❌ 링크 복사 실패:', error);
      alert('링크 복사에 실패했습니다. 다시 시도해주세요.');
    }
  };

  useEffect(() => {
    // 로딩 중이면 대기
    if (loading) return;

    // 로그인하지 않은 사용자는 로그인 페이지로
    if (!user) {
      navigate('/admin-login');
      return;
    }

    // admin 또는 super_admin 권한이 없는 사용자는 매장 목록으로
    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      navigate('/stores');
      return;
    }
  }, [user, loading, navigate]);

  // 실제 주문 데이터 로드
  useEffect(() => {
    const loadOrders = async () => {
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return;

      try {
        setLoadingOrders(true);
        
        let allOrders: Order[] = [];
        
        // 슈퍼 어드민이 특정 매장을 선택한 경우
        if (user.role === 'super_admin' && storeId) {
          // 특정 매장의 주문만 가져오기
          allOrders = await getStoreOrders(storeId);
          console.log(`매장 ${storeName}의 주문:`, allOrders);
        } else {
          // 일반 admin 사용자 또는 슈퍼 어드민이 전체 보기를 원하는 경우
        console.log('🔍 getUserStores 호출, userId:', user.id);
        const userStores = await getUserStores(user.id);
        console.log('🏪 사용자 매장 목록:', userStores);

        if (userStores.length === 0) {
          console.log('관리하는 매장이 없습니다.');
          setOrders([]);
          return;
        }

        // 모든 매장의 주문 데이터 가져오기
        for (const store of userStores) {
          const storeOrders = await getStoreOrders(store.id);
          console.log(`매장 ${store.name}의 주문:`, storeOrders);
          allOrders.push(...storeOrders);
        }
        
        // 전체 주문을 최신순으로 정렬
        allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        // 첫 번째 매장을 현재 매장으로 설정
        if (userStores.length > 0) {
          console.log('🏪 현재 매장 설정:', userStores[0]);
          setCurrentStore(userStores[0]);
        }
        }

        // 주문 아이템 정보도 함께 가져오기
        const ordersWithItems = await Promise.all(
          allOrders.map(async (order) => {
            // 주문 아이템 정보 가져오기
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

        setOrders(ordersWithItems);
        console.log('로드된 주문 데이터:', ordersWithItems);
      } catch (error) {
        console.error('주문 데이터 로드 오류:', error);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [user, storeId, storeName]);

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    const order = orders.find(o => o.id === orderId);
    const orderNumber = order ? getOrderNumber(order, orders) : 0;
    console.log('주문 상태 변경 요청:', { orderId, orderNumber, newStatus });
    setPendingStatusChange({ orderId, orderNumber, newStatus });
    setShowStatusConfirm(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;

    try {
      const { orderId, newStatus } = pendingStatusChange;
      
      // updateOrderStatus API 사용 (알림톡 발송 포함)
      await updateOrderStatus(orderId, newStatus);

      // 로컬 상태 업데이트
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      console.log(`주문 ${orderId} 상태가 ${newStatus}로 변경되었습니다.`);
      
      // 성공 알림 (고객 주문 조회 페이지 반영 안내 포함)
      alert(`주문 상태가 ${newStatus}로 변경되었습니다.\n\n고객은 주문 조회 링크에서 실시간으로 상태를 확인할 수 있습니다.`);
    } catch (error) {
      console.error('주문 상태 변경 오류:', error);
      alert('주문 상태 변경에 실패했습니다.');
    } finally {
      setShowStatusConfirm(false);
      setPendingStatusChange(null);
    }
  };

  const cancelStatusChange = () => {
    setShowStatusConfirm(false);
    setPendingStatusChange(null);
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm('정말로 주문을 취소하시겠습니까?')) {
      setOrders(orders.filter(order => order.id !== orderId));
    }
  };

  const handleLogout = () => {
    // useNewAuth의 logout 함수 사용
    const { logout } = useNewAuth();
    logout();
    navigate('/admin-login');
  };

  const handleDateSelect = (date: string) => {
    console.log('날짜 선택됨:', date);
    if (date) {
      setSelectedDate(date);
      setSelectedPeriod('custom');
    } else {
      setSelectedDate('');
      setSelectedPeriod('today'); // 날짜가 없으면 오늘로 돌아감
    }
    setCurrentPage(1); // 페이지 리셋
    setShowDatePicker(false);
    setShowCalendar(false);
  };

  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
    setCurrentPage(1); // 페이지 리셋
    if (period !== 'custom') {
      setSelectedDate('');
    }
    setShowCalendar(false);
  };


  // 배달날짜 추출 함수
  const getDeliveryDate = (order: Order) => {
    if (order.delivery_time) {
      // "2024-01-20 점심배송 (11:00-13:00)" 형태에서 날짜 추출
      const dateMatch = order.delivery_time.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        return dateMatch[1];
      }
    }
    if (order.pickup_time) {
      // 픽업 시간에서도 날짜 추출 시도
      const dateMatch = order.pickup_time.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        return dateMatch[1];
      }
    }
    // 배달/픽업 시간이 없으면 주문 날짜 사용
    return new Date(order.created_at).toISOString().split('T')[0];
  };

  // 날짜 필터링 함수 (배달날짜 기준)
  const filterOrdersByPeriod = (orders: Order[], period: string, customDate?: string) => {
    // 한국 표준시간 기준으로 날짜 계산
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
    const today = new Date(koreaTime.getFullYear(), koreaTime.getMonth(), koreaTime.getDate());
    
    switch (period) {
      case 'today':
        return orders.filter(order => {
          const deliveryDate = getDeliveryDate(order);
          return deliveryDate === today.toISOString().split('T')[0];
        });
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDateString = yesterday.toISOString().split('T')[0];
        return orders.filter(order => {
          const deliveryDate = getDeliveryDate(order);
          return deliveryDate === yesterdayDateString;
        });
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // 이번 주 월요일
        const weekStartString = weekStart.toISOString().split('T')[0];
        return orders.filter(order => {
          const deliveryDate = getDeliveryDate(order);
          return deliveryDate >= weekStartString && deliveryDate <= today.toISOString().split('T')[0];
        });
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthStartString = monthStart.toISOString().split('T')[0];
        return orders.filter(order => {
          const deliveryDate = getDeliveryDate(order);
          return deliveryDate >= monthStartString && deliveryDate <= today.toISOString().split('T')[0];
        });
      case 'custom':
        if (!customDate || customDate === '') return orders; // 날짜가 없으면 모든 주문 반환
        return orders.filter(order => {
          const deliveryDate = getDeliveryDate(order);
          console.log('날짜 비교:', { deliveryDate, customDate, match: deliveryDate === customDate });
          return deliveryDate === customDate;
        });
      default:
        return orders;
    }
  };

  // 인기 메뉴 계산 함수
  const getPopularMenus = (orders: Order[]) => {
    const menuCount: { [key: string]: number } = {};
    
    orders.forEach(order => {
      order.order_items?.forEach(item => {
        const menuName = item.menus.name;
        menuCount[menuName] = (menuCount[menuName] || 0) + item.quantity;
      });
    });
    
    return Object.entries(menuCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  };



  // 요일별 성과 분석 함수
  const getWeeklyAnalysis = (orders: Order[]) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    
    return days.map((dayName, dayIndex) => {
      const dayOrders = orders.filter(order => {
        const orderDay = new Date(order.created_at).getDay();
        return orderDay === dayIndex;
      });
      
      const revenue = dayOrders.reduce((sum, order) => sum + order.total, 0);
      
      return {
        name: dayName,
        orders: dayOrders.length,
        revenue: revenue
      };
    });
  };

  const filteredOrdersByPeriod = filterOrdersByPeriod(orders, selectedPeriod, selectedDate);
  
  // 디버깅용 로그
  console.log('현재 필터 상태:', {
    selectedPeriod,
    selectedDate,
    totalOrders: orders.length,
    filteredOrders: filteredOrdersByPeriod.length
  });
  const filteredOrdersByStatus = filteredOrdersByPeriod.filter(order => order.status === selectedStatus);
  
  // 검색 기능 적용
  const finalFilteredOrders = filteredOrdersByStatus.filter(order => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      order.depositor_name?.toLowerCase().includes(searchLower) ||
      order.delivery_address?.toLowerCase().includes(searchLower) ||
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.customer_phone?.includes(searchTerm)
    );
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());


  // 메뉴 필터링
  const filteredMenus = menus.filter(menu => menu.category === selectedMenuCategory);

  // 페이지네이션 계산
  const totalPages = Math.ceil(finalFilteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = finalFilteredOrders.slice(startIndex, endIndex);

  // 페이지 변경 시 상단으로 스크롤
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 프린트 함수
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = document.querySelector('.print-content');
    if (!printContent) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>주문 내역 프린트</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              font-size: 12px;
              line-height: 1.4;
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .print-order {
              margin-bottom: 15px;
              padding: 10px;
              border: 1px solid #ddd;
              page-break-inside: avoid;
            }
            .print-order-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-weight: bold;
            }
            .print-order-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 8px;
            }
            .print-order-items {
              margin-bottom: 8px;
            }
            .print-order-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            .print-order-total {
              text-align: right;
              font-weight: bold;
              border-top: 1px solid #ddd;
              padding-top: 5px;
            }
            @media print {
              body { margin: 0; padding: 15px; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

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
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  // 메뉴 관련 핸들러 함수들
  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      // storeId가 있으면 해당 매장을, 없으면 사용자의 첫 번째 매장을 사용
      let targetStoreId = storeId;
      
      if (!targetStoreId) {
        if (user.role === 'admin') {
          // admin 사용자의 경우 user_stores 테이블을 통해 소유한 매장을 가져오기
          const { data: userStores } = await supabase
            .from('user_stores')
            .select(`
              stores (
                id,
                name,
                category,
                delivery_area,
                phone,
                business_hours_start,
                business_hours_end,
                pickup_time_slots,
                delivery_time_slots,
                bank_account,
                account_holder
              )
            `)
            .eq('user_id', user.id)
            .eq('role', 'owner');
          
          if (userStores && userStores.length > 0) {
            targetStoreId = userStores[0].stores?.[0]?.id;
          } else {
            alert('관리하는 매장이 없습니다.');
            return;
          }
        } else if (user.role === 'super_admin') {
          // 슈퍼 어드민의 경우 모든 매장에서 첫 번째 매장 사용
          const allStores = await getStores();
          if (allStores.length > 0) {
            targetStoreId = allStores[0].id;
          } else {
            alert('등록된 매장이 없습니다.');
            return;
          }
        }
      }

      const menuData = {
        store_id: targetStoreId!,
        name: menuForm.name,
        description: menuForm.description,
        price: parseFloat(menuForm.price) || 0,
        category: menuForm.category,
        is_available: menuForm.is_available
      };

      if (editingMenu) {
        await updateMenu(editingMenu.id, menuData);
      } else {
        await createMenu(menuData);
      }

      setShowMenuModal(false);
      setEditingMenu(null);
      setMenuForm({ name: '', description: '', price: '', category: '', is_available: true });
      loadMenus();
    } catch (error) {
      console.error('❌ 메뉴 저장 실패:', error);
      alert('메뉴 저장에 실패했습니다.');
    }
  };


  const handleDeleteMenu = async (menuId: string) => {
    if (!confirm('정말로 이 메뉴를 삭제하시겠습니까?')) return;

    try {
      await deleteMenu(menuId);
      loadMenus();
    } catch (error) {
      console.error('❌ 메뉴 삭제 실패:', error);
      alert('메뉴 삭제에 실패했습니다.');
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleToggleMenuAvailability = async (menu: Menu) => {
    try {
      await updateMenu(menu.id, { is_available: !menu.is_available });
      loadMenus();
    } catch (error) {
      console.error('❌ 메뉴 상태 변경 실패:', error);
      alert('메뉴 상태 변경에 실패했습니다.');
    }
  };
  
  const popularMenus = getPopularMenus(filteredOrdersByPeriod);
  
  // 기간별 제목 생성 함수
  const getPeriodTitle = (baseTitle: string) => {
    const periodMap: { [key: string]: string } = {
      'today': '오늘',
      'yesterday': '어제',
      'week': '이번주',
      'month': '이번달',
      'custom': selectedDate ? selectedDate : '선택한 날짜'
    };
    
    const period = periodMap[selectedPeriod] || '전체';
    
    // baseTitle이 빈 문자열이면 기간만 반환
    if (baseTitle === '') {
      return period;
    }
    
    return `${period} ${baseTitle}`;
  };

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

  // 주문 번호를 최신 주문이 큰 숫자가 되도록 만드는 함수 (배달날짜 기준)
  const getOrderNumber = (order: Order, allOrders: Order[]) => {
    const deliveryDate = getDeliveryDate(order);
    const sameDayOrders = allOrders.filter(o => getDeliveryDate(o) === deliveryDate);
    const orderIndex = sameDayOrders.findIndex(o => o.id === order.id);
    return sameDayOrders.length - orderIndex; // 최신 주문이 큰 숫자가 되도록
  };


  // 통계 계산 함수들
  const calculateStatistics = (orders: Order[], period: string) => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    // 이전 기간과 비교하여 매출 증가율 계산
    let previousPeriodRevenue = 0;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayOrders = orders.filter(order => {
          const deliveryDate = getDeliveryDate(order);
          return deliveryDate === yesterday.toISOString().split('T')[0];
        });
        previousPeriodRevenue = yesterdayOrders.reduce((sum, order) => sum + order.total, 0);
        break;
      case 'yesterday':
        const dayBeforeYesterday = new Date(today);
        dayBeforeYesterday.setDate(today.getDate() - 2);
        const dayBeforeYesterdayOrders = orders.filter(order => {
          const deliveryDate = getDeliveryDate(order);
          return deliveryDate === dayBeforeYesterday.toISOString().split('T')[0];
        });
        previousPeriodRevenue = dayBeforeYesterdayOrders.reduce((sum, order) => sum + order.total, 0);
        break;
      case 'week':
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(today);
        lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
        const lastWeekOrders = orders.filter(order => {
          const deliveryDate = getDeliveryDate(order);
          return deliveryDate >= lastWeekStart.toISOString().split('T')[0] && 
                 deliveryDate <= lastWeekEnd.toISOString().split('T')[0];
        });
        previousPeriodRevenue = lastWeekOrders.reduce((sum, order) => sum + order.total, 0);
        break;
      case 'month':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        const lastMonthOrders = orders.filter(order => {
          const deliveryDate = getDeliveryDate(order);
          return deliveryDate >= lastMonth.toISOString().split('T')[0] && 
                 deliveryDate <= lastMonthEnd.toISOString().split('T')[0];
        });
        previousPeriodRevenue = lastMonthOrders.reduce((sum, order) => sum + order.total, 0);
        break;
    }
    
    const revenueGrowthRate = previousPeriodRevenue > 0 
      ? Math.round(((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100)
      : totalRevenue > 0 ? 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueGrowthRate
    };
  };

  // 로딩 중 (인증 로딩만 체크, 주문 데이터는 백그라운드에서 로드)
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

  // 권한 체크
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <i className="ri-lock-line text-2xl text-red-600"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600 mb-4">관리자만 접근할 수 있는 페이지입니다.</p>
          <button
            onClick={() => navigate('/stores')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            매장 목록으로 이동
          </button>
        </div>
      </div>
    );
  }


  return (
    <>
      {/* 프린트용 CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
              padding: 20px;
              font-size: 12px;
              line-height: 1.4;
            }
            .print-header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .print-order {
              margin-bottom: 15px;
              padding: 10px;
              border: 1px solid #ddd;
              page-break-inside: avoid;
            }
            .print-order-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-weight: bold;
            }
            .print-order-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 8px;
            }
            .print-order-items {
              margin-bottom: 8px;
            }
            .print-order-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            .print-order-total {
              text-align: right;
              font-weight: bold;
              border-top: 1px solid #ddd;
              padding-top: 5px;
            }
            .no-print {
              display: none !important;
            }
          }
          
          /* 모던 드롭다운 스타일 */
          .modern-select {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
          
          .modern-select option {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-weight: 500;
            padding: 12px 16px;
            background: white;
            color: #374151;
            border: none;
            font-size: 14px;
            line-height: 1.5;
          }
          
          .modern-select option:hover {
            background: #f9fafb;
            color: #111827;
          }
          
          .modern-select option:checked {
            background: #fef3c7;
            color: #92400e;
            font-weight: 600;
          }
        `
      }} />
      
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b no-print">
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
              <h1 className="text-lg font-semibold text-gray-800">
                {storeName ? `${storeName} 관리자` : '매장 관리자'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md flex items-center whitespace-nowrap cursor-pointer text-sm"
            >
                <i className="ri-logout-box-r-line mr-1.5 text-xs"></i>
              로그아웃
            </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 flex-1 max-w-7xl mx-auto w-full">
        {/* 탭 메뉴 */}
        <div className="flex space-x-2 sm:space-x-3 mb-6 no-print overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 sm:px-6 py-3 rounded-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'orders'
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <i className="ri-file-list-3-line mr-2 sm:mr-2"></i>
            <span className="hidden sm:inline">주문 내역</span>
            <span className="sm:hidden">주문</span>
          </button>
          <button
            onClick={() => setActiveTab('menus')}
            className={`px-3 sm:px-6 py-3 rounded-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'menus'
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <i className="ri-restaurant-line mr-2 sm:mr-2"></i>
            <span className="hidden sm:inline">메뉴 관리</span>
            <span className="sm:hidden">메뉴</span>
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-3 sm:px-6 py-3 rounded-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'statistics'
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <i className="ri-bar-chart-line mr-2 sm:mr-2"></i>
            <span className="hidden sm:inline">통계</span>
            <span className="sm:hidden">통계</span>
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`px-3 sm:px-6 py-3 rounded-lg text-sm sm:text-base font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
              activeTab === 'store'
                ? 'bg-gray-800 text-white'
                : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <i className="ri-store-line mr-2 sm:mr-2"></i>
            <span className="hidden sm:inline">매장 관리</span>
            <span className="sm:hidden">매장</span>
          </button>
        </div>


        {activeTab === 'orders' && (
          <>
            {/* 주문 내역 탭 */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">주문 내역</h3>
                  <p className="text-sm text-gray-600">모든 주문 정보를 상세하게 확인할 수 있습니다</p>
                </div>
                {finalFilteredOrders.length > 0 && (
            <button
                    onClick={handlePrint}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm whitespace-nowrap cursor-pointer"
                  >
                    <i className="ri-printer-line"></i>
                    프린트
            </button>
                )}
              </div>
        </div>

        {/* 검색 및 필터 섹션 */}
        <div className="space-y-4 mb-6 no-print">
          {/* 검색 바 */}
          <div className="bg-white rounded-lg border-2 border-gray-300 p-4 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <i className="ri-search-line text-orange-500"></i>
              <span className="text-sm font-medium text-gray-700">검색</span>
            </div>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="입금자명, 배달주소, 고객명, 전화번호로 검색..."
                className="w-full px-4 py-3 pl-10 pr-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all duration-200 hover:bg-gray-100"
            />
              <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>

        {/* 필터 카드 */}
          <div className="bg-white rounded-lg border-2 border-gray-300 p-4 shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <i className="ri-filter-3-line text-orange-500"></i>
              <span className="text-sm font-medium text-gray-700">필터</span>
            </div>
            
            <div className="space-y-4">
              {/* 기간 필터 - 모바일 최적화 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <i className="ri-calendar-line text-gray-500 text-sm"></i>
                  <span className="text-sm font-medium text-gray-700">기간</span>
                </div>
                
                {/* 기간 선택 버튼들 - 아이콘과 함께 일관된 디자인 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'today', label: '오늘', icon: 'ri-calendar-today-line' },
                    { key: 'yesterday', label: '어제', icon: 'ri-calendar-check-line' },
                    { key: 'week', label: '이번주', icon: 'ri-calendar-week-line' },
                    { key: 'month', label: '이번달', icon: 'ri-calendar-month-line' }
                  ].map((period) => (
                    <button
                      key={period.key}
                      onClick={() => handlePeriodSelect(period.key)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
                        selectedPeriod === period.key 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <i className={`${period.icon} text-xs`}></i>
                      <span>{period.label}</span>
                    </button>
                  ))}
                </div>

                {/* 날짜 선택 버튼 - 기간 버튼과 동일한 크기 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      selectedPeriod === 'custom' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <i className="ri-calendar-line"></i>
                    {selectedDate ? selectedDate : '날짜 선택'}
                  </button>
                  
                  {selectedPeriod === 'custom' && selectedDate && (
                    <button
                      onClick={() => {
                        setSelectedDate('');
                        setSelectedPeriod('today');
                      }}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <i className="ri-close-line"></i>
                      <span>초기화</span>
                    </button>
                  )}
                </div>

                {/* 캘린더 */}
                {showCalendar && (
                  <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700">날짜 선택</h3>
                      <button
                        onClick={() => setShowCalendar(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <i className="ri-close-line"></i>
                      </button>
                    </div>
                    <input
                      type="date"
                      value={selectedDate || ''}
                      onChange={(e) => {
                        handleDateSelect(e.target.value);
                        setShowCalendar(false);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}
              </div>

              {/* 상태 필터 - 모바일 최적화 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <i className="ri-filter-line text-gray-500 text-sm"></i>
                  <span className="text-sm font-medium text-gray-700">상태</span>
                </div>
                
                {/* 상태 버튼들 - 기간 버튼과 동일한 크기 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { key: '입금대기', label: '입금대기', count: filteredOrdersByPeriod.filter(order => order.status === '입금대기').length, icon: 'ri-time-line' },
                    { key: '입금확인', label: '입금확인', count: filteredOrdersByPeriod.filter(order => order.status === '입금확인').length, icon: 'ri-check-line' },
                    { key: '배달완료', label: '배달완료', count: filteredOrdersByPeriod.filter(order => order.status === '배달완료').length, icon: 'ri-truck-line' }
                  ].map((status) => (
                    <button
                      key={status.key}
                      onClick={() => setSelectedStatus(status.key)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col items-center gap-1 ${
                        selectedStatus === status.key
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <i className={`${status.icon} text-xs`}></i>
                        <span>{status.label}</span>
                      </div>
                      <span className="text-xs opacity-75">({status.count})</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

            {/* 오늘 주문 수 표시 - 검색어가 없을 때만 표시 */}
            {paginatedOrders.length > 0 && !searchTerm && (
              <div className="mb-4 flex justify-center">
                <div className="inline-flex items-center px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full">
                  <span className="text-gray-700 text-sm">
                    <i className="ri-calendar-line mr-1 text-orange-500"></i>
                    {getPeriodTitle('')} {finalFilteredOrders.length}개의 주문이 들어왔습니다
                  </span>
                </div>
              </div>
            )}

            {/* 주문 상세 목록 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {loadingOrders ? (
            <div className="col-span-full bg-white rounded-lg p-8 shadow-md border-2 border-gray-300">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">주문 데이터를 불러오는 중...</p>
              </div>
            </div>
              ) : paginatedOrders.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg p-8 shadow-md border-2 border-gray-300">
              <div className="text-center text-gray-500">
                <i className="ri-shopping-cart-line text-4xl mb-4"></i>
                <p>선택한 조건에 해당하는 주문이 없습니다.</p>
              </div>
            </div>
          ) : (
                paginatedOrders.map((order) => {
              const { date, time } = {
                date: new Date(order.created_at).toLocaleDateString('ko-KR'),
                time: new Date(order.created_at).toLocaleTimeString('ko-KR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              };
              
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-md border-2 border-gray-300 hover:shadow-lg hover:border-orange-400 transition-all duration-200 overflow-hidden">
                  <div className="p-4 lg:p-5">
                    <div className="mb-4">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3 gap-2">
                        <h3 className="font-semibold text-gray-800 text-lg">주문번호: {getOrderNumber(order, finalFilteredOrders)}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <i className="ri-calendar-line text-gray-400"></i>
                            <span>주문일시: {date} {time}</span>
                          </div>
                          {order.order_type === 'delivery' && order.delivery_address && (
                            <div className="flex items-start gap-2">
                              <i className="ri-map-pin-line text-gray-400 mt-0.5"></i>
                              <span>배달주소: {order.delivery_address}</span>
                            </div>
                          )}
                          {order.delivery_time && (
                            <div className="flex items-center gap-2">
                              <i className="ri-truck-line text-gray-400"></i>
                              <span>배달시간: {order.delivery_time}</span>
                            </div>
                          )}
                          {order.pickup_time && (
                            <div className="flex items-center gap-2">
                              <i className="ri-store-line text-gray-400"></i>
                              <span>픽업시간: {order.pickup_time}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          {order.depositor_name && (
                            <div className="flex items-center gap-2">
                              <i className="ri-user-line text-gray-400"></i>
                              <span>입금자명: {order.depositor_name}</span>
                            </div>
                          )}
                          {order.customer_name && (
                            <div className="flex items-center gap-2">
                              <i className="ri-user-3-line text-gray-400"></i>
                              <span>고객명: {order.customer_name}</span>
                            </div>
                          )}
                          {order.customer_phone && (
                            <div className="flex items-center gap-2">
                              <i className="ri-phone-line text-gray-400"></i>
                              <span>연락처: {order.customer_phone}</span>
                            </div>
                          )}
                        </div>
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

                    {/* 요청사항 */}
                    {order.special_requests && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="ri-message-line mr-2"></i>
                          <span>요청사항: {order.special_requests}</span>
                        </div>
                      </div>
                    )}

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
                          </>
                        )}
                        
                        {/* 배달완료 상태일 때 (배달 주문만) */}
                        {order.status === '배달완료' && order.order_type === 'delivery' && (
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
                          </>
                        )}
                            
                        {canCancel(order.status) && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap cursor-pointer"
                          >
                            주문취소
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
        {finalFilteredOrders.length > 0 && (
          <div className="mt-6 flex justify-center no-print">
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {/* 이전 페이지 버튼 */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <i className="ri-arrow-left-s-line"></i>
                </button>

                {/* 페이지 번호들 - 최대 5개까지만 표시 */}
                {(() => {
                  const maxVisiblePages = 5;
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                  
                  // 끝 페이지가 조정되면 시작 페이지도 조정
                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }
                  
                  const pages = [];
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(i);
                  }
                  
                  return pages.map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        currentPage === page
                          ? 'bg-orange-500 text-white'
                          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ));
                })()}

                {/* 다음 페이지 버튼 */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <i className="ri-arrow-right-s-line"></i>
                </button>
              </div>
            )}
          </div>
        )}


        {/* 페이지 정보 */}
        {finalFilteredOrders.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500 no-print">
            {startIndex + 1}-{Math.min(endIndex, finalFilteredOrders.length)} / {finalFilteredOrders.length}개 주문
            </div>
        )}

        {/* 프린트용 콘텐츠 */}
        <div className="print-content" style={{ display: 'none', visibility: 'hidden' }}>
          <div className="print-header">
            <h1 style={{ fontSize: '18px', margin: '0 0 5px 0' }}>
              {storeName || '매장'} 주문 내역
            </h1>
            <p style={{ margin: '0', fontSize: '14px' }}>
              {selectedPeriod === 'today' ? '오늘' : 
               selectedPeriod === 'yesterday' ? '어제' : 
               selectedDate ? selectedDate : '전체'} 주문 목록
            </p>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
              프린트 일시: {new Date().toLocaleString('ko-KR')}
            </p>
          </div>

          {finalFilteredOrders.map((order) => {
            const { date, time } = {
              date: new Date(order.created_at).toLocaleDateString('ko-KR'),
              time: new Date(order.created_at).toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            };
            
            return (
              <div key={order.id} className="print-order">
                <div className="print-order-header">
                  <span>주문번호: {getOrderNumber(order, finalFilteredOrders)}</span>
                  <span>{order.status}</span>
                </div>
                
                <div className="print-order-details">
                  <div>
                    <strong>주문일시:</strong> {date} {time}
                  </div>
                  <div>
                    <strong>주문방식:</strong> {order.order_type === 'delivery' ? '배달' : '픽업'}
                  </div>
                  {order.delivery_address && (
                    <div>
                      <strong>배달주소:</strong> {order.delivery_address}
          </div>
        )}
                  {order.delivery_time && (
                    <div>
                      <strong>배달시간:</strong> {order.delivery_time}
                    </div>
                  )}
                  {order.pickup_time && (
                    <div>
                      <strong>픽업시간:</strong> {order.pickup_time}
                    </div>
                  )}
                  {order.depositor_name && (
                    <div>
                      <strong>입금자명:</strong> {order.depositor_name}
                    </div>
                  )}
                  {order.customer_name && (
                    <div>
                      <strong>고객명:</strong> {order.customer_name}
                    </div>
                  )}
                  {order.customer_phone && (
                    <div>
                      <strong>연락처:</strong> {order.customer_phone}
                    </div>
                  )}
                  {order.special_requests && (
                    <div>
                      <strong>요청사항:</strong> {order.special_requests}
                    </div>
                  )}
                </div>

                <div className="print-order-items">
                  <strong>주문 상품:</strong>
                  {order.order_items?.map((item, index) => (
                    <div key={index} className="print-order-item">
                      <span>{item.menus.name} x {item.quantity}</span>
                      <span>{(item.price * item.quantity).toLocaleString()}원</span>
                    </div>
                  )) || <div>주문 상품 정보 없음</div>}
                </div>

                <div className="print-order-total">
                  총 결제 금액: {order.total.toLocaleString()}원
                </div>
              </div>
            );
          })}
        </div>
          </>
        )}


        {activeTab === 'statistics' && (
          <>
            {/* 통계 탭 */}
            <div className="mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">매장 통계</h3>
                <p className="text-sm text-gray-600">매장의 주문 현황과 매출 통계를 확인할 수 있습니다</p>
              </div>
            </div>

            {/* 통계 필터 카드 */}
            <div className="bg-white rounded-lg border-2 border-gray-300 p-4 shadow-md mb-6">
              <div className="flex items-center gap-2 mb-3">
                <i className="ri-calendar-check-line text-orange-500"></i>
                <span className="text-sm font-medium text-gray-700">통계 기간</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'today', label: '오늘', icon: 'ri-calendar-today-line' },
                  { key: 'yesterday', label: '어제', icon: '' },
                  { key: 'week', label: '이번주', icon: 'ri-calendar-week-line' },
                  { key: 'month', label: '이번달', icon: 'ri-calendar-month-line' }
                ].map((period) => (
                  <button
                    key={period.key}
                    onClick={() => handlePeriodSelect(period.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      selectedPeriod === period.key
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-200'
                    }`}
                  >
                    {period.icon && (
                      <i className={`${period.icon} text-base ${selectedPeriod === period.key ? 'text-white' : 'text-gray-400'}`}></i>
                    )}
                    <span>{period.label}</span>
                  </button>
                ))}
                
                {/* 날짜 선택 버튼 */}
                <div className="relative date-picker-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('날짜 선택 버튼 클릭됨, 현재 selectedPeriod:', selectedPeriod);
                      setShowDatePicker(!showDatePicker);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                      selectedPeriod === 'custom'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-200'
                    }`}
                  >
                    <i className={`ri-calendar-line text-base ${selectedPeriod === 'custom' ? 'text-white' : 'text-gray-400'}`}></i>
                    <span>{selectedDate ? selectedDate : '날짜 선택'}</span>
                  </button>
                  
                  {/* 달력 드롭다운 */}
                  {showDatePicker && (
                    <div 
                      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-3 min-w-[250px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <i className="ri-calendar-line text-orange-500 text-sm"></i>
                        <span className="text-sm font-medium text-gray-700">날짜 선택</span>
                      </div>
                      <input
                        type="date"
                        value={selectedDate || ''}
                        onChange={(e) => {
                          console.log('날짜 선택됨:', e.target.value);
                          handleDateSelect(e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        max={new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Seoul"})).toISOString().split('T')[0]}
                        autoFocus
                        placeholder="날짜를 선택하세요"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDatePicker(false);
                          }}
                          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                        >
                          닫기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-md border-2 border-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">{getPeriodTitle('총 매출')}</p>
                    <p className="text-lg font-bold text-green-600">{calculateStatistics(filteredOrdersByPeriod, selectedPeriod).totalRevenue.toLocaleString()}원</p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="ri-money-dollar-circle-line text-green-600"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-md border-2 border-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">{getPeriodTitle('총 주문수')}</p>
                    <p className="text-lg font-bold text-blue-600">{calculateStatistics(filteredOrdersByPeriod, selectedPeriod).totalOrders.toLocaleString()}</p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="ri-shopping-cart-line text-blue-600"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-md border-2 border-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">{getPeriodTitle('평균 주문액')}</p>
                    <p className="text-lg font-bold text-purple-600">{calculateStatistics(filteredOrdersByPeriod, selectedPeriod).averageOrderValue.toLocaleString()}원</p>
                  </div>
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i className="ri-bar-chart-line text-purple-600"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 shadow-md border-2 border-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600">{getPeriodTitle('매출 증가율')}</p>
                    <p className={`text-lg font-bold ${calculateStatistics(filteredOrdersByPeriod, selectedPeriod).revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {calculateStatistics(filteredOrdersByPeriod, selectedPeriod).revenueGrowthRate >= 0 ? '+' : ''}{calculateStatistics(filteredOrdersByPeriod, selectedPeriod).revenueGrowthRate}%
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <i className="ri-trending-up-line text-orange-600"></i>
                  </div>
                </div>
              </div>
            </div>


            {/* 요일별 성과 */}
            <div className="bg-white rounded-lg p-6 shadow-md border-2 border-gray-300 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <i className="ri-calendar-line text-orange-500"></i>
                요일별 성과 (전체 기간)
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {getWeeklyAnalysis(orders).map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="text-xs text-gray-500 mb-1">{day.name}</div>
                    <div className="text-lg font-bold text-gray-800">{day.orders}</div>
                    <div className="text-xs text-gray-500">{day.revenue.toLocaleString()}원</div>
                    <div className="w-full h-1 bg-gray-200 rounded-full mt-2">
                      <div 
                        className="h-1 bg-orange-500 rounded-full transition-all duration-300"
                        style={{ width: `${getWeeklyAnalysis(orders).length > 0 ? (day.orders / Math.max(...getWeeklyAnalysis(orders).map(d => d.orders))) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 인기 메뉴 */}
            <div className="bg-white rounded-lg p-4 shadow-md border-2 border-gray-300">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{getPeriodTitle('인기 메뉴')}</h3>
              <div className="space-y-3">
                {popularMenus.length > 0 ? (
                  popularMenus.map((menu, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-orange-600 font-bold text-sm">#{index + 1}</span>
                        </div>
                        <span className="text-gray-800 font-medium">{menu.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                          {menu.count}개
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <i className="ri-restaurant-line text-4xl mb-3 text-gray-300"></i>
                    <p className="text-lg">주문된 메뉴가 없습니다</p>
                    <p className="text-sm">선택한 기간에 주문된 메뉴가 없습니다</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'menus' && (
          <>
            {/* 메뉴 관리 탭 */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">메뉴 관리</h3>
                  <p className="text-sm text-gray-600">매장의 메뉴를 추가, 수정, 삭제할 수 있습니다</p>
      </div>
                <button
                  onClick={() => {
                    console.log('메뉴 추가 버튼 클릭됨');
                    setEditingMenu(null);
                    setMenuForm({ name: '', description: '', price: '', category: '', is_available: true });
                    setShowMenuModal(true);
                    console.log('showMenuModal 상태:', true);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm whitespace-nowrap cursor-pointer"
                >
                  <i className="ri-add-line"></i>
                  메뉴 추가
                </button>
    </div>
            </div>

            {/* 카테고리 탭 - menu 페이지와 동일한 스타일 */}
            {menus.length > 0 && (
              <div className="bg-white px-4 py-4 border-b shadow-sm mb-0">
                <div className="flex space-x-2 overflow-x-auto pb-1">
                  {STANDARD_CATEGORIES.map(category => {
                    const count = menus.filter(menu => menu.category === category).length;
                    if (count === 0) return null; // 메뉴가 없는 카테고리는 표시하지 않음
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedMenuCategory(category)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                          selectedMenuCategory === category
                            ? 'bg-gray-800 text-white'
                            : 'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <i className={`ri-restaurant-line mr-1.5 ${selectedMenuCategory === category ? 'text-white' : 'text-gray-600'}`}></i>
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 메뉴 목록 - 아코디언 스타일 */}
            {loadingMenus ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">메뉴를 불러오는 중...</p>
              </div>
            ) : filteredMenus.length > 0 ? (
              <div className="space-y-4">
                {/* 카테고리별로 그룹화 */}
                {STANDARD_CATEGORIES.map((category) => {
                  const categoryMenus = filteredMenus.filter(menu => 
                    selectedMenuCategory === 'all' ? menu.category === category : true
                  );
                  
                  if (categoryMenus.length === 0) return null;
                  
                  const isExpanded = expandedCategories.has(category);
                  
                  return (
                    <div key={category} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                      {/* 카테고리 헤더 */}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl flex items-center justify-center">
                            <i className="ri-restaurant-line text-white text-lg"></i>
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-bold text-gray-800">{category}</h3>
                            <p className="text-sm text-gray-500">{categoryMenus.length}개 메뉴</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {isExpanded ? '접기' : '펼치기'}
                          </span>
                          <i className={`ri-arrow-down-s-line text-xl text-gray-400 transition-transform duration-300 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}></i>
                        </div>
                      </button>
                      
                      {/* 카테고리 메뉴 목록 */}
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="px-6 pb-6">
                          <div className="space-y-2">
                            {categoryMenus.map((menu, index) => (
                  <div key={menu.id} className={`px-4 py-4 hover:bg-gray-50 transition-colors duration-200 ${index !== filteredMenus.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-black text-base truncate">{menu.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-black font-semibold text-base">
                              {(menu.price || 0).toLocaleString()}원
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-2 line-clamp-2 leading-relaxed">{menu.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 ${
                              menu.is_available 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : 'bg-red-100 text-red-700 border border-red-200'
                            }`}>
                              <i className={`ri-${menu.is_available ? 'check' : 'close'}-line text-xs`}></i>
                              {menu.is_available ? '주문가능' : '품절'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleMenuAvailability(menu)}
                              className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                                menu.is_available 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              <i className={`ri-${menu.is_available ? 'check' : 'close'}-line text-sm`}></i>
                            </button>
                            <button
                              onClick={() => {
                                setEditingMenu(menu);
                                setMenuForm({
                                  name: menu.name,
                                  description: menu.description || '',
                                  price: menu.price.toString(),
                                  category: menu.category,
                                  is_available: menu.is_available
                                });
                                setShowMenuModal(true);
                              }}
                              className="w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center bg-white text-black border border-gray-300 hover:bg-gray-100"
                            >
                              <i className="ri-edit-line text-sm"></i>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('정말로 이 메뉴를 삭제하시겠습니까?')) {
                                  handleDeleteMenu(menu.id);
                                }
                              }}
                              className="w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50"
                            >
                              <i className="ri-delete-bin-line text-sm"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-restaurant-line text-3xl text-orange-400"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">메뉴가 없습니다</h3>
                <p className="text-gray-500">이 카테고리에 등록된 메뉴가 없습니다.</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 메뉴 추가/수정 모달 */}
      {showMenuModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md border-2 border-gray-300 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              {editingMenu ? '메뉴 수정' : '메뉴 추가'}
            </h3>
            <form onSubmit={handleMenuSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메뉴명 *</label>
                <input
                  type="text"
                  value={menuForm.name}
                  onChange={(e) => setMenuForm({...menuForm, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="메뉴명을 입력하세요"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea
                  value={menuForm.description}
                  onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={3}
                  placeholder="메뉴 설명을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">가격 *</label>
                <input
                  type="number"
                  value={menuForm.price}
                  onChange={(e) => setMenuForm({...menuForm, price: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="가격을 입력하세요"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 *</label>
                <select
                  value={menuForm.category}
                  onChange={(e) => setMenuForm({...menuForm, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                >
                  <option value="">카테고리를 선택하세요</option>
                  {STANDARD_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={menuForm.is_available}
                  onChange={(e) => setMenuForm({...menuForm, is_available: e.target.checked})}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="is_available" className="ml-2 text-sm text-gray-700">
                  판매 가능
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium"
                >
                  {editingMenu ? '수정하기' : '추가하기'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuModal(false);
                    setEditingMenu(null);
                    setMenuForm({ name: '', description: '', price: '', category: '', is_available: true });
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg font-medium"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
        )}

        {activeTab === 'store' && (
          <>
            {/* 매장 관리 탭 */}
            <div className="mb-6 px-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">매장 정보 관리</h2>
              <p className="text-gray-600 text-sm mb-4">매장의 기본 정보를 확인하고 수정할 수 있습니다.</p>
            </div>

            {/* 주문 링크 복사 섹션 */}
            <div className="mb-6 px-4">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <i className="ri-share-line text-white text-xl"></i>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">주문 링크 공유</h3>
                  <p className="text-sm text-gray-600">고객들이 이 링크로 주문할 수 있습니다</p>
                </div>
                
                <div className="bg-white rounded-xl p-4 mb-4 border-2 border-gray-300 shadow-md">
                  <div className="font-mono text-sm text-gray-700 break-all">
                    {storeId ? `${window.location.origin}/menu/${storeId}` : '로딩 중...'}
                  </div>
                </div>
                
                <button
                  onClick={copyOrderLink}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    copiedLink
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <i className="ri-check-line text-lg"></i>
                      <span>복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-file-copy-line text-lg"></i>
                      <span>링크 복사하기</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* 매장 정보 카드 */}
            <div className="bg-white rounded-lg shadow-md border-2 border-gray-300 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">매장 정보</h3>
                <button
                  onClick={handleEditStore}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <i className="ri-edit-line"></i>
                  수정
                </button>
              </div>
              <div className="space-y-6">
                {/* 기본 정보 섹션 */}
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="ri-store-line text-orange-500"></i>
                    기본 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">매장명</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">{currentStore?.name || storeName || '로딩 중...'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">{currentStore?.category || '로딩 중...'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">{currentStore?.phone || '로딩 중...'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">배달 지역</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">{currentStore?.delivery_area || '로딩 중...'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 운영 정보 섹션 */}
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="ri-time-line text-orange-500"></i>
                    운영 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">운영시간</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">
                          {currentStore?.business_hours_start && currentStore?.business_hours_end 
                            ? `${currentStore.business_hours_start} - ${currentStore.business_hours_end}`
                            : '로딩 중...'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">주문마감시간</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">{currentStore?.order_cutoff_time || '로딩 중...'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">최소주문금액</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">
                          {currentStore?.minimum_order_amount ? `${currentStore.minimum_order_amount.toLocaleString()}원` : '로딩 중...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 결제 정보 섹션 */}
                <div>
                  <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="ri-bank-line text-orange-500"></i>
                    결제 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">계좌번호</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900 font-mono">{currentStore?.bank_account || '로딩 중...'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">예금주</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">{currentStore?.account_holder || '로딩 중...'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 안내 섹션 */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <i className="ri-information-line text-blue-500 text-lg mt-0.5"></i>
                      <div className="flex-1">
                        <p className="text-sm text-blue-800 font-medium mb-2">
                          배달비 설정
                        </p>
                        <p className="text-sm text-blue-700 mb-3">
                          배달지역별 배달비 설정은 상단의 "배달비 설정" 탭에서 관리할 수 있습니다.
                        </p>
                        <button
                          onClick={() => navigate('/admin-dashboard')}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
                        >
                          <i className="ri-truck-line"></i>
                          배달비 설정으로 이동
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      
      {/* 상태 변경 확인 모달 */}
      {showStatusConfirm && pendingStatusChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full border-2 border-gray-300 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-question-line text-2xl text-orange-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">주문상태 변경</h3>
              <p className="text-gray-600 mb-4">
                주문 #{pendingStatusChange.orderNumber}의 상태를<br/>
                <span className="font-semibold text-orange-600">{pendingStatusChange.newStatus}</span>로 변경하시겠습니까?
              </p>
              <div className="bg-blue-100 border-l-4 border-blue-500 p-3 mb-6">
                <p className="text-sm text-blue-800 font-medium">
                  <i className="ri-information-line mr-1"></i>
                  고객 주문 조회 페이지에 실시간으로 반영됩니다
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

        {/* 매장 정보 수정 모달 */}
        {showStoreEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-300 shadow-xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">매장 정보 수정</h3>
                  <button
                    onClick={() => setShowStoreEditModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-close-line text-xl"></i>
                  </button>
                </div>

                <form onSubmit={handleStoreEditSubmit} className="space-y-6">
                  {/* 기본 정보 */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-800 mb-4">기본 정보</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">매장명</label>
                        <input
                          type="text"
                          value={storeEditForm.name}
                          onChange={(e) => setStoreEditForm({ ...storeEditForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
                        <input
                          type="tel"
                          value={storeEditForm.phone}
                          onChange={(e) => setStoreEditForm({ ...storeEditForm, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">주소</label>
                        <input
                          type="text"
                          value={storeEditForm.address}
                          onChange={(e) => setStoreEditForm({ ...storeEditForm, address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">매장 설명</label>
                        <textarea
                          value={storeEditForm.description}
                          onChange={(e) => setStoreEditForm({ ...storeEditForm, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 운영 정보 */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-800 mb-4">운영 정보</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">운영 시작시간</label>
                        <input
                          type="time"
                          value={storeEditForm.business_hours_start}
                          onChange={(e) => setStoreEditForm({ ...storeEditForm, business_hours_start: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">운영 종료시간</label>
                        <input
                          type="time"
                          value={storeEditForm.business_hours_end}
                          onChange={(e) => setStoreEditForm({ ...storeEditForm, business_hours_end: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">주문마감시간 (시)</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={storeEditForm.order_deadline_hour}
                          onChange={(e) => setStoreEditForm({ ...storeEditForm, order_deadline_hour: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">주문마감시간 (분)</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={storeEditForm.order_deadline_minute}
                          onChange={(e) => setStoreEditForm({ ...storeEditForm, order_deadline_minute: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 배달 정보 */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-800 mb-4">배달 정보</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">배달 지역</label>
                        <input
                          type="text"
                          value={storeEditForm.delivery_area}
                          onChange={(e) => setStoreEditForm({ ...storeEditForm, delivery_area: e.target.value })}
                          placeholder="예: 강남구, 서초구, 송파구"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">기본 배달비 (원)</label>
                        <input
                          type="number"
                          min="0"
                          value={storeEditForm.delivery_fee}
                          onChange={(e) => setStoreEditForm({ ...storeEditForm, delivery_fee: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowStoreEditModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      수정 완료
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      
      <Footer />
    </div>
    </>
  );
}