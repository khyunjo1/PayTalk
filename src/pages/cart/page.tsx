import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../../lib/orderApi';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface StoreInfo {
  id: string;
  name: string;
  phone: string;
  business_hours_start?: string;
  business_hours_end?: string;
  order_cutoff_time?: string;
  pickup_time_slots?: string[];
  delivery_time_slots?: Array<{
    name: string;
    start: string;
    end: string;
    enabled: boolean;
  }>;
}

// 시간 형식을 읽기 쉽게 변환하는 함수
const formatTime = (timeString: string): string => {
  if (!timeString) return '오후 3시';
  
  const [hour, minute] = timeString.split(':').map(Number);
  
  if (hour === 0) {
    return minute === 0 ? '자정' : `오전 12시 ${minute}분`;
  } else if (hour < 12) {
    return minute === 0 ? `오전 ${hour}시` : `오전 ${hour}시 ${minute}분`;
  } else if (hour === 12) {
    return minute === 0 ? '정오' : `오후 12시 ${minute}분`;
  } else {
    const pmHour = hour - 12;
    return minute === 0 ? `오후 ${pmHour}시` : `오후 ${pmHour}시 ${minute}분`;
  }
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedStoreInfo = localStorage.getItem('storeInfo');
    
    if (savedCart && savedStoreInfo) {
      setCart(JSON.parse(savedCart));
      const store = JSON.parse(savedStoreInfo);
      console.log('로드된 매장 정보:', store);
      console.log('배달 시간대 슬롯:', store.delivery_time_slots);
      setStoreInfo(store);
      
      
      // 배달 가능 시간이 있으면 첫 번째 시간을 기본값으로 설정
      if (store.delivery_time_slots && store.delivery_time_slots.length > 0) {
        const enabledSlots = store.delivery_time_slots.filter(slot => slot.enabled);
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
      setLoading(false);
      navigate('/');
    }
  }, [navigate]);


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

  if (!storeInfo || cart.length === 0) {
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

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal;

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      const updatedCart = cart.filter(item => item.id !== itemId);
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    } else {
      const updatedCart = cart.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    }
  };

  const removeItem = (itemId: string) => {
    const updatedCart = cart.filter(item => item.id !== itemId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleOrder = async () => {
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
    } else {
      if (!pickupTime) {
        alert('픽업 희망 시간을 선택해주세요.');
        return;
      }
    }

    if (!depositorName.trim()) {
      alert('입금자명을 입력해주세요.');
      return;
    }

    try {
      // 주문접수시간 확인 후 배달날짜 자동 설정
      const now = new Date();
      const cutoffTime = storeInfo.order_cutoff_time || '15:00'; // 기본값 오후 3시
      const [cutoffHour, cutoffMinute] = cutoffTime.split(':').map(Number);
      
      const today = new Date();
      const cutoffToday = new Date(today);
      cutoffToday.setHours(cutoffHour, cutoffMinute, 0, 0);
      
      // 현재 시간이 주문접수시간을 지났으면 다음날로 설정
      const deliveryDate = now > cutoffToday 
        ? new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : today.toISOString().split('T')[0];

      // 주문 데이터 준비 (임시 사용자 ID 생성 - UUID 형식)
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      const orderData = {
        user_id: generateUUID(),
        store_id: storeInfo.id,
        order_type: orderType,
        delivery_address: orderType === 'delivery' ? deliveryAddress : null,
        delivery_time: orderType === 'delivery' ? `${deliveryDate} ${deliveryTime}` : null,
        pickup_time: orderType === 'pickup' ? `${deliveryDate} ${pickupTime}` : null,
        special_requests: specialRequests || null,
        depositor_name: depositorName,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: orderType === 'delivery' ? deliveryAddress : null,
        subtotal: subtotal,
        total: total,
        items: cart.map(item => ({
          menu_id: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      // 주문 생성
      const order = await createOrder(orderData);
      
      if (order) {
        // 장바구니 및 매장 정보 초기화
        localStorage.removeItem('cart');
        localStorage.removeItem('storeInfo');
        
        // 주문 완료 페이지로 이동 (주문 ID 전달)
        navigate(`/order-complete/${order.id}`);
      } else {
        alert('주문 생성에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('주문 생성 오류:', error);
      alert('주문 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
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

      <div className="p-4 space-y-6">
        {/* 주문 방식 선택 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="ri-shopping-bag-line text-orange-500"></i>
            주문 방식
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setOrderType('delivery')}
              className={`flex-1 py-2 px-3 rounded-lg border text-center cursor-pointer transition-all duration-200 ${
                orderType === 'delivery'
                  ? 'border-orange-500 bg-orange-500 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-orange-300 hover:bg-orange-50'
              }`}
            >
              <i className="ri-truck-line mr-1"></i>
              <span className="text-sm font-medium">배달</span>
            </button>
            <button
              onClick={() => setOrderType('pickup')}
              className={`flex-1 py-2 px-3 rounded-lg border text-center cursor-pointer transition-all duration-200 ${
                orderType === 'pickup'
                  ? 'border-orange-500 bg-orange-500 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-orange-300 hover:bg-orange-50'
              }`}
            >
              <i className="ri-store-3-line mr-1"></i>
              <span className="text-sm font-medium">픽업</span>
            </button>
          </div>
        </div>

        {/* 고객 정보 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="ri-user-line text-orange-500"></i>
            고객 정보
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center text-blue-800">
              <i className="ri-information-line mr-2"></i>
              <div className="text-sm">
                알림톡이 전송되므로 정확한 전화번호를 입력해주세요.
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                고객명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="이름을 입력해주세요"
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                전화번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="010-1234-5678 또는 01012345678"
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="text-xs text-gray-500 mt-1">
                알림톡 발송용
              </div>
            </div>
          </div>
        </div>

        {/* 배달 정보 */}
        {orderType === 'delivery' && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="ri-truck-line text-orange-500"></i>
              배달 정보
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center text-blue-800">
                <i className="ri-information-line mr-2"></i>
                <div className="text-sm">
                  <div>
                    {formatTime(storeInfo?.order_cutoff_time || '15:00')} 이후 주문은 다음날 배달됩니다.
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  배달 주소 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="상세 주소를 입력해주세요"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
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
                          <div className="text-sm text-gray-500 mt-1">{slot.start} - {slot.end}</div>
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
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="ri-store-3-line text-orange-500"></i>
              픽업 정보
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center text-blue-800">
                <i className="ri-information-line mr-2"></i>
                <div className="text-sm">
                  <div>
                    {formatTime(storeInfo?.order_cutoff_time || '15:00')} 이후 주문은 다음날 픽업됩니다.
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-800">{storeInfo?.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  <div>영업시간: {(storeInfo as any)?.business_hours_start || '09:00'} ~ {(storeInfo as any)?.business_hours_end || '21:00'}</div>
                  <div>전화번호: {storeInfo?.phone}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  픽업 희망 시간 <span className="text-red-500">*</span>
                </label>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-3 text-center">
                    <i className="ri-time-line mr-1"></i>
                    스크롤하여 시간을 선택하세요
                  </div>
                  <div className="flex gap-4 items-center">
                    {/* 시간 선택 */}
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 mb-2 text-center">시간</div>
                      <div className="h-32 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-inner">
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
                                  className={`px-3 py-3 text-center cursor-pointer transition-colors border-b border-gray-100 ${
                                    pickupTime.startsWith(hour)
                                      ? 'bg-orange-500 text-white'
                                      : 'hover:bg-orange-50'
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
                      <div className="text-xs text-gray-500 mb-2 text-center">분</div>
                      <div className="h-32 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-inner">
                        <div className="py-2">
                          {['00', '10', '20', '30', '40', '50'].map((minute) => (
                            <div
                              key={minute}
                              onClick={() => {
                                const currentHour = pickupTime.split(':')[0] || '00';
                                setPickupTime(`${currentHour}:${minute}`);
                              }}
                              className={`px-3 py-3 text-center cursor-pointer transition-colors border-b border-gray-100 ${
                                pickupTime.endsWith(minute)
                                  ? 'bg-orange-500 text-white'
                                  : 'hover:bg-orange-50'
                              }`}
                            >
                              {minute}분
                            </div>
                          ))}
                        </div>
                      </div>
                </div>
              </div>
                  <div className="text-xs text-gray-500 mt-3 text-center">
                    선택된 시간: <span className="font-medium text-orange-600">{pickupTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 입금자 정보 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="ri-bank-line text-orange-500"></i>
            입금자 정보 (무통장입금)
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              입금자명 <span className="text-red-500">*</span>
            </label>
                <input
                  type="text"
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                  placeholder="입금자명을 입력해주세요"
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* 주문 상품 및 결제 금액 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <i className="ri-shopping-cart-line text-orange-500"></i>
            주문 상품
          </h2>
          <div className="max-h-64 overflow-y-auto space-y-3 pr-2 mb-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{item.name}</div>
                  <div className="text-sm text-gray-600">{item.price.toLocaleString()}원</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white border border-gray-200 rounded-full">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-l-full transition-colors"
                    >
                      <i className="ri-subtract-line text-sm"></i>
                    </button>
                    <span className="px-3 py-1 text-sm font-medium text-gray-700 min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-r-full transition-colors"
                    >
                      <i className="ri-add-line text-sm"></i>
                    </button>
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
            ))}
          </div>
          
          {/* 총 결제 금액 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg text-gray-800">총 결제 금액</span>
              <span className="font-bold text-2xl text-orange-500">{total.toLocaleString()}원</span>
            </div>
          </div>
        </div>
      </div>

      {/* 주문하기 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <button
          onClick={handleOrder}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 px-4 rounded-xl font-bold text-lg whitespace-nowrap cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          <div className="flex items-center justify-center gap-2">
            <i className="ri-shopping-bag-line text-xl"></i>
            <span>{total.toLocaleString()}원 주문하기</span>
          </div>
        </button>
      </div>
      
      <Footer />
    </div>
  );
}
