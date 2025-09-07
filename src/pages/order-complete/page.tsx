import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

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
  delivery_fee: number;
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
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30분
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadOrderData = async () => {
      if (!orderId) {
        navigate('/stores');
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

  useEffect(() => {
    if (orderData?.status === '입금대기' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [orderData, timeLeft]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">주문 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!orderData) return null;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const copyAccountNumber = () => {
    if (orderData?.stores?.bank_account) {
      navigator.clipboard.writeText(orderData.stores.bank_account);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <h1 className="text-lg font-semibold text-center">주문 완료</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 주문 완료 상태 */}
        <div className="bg-white rounded-lg p-6 text-center">
          <i className="ri-check-double-line text-4xl text-green-500 mb-3"></i>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">주문이 완료되었습니다!</h2>
          <p className="text-gray-600 mb-4">주문번호: {orderData.id}</p>
          <p className="text-sm text-gray-500">{orderData.stores.name}</p>
        </div>

        {/* 결제 방법별 안내 */}
        {orderData.status === '입금대기' ? (
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <i className="ri-bank-line mr-2"></i>
              입금 안내
            </h3>
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="text-sm font-medium text-orange-800 mb-1">
                  입금 마감까지 남은 시간
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatTime(timeLeft)}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-2">입금 계좌</div>
                <div className="flex items-center justify-between">
                  <div className="font-medium">{orderData.stores.account_holder} {orderData.stores.bank_account}</div>
                  <button
                    onClick={copyAccountNumber}
                    className="text-orange-500 hover:text-orange-600 cursor-pointer"
                  >
                    <i className="ri-file-copy-line"></i>
                  </button>
                </div>
                <div className="text-sm text-gray-600 mt-1">예금주: 반찬나라</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-1">입금자명</div>
                <div className="font-medium">{orderData.depositorName}</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-1">입금 금액</div>
                <div className="font-semibold text-lg text-orange-500">
                  {orderData.total.toLocaleString()}원
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <i className="ri-information-line mr-1"></i>
                  입금 확인 후 조리가 시작됩니다.
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm text-green-800">
                  <i className="ri-message-line mr-1"></i>
                  입금 확인 시 카카오톡으로 알림톡이 전송됩니다.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <i className="ri-bank-card-line mr-2"></i>
              결제 완료
            </h3>
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-green-800 font-medium">
                  <i className="ri-check-line mr-2"></i>
                  카드 결제가 완료되었습니다
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-1">결제 금액</div>
                <div className="font-semibold text-lg text-orange-500">
                  {orderData.total.toLocaleString()}원
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <i className="ri-information-line mr-1"></i>
                  주문이 확정되었습니다. 조리를 시작합니다.
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm text-green-800">
                  <i className="ri-message-line mr-1"></i>
                  조리 완료 시 카카오톡으로 알림톡이 전송됩니다.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 주문 상세 내역 */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">주문 상세</h3>
          <div className="space-y-2">
            {orderData.order_items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.menus.name} x {item.quantity}</span>
                <span>{(item.price * item.quantity).toLocaleString()}원</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-sm">
                <span>상품 금액</span>
                <span>{orderData.subtotal.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>배달비</span>
                <span>{orderData.delivery_fee.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                <span>총 결제 금액</span>
                <span className="text-orange-500">{orderData.total.toLocaleString()}원</span>
              </div>
            </div>
          </div>
        </div>

        {/* 매장 정보 */}
        <div className="bg-white rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">매장 정보</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <i className="ri-store-3-line text-gray-500 mr-2"></i>
              <span>{orderData.stores.name}</span>
            </div>
            <div className="flex items-center">
              <i className="ri-phone-line text-gray-500 mr-2"></i>
              <span>{orderData.stores.phone}</span>
            </div>
          </div>
        </div>

        {/* 버튼들 */}
        <div className="bg-white rounded-lg p-4">
          <div className="space-y-3">
            <button
              onClick={() => navigate('/orders')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
            >
              주문내역 확인하기
            </button>
            <button
              onClick={() => navigate('/stores')}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
            >
              다른 매장 보러가기
            </button>
          </div>
        </div>
      </div>

      {/* 복사 완료 토스트 */}
      {copied && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg text-sm z-50">
          계좌번호가 복사되었습니다
        </div>
      )}
    </div>
  );
}
