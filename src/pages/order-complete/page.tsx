import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

interface OrderData {
  id: string;
  status: string;
  order_type: 'delivery' | 'pickup';
  delivery_address?: string;
  delivery_time?: string;
  pickup_time?: string;
  special_requests?: string;
  depositor_name: string;
  subtotal: number;
  total: number;
  created_at: string;
  stores: {
    name: string;
    phone: string;
    bank_account: string;
    account_holder: string;
  };
  order_items: Array<{
    quantity: number;
    price: number;
    menus: {
      name: string;
    };
  }>;
}

export default function OrderComplete() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadOrderData = async () => {
      if (!orderId) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            stores (
              name,
              phone,
              bank_account,
              account_holder
            ),
            order_items (
              quantity,
              price,
              menus (
                name
              )
            )
          `)
          .eq('id', orderId)
          .single();

        if (error) {
          console.error('주문 정보 가져오기 오류:', error);
          navigate('/stores');
          return;
        }

        setOrderData(data);
      } catch (error) {
        console.error('주문 정보 로드 오류:', error);
        navigate('/stores');
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">주문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!orderData) return null;

  const copyAccountNumber = () => {
    if (orderData?.stores?.bank_account) {
      navigator.clipboard.writeText(orderData.stores.bank_account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* 주문 완료 메인 카드 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-check-line text-3xl text-green-500"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">주문 완료!</h1>
          <p className="text-gray-600 mb-4">{orderData.stores.name}</p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
            <p className="text-orange-800 font-medium text-sm">
              입금 확인 후 조리가 시작됩니다
            </p>
          </div>

          {/* 문의 안내 - 입금 확인 메시지 바로 아래 */}
          <div className="text-center text-sm text-gray-600">
            <p>주문 취소나 문의사항이 있으시면</p>
            <p className="font-medium text-orange-600">{orderData.stores.phone}</p>
            <p>로 연락해주세요</p>
          </div>
        </div>

        {/* 입금 정보 카드 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">입금 정보</h2>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="text-sm text-gray-600 mb-2">입금 계좌</div>
            <div className="font-mono text-lg font-bold text-gray-800 mb-1">
              {orderData.stores.bank_account}
            </div>
            <div className="text-sm text-gray-600">
              예금주: {orderData.stores.account_holder}
            </div>
          </div>

          <button
            onClick={copyAccountNumber}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <i className="ri-file-copy-line mr-1"></i>
            복사
          </button>
        </div>

        {/* 배달/픽업 정보 카드 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {orderData.order_type === 'delivery' ? '배달 정보' : '픽업 정보'}
          </h2>
          
          <div className="space-y-3 mb-6">
            {orderData.delivery_address && (
              <div className="flex items-start gap-3">
                <i className="ri-map-pin-line text-orange-500 mt-1"></i>
                <div>
                  <div className="text-sm text-gray-600">배달 주소</div>
                  <div className="text-gray-800">{orderData.delivery_address}</div>
                </div>
              </div>
            )}
            
            {orderData.delivery_time && (
              <div className="flex items-start gap-3">
                <i className="ri-time-line text-orange-500 mt-1"></i>
                <div>
                  <div className="text-sm text-gray-600">배달 시간</div>
                  <div className="text-gray-800">{orderData.delivery_time}</div>
                </div>
              </div>
            )}
            
            {orderData.pickup_time && (
              <div className="flex items-start gap-3">
                <i className="ri-time-line text-orange-500 mt-1"></i>
                <div>
                  <div className="text-sm text-gray-600">픽업 시간</div>
                  <div className="text-gray-800">{orderData.pickup_time}</div>
                </div>
              </div>
            )}
            
            {orderData.special_requests && (
              <div className="flex items-start gap-3">
                <i className="ri-message-line text-orange-500 mt-1"></i>
                <div>
                  <div className="text-sm text-gray-600">요청사항</div>
                  <div className="text-gray-800">{orderData.special_requests}</div>
                </div>
              </div>
            )}
          </div>

          {/* 주문 내역 - 헤딩 없이 배달 정보 아래에 통합 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-3 mb-4">
              {orderData.order_items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-700">{item.menus.name} x {item.quantity}</span>
                  <span className="font-medium text-gray-800">{(item.price * item.quantity).toLocaleString()}원</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">총 결제 금액</span>
                <span className="text-2xl font-bold text-orange-500">{orderData.total.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </div>

        {/* 안내 카드 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <i className="ri-message-line text-blue-500 text-xl mt-1"></i>
            <div>
              <h3 className="font-bold text-blue-800 mb-2">알림톡 안내</h3>
              <p className="text-blue-700 text-sm">
                입금 확인, 조리 시작, 배달 완료 등 각 단계별로 카카오톡 알림톡이 발송됩니다.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* 복사 완료 토스트 */}
      {copied && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-6 py-3 rounded-xl text-sm font-medium z-50 shadow-lg flex items-center gap-2">
          <i className="ri-check-line text-base"></i>
          계좌번호가 복사되었습니다
        </div>
      )}
      
      <Footer />
    </div>
  );
}