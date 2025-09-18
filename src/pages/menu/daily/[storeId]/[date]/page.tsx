import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNewAuth } from '../../../../../hooks/useNewAuth';
import { 
  getDailyMenu, 
  getDailyMenuItems, 
  getTodayDailyMenu, 
  getTomorrowDailyMenu,
  getLatestDailyMenu
} from '../../../../../lib/dailyMenuApi';
import { getStore } from '../../../../../lib/storeApi';
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
  const { } = useNewAuth();
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
    
    // 한국 표준시간으로 현재 시간 가져오기
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
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
      now: now.toISOString()
    });
    
    // 과거 날짜인 경우 무조건 주문 마감
    if (isPastDate) {
      console.log('과거 날짜 - 주문 마감');
      return true;
    }
    
    // 미래 날짜인 경우 주문 가능
    if (!isToday && !isYesterday && !isPastDate) {
      console.log('미래 메뉴 - 주문 가능');
      return false;
    }
    
    // 매장의 주문마감시간 가져오기
    const cutoffTime = storeData.order_cutoff_time || '15:00:00';
    
    // 어제 메뉴인 경우 무조건 비활성화 (이미 지난 날)
    if (isYesterday) {
      console.log('어제 메뉴 - 주문 마감');
      return true;
    }
    
    // 오늘 메뉴인 경우 시간 체크
    if (isToday) {
      // 시간을 분으로 변환해서 정확한 비교
      const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const currentMinutes = timeToMinutes(currentTime);
      const cutoffMinutes = timeToMinutes(cutoffTime);
      const isClosed = currentMinutes > cutoffMinutes;
      
      console.log('오늘 메뉴 시간 비교 결과 (분 단위):', {
        currentTime,
        cutoffTime,
        currentMinutes,
        cutoffMinutes,
        isClosed,
        comparison: `${currentMinutes} > ${cutoffMinutes} = ${isClosed}`
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
      
      // 한국 표준시간 기준으로 오늘 날짜 계산
      const now = new Date();
      const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
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
        // 오류가 발생해도 계속 진행 (메뉴가 없다고 표시)
        return;
      }
      
      setDailyMenu(menuData);
      setDailyMenuItems(menuItems);
      
      // 3. 주문 마감 상태 체크
      if (menuData && menuDate) {
        const orderClosed = checkOrderClosed(storeData, menuDate);
        console.log('주문 마감 상태 체크:', {
          menuDate,
          currentTime: new Date().toLocaleString("en-US", {timeZone: "Asia/Seoul"}),
          cutoffTime: storeData.order_cutoff_time,
          orderClosed
        });
        setIsOrderClosed(orderClosed);
        console.log('setIsOrderClosed 호출됨:', orderClosed);
      }
      
      // 4. 카테고리 추출
      const uniqueCategories = ['전체', ...new Set(menuItems.map(item => item.menu?.category).filter(Boolean))];
      setCategories(uniqueCategories);
      
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


  // 모든 메뉴 아이템 표시
  const filteredMenuItems = dailyMenuItems;

  const getTotalPrice = () => {
    return Array.from(cart.entries()).reduce((total, [menuId, quantity]) => {
      const menuItem = dailyMenuItems.find(item => item.menu_id === menuId);
      if (menuItem && menuItem.menu) {
        return total + (menuItem.menu.price || 0) * quantity;
      }
      return total;
    }, 0);
  };

  const getCartItemCount = () => {
    return Array.from(cart.values()).reduce((total, quantity) => total + quantity, 0);
  };


  const handleGoToCart = () => {
    if (getCartItemCount() === 0) {
      alert('장바구니가 비어있습니다.');
      return;
    }
    
    // 매장 정보가 없으면 에러
    if (!store) {
      alert('매장 정보를 불러올 수 없습니다.');
      return;
    }
    
    // 장바구니에 일일 메뉴 정보 저장
    const dailyMenuData = {
      dailyMenuId: dailyMenu?.id,
      menuDate: dailyMenu?.menu_date,
      items: Array.from(cart).map(menuId => ({
        menuId
      })),
    };
    
    // 매장 정보를 localStorage에 저장 (장바구니에서 필요)
    localStorage.setItem('storeInfo', JSON.stringify(store));
    localStorage.setItem('dailyMenuCart', JSON.stringify(dailyMenuData));
    
    // 일반 장바구니는 비워두기 (일일 메뉴만 주문)
    localStorage.setItem('cart', JSON.stringify([]));
    
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!dailyMenu) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-calendar-line text-6xl text-gray-400 mb-4"></i>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">메뉴가 없습니다</h1>
          <p className="text-gray-600 mb-6">이 날짜의 메뉴가 준비되지 않았습니다.</p>
          <button
            onClick={() => navigate(`/menu/${storeId}`)}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            일반 메뉴 보기
          </button>
        </div>
      </div>
    );
  }

  // 주문 마감 상태일 때의 UI
  if (isOrderClosed) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* 모바일 최적화 헤더 */}
      <div className="bg-white border-b border-gray-200 px-3 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate leading-tight">
                {store?.name}
              </h1>
              <div className="flex flex-col gap-1 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <i className="ri-map-pin-line text-xs text-gray-500 flex-shrink-0"></i>
                  <span className="text-xs text-gray-600 truncate">{store?.delivery_area}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <i className="ri-calendar-line text-xs text-gray-500 flex-shrink-0"></i>
                  <span className="text-xs text-gray-600 truncate">{dailyMenu?.title || `${date}의 반찬`}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <i className="ri-truck-line text-xs text-gray-500 flex-shrink-0"></i>
                  <span className="text-xs text-gray-600">최소주문 {store?.minimum_order_amount?.toLocaleString() || '0'}원</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <i className="ri-close-circle-line text-xs text-red-500 flex-shrink-0"></i>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    주문마감
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/menu/${storeId}`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors text-xs flex-shrink-0"
            >
              <i className="ri-restaurant-line text-xs"></i>
              <span>일반 메뉴</span>
            </button>
          </div>
        </div>
      </div>

      {/* 주문 마감 안내 */}
      <div className="px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-time-line text-2xl text-red-500"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">주문이 마감되었습니다</h2>
            <p className="text-gray-600 mb-4 text-sm">
              {dailyMenu.menu_date}의 주문 마감시간이 지났습니다.
            </p>
            <div className="bg-red-50 rounded-lg p-3 mb-4">
              <p className="text-red-700 font-medium text-sm">
                주문 마감시간: {store?.order_cutoff_time || '15:00'}
              </p>
            </div>
            <button
              onClick={() => navigate(`/menu/${storeId}`)}
              className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              일반 메뉴 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <Header />
      
      {/* 모바일 최적화 헤더 */}
      <div className="bg-white border-b border-gray-200 px-3 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate leading-tight">
                {store?.name}
              </h1>
              <div className="flex flex-col gap-1 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <i className="ri-map-pin-line text-xs text-gray-500 flex-shrink-0"></i>
                  <span className="text-xs text-gray-600 truncate">{store?.delivery_area}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <i className="ri-calendar-line text-xs text-gray-500 flex-shrink-0"></i>
                  <span className="text-xs text-gray-600 truncate">{dailyMenu?.title || `${date}의 반찬`}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <i className="ri-truck-line text-xs text-gray-500 flex-shrink-0"></i>
                  <span className="text-xs text-gray-600">최소주문 {store?.minimum_order_amount?.toLocaleString() || '0'}원</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <i className={`text-xs flex-shrink-0 ${
                    isOrderClosed ? 'ri-close-circle-line text-red-500' : 'ri-check-circle-line text-green-500'
                  }`}></i>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isOrderClosed 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {isOrderClosed ? '주문마감' : '주문접수중'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/order-status/${storeId}`)}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors text-xs flex-shrink-0"
            >
              <i className="ri-shopping-bag-3-line text-xs"></i>
              <span>내 주문</span>
            </button>
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
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
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
                    <div className={`overflow-hidden ${
                      isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="px-4 pt-4 pb-4">
                        <div className="space-y-3">
                          {categoryItems.map((item) => (
                            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 group">
                              {/* 메뉴 정보 */}
                              <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition-colors flex-1 pr-2">
                                    {item.menu?.name || '메뉴 정보 없음'}
                                  </h3>
                                  <div className="text-right flex-shrink-0">
                                    <span className="text-lg font-bold text-gray-900">
                                      {(item.menu?.price || 0).toLocaleString()}원
                                    </span>
                                  </div>
                                </div>

                                {item.menu?.description && (
                                  <p className="text-gray-600 mb-3 line-clamp-2 leading-relaxed text-sm">
                                    {item.menu.description}
                                  </p>
                                )}

                                {/* 상태 정보 */}
                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                                    item.is_available
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    <i className={`ri-${item.is_available ? 'check' : 'close'}-line text-xs`}></i>
                                    {item.is_available ? '판매가능' : '품절'}
                                  </span>
                                </div>

                                {/* 장바구니 수량 조절 UI */}
                                <div className="flex items-center justify-end">
                                  {cart.has(item.menu_id) ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          const currentQuantity = cart.get(item.menu_id) || 0;
                                          handleQuantityChange(item.menu_id, currentQuantity - 1);
                                        }}
                                        disabled={!item.is_available || isOrderClosed}
                                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <i className="ri-subtract-line text-sm"></i>
                                      </button>
                                      <span className="w-8 text-center font-semibold text-gray-900">
                                        {cart.get(item.menu_id) || 0}
                                      </span>
                                      <button
                                        onClick={() => {
                                          const currentQuantity = cart.get(item.menu_id) || 0;
                                          handleQuantityChange(item.menu_id, currentQuantity + 1);
                                        }}
                                        disabled={!item.is_available || isOrderClosed}
                                        className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <i className="ri-add-line text-sm"></i>
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleToggleCart(item.menu_id)}
                                      disabled={!item.is_available || isOrderClosed}
                                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm ${
                                        item.is_available && !isOrderClosed
                                          ? 'bg-white text-gray-900 hover:bg-gray-900 hover:text-white border border-gray-300 hover:border-gray-900 shadow-sm hover:shadow-lg'
                                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                      }`}
                                    >
                                      <i className="ri-add-line mr-1"></i>
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
