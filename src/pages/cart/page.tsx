import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface StoreInfo {
  id: string;
  name: string;
  deliveryFee: number;
  phone: string;
  businessHoursStart?: string;
  businessHoursEnd?: string;
  pickupTimeSlots?: string[];
  deliveryTimeSlots?: Array<{
    name: string;
    start: string;
    end: string;
    enabled: boolean;
  }>;
}

export default function Cart() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('bank');
  const [depositorName, setDepositorName] = useState('');

  useEffect(() => {
    // 로그인하지 않은 사용자는 홈페이지로 리다이렉트
    if (!loading && !user) {
      navigate('/');
      return;
    }

    const savedCart = localStorage.getItem('cart');
    const savedStoreInfo = localStorage.getItem('storeInfo');
    
    if (savedCart && savedStoreInfo) {
      setCart(JSON.parse(savedCart));
      const store = JSON.parse(savedStoreInfo);
      console.log('로드된 매장 정보:', store);
      console.log('배달 시간대 슬롯:', store.deliveryTimeSlots);
      setStoreInfo(store);
      
      // 오늘 날짜를 기본값으로 설정
      const today = new Date().toISOString().split('T')[0];
      setDeliveryDate(today);
      setPickupDate(today);
      
      // 배달 가능 시간이 있으면 첫 번째 시간을 기본값으로 설정
      if (store.deliveryTimeSlots && store.deliveryTimeSlots.length > 0) {
        const enabledSlots = store.deliveryTimeSlots.filter(slot => slot.enabled);
        if (enabledSlots.length > 0) {
          setDeliveryTime(`${enabledSlots[0].name} (${enabledSlots[0].start}-${enabledSlots[0].end})`);
        }
      }
      
      if (store.pickupTimeSlots && store.pickupTimeSlots.length > 0) {
        setPickupTime(store.pickupTimeSlots[0]);
      }
    } else {
      navigate('/stores');
    }
  }, [navigate]);

  // 영업시간 검증 함수
  const isBusinessHoursPassed = (date: string, businessHoursEnd: string) => {
    const today = new Date().toISOString().split('T')[0];
    const selectedDate = new Date(date);
    const currentDate = new Date(today);
    
    // 오늘이 아니면 항상 주문 가능
    if (selectedDate.getTime() !== currentDate.getTime()) {
      return false;
    }
    
    // 오늘인 경우 현재 시간과 영업 종료 시간 비교
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [endHour, endMinute] = businessHoursEnd.split(':').map(Number);
    const businessEndTime = endHour * 60 + endMinute;
    
    return currentTime >= businessEndTime;
  };

  // 선택 가능한 날짜 목록 생성
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  };

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
  const deliveryFee = orderType === 'delivery' ? storeInfo.deliveryFee : 0;
  const total = subtotal + deliveryFee;

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

  const handleOrder = () => {
    // 유효성 검사
    if (orderType === 'delivery') {
      if (!deliveryAddress.trim()) {
        alert('배달 주소를 입력해주세요.');
        return;
      }
      if (!deliveryDate) {
        alert('배달 날짜를 선택해주세요.');
        return;
      }
      if (!deliveryTime) {
        alert('배달 희망 시간을 선택해주세요.');
        return;
      }
    } else {
      if (!pickupDate) {
        alert('픽업 날짜를 선택해주세요.');
        return;
      }
      if (!pickupTime) {
        alert('픽업 희망 시간을 선택해주세요.');
        return;
      }
    }

    if (paymentMethod === 'bank' && !depositorName.trim()) {
      alert('입금자명을 입력해주세요.');
      return;
    }

    // 주문 정보 저장
    const orderData = {
      orderId: 'ORD' + Date.now(),
      storeInfo,
      cart,
      orderType,
      deliveryAddress,
      deliveryDate: orderType === 'delivery' ? deliveryDate : pickupDate,
      deliveryTime: orderType === 'delivery' ? deliveryTime : pickupTime,
      specialRequests,
      paymentMethod,
      depositorName,
      subtotal,
      deliveryFee,
      total,
      orderDate: new Date().toISOString(),
      status: paymentMethod === 'bank' ? '입금대기' : '입금확인'
    };

    localStorage.setItem('currentOrder', JSON.stringify(orderData));
    
    // 기존 주문 내역에 추가
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    existingOrders.unshift(orderData);
    localStorage.setItem('orders', JSON.stringify(existingOrders));

    // 장바구니 비우기
    localStorage.removeItem('cart');
    localStorage.removeItem('storeInfo');

    navigate('/order-complete');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
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
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-semibold text-gray-800 mb-3">주문 방식</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setOrderType('delivery')}
              className={`p-3 rounded-lg border-2 text-center cursor-pointer ${
                orderType === 'delivery'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              <i className="ri-truck-line text-xl mb-1 block"></i>
              <div className="text-sm font-medium">배달 주문</div>
              <div className="text-xs text-gray-500">배달비 {storeInfo.deliveryFee.toLocaleString()}원</div>
            </button>
            <button
              onClick={() => setOrderType('pickup')}
              className={`p-3 rounded-lg border-2 text-center cursor-pointer ${
                orderType === 'pickup'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              <i className="ri-store-3-line text-xl mb-1 block"></i>
              <div className="text-sm font-medium">매장 픽업</div>
              <div className="text-xs text-gray-500">배달비 없음</div>
            </button>
          </div>
        </div>

        {/* 배달 정보 */}
        {orderType === 'delivery' && (
          <div className="bg-white rounded-lg p-4">
            <h2 className="font-semibold text-gray-800 mb-3">배달 정보</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  배달 날짜 <span className="text-red-500">*</span>
                </label>
                <select
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm pr-8"
                >
                  {getAvailableDates().map((date) => {
                    const isPassed = isBusinessHoursPassed(date, storeInfo.businessHoursEnd || '21:00');
                    const dateObj = new Date(date);
                    const today = new Date();
                    const isToday = dateObj.toDateString() === today.toDateString();
                    const dayName = isToday ? '오늘' : 
                      dateObj.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
                    
                    return (
                      <option 
                        key={date} 
                        value={date}
                        disabled={isPassed}
                      >
                        {dayName} {isPassed ? '(영업시간 종료)' : ''}
                      </option>
                    );
                  })}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  영업시간이 지난 당일은 주문할 수 없습니다
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  배달 시간대 선택 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {console.log('렌더링 시 매장 정보:', storeInfo)}
                  {console.log('배달 시간대 슬롯:', (storeInfo as any)?.deliveryTimeSlots)}
                  {(storeInfo as any)?.deliveryTimeSlots?.filter((slot: any) => slot.enabled).map((slot: any) => (
                    <label key={slot.name} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="deliveryTimeSlot"
                        value={`${slot.name} (${slot.start}-${slot.end})`}
                        checked={deliveryTime === `${slot.name} (${slot.start}-${slot.end})`}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium">{slot.name}</div>
                        <div className="text-sm text-gray-600">{slot.start} - {slot.end}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">
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
          <div className="bg-white rounded-lg p-4">
            <h2 className="font-semibold text-gray-800 mb-3">픽업 정보</h2>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-medium text-gray-800">{storeInfo?.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  <div>영업시간: {(storeInfo as any)?.businessHoursStart || '09:00'} ~ {(storeInfo as any)?.businessHoursEnd || '21:00'}</div>
                  <div>전화번호: {storeInfo?.phone}</div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  픽업 날짜 <span className="text-red-500">*</span>
                </label>
                <select
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm pr-8"
                >
                  {getAvailableDates().map((date) => {
                    const isPassed = isBusinessHoursPassed(date, storeInfo.businessHoursEnd || '21:00');
                    const dateObj = new Date(date);
                    const today = new Date();
                    const isToday = dateObj.toDateString() === today.toDateString();
                    const dayName = isToday ? '오늘' : 
                      dateObj.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
                    
                    return (
                      <option 
                        key={date} 
                        value={date}
                        disabled={isPassed}
                      >
                        {dayName} {isPassed ? '(영업시간 종료)' : ''}
                      </option>
                    );
                  })}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  영업시간이 지난 당일은 픽업할 수 없습니다
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  픽업 희망 시간
                </label>
                <select
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm pr-8"
                >
                  <option value="">시간을 선택하세요</option>
                  {(storeInfo as any)?.pickupTimeSlots?.map((time: string) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  매장 영업시간 내에서 픽업 시간을 선택하세요
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 결제 방법 */}
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-semibold text-gray-800 mb-3">결제 방법</h2>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="payment"
                value="bank"
                checked={paymentMethod === 'bank'}
                onChange={(e) => setPaymentMethod(e.target.value as 'bank' | 'card')}
                className="mr-3"
              />
              <div className="flex items-center">
                <i className="ri-bank-line mr-2"></i>
                <span>무통장 입금</span>
              </div>
            </label>
            {paymentMethod === 'bank' && (
              <div className="ml-6 space-y-2">
                <div className="text-sm text-gray-600">
                  계좌번호: 국민은행 123456-78-901234 (반찬나라)
                </div>
                <input
                  type="text"
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                  placeholder="입금자명을 입력해주세요"
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            )}
            
            <label className="flex items-center">
              <input
                type="radio"
                name="payment"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value as 'bank' | 'card')}
                className="mr-3"
              />
              <div className="flex items-center">
                <i className="ri-bank-card-line mr-2"></i>
                <span>카드 결제 (카카오톡)</span>
              </div>
            </label>
          </div>
        </div>

        {/* 주문 상품 */}
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-semibold text-gray-800 mb-3">주문 상품</h2>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">{item.price.toLocaleString()}원</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full cursor-pointer"
                    >
                      <i className="ri-subtract-line text-sm"></i>
                    </button>
                    <span className="font-semibold w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-full cursor-pointer"
                    >
                      <i className="ri-add-line text-sm"></i>
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-600 cursor-pointer p-1"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 결제 금액 */}
        <div className="bg-white rounded-lg p-4">
          <h2 className="font-semibold text-gray-800 mb-3">결제 금액</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>상품 금액</span>
              <span>{subtotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span>배달비</span>
              <span>{deliveryFee.toLocaleString()}원</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>총 결제 금액</span>
                <span className="text-orange-500">{total.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 주문하기 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <button
          onClick={handleOrder}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 px-4 rounded-lg font-semibold whitespace-nowrap cursor-pointer"
        >
          {total.toLocaleString()}원 주문하기
        </button>
      </div>
    </div>
  );
}
