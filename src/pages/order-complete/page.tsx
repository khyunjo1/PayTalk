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
      
      {/* 페이지 제목 - order-complete 페이지 전용 */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <h1 className="text-lg font-semibold text-center">주문 완료</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 주문 완료 상태 */}
        <div className="bg-gradient-to-br from-orange-25 via-white to-orange-25 rounded-xl p-6 text-center shadow-lg border border-orange-100">
          <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <i className="ri-check-double-line text-3xl text-white"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">주문이 완료되었습니다!</h2>
          <div className="inline-flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-full mb-4 shadow-sm">
            <i className="ri-store-line mr-2 text-orange-500"></i>
            <span className="font-medium">{orderData.stores.name}</span>
          </div>
          
          {/* 통합 안내 문구 */}
          <div className="bg-gradient-to-r from-orange-100 to-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm">
            <div className="text-sm text-orange-800 flex items-center justify-center">
              <i className="ri-chef-hat-line mr-2 text-orange-600"></i>
              <span className="font-medium">입금 확인 후 조리가 시작되며, 카카오톡으로 알림톡이 전송됩니다</span>
            </div>
          </div>
        </div>

        {/* 결제 방법별 안내 */}
        {orderData.status === '입금대기' ? (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="ri-bank-line text-orange-500"></i>
              입금 안내
            </h3>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-50 to-orange-25 rounded-xl p-4 border border-orange-100 shadow-sm">
                <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                  <i className="ri-bank-card-line text-orange-500"></i>
                  입금 계좌
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-lg font-semibold text-gray-800">
                    {orderData.stores.account_holder} {orderData.stores.bank_account}
                  </div>
                  <button
                    onClick={copyAccountNumber}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <i className="ri-file-copy-line"></i>
                    <span>복사하기</span>
                  </button>
                </div>
                <div className="text-sm text-gray-600">예금주: {orderData.stores.account_holder}</div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                  <i className="ri-shopping-cart-line text-orange-500"></i>
                  주문 내역
                </div>
                <div className="space-y-2 mb-4">
                  {orderData.order_items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm text-gray-700">{item.menus.name} x {item.quantity}</span>
                      <span className="text-sm font-medium text-gray-800">{(item.price * item.quantity).toLocaleString()}원</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">상품 금액</span>
                    <span className="font-medium">{orderData.subtotal.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-orange-200">
                    <span className="font-bold text-lg text-gray-800">입금 금액</span>
                    <span className="font-bold text-2xl text-orange-500">{orderData.total.toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="ri-bank-card-line text-orange-500"></i>
              결제 완료
            </h3>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-green-25 border border-green-200 rounded-xl p-4 shadow-sm">
                <div className="text-green-800 font-medium flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <i className="ri-check-line text-white text-sm"></i>
                  </div>
                  카드 결제가 완료되었습니다
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                  <i className="ri-money-dollar-circle-line text-orange-500"></i>
                  결제 금액
                </div>
                <div className="font-bold text-2xl text-orange-500">
                  {orderData.total.toLocaleString()}원
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-25 border border-orange-200 rounded-xl p-4 shadow-sm">
                <div className="text-sm text-orange-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <i className="ri-information-line text-white text-sm"></i>
                  </div>
                  주문이 확정되었습니다. 조리를 시작합니다.
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-25 border border-green-200 rounded-xl p-4 shadow-sm">
                <div className="text-sm text-green-800 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <i className="ri-message-line text-white text-sm"></i>
                  </div>
                  조리 완료 시 카카오톡으로 알림톡이 전송됩니다.
                </div>
              </div>
            </div>
          </div>
        )}



        {/* 버튼들 */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="space-y-4">
            <button
              onClick={() => navigate('/orders')}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 px-4 rounded-xl font-semibold text-lg whitespace-nowrap cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center gap-2">
                <i className="ri-file-list-line text-xl"></i>
                <span>주문내역 확인하기</span>
              </div>
            </button>
            <button
              onClick={() => navigate('/stores')}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-800 py-4 px-4 rounded-xl font-semibold text-lg whitespace-nowrap cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] border border-gray-200"
            >
              <div className="flex items-center justify-center gap-2">
                <i className="ri-store-line text-xl"></i>
                <span>다른 매장 보러가기</span>
              </div>
            </button>
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
