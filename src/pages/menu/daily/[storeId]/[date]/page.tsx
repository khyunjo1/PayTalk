import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getDailyMenu, 
  getDailyMenuItems, 
  getTodayDailyMenu, 
  getTomorrowDailyMenu,
  getLatestDailyMenu
} from '../../../../../lib/dailyMenuApi';
import { getStore } from '../../../../../lib/storeApi';
import { getCurrentKoreaTime } from '../../../../../lib/dateUtils';
import { getMenuCategoriesByStoreCategory } from '../../../../../lib/categoryMapping';
import Header from '../../../../../components/Header';
import Footer from '../../../../../components/Footer';

interface DailyMenu {
  id: string;
  store_id: string;
  menu_date: string;
  title: string;
  description?: string;
  is_active: boolean;
  cutoff_time?: string;
  // 일일 설정값들
  pickup_time_slots?: string[];
  delivery_time_slots?: Array<{
    name: string;
    start: string;
    end: string;
    enabled: boolean;
  }>;
  delivery_fee?: number;
  order_cutoff_time?: string;
  minimum_order_amount?: number;
  created_at: string;
  updated_at: string;
}

interface DailyMenuItem {
  id: string;
  daily_menu_id: string;
  menu_id: string;
  is_available: boolean;
  menu?: {
    id: string;
    name: string;
    description?: string;
    price: number;
    category: string;
  };
}

export default function DailyMenuPage() {
  const { storeId, date } = useParams<{ storeId: string; date?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dailyMenu, setDailyMenu] = useState<DailyMenu | null>(null);
  const [dailyMenuItems, setDailyMenuItems] = useState<DailyMenuItem[]>([]);
  const [store, setStore] = useState<any>(null);
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [isOrderClosed, setIsOrderClosed] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!storeId) return;
    loadData();
  }, [storeId, date]);

  // isOrderClosed 상태 변경 디버깅
  useEffect(() => {
    console.log('isOrderClosed 상태 변경됨:', isOrderClosed);
  }, [isOrderClosed]);

  // 주문 마감 여부 체크 함수
  const checkOrderClosed = (storeData: any, menuDate: string) => {
    if (!storeData || !menuDate) {
      console.log('체크 실패: storeData 또는 menuDate 없음', { storeData, menuDate });
      return false;
    }
    
    // 일일 메뉴의 설정값을 우선적으로 사용
    const cutoffTime = dailyMenu?.order_cutoff_time || storeData.order_cutoff_time || '15:00';
    
    // UTC+9 (한국 시간) 직접 계산 - 클라이언트 시간대에 무관하게 일관된 결과
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const koreaTime = new Date(utcTime + (9 * 3600000)); // UTC+9
    const currentTime = koreaTime.toTimeString().split(' ')[0]; // HH:MM:SS 형식
    
    // 메뉴 날짜가 오늘인지 확인 (한국 표준시간 기준)
    const todayStr = koreaTime.toISOString().split('T')[0];
    const isToday = menuDate === todayStr;
    
    // 어제 메뉴인지 확인
    const yesterday = new Date(koreaTime);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const isYesterday = menuDate === yesterdayStr;
    
    // 과거 날짜인지 확인 (오늘보다 이전)
    const menuDateObj = new Date(menuDate);
    const todayDateObj = new Date(todayStr);
    const isPastDate = menuDateObj < todayDateObj;
    
    console.log('날짜 비교 (한국 시간 기준):', {
      menuDate,
      todayStr,
      yesterdayStr,
      isToday,
      isYesterday,
      isPastDate,
      currentTime,
      cutoffTime: storeData.order_cutoff_time,
      koreaTime: koreaTime.toISOString(),
    });
    
    // 과거 날짜인 경우 무조건 주문 마감
    if (isPastDate) {
      console.log('과거 날짜 - 주문 마감');
      return true;
    }
    
    // 미래 날짜인 경우 주문 가능
    if (menuDateObj > todayDateObj) {
      console.log('미래 메뉴 - 주문 가능');
      return false;
    }
    
    
    // 어제 메뉴인 경우 무조건 비활성화 (이미 지난 날)
    if (isYesterday) {
      console.log('어제 메뉴 - 주문 마감');
      return true;
    }
    
    // 오늘 메뉴인 경우 시간 체크
    if (isToday) {
      // 시간을 분으로 변환해서 정확한 비교
      const currentMinutes = parseInt(currentTime.split(':')[0]) * 60 + parseInt(currentTime.split(':')[1]);
      const cutoffMinutes = parseInt(cutoffTime.split(':')[0]) * 60 + parseInt(cutoffTime.split(':')[1]);
      
      const isClosed = currentMinutes >= cutoffMinutes;
      
      console.log('오늘 메뉴 시간 비교 결과 (분 단위):', {
        currentTime,
        currentMinutes,
        cutoffTime,
        cutoffMinutes,
        isClosed
      });
      
      return isClosed;
    }
    
    // 여기까지 오면 안 되지만 안전장치
    return false;
  };

  const loadData = async () => {
    if (!storeId) return;
    
    try {
      setLoading(true);
      
      // 1. 매장 정보 로드
      const storeData = await getStore(storeId);
      setStore(storeData);
      
      // 2. 일일 메뉴 로드 - 자동으로 최근 메뉴 로드
      let menuData: DailyMenu | null = null;
      let menuItems: DailyMenuItem[] = [];
      
      // UTC+9 (한국 시간) 직접 계산 - 클라이언트 시간대에 무관하게 일관된 결과
      const now = new Date();
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const koreaTime = new Date(utcTime + (9 * 3600000)); // UTC+9
      let menuDate = date || koreaTime.toISOString().split('T')[0];
      
      try {
        // 먼저 지정된 날짜의 메뉴가 있는지 확인
        if (date && date.trim() !== '') {
          menuData = await getDailyMenu(storeId, date);
          if (menuData) {
            menuItems = await getDailyMenuItems(menuData.id);
          }
        } else {
          // 날짜가 없으면 오늘 메뉴 로드
          menuData = await getTodayDailyMenu(storeId);
          if (menuData) {
            menuItems = await getDailyMenuItems(menuData.id);
          }
        }
        
        // 지정된 날짜에 메뉴가 없으면 내일 메뉴 확인
        if (!menuData || menuItems.length === 0) {
          const tomorrowMenu = await getTomorrowDailyMenu(storeId);
          if (tomorrowMenu) {
            menuData = tomorrowMenu;
            menuItems = await getDailyMenuItems(tomorrowMenu.id);
            menuDate = tomorrowMenu.menu_date;
          }
        }
        
        if (!menuData) {
          return;
        }
      } catch (error) {
        console.error('일일 메뉴 로드 중 오류:', error);
        
        // daily_menus 테이블이 없는 경우 사용자에게 알림
        if (error.message?.includes('daily_menus 테이블이 존재하지 않습니다')) {
          console.warn('daily_menus 테이블이 존재하지 않습니다. 일반 메뉴로 리다이렉트합니다.');
          navigate(`/menu/${storeId}`);
          return;
        }
        
        // 다른 오류는 계속 진행 (메뉴가 없다고 표시)
        return;
      }
      
      setDailyMenu(menuData);
      setDailyMenuItems(menuItems);
      
      // 3. 매장 정보에 일일 메뉴 설정값 적용
      if (menuData) {
        console.log('🔍 일일 메뉴 설정값을 매장 정보에 적용:', {
          storeId,
          menuDate: menuData.menu_date,
          dailyMenuSettings: {
            pickup_time_slots: menuData.pickup_time_slots,
            delivery_time_slots: menuData.delivery_time_slots,
            delivery_fee: menuData.delivery_fee,
            order_cutoff_time: menuData.order_cutoff_time,
            minimum_order_amount: menuData.minimum_order_amount
          }
        });
        
        const updatedStore = {
          ...storeData,
          pickup_time_slots: menuData.pickup_time_slots || storeData.pickup_time_slots,
          delivery_time_slots: (menuData.delivery_time_slots && menuData.delivery_time_slots.length > 0) 
            ? menuData.delivery_time_slots 
            : storeData.delivery_time_slots,
          delivery_fee: menuData.delivery_fee !== undefined ? menuData.delivery_fee : storeData.delivery_fee,
          order_cutoff_time: menuData.order_cutoff_time || storeData.order_cutoff_time,
          minimum_order_amount: menuData.minimum_order_amount !== undefined ? menuData.minimum_order_amount : storeData.minimum_order_amount
        };
        
        setStore(updatedStore);
        console.log('✅ 일일 설정값이 적용된 매장 정보:', updatedStore);
        console.log('🔍 적용된 배달 시간대:', updatedStore.delivery_time_slots);
        console.log('🔍 적용된 픽업 시간대:', updatedStore.pickup_time_slots);
        console.log('🔍 적용된 최소 주문 금액:', updatedStore.minimum_order_amount);
        console.log('🔍 적용된 주문 마감 시간:', updatedStore.order_cutoff_time);
      }
      
      // 4. 주문 마감 상태 체크 (업데이트된 매장 정보 사용)
      if (menuData && menuDate) {
        const finalStoreData = menuData ? {
          ...storeData,
          pickup_time_slots: menuData.pickup_time_slots || storeData.pickup_time_slots,
          delivery_time_slots: (menuData.delivery_time_slots && menuData.delivery_time_slots.length > 0) 
            ? menuData.delivery_time_slots 
            : storeData.delivery_time_slots,
          delivery_fee: menuData.delivery_fee !== undefined ? menuData.delivery_fee : storeData.delivery_fee,
          order_cutoff_time: menuData.order_cutoff_time || storeData.order_cutoff_time,
          minimum_order_amount: menuData.minimum_order_amount !== undefined ? menuData.minimum_order_amount : storeData.minimum_order_amount
        } : storeData;
        
        const orderClosed = checkOrderClosed(finalStoreData, menuDate);
        console.log('주문 마감 상태 체크:', {
          menuDate,
          currentTime: getCurrentKoreaTime().toLocaleString("en-US", {timeZone: "Asia/Seoul"}),
          cutoffTime: finalStoreData.order_cutoff_time,
          orderClosed
        });
        setIsOrderClosed(orderClosed);
        console.log('setIsOrderClosed 호출됨:', orderClosed);
      }
      
      // 4. 카테고리 추출 및 정렬
      const uniqueCategories = [...new Set(menuItems.map(item => item.menu?.category).filter(Boolean))];
      
      // 매장 카테고리에 따른 정렬 순서 가져오기
      const storeCategory = storeData?.category || '한식반찬';
      const categoryOrder = getMenuCategoriesByStoreCategory(storeCategory);
      
      // 카테고리를 지정된 순서대로 정렬
      const sortedCategories = uniqueCategories.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        
        // 순서에 없는 카테고리는 맨 뒤로
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        
        return indexA - indexB;
      });
      
      setCategories(sortedCategories);
      
      // 5. 카테고리를 접힌 상태로 설정 (기본값)
      setExpandedCategories(new Set());
      
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleToggleCart = (menuId: string) => {
    const menuItem = dailyMenuItems.find(item => item.menu_id === menuId);
    if (!menuItem || !menuItem.is_available) return;

    setCart(prev => {
      const newCart = new Map(prev);
      if (newCart.has(menuId)) {
        newCart.delete(menuId);
      } else {
        newCart.set(menuId, 1);
      }
      return newCart;
    });
  };

  const handleQuantityChange = (menuId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => {
        const newCart = new Map(prev);
        newCart.delete(menuId);
        return newCart;
      });
    } else {
      setCart(prev => {
        const newCart = new Map(prev);
        newCart.set(menuId, quantity);
        return newCart;
      });
    }
  };

  // 모든 메뉴 아이템 표시
  const filteredMenuItems = dailyMenuItems;

  const getTotalPrice = () => {
    return Array.from(cart.entries()).reduce((total, [menuId, quantity]) => {
      const menuItem = dailyMenuItems.find(item => item.menu_id === menuId);
      if (menuItem && menuItem.menu) {
        return total + (menuItem.menu.price * quantity);
      }
      return total;
    }, 0);
  };

  const getCartItemCount = () => {
    return Array.from(cart.values()).reduce((total, quantity) => total + quantity, 0);
  };

  const handleGoToCart = () => {
    console.log('🔍 장바구니 이동 시도:', {
      cartSize: cart.size,
      cartItems: Array.from(cart.entries()),
      dailyMenuItems: dailyMenuItems.length
    });

    if (cart.size === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }

    // 매장 정보가 없으면 에러
    if (!store) {
      alert('매장 정보를 불러올 수 없습니다.');
      return;
    }

    // 장바구니에 일일 메뉴 정보 저장 (메뉴 정보 포함)
    const dailyMenuData = Array.from(cart.entries()).map(([menuId, quantity]) => {
      // 해당 메뉴의 상세 정보 찾기
      const menuItem = dailyMenuItems.find(item => item.menu_id === menuId);
      console.log('🔍 메뉴 아이템 찾기:', {
        menuId,
        menuItem,
        dailyMenuItems: dailyMenuItems.length
      });
      
      return {
        menu_id: menuId,
        quantity,
        menu: menuItem?.menu,
        is_available: menuItem?.is_available || false
      };
    }).filter(item => item.menu); // 메뉴 정보가 있는 것만 필터링

    console.log('🔍 저장할 일일 메뉴 데이터:', dailyMenuData);

    // 매장 정보를 localStorage에 저장 (장바구니에서 필요)
    console.log('🔍 저장할 매장 정보:', store);
    console.log('🔍 매장 배달 시간대:', store.delivery_time_slots);
    localStorage.setItem('storeInfo', JSON.stringify(store));
    localStorage.setItem('dailyMenuCart', JSON.stringify({
      items: dailyMenuData,
      menuDate: dailyMenu?.menu_date || date,
      dailyMenuId: dailyMenu?.id
    }));
    localStorage.setItem('dailyMenuInfo', JSON.stringify(dailyMenu));
    
    // 일일 설정값 저장 (배달비, 최소주문금액 등)
    const dailySettings = {
      pickup_time_slots: dailyMenu?.pickup_time_slots,
      delivery_time_slots: dailyMenu?.delivery_time_slots,
      delivery_fee: dailyMenu?.delivery_fee,
      order_cutoff_time: dailyMenu?.order_cutoff_time,
      minimum_order_amount: dailyMenu?.minimum_order_amount
    };
    localStorage.setItem('dailyMenuSettings', JSON.stringify(dailySettings));

    // 일반 장바구니는 비워두기 (일일 메뉴만 주문)
    localStorage.setItem('cart', JSON.stringify([]));

    navigate(`/cart/${storeId}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!dailyMenu) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">메뉴가 없습니다</h1>
            <p className="text-gray-600 mb-6">이 날짜의 메뉴가 준비되지 않았습니다.</p>
            <button
              onClick={() => navigate(`/menu/${storeId}`)}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              일반 메뉴 보기
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 주문 마감 상태일 때의 UI
  if (isOrderClosed) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 모바일 최적화 헤더 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              {/* 왼쪽: 매장명 */}
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-gray-900 truncate">
                  {store?.name || '매장'}
                </h1>
                <span className="text-xs text-gray-500 truncate">{dailyMenu?.title || `${date}의 반찬`}</span>
              </div>
              
              {/* 중앙: 최소주문금액 */}
              <div className="hidden sm:block text-center flex-shrink-0">
                <div className="text-xs text-gray-500">최소주문</div>
                <div className="text-xs font-semibold text-gray-700">{store?.minimum_order_amount?.toLocaleString() || '0'}원</div>
              </div>
              
              {/* 오른쪽: 상태 + 일반메뉴 버튼 */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <i className="ri-close-circle-line text-xs text-red-500"></i>
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    마감
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/menu/${storeId}`)}
                  className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors text-xs"
                >
                  <i className="ri-restaurant-line text-xs"></i>
                  <span className="hidden sm:inline">일반 메뉴</span>
                </button>
              </div>
            </div>
            
            {/* 모바일에서만 표시되는 최소주문금액 */}
            <div className="sm:hidden mt-1 text-center">
              <span className="text-xs text-gray-500">최소주문 {store?.minimum_order_amount?.toLocaleString() || '0'}원</span>
            </div>
          </div>
        </div>

        {/* 주문 마감 안내 */}
        <div className="px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-time-line text-3xl text-red-500"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">주문이 마감되었습니다</h2>
            <p className="text-gray-600 mb-6">
              {dailyMenu.menu_date}의 주문 마감시간이 지났습니다.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                주문 마감시간: {store?.order_cutoff_time || '15:00'}
              </p>
            </div>
            <button
              onClick={() => navigate(`/menu/${storeId}`)}
              className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <i className="ri-restaurant-line text-sm"></i>
              일반 메뉴 보기
            </button>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 페이톡 헤더 - 다른 페이지와 동일 */}
      <div className="bg-white sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center">
            <img 
              src="https://static.readdy.ai/image/912b0945f01d9fdb4ff4544659653c90/2d4890bd82abce85d430bd82d04df8d6.png" 
              alt="페이톡 로고" 
              className="w-12 h-12"
            />
          </div>
        </div>
      </div>

      {/* 매장 정보 헤더 */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-5 py-3">
          <div className="flex items-center justify-between">
            {/* 왼쪽: 상호명 + 주문일시 + 최소주문 */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">
                {store?.name || '매장'}
              </h1>
              <span className="text-xs text-gray-500 truncate">{dailyMenu?.title || `${date}의 반찬`}</span>
              <div className="flex items-center gap-1 mt-1">
                <i className="ri-money-dollar-circle-line text-xs text-gray-500"></i>
                <span className="text-xs text-gray-500">최소주문</span>
                <span className="text-xs font-bold text-gray-900">{store?.minimum_order_amount?.toLocaleString() || '0'}원</span>
              </div>
            </div>
            
            {/* 오른쪽: 상태 + 내주문 버튼 */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                isOrderClosed 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {isOrderClosed ? '마감' : '접수중'}
              </span>
              <button
                onClick={() => navigate(`/order-status/${storeId}`)}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <i className="ri-shopping-bag-3-line text-xs"></i>
                <span>내주문</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 카테고리 필터 */}

      {/* 메뉴 목록 - 아코디언 스타일 */}
      <div className="px-3 pt-4 pb-20">
        <div className="max-w-4xl mx-auto">
          {filteredMenuItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-restaurant-line text-2xl text-orange-500"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">메뉴가 없습니다</h3>
              <p className="text-gray-600 text-sm">이 카테고리에 등록된 메뉴가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 카테고리별로 그룹화 */}
              {categories.map((category) => {
                const categoryItems = filteredMenuItems.filter(item =>
                  item.menu?.category === category
                );
                
                if (categoryItems.length === 0) return null;
                
                const isExpanded = expandedCategories.has(category);
                
                return (
                  <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* 카테고리 헤더 */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <h3 className="text-base font-bold text-gray-900">{category}</h3>
                          <p className="text-xs text-gray-500">{categoryItems.length}개 메뉴</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">
                          {isExpanded ? '접기' : '펼치기'}
                        </span>
                        <i className={`ri-arrow-down-s-line text-lg text-gray-400 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}></i>
                      </div>
                    </button>
                    
                    {/* 카테고리 메뉴 목록 */}
                    <div className={`transition-all duration-300 ${
                      isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                    }`}>
                      <div className="px-3 pt-3 pb-3">
                        <div className="space-y-2">
                          {categoryItems.map((item) => (
                            <div key={item.id} className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 group">
                              {/* 메뉴 정보 */}
                              <div className="p-3">
                                {/* 상단: 메뉴명 + 상태 + 가격 */}
                                <div className="flex justify-between items-start mb-1">
                                  <div className="flex-1 min-w-0 pr-2">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                                        {item.menu?.name || '메뉴 정보 없음'}
                                      </h3>
                                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0 ${
                                        item.is_available
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-red-100 text-red-700'
                                      }`}>
                                        <i className={`ri-${item.is_available ? 'check' : 'close'}-line text-xs`}></i>
                                        {item.is_available ? '판매중' : '품절'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <span className="text-sm font-bold text-gray-900">
                                      {(item.menu?.price || 0).toLocaleString()}원
                                    </span>
                                  </div>
                                </div>

                                {item.menu?.description && (
                                  <p className="text-gray-600 mb-2 line-clamp-2 leading-relaxed text-xs">
                                    {item.menu.description}
                                  </p>
                                )}

                                {/* 장바구니 수량 조절 UI */}
                                <div className="flex items-center justify-end">
                                  {cart.has(item.menu_id) ? (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => {
                                          const currentQuantity = cart.get(item.menu_id) || 0;
                                          handleQuantityChange(item.menu_id, currentQuantity - 1);
                                        }}
                                        disabled={!item.is_available || isOrderClosed}
                                        className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <i className="ri-subtract-line text-xs"></i>
                                      </button>
                                      <span className="w-6 text-center font-semibold text-gray-900 text-sm">
                                        {cart.get(item.menu_id) || 0}
                                      </span>
                                      <button
                                        onClick={() => {
                                          const currentQuantity = cart.get(item.menu_id) || 0;
                                          handleQuantityChange(item.menu_id, currentQuantity + 1);
                                        }}
                                        disabled={!item.is_available || isOrderClosed}
                                        className="w-6 h-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <i className="ri-add-line text-xs"></i>
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleToggleCart(item.menu_id)}
                                      disabled={!item.is_available || isOrderClosed}
                                      className={`px-3 py-1.5 rounded-md font-medium transition-all duration-300 transform hover:scale-105 text-xs ${
                                        item.is_available && !isOrderClosed
                                          ? 'bg-white text-gray-900 hover:bg-gray-900 hover:text-white border border-gray-300 hover:border-gray-900 shadow-sm hover:shadow-lg'
                                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      }`}
                                    >
                                      <i className="ri-add-line mr-1 text-xs"></i>
                                      담기
                                    </button>
                                  )}
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
          )}
        </div>
      </div>

      {/* 메뉴와 푸터 사이 구분선 */}
      <div className="h-px bg-gray-100"></div>

      {/* 장바구니 버튼 */}
      {getCartItemCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="flex items-center justify-between p-3 max-w-4xl mx-auto">
            {/* 왼쪽: 수량 정보 */}
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-gray-900">
                {getCartItemCount()}개
              </div>
              <div className="text-xs text-orange-600 font-medium">
                최소주문 {store?.minimum_order_amount?.toLocaleString() || '0'}원
              </div>
            </div>

            {/* 오른쪽: 장바구니 버튼 */}
            <button
              onClick={handleGoToCart}
              disabled={isOrderClosed}
              className={`px-4 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all duration-200 text-sm ${
                isOrderClosed
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg'
              }`}
            >
              <i className="ri-shopping-cart-line text-sm"></i>
              <span>{getTotalPrice().toLocaleString()}원 주문</span>
            </button>
          </div>
        </div>
      )}


      <Footer />
    </div>
  );
}
