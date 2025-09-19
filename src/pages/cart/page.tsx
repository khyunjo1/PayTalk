import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../../lib/orderApi';
import { getDeliveryAreas, getDeliveryFeeByAreaId } from '../../lib/deliveryAreaApi';
import { supabase } from '../../lib/supabase';
import Footer from '../../components/Footer';

// Cart 페이지는 인증 없이 접근 가능하도록 별도 Header 사용
const CartHeader = () => {
  
  return (
    <div className="bg-white">
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
  );
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
  quantity?: number;
  originalMenuId?: string;
}

interface StoreInfo {
  id: string;
  name: string;
  phone: string;
  business_hours_start?: string;
  business_hours_end?: string;
  order_cutoff_time?: string;
  minimum_order_amount?: number;
  pickup_time_slots?: string[];
  delivery_time_slots?: Array<{
    name: string;
    start: string;
    end: string;
    enabled: boolean;
  }>;
}


// 날짜를 월/일 형식으로 변환하는 함수 (한국 표준시간 기준)
const formatDate = (dateString: string): string => {
  // YYYY-MM-DD 형식의 문자열을 직접 파싱 (시간대 무시)
  const [, month, day] = dateString.split('-').map(Number);
  return `${month}/${day}`;
};

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'zeropay'>('bank_transfer');
  const [loading, setLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [dailyMenuCartData, setDailyMenuCartData] = useState<any>(null);
  const [deliveryAreas, setDeliveryAreas] = useState<any[]>([]);
  const [selectedDeliveryArea, setSelectedDeliveryArea] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const hasLoaded = useRef(false);

  // deliveryDate 계산 (useEffect 외부에서)
  const getDeliveryDate = () => {
    // 일일 메뉴 데이터가 있으면 해당 날짜 사용
    if (dailyMenuCartData?.menuDate) {
      return dailyMenuCartData.menuDate;
    }
    
    if (!storeInfo) {
      // 한국 표준시간 기준으로 오늘 날짜 반환
      const now = new Date();
      const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
      return koreaTime.toISOString().split('T')[0];
    }
    
    // 한국 시간대 기준으로 현재 시간 계산
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
    
    const cutoffTime = storeInfo.order_cutoff_time || '15:00';
    const [cutoffHour, cutoffMinute] = cutoffTime.split(':').map(Number);
    
    const today = new Date(koreaTime);
    const cutoffToday = new Date(today);
    cutoffToday.setHours(cutoffHour, cutoffMinute, 0, 0);
    
    // 현재 시간이 주문접수시간을 지났으면 다음날로 설정
    const result = koreaTime > cutoffToday 
      ? new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : today.toISOString().split('T')[0];
    
    return result;
  };

  // 배달/픽업 날짜 계산
  const calculateDeliveryDate = (menuDate?: string, storeInfo?: any) => {
    // 일일 메뉴 데이터가 있으면 해당 날짜 사용
    if (menuDate) {
      return menuDate;
    }
    
    if (!storeInfo) return new Date().toISOString().split('T')[0];
    
    // 한국 시간대 기준으로 현재 시간 계산
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
    
    const cutoffTime = storeInfo.order_cutoff_time || '15:00';
    const [cutoffHour, cutoffMinute] = cutoffTime.split(':').map(Number);
    
    const today = new Date(koreaTime);
    const cutoffToday = new Date(today);
    cutoffToday.setHours(cutoffHour, cutoffMinute, 0, 0);
    
    // 현재 시간이 주문접수시간을 지났으면 다음날로 설정
    const result = koreaTime > cutoffToday 
      ? new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : today.toISOString().split('T')[0];
    
    return result;
  };

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    
    console.log('🔍 장바구니 페이지 useEffect 실행됨');
    const loadCartData = async () => {
      const savedCart = localStorage.getItem('cart');
      const savedStoreInfo = localStorage.getItem('storeInfo');
      const dailyMenuCart = localStorage.getItem('dailyMenuCart');
      const dailyMenuSettings = localStorage.getItem('dailyMenuSettings');
      
      console.log('🔍 localStorage 데이터 확인:', {
        savedCart: savedCart ? JSON.parse(savedCart) : null,
        savedStoreInfo: savedStoreInfo ? JSON.parse(savedStoreInfo) : null,
        dailyMenuCart: dailyMenuCart ? JSON.parse(dailyMenuCart) : null,
        dailyMenuSettings: dailyMenuSettings ? JSON.parse(dailyMenuSettings) : null
      });
      
      if (savedCart && savedStoreInfo) {
        setCart(JSON.parse(savedCart));
        const store = JSON.parse(savedStoreInfo);
        console.log('로드된 매장 정보:', store);
        console.log('배달 시간대 슬롯:', store.delivery_time_slots);
        setStoreInfo(store);
        
        // 배달지역 데이터 로드
        try {
          const areas = await getDeliveryAreas(store.id);
          setDeliveryAreas(areas);
          
          // 첫 번째 배달지역을 기본 선택으로 설정
          if (areas.length > 0) {
            setSelectedDeliveryArea(areas[0].id);
          }
        } catch (error) {
          console.error('배달지역 로드 실패:', error);
        }
        
        // 일일 메뉴 장바구니 데이터 처리
        if (dailyMenuCart) {
          try {
            const dailyMenuData = JSON.parse(dailyMenuCart);
            console.log('일일 메뉴 장바구니 데이터:', dailyMenuData);
            setDailyMenuCartData(dailyMenuData);
            
            // 일일 메뉴 설정값 적용
            if (dailyMenuSettings) {
              const settings = JSON.parse(dailyMenuSettings);
              console.log('일일 메뉴 설정값 적용:', settings);
              
              // 매장 정보에 일일 설정값 적용
              const updatedStore = {
                ...store,
                pickup_time_slots: settings.pickup_time_slots || store.pickup_time_slots,
                delivery_time_slots: settings.delivery_time_slots || store.delivery_time_slots,
                delivery_fee: settings.delivery_fee !== undefined ? settings.delivery_fee : store.delivery_fee,
                order_cutoff_time: settings.order_cutoff_time || store.order_cutoff_time,
                minimum_order_amount: settings.minimum_order_amount !== undefined ? settings.minimum_order_amount : store.minimum_order_amount
              };
              
              setStoreInfo(updatedStore);
              console.log('일일 설정값이 적용된 매장 정보:', updatedStore);
            }
            
            // 일일 메뉴 날짜로 배달 날짜 설정
            console.log('일일 메뉴 날짜 설정:', dailyMenuData.menuDate);
            
            // 일일 메뉴 아이템들을 장바구니에 추가 (메뉴 정보가 이미 포함되어 있음)
            try {
              console.log('🔍 일일 메뉴 데이터:', dailyMenuData);
              
              // 일일 메뉴 데이터에 메뉴 정보가 포함되어 있는지 확인
              const hasMenuInfo = dailyMenuData.items.some((item: any) => item.menuInfo);
              
              if (hasMenuInfo) {
                // 메뉴 정보가 포함된 경우 직접 사용
                const dailyMenuItems = dailyMenuData.items.map((item: any, index: number) => {
                  const quantity = item.quantity || 1;
                  const menuInfo = item.menuInfo;
                  
                  return {
                    id: `daily-${index}-${Date.now()}-${item.menuId}`,
                    originalMenuId: item.menuId,
                    name: menuInfo?.name || `메뉴-${item.menuId}`,
                    price: (menuInfo?.price || 0) * quantity,
                    quantity: quantity,
                    available: menuInfo?.is_available !== false
                  };
                });
                
                console.log('✅ 메뉴 정보 포함 아이템들:', dailyMenuItems);
                setCart(dailyMenuItems);
              } else {
                // 메뉴 정보가 없는 경우 API 호출로 가져오기 (기존 방식)
                const menuIds = dailyMenuData.items.map((item: any) => item.menuId);
                console.log('🔍 메뉴 ID 목록:', menuIds);
                
                if (!menuIds || menuIds.length === 0) {
                  console.warn('⚠️ 메뉴 ID가 없습니다. 빈 장바구니로 설정합니다.');
                  setCart([]);
                  return;
                }
                
                const validMenuIds = menuIds.filter((id: any) => id && typeof id === 'string');
                if (validMenuIds.length === 0) {
                  console.warn('⚠️ 유효한 메뉴 ID가 없습니다. 빈 장바구니로 설정합니다.');
                  setCart([]);
                  return;
                }
                
                console.log('🔍 유효한 메뉴 ID:', validMenuIds);
                
                const { data: menuData, error } = await supabase
                  .from('menus')
                  .select('id, name, price, is_available')
                  .in('id', validMenuIds);
                  
                if (error) {
                  console.error('❌ 메뉴 데이터 조회 오류:', error);
                  throw error;
                }

                if (menuData) {
                  const dailyMenuItems = dailyMenuData.items.map((item: any, index: number) => {
                    const menu = menuData.find(m => m.id === item.menuId);
                    const quantity = item.quantity || 1;
                    return {
                      id: `daily-${index}-${Date.now()}-${item.menuId}`,
                      originalMenuId: item.menuId,
                      name: menu?.name || `메뉴-${item.menuId}`,
                      price: (menu?.price || 0) * quantity,
                      quantity: quantity,
                      available: menu?.is_available !== false
                    };
                  });

                  setCart(dailyMenuItems);
                }
              }
            } catch (error) {
              console.error('메뉴 정보 가져오기 오류:', error);
              // 에러 발생 시에도 수량 정보를 유지하여 장바구니에 표시
              const dailyMenuItems = dailyMenuData.items.map((item: any, index: number) => {
                const quantity = item.quantity || 1;
                return {
                  id: `daily-${index}-${Date.now()}-${item.menuId}`,
                  originalMenuId: item.menuId,
                  name: `메뉴-${item.menuId}`,
                  price: 0,
                  quantity: quantity,
                  available: true
                };
              });
              console.log('🔍 에러 발생 시 생성된 아이템들:', dailyMenuItems);
              setCart(dailyMenuItems);
            }
          } catch (error) {
            console.error('일일 메뉴 장바구니 데이터 파싱 오류:', error);
          }
        } else {
          // 일반 메뉴의 경우 배달 날짜 계산
          const calculatedDate = calculateDeliveryDate(undefined, store);
          console.log('일반 메뉴 날짜 설정:', calculatedDate);
        }
        
        // 배달 가능 시간이 있으면 첫 번째 시간을 기본값으로 설정
        if (store.delivery_time_slots && store.delivery_time_slots.length > 0) {
          const enabledSlots = store.delivery_time_slots.filter((slot: { enabled: boolean }) => slot.enabled);
          if (enabledSlots.length > 0) {
            setDeliveryTime(`${enabledSlots[0].name} (${enabledSlots[0].start}-${enabledSlots[0].end})`);
          }
        }
        
        // 픽업 시간 기본값 설정 (매장 영업시간 시작 + 1시간)
        const startHour = parseInt(store.business_hours_start?.split(':')[0] || '9');
        const defaultHour = (startHour + 1).toString().padStart(2, '0');
        setPickupTime(`${defaultHour}:00`);
        
        setLoading(false);
      } else {
        console.log('⚠️ localStorage에 필요한 데이터가 없습니다. 홈으로 이동합니다.');
        setLoading(false);
        navigate('/');
      }
    };

    loadCartData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 배달지역 변경 시 배달비 업데이트
  useEffect(() => {
    const updateDeliveryFee = async () => {
      console.log('🔍 배달비 업데이트 시도:', { selectedDeliveryArea, orderType });
      
      if (selectedDeliveryArea && orderType === 'delivery') {
        try {
          const fee = await getDeliveryFeeByAreaId(selectedDeliveryArea);
          console.log('✅ 배달비 조회 성공:', fee);
          setDeliveryFee(fee);
        } catch (error) {
          console.error('❌ 배달비 조회 실패:', error);
          setDeliveryFee(0);
        }
      } else {
        console.log('⚠️ 배달비 0으로 설정:', { selectedDeliveryArea, orderType });
        setDeliveryFee(0);
      }
    };

    updateDeliveryFee();
  }, [selectedDeliveryArea, orderType]);

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">로딩 중...</h2>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  console.log('🔍 장바구니 상태 확인:', {
    storeInfo: !!storeInfo,
    cartLength: cart.length,
    cart: cart
  });

  if (!storeInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-store-line text-6xl text-gray-300 mb-4"></i>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">매장 정보를 찾을 수 없습니다</h2>
          <p className="text-gray-500 mb-4">매장을 선택하고 다시 시도해주세요</p>
          <button
            onClick={() => navigate('/stores')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg whitespace-nowrap cursor-pointer"
          >
            매장으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-shopping-cart-line text-6xl text-gray-300 mb-4"></i>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">장바구니가 비어있습니다</h2>
          <p className="text-gray-500 mb-4">맛있는 반찬을 담아보세요</p>
          <button
            onClick={() => navigate('/stores')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg whitespace-nowrap cursor-pointer"
          >
            매장으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const subtotal = cart.filter(item => item.available).reduce((sum, item) => sum + item.price, 0);
  const total = subtotal + (orderType === 'delivery' ? deliveryFee : 0);
  
  // 최소주문금액 체크 (배달만)
  const minimumOrderAmount = storeInfo?.minimum_order_amount || 0;
  const isMinimumOrderMet = orderType === 'pickup' || subtotal >= minimumOrderAmount;
  const remainingAmount = minimumOrderAmount - subtotal;


  const removeItem = (itemId: string) => {
    const updatedCart = cart.filter(item => item.id !== itemId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleOrder = async () => {
    if (isOrdering) return; // 이미 주문 중이면 무시
    
    if (!storeInfo) {
      alert('매장 정보를 찾을 수 없습니다.');
      return;
    }

    // 고객 정보 유효성 검사
    if (!customerName.trim()) {
      alert('고객명을 입력해주세요.');
      return;
    }

    if (!customerPhone.trim()) {
      alert('전화번호를 입력해주세요.');
      return;
    }

    // 전화번호 형식 검사 (010-0000-0000 또는 01000000000)
    const phoneRegex = /^010-?\d{4}-?\d{4}$/;
    if (!phoneRegex.test(customerPhone.replace(/\s/g, ''))) {
      alert('전화번호를 올바르게 입력해주세요.\n\n예: 010-1234-5678 또는 01012345678\n\n알림톡 발송을 위해 정확한 전화번호가 필요합니다.');
      return;
    }

    // 유효성 검사
    if (orderType === 'delivery') {
      if (!deliveryAddress.trim()) {
        alert('배달 주소를 입력해주세요.');
        return;
      }
      if (!deliveryTime) {
        alert('배달 희망 시간을 선택해주세요.');
        return;
      }
      // 배달 시 최소주문금액 체크
      if (subtotal < minimumOrderAmount) {
        alert(`최소주문금액 ${minimumOrderAmount.toLocaleString()}원을 맞춰주세요.\n\n현재 주문금액: ${subtotal.toLocaleString()}원\n부족한 금액: ${remainingAmount.toLocaleString()}원`);
        return;
      }
    } else {
      if (!pickupTime) {
        alert('픽업 희망 시간을 선택해주세요.');
        return;
      }
      // 픽업은 최소주문금액 체크 없음
    }

    // 무통장입금인 경우에만 입금자명 검사
    if (paymentMethod === 'bank_transfer' && !depositorName.trim()) {
      alert('입금자명을 입력해주세요.');
      return;
    }

    setIsOrdering(true);
    try {
      // 주문접수시간 확인 후 배달날짜 자동 설정
      // deliveryDate는 이미 컴포넌트 레벨에서 계산됨

      // 주문 데이터 준비 (임시 사용자 ID 생성 - UUID 형식)
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      // 배달/픽업 시간을 그대로 저장 (타임스탬프 변환 없이)
      console.log('🔍 디버깅 - deliveryTime:', deliveryTime);
      console.log('🔍 디버깅 - pickupTime:', pickupTime);

      const orderData = {
        user_id: generateUUID(),
        store_id: storeInfo.id,
        order_type: orderType,
        delivery_address: orderType === 'delivery' ? deliveryAddress : undefined,
        delivery_time: orderType === 'delivery' ? deliveryTime : undefined,
        pickup_time: orderType === 'pickup' ? pickupTime : undefined,
        special_requests: specialRequests || undefined,
        depositor_name: paymentMethod === 'bank_transfer' ? depositorName : undefined,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: orderType === 'delivery' ? deliveryAddress : undefined,
        subtotal: subtotal,
        delivery_fee: orderType === 'delivery' ? deliveryFee : 0,
        total: total,
        delivery_area_id: (orderType === 'delivery' && selectedDeliveryArea && selectedDeliveryArea.trim() !== '') ? selectedDeliveryArea : undefined,
        payment_method: paymentMethod,
        items: cart.filter(item => item.available).map(item => {
          const menuId = (item as any).originalMenuId || item.id;
          if (!menuId || menuId.trim() === '') {
            console.error('유효하지 않은 menu_id:', item);
            throw new Error('메뉴 ID가 유효하지 않습니다.');
          }
          return {
            menu_id: menuId,
            price: item.quantity ? item.price / item.quantity : item.price, // 단가로 저장
            quantity: item.quantity || 1
          };
        }),
        // 일일 메뉴 데이터 추가
        daily_menu_data: dailyMenuCartData ? {
          daily_menu_id: dailyMenuCartData.dailyMenuId && dailyMenuCartData.dailyMenuId.trim() !== '' ? dailyMenuCartData.dailyMenuId : undefined,
          menu_date: dailyMenuCartData.menuDate,
          items: dailyMenuCartData.items
        } : undefined
      };

      // 주문 생성
      const order = await createOrder(orderData);
      
      if (order) {
        // 장바구니 및 매장 정보 초기화
        localStorage.removeItem('cart');
        localStorage.removeItem('storeInfo');
        localStorage.removeItem('dailyMenuCart');
        
        // 주문 완료 페이지로 이동 (주문 ID 전달)
        navigate(`/order-complete/${order.id}`);
      } else {
        alert('주문 생성에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('주문 생성 오류:', error);
      alert('주문 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <CartHeader />
      
      {/* 페이지 제목 - cart 페이지 전용 */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
          >
            <i className="ri-arrow-left-line text-xl"></i>
          </button>
          <h1 className="text-lg font-semibold ml-2">주문하기</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-8">
        {/* 주문 방식 선택 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-orange-300 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <i className="ri-shopping-bag-line text-orange-500 text-lg"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-800">주문 방식</h2>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setOrderType('delivery')}
              className={`flex-1 py-4 px-6 rounded-xl border-2 text-center cursor-pointer transition-all duration-300 font-semibold ${
                orderType === 'delivery'
                  ? 'border-orange-500 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105'
                  : 'border-gray-300 text-gray-600 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <i className="ri-truck-line text-lg"></i>
                <span className="text-base">배달</span>
              </div>
            </button>
            <button
              onClick={() => setOrderType('pickup')}
              className={`flex-1 py-4 px-6 rounded-xl border-2 text-center cursor-pointer transition-all duration-300 font-semibold ${
                orderType === 'pickup'
                  ? 'border-orange-500 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105'
                  : 'border-gray-300 text-gray-600 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <i className="ri-store-3-line text-lg"></i>
                <span className="text-base">픽업</span>
              </div>
            </button>
          </div>
        </div>

        {/* 배달지역 선택 */}
        {orderType === 'delivery' && deliveryAreas.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <i className="ri-map-pin-line text-orange-500"></i>
              배달지역 선택
            </h3>
            
            {/* 최소주문금액 안내 */}
            {!isMinimumOrderMet && (
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-center gap-2 text-orange-700">
                  <i className="ri-information-line text-lg"></i>
                  <span className="font-semibold">최소주문금액 미달</span>
                </div>
                <p className="text-sm text-orange-600 mt-1">
                  {remainingAmount.toLocaleString()}원 더 담으면 주문 가능합니다
                </p>
              </div>
            )}
            <div className="grid gap-3">
              {deliveryAreas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => setSelectedDeliveryArea(area.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedDeliveryArea === area.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-800">{area.area_name}</h4>
                      <p className="text-sm text-gray-600">배달 가능 지역</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-orange-600">
                        {area.delivery_fee.toLocaleString()}원
                      </p>
                      <p className="text-xs text-gray-500">배달비</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 고객 정보 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-orange-300 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <i className="ri-user-line text-orange-500 text-lg"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-800">고객 정보</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">
                고객명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="이름을 입력해주세요"
                className="w-full p-4 border-2 border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200 hover:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">
                전화번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => {
                  const numbers = e.target.value.replace(/[^0-9]/g, '');
                  const limited = numbers.slice(0, 11);
                  setCustomerPhone(limited);
                }}
                placeholder="01023432321"
                className="w-full p-4 border-2 border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200 hover:border-gray-400"
              />
              <div className="text-sm text-gray-500 mt-2">
                숫자만 입력하세요 (예: 01023432321)
              </div>
            </div>
          </div>
        </div>

        {/* 배달 정보 */}
        {orderType === 'delivery' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-orange-300 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <i className="ri-truck-line text-orange-500 text-lg"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-800">배달 정보</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-2">
                  배달 주소 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="상세 주소를 입력해주세요"
                  className="w-full p-4 border-2 border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200 hover:border-gray-400"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-4">
                  배달 시간대 선택 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {(storeInfo as any)?.delivery_time_slots?.filter((slot: any) => slot.enabled).map((slot: any) => (
                    <button
                      key={slot.name}
                      onClick={() => setDeliveryTime(`${slot.name} (${slot.start}-${slot.end})`)}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        deliveryTime === `${slot.name} (${slot.start}-${slot.end})`
                          ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-md'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:bg-orange-25'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center">
                          {deliveryTime === `${slot.name} (${slot.start}-${slot.end})` && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            <i className="ri-truck-line"></i>
                            {slot.name}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {formatDate(getDeliveryDate())} {slot.start} - {slot.end}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  원하는 배달 시간대를 선택하세요
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  배달 요청사항
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="특별한 요청사항이 있으시면 입력해주세요"
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 픽업 정보 */}
        {orderType === 'pickup' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-orange-300 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <i className="ri-store-3-line text-orange-500 text-lg"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-800">픽업 정보</h2>
            </div>
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <div className="font-bold text-lg text-gray-800 mb-2">{storeInfo?.name}</div>
                <div className="text-base text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <i className="ri-time-line text-orange-500"></i>
                    <span>영업시간: {(storeInfo as any)?.business_hours_start || '09:00'} ~ {(storeInfo as any)?.business_hours_end || '21:00'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="ri-phone-line text-orange-500"></i>
                    <span>전화번호: {storeInfo?.phone}</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-800 mb-4">
                  픽업 희망 시간 <span className="text-red-500">*</span>
                </label>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-6 shadow-sm">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
                      <i className="ri-time-line text-orange-500"></i>
                      <span className="text-sm font-semibold text-gray-700">픽업 희망 시간을 선택하세요</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-6 items-start">
                    {/* 시간 선택 */}
                    <div className="flex-1">
                      <div className="text-center mb-3">
                        <span className="text-xs font-bold text-gray-600 bg-white px-3 py-1 rounded-full">시간</span>
                      </div>
                      <div className="h-40 overflow-y-auto border-2 border-white rounded-xl bg-white shadow-inner">
                        <div className="py-2">
                          {(() => {
                            const startHour = parseInt((storeInfo as any)?.business_hours_start?.split(':')[0] || '9');
                            const endHour = parseInt((storeInfo as any)?.business_hours_end?.split(':')[0] || '21');
                            return Array.from({ length: endHour - startHour + 1 }, (_, i) => {
                              const hour = (startHour + i).toString().padStart(2, '0');
                              return (
                                <div
                                  key={hour}
                                  onClick={() => {
                                    const currentMinute = pickupTime.split(':')[1] || '00';
                                    setPickupTime(`${hour}:${currentMinute}`);
                                  }}
                                  className={`px-4 py-3 text-center cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                                    pickupTime.startsWith(hour)
                                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-md'
                                      : 'hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 text-gray-700 font-medium'
                                  }`}
                                >
                                  {hour}시
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    {/* 분 선택 */}
                    <div className="flex-1">
                      <div className="text-center mb-3">
                        <span className="text-xs font-bold text-gray-600 bg-white px-3 py-1 rounded-full">분</span>
                      </div>
                      <div className="h-40 overflow-y-auto border-2 border-white rounded-xl bg-white shadow-inner">
                        <div className="py-2">
                          {['00', '10', '20', '30', '40', '50'].map((minute) => (
                            <div
                              key={minute}
                              onClick={() => {
                                const currentHour = pickupTime.split(':')[0] || '00';
                                setPickupTime(`${currentHour}:${minute}`);
                              }}
                              className={`px-4 py-3 text-center cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                                pickupTime.endsWith(minute)
                                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-md'
                                  : 'hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 text-gray-700 font-medium'
                              }`}
                            >
                              {minute}분
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 선택된 시간 표시 */}
                  <div className="text-center mt-6">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-2xl shadow-lg border border-orange-200">
                      <i className="ri-time-line text-orange-500 text-lg"></i>
                      <span className="font-bold text-gray-800">선택된 시간: </span>
                      <span className="font-bold text-orange-600 text-lg">{pickupTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 결제 방식 선택 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-orange-300 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <i className="ri-bank-card-line text-orange-500 text-lg"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-800">결제 방식</h2>
          </div>
          
          {/* 결제 방식 선택 버튼 */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setPaymentMethod('bank_transfer')}
              className={`py-4 px-4 rounded-xl border-2 text-center cursor-pointer transition-all duration-300 font-semibold ${
                paymentMethod === 'bank_transfer'
                  ? 'border-orange-500 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105'
                  : 'border-gray-300 text-gray-600 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <i className="ri-bank-line text-xl"></i>
                <span className="text-sm">무통장입금</span>
              </div>
            </button>
            <button
              onClick={() => setPaymentMethod('zeropay')}
              className={`py-4 px-4 rounded-xl border-2 text-center cursor-pointer transition-all duration-300 font-semibold ${
                paymentMethod === 'zeropay'
                  ? 'border-orange-500 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105'
                  : 'border-gray-300 text-gray-600 hover:border-orange-300 hover:bg-orange-50 hover:shadow-md'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <i className="ri-qr-code-line text-xl"></i>
                <span className="text-sm">제로페이</span>
              </div>
            </button>
          </div>

          {/* 무통장입금 선택 시 입금자명 입력 */}
          {paymentMethod === 'bank_transfer' && (
            <div>
              <label className="block text-base font-semibold text-gray-800 mb-2">
                입금자명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={depositorName}
                onChange={(e) => setDepositorName(e.target.value)}
                placeholder="입금자명을 입력해주세요"
                className="w-full p-4 border-2 border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all duration-200 hover:border-gray-400"
              />
            </div>
          )}

          {/* 제로페이 선택 시 안내 메시지 */}
          {paymentMethod === 'zeropay' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <i className="ri-information-line text-lg"></i>
                <span className="font-semibold">제로페이 결제 안내</span>
              </div>
              <p className="text-sm text-blue-600">
                주문 완료 후 제로페이 QR 코드를 통해 결제하실 수 있습니다.
              </p>
            </div>
          )}
        </div>

        {/* 주문 상품 및 결제 금액 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-orange-300 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <i className="ri-shopping-cart-line text-orange-500 text-lg"></i>
            </div>
            <h2 className="text-xl font-bold text-gray-800">주문 상품</h2>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-3 pr-2 mb-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {item.name}
                        {item.quantity && item.quantity > 1 && (
                          <span className="ml-2 text-sm text-gray-500">x{item.quantity}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{(item.price || 0).toLocaleString()}원</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.available ? '판매가능' : '품절'}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                        title="메뉴 삭제"
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 주문 요약 */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">상품 금액</span>
              <span className="text-gray-800">{subtotal.toLocaleString()}원</span>
            </div>
            {orderType === 'delivery' && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">배달비</span>
                <span className="text-gray-800">{deliveryFee.toLocaleString()}원</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="font-bold text-lg text-gray-800">총 결제 금액</span>
              <span className="font-bold text-2xl text-orange-500">{total.toLocaleString()}원</span>
            </div>
          </div>
        </div>
      </div>

      {/* 주문하기 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-6 shadow-2xl">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleOrder}
            disabled={isOrdering || !isMinimumOrderMet}
            className={`w-full py-5 px-6 rounded-2xl font-bold text-xl whitespace-nowrap transition-all duration-300 shadow-xl ${
              isOrdering || !isMinimumOrderMet
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-2xl transform hover:scale-[1.02] cursor-pointer'
            } text-white`}
          >
            <div className="flex items-center justify-center gap-3">
              {isOrdering ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>주문 처리 중...</span>
                </>
              ) : !isMinimumOrderMet ? (
                <>
                  <i className="ri-information-line text-2xl"></i>
                  <span>최소주문금액 미달</span>
                </>
              ) : (
                <>
                  <i className="ri-shopping-bag-line text-2xl"></i>
                  <span>{total.toLocaleString()}원 주문하기</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
