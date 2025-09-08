import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createOrder } from '../../lib/orderApi';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface StoreInfo {
  id: string;
  name: string;
  delivery_fee: number; // 데이터베이스 필드명과 일치
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
  const { user, loading } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
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
      console.log('배달 시간대 슬롯:', store.delivery_time_slots);
      setStoreInfo(store);
      
      
      // 배달 가능 시간이 있으면 첫 번째 시간을 기본값으로 설정
      if (store.delivery_time_slots && store.delivery_time_slots.length > 0) {
        const enabledSlots = store.delivery_time_slots.filter(slot => slot.enabled);
        if (enabledSlots.length > 0) {
          setDeliveryTime(`${enabledSlots[0].name} (${enabledSlots[0].start}-${enabledSlots[0].end})`);
        }
      }
      
      if (store.pickup_time_slots && store.pickup_time_slots.length > 0) {
        setPickupTime(store.pickup_time_slots[0]);
      }
    } else {
      navigate('/stores');
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
  const deliveryFee = orderType === 'delivery' ? storeInfo.delivery_fee : 0;
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

  const handleOrder = async () => {
    if (!user || !storeInfo) {
      alert('로그인이 필요합니다.');
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

    if (paymentMethod === 'bank' && !depositorName.trim()) {
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

      // 주문 데이터 준비
      const orderData = {
        user_id: user.id,
        store_id: storeInfo.id,
        order_type: orderType,
        delivery_address: orderType === 'delivery' ? deliveryAddress : null,
        delivery_time: orderType === 'delivery' ? `${deliveryDate} ${deliveryTime}` : null,
        pickup_time: orderType === 'pickup' ? `${deliveryDate} ${pickupTime}` : null,
        special_requests: specialRequests || null,
        depositor_name: depositorName,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
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
              <div className="text-xs text-gray-500">배달비 {storeInfo.delivery_fee.toLocaleString()}원</div>
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center text-blue-800">
                <i className="ri-information-line mr-2"></i>
                <div className="text-sm">
                  <div className="font-medium">주문 접수 안내</div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  배달 시간대 선택 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {console.log('렌더링 시 매장 정보:', storeInfo)}
                  {console.log('배달 시간대 슬롯:', (storeInfo as any)?.delivery_time_slots)}
                  {(storeInfo as any)?.delivery_time_slots?.filter((slot: any) => slot.enabled).map((slot: any) => (
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center text-blue-800">
                <i className="ri-information-line mr-2"></i>
                <div className="text-sm">
                  <div className="font-medium">주문 접수 안내</div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  픽업 희망 시간
                </label>
                <select
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm pr-8"
                >
                  <option value="">시간을 선택하세요</option>
                  {(storeInfo as any)?.pickup_time_slots?.map((time: string) => (
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
