import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNewAuth } from '../../../../../hooks/useNewAuth';
import { 
  getDailyMenu, 
  getDailyMenuItems, 
  getTodayDailyMenu, 
  getTomorrowDailyMenu
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
  initial_quantity: number;
  current_quantity: number;
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
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isOrderClosed, setIsOrderClosed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [categories, setCategories] = useState<string[]>([]);

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
      
      
      // 2. 일일 메뉴 로드
      let menuData: DailyMenu | null = null;
      // 한국 표준시간 기준으로 오늘 날짜 계산
      const now = new Date();
      const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
      let menuDate = date || koreaTime.toISOString().split('T')[0];
      
      try {
        if (date && date.trim() !== '') {
          menuData = await getDailyMenu(storeId, date);
        } else {
          // 날짜가 없으면 오늘 메뉴 로드
          menuData = await getTodayDailyMenu(storeId);
        }
        
        if (!menuData) {
          // 오늘 메뉴가 없으면 내일 메뉴 확인
          const tomorrowMenu = await getTomorrowDailyMenu(storeId);
          if (tomorrowMenu) {
            setDailyMenu(tomorrowMenu);
            const items = await getDailyMenuItems(tomorrowMenu.id);
            setDailyMenuItems(items);
          }
          return;
        }
      } catch (error) {
        console.error('일일 메뉴 로드 중 오류:', error);
        // 오류가 발생해도 계속 진행 (메뉴가 없다고 표시)
        return;
      }
      
      setDailyMenu(menuData);
      
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
      
        // 4. 일일 메뉴 아이템들 로드
        const items = await getDailyMenuItems(menuData.id);
        setDailyMenuItems(items);
        
        // 5. 카테고리 추출
        const uniqueCategories = ['전체', ...new Set(items.map(item => item.menu?.category).filter(Boolean))];
        setCategories(uniqueCategories);
      
      
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleAddToCart = (menuId: string) => {
    // 해당 메뉴의 남은 수량 확인
    const menuItem = dailyMenuItems.find(item => item.menu_id === menuId);
    if (!menuItem) return;
    
    const currentCartQuantity = cart[menuId] || 0;
    if (currentCartQuantity >= menuItem.current_quantity) {
      alert('남은 수량을 초과할 수 없습니다.');
      return;
    }
    
    setCart(prev => ({
      ...prev,
      [menuId]: (prev[menuId] || 0) + 1
    }));
  };

  const handleRemoveFromCart = (menuId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[menuId] > 1) {
        newCart[menuId] -= 1;
      } else {
        delete newCart[menuId];
      }
      return newCart;
    });
  };


  // 카테고리별 필터링된 메뉴 아이템
  const filteredMenuItems = dailyMenuItems.filter(item => {
    if (selectedCategory === '전체') return true;
    return item.menu?.category === selectedCategory;
  });

  const getTotalPrice = () => {
    return dailyMenuItems.reduce((total, item) => {
      const quantity = cart[item.menu_id] || 0;
      return total + ((item.menu?.price || 0) * quantity);
    }, 0);
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
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
      items: Object.entries(cart).map(([menuId, quantity]) => ({
        menuId,
        quantity
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <Header />
      
      {/* 히어로 섹션 - 매장 정보와 메뉴 날짜 */}
      <div className="relative overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-200 via-orange-300 to-orange-400 opacity-60"></div>
        <div className="absolute inset-0 bg-white opacity-40"></div>
        
        {/* 콘텐츠 */}
        <div className="relative px-4 py-8 sm:py-12 text-center">
          {/* 매장명 */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 px-2">
            {store?.name}
          </h1>
          
          {/* 배달 지역 */}
          <div className="flex items-center justify-center gap-2 mb-4 px-2">
            <i className="ri-map-pin-line text-gray-600 text-base sm:text-lg"></i>
            <span className="text-gray-700 font-medium text-sm sm:text-base">{store?.delivery_area}</span>
          </div>
          
          {/* 메뉴 날짜와 상태 */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <i className="ri-calendar-check-line text-gray-600 text-lg sm:text-xl"></i>
              <span className="text-gray-800 font-semibold text-base sm:text-lg">
                {dailyMenu?.title || `${date}의 반찬`}
              </span>
            </div>
            
            {/* 주문 상태 */}
            <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full ${
              isOrderClosed 
                ? 'bg-red-500/80 text-white' 
                : 'bg-green-500/80 text-white'
            }`}>
              <i className={`text-xs sm:text-sm ${
                isOrderClosed 
                  ? 'ri-close-circle-line' 
                  : 'ri-check-circle-line'
              }`}></i>
              <span className="font-medium text-xs sm:text-sm">
                {isOrderClosed ? '주문마감' : '주문접수중'}
              </span>
            </div>
          </div>
          
          {/* 최소주문금액 */}
          <div className="text-gray-700 text-xs sm:text-sm px-2">
            최소주문 <span className="font-bold">{store?.minimum_order_amount?.toLocaleString() || '0'}원</span>
          </div>
        </div>
      </div>

        {/* 주문 마감 안내 */}
        <div className="px-4 py-8 sm:py-12">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 text-center border border-red-100">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <i className="ri-time-line text-3xl sm:text-4xl text-red-500"></i>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">주문이 마감되었습니다</h2>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {dailyMenu.menu_date}의 주문 마감시간이 지났습니다.
              </p>
              <div className="bg-red-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                <p className="text-red-700 font-medium text-sm sm:text-base">
                  주문 마감시간: {store?.order_cutoff_time || '15:00'}
                </p>
              </div>
              <button
                onClick={() => navigate(`/menu/${storeId}`)}
                className="w-full px-6 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
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
      
      {/* 히어로 섹션 - 매장 정보와 메뉴 날짜 */}
      <div className="relative overflow-hidden">
        {/* 배경 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-200 via-orange-300 to-orange-400 opacity-60"></div>
        <div className="absolute inset-0 bg-white opacity-40"></div>
        
        {/* 콘텐츠 */}
        <div className="relative px-4 py-8 sm:py-12 text-center">
          {/* 매장명 */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 px-2">
            {store?.name}
          </h1>
          
          {/* 배달 지역 */}
          <div className="flex items-center justify-center gap-2 mb-4 px-2">
            <i className="ri-map-pin-line text-gray-600 text-base sm:text-lg"></i>
            <span className="text-gray-700 font-medium text-sm sm:text-base">{store?.delivery_area}</span>
          </div>
          
          {/* 메뉴 날짜와 상태 */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2">
              <i className="ri-calendar-check-line text-gray-600 text-lg sm:text-xl"></i>
              <span className="text-gray-800 font-semibold text-base sm:text-lg">
                {dailyMenu?.title || `${date}의 반찬`}
              </span>
            </div>
            
            {/* 주문 상태 */}
            <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full ${
              isOrderClosed 
                ? 'bg-red-500/80 text-white' 
                : 'bg-green-500/80 text-white'
            }`}>
              <i className={`text-xs sm:text-sm ${
                isOrderClosed 
                  ? 'ri-close-circle-line' 
                  : 'ri-check-circle-line'
              }`}></i>
              <span className="font-medium text-xs sm:text-sm">
                {isOrderClosed ? '주문마감' : '주문접수중'}
              </span>
            </div>
          </div>
          
          
          {/* 내 주문 보러가기 버튼 */}
          <button
            onClick={() => navigate(`/order-status/${storeId}`)}
            className="group inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ease-out text-sm sm:text-base"
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
              <i className="ri-shopping-bag-3-line text-xs sm:text-sm"></i>
            </div>
            <span>내 주문 보러가기</span>
          </button>
        </div>
      </div>

      {/* 카테고리 필터 */}
      {categories.length > 0 && (
        <div className="px-4 py-4 sm:py-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6">
              <div className="mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">카테고리</h3>
              </div>
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 transform hover:scale-105 whitespace-nowrap flex-shrink-0 ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-400/30'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메뉴 목록 */}
      <div className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          {filteredMenuItems.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="ri-restaurant-line text-4xl text-orange-400"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">메뉴가 없습니다</h3>
              <p className="text-gray-600 text-lg">이 카테고리에 등록된 메뉴가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {filteredMenuItems.map((item) => (
                <div key={item.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl hover:scale-102 transition-all duration-300 group">
                  {/* 메뉴 정보 */}
                  <div className="p-4 sm:p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors flex-1 pr-2">
                        {item.menu?.name || '메뉴 정보 없음'}
                      </h3>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xl sm:text-2xl font-bold text-orange-600">
                          {(item.menu?.price || 0).toLocaleString()}원
                        </span>
                      </div>
                    </div>
                    
                    {item.menu?.description && (
                      <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed text-sm sm:text-base">
                        {item.menu.description}
                      </p>
                    )}
                    
                    {/* 상태와 수량 정보 */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                        item.is_available 
                          ? 'bg-green-100 text-green-700 border border-green-200' 
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        <i className={`ri-${item.is_available ? 'check' : 'close'}-line text-xs`}></i>
                        {item.is_available ? '주문가능' : '품절'}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                        남은 수량: {item.current_quantity}개
                      </span>
                    </div>
                    
                    {/* 장바구니 수량 조절 UI */}
                    <div className="flex items-center justify-end">
                      {(() => {
                        const cartItem = cart[item.menu_id];
                        
                        if (!cartItem) {
                          // 장바구니에 없는 경우 - 담기 버튼
                          return (
                            <button
                              onClick={() => handleAddToCart(item.menu_id)}
                              disabled={!item.is_available || isOrderClosed}
                              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm ${
                                item.is_available && !isOrderClosed
                                  ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-400/30 hover:shadow-xl hover:shadow-orange-400/40'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              <i className="ri-add-line mr-1"></i>
                              담기
                            </button>
                          );
                        } else {
                          // 장바구니에 있는 경우 - 수량 조절 UI
                          return (
                            <div className="flex items-center gap-2 sm:gap-3 justify-end">
                              {/* 수량 조절 버튼들 */}
                              <div className="flex items-center rounded-xl overflow-hidden">
                                <button
                                  onClick={() => handleRemoveFromCart(item.menu_id)}
                                  disabled={!item.is_available || isOrderClosed}
                                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-orange-600 hover:bg-orange-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <i className="ri-subtract-line text-sm sm:text-lg"></i>
                                </button>
                                <span className="px-3 sm:px-4 py-2 text-orange-700 font-bold text-base sm:text-lg min-w-[2.5rem] sm:min-w-[3rem] text-center bg-white">
                                  {cartItem}
                                </span>
                                <button
                                  onClick={() => handleAddToCart(item.menu_id)}
                                  disabled={!item.is_available || isOrderClosed || item.current_quantity <= cartItem}
                                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-orange-600 hover:bg-orange-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={item.current_quantity <= cartItem ? '남은 수량을 초과할 수 없습니다' : '수량 추가'}
                                >
                                  <i className="ri-add-line text-sm sm:text-lg"></i>
                                </button>
                              </div>
                              
                              {/* 삭제 버튼 */}
                              <button
                                onClick={() => handleRemoveFromCart(item.menu_id)}
                                disabled={!item.is_available || isOrderClosed}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                title="메뉴 삭제"
                              >
                                <i className="ri-delete-bin-line text-sm sm:text-lg"></i>
                              </button>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 메뉴와 푸터 사이 구분선 */}
      <div className="h-px bg-gray-100"></div>

      {/* 장바구니 버튼 */}
      {getCartItemCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-orange-200 shadow-2xl z-50">
          <div className="flex items-center justify-between p-4 sm:p-6 max-w-4xl mx-auto">
            {/* 왼쪽: 가격 정보 */}
            <div className="flex-1 min-w-0">
              <div className="text-lg sm:text-2xl font-bold text-gray-800">
                {getTotalPrice().toLocaleString()}원
              </div>
              <div className="text-xs sm:text-sm text-orange-600 font-medium">
                배달주문 최소주문금액 {store?.minimum_order_amount?.toLocaleString() || '0'}원
              </div>
            </div>
            

            {/* 오른쪽: 장바구니 버튼 */}
            <button
              onClick={handleGoToCart}
              disabled={isOrderClosed}
              className={`px-4 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold flex items-center gap-2 sm:gap-3 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 text-sm sm:text-base ${
                isOrderClosed
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white'
              }`}
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
                <i className="ri-shopping-cart-line text-sm sm:text-lg"></i>
              </div>
              <span className="hidden sm:inline">{getCartItemCount()}개 장바구니 보기</span>
              <span className="sm:hidden">{getCartItemCount()}개</span>
            </button>
          </div>
        </div>
      )}


      <Footer />
    </div>
  );
}
