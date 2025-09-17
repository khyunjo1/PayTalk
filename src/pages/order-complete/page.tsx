import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

interface OrderData {
  id: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  depositor_name: string;
  delivery_address: string;
  delivery_time: string;
  pickup_time: string;
  special_requests: string;
  order_type: 'delivery' | 'pickup';
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_area_id?: string;
  stores: {
    name: string;
    phone: string;
    bank_account: string;
    account_holder: string;
  };
  order_items: Array<{
    price: number;
    quantity: number;
    menus: {
      name: string;
    };
  }>;
  daily_menu_orders?: Array<{
    daily_menu_id: string;
    menu_id: string;
    quantity: number;
    daily_menus: {
      menu_date: string;
      title: string;
    };
    menus: {
      name: string;
      price: number;
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
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            created_at,
            customer_name,
            customer_phone,
            depositor_name,
            delivery_address,
            delivery_time,
            pickup_time,
            special_requests,
            order_type,
            subtotal,
            delivery_fee,
            total,
            delivery_area_id,
            stores (
              name,
              phone,
              bank_account,
              account_holder
            ),
            order_items (
              price,
              quantity,
              menus (
                name
              )
            ),
            daily_menu_orders (
              daily_menu_id,
              menu_id,
              quantity,
              daily_menus (
                menu_date,
                title
              ),
              menus (
                name,
                price
              )
            )
          `)
          .eq('id', orderId)
          .single();

        if (error) {
          console.error('주문 정보 로드 오류:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <Header />
      
      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* 성공 메시지 카드 */}
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <i className="ri-check-line text-4xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">주문 완료!</h1>
          <p className="text-gray-600 text-lg mb-4">{orderData.stores.name}</p>
          <p className="text-sm text-gray-500">주문번호: {orderData.id.slice(-8).toUpperCase()}</p>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 mt-6 text-white">
            <p className="font-semibold">입금 확인 후 조리가 시작됩니다</p>
          </div>
        </div>

        {/* 통합 주문 정보 카드 */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          {/* 주문 메뉴 */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="ri-restaurant-line text-orange-500"></i>
              주문 메뉴
            </h3>
            <div className="space-y-3">
              {orderData.daily_menu_orders?.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-orange-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">{item.menus.name}</p>
                    <p className="text-sm text-gray-600">{item.quantity}개</p>
                  </div>
                  <p className="text-lg font-bold text-orange-600">
                    {((item.menus?.price || 0) * item.quantity).toLocaleString()}원
                  </p>
                </div>
              ))}
            </div>
            
            <div className="space-y-2 pt-4 mt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">상품 금액</span>
                <span className="text-gray-800">{orderData.subtotal.toLocaleString()}원</span>
              </div>
              {orderData.order_type === 'delivery' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">배달비</span>
                  <span className="text-gray-800">
                    {(orderData.delivery_fee || (orderData.total - orderData.subtotal) || 0).toLocaleString()}원
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-lg font-bold text-gray-900">총 결제 금액</span>
                <span className="text-xl font-bold text-orange-600">{orderData.total.toLocaleString()}원</span>
              </div>
            </div>
          </div>

          {/* 입금 정보 */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="ri-bank-card-line text-blue-500"></i>
              입금 정보
            </h3>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="text-sm text-gray-600 mb-2">입금 계좌</div>
              <div className="font-mono text-lg font-bold text-gray-900 mb-1">
                {orderData.stores.bank_account}
              </div>
              <div className="text-sm text-gray-600">
                예금주: {orderData.stores.account_holder}
              </div>
            </div>

            <button
              onClick={copyAccountNumber}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <i className="ri-file-copy-line mr-2"></i>
              계좌번호 복사
            </button>
          </div>

          {/* 배달/픽업 정보 */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className={orderData.order_type === 'delivery' ? 'ri-truck-line text-green-500' : 'ri-store-line text-green-500'}></i>
              {orderData.order_type === 'delivery' ? '배달 정보' : '픽업 정보'}
            </h3>
            
            <div className="space-y-3">
              {orderData.delivery_address && (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                  <i className="ri-map-pin-line text-green-500 mt-1"></i>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">배달 주소</div>
                    <div className="text-gray-900 font-semibold">{orderData.delivery_address}</div>
                  </div>
                </div>
              )}
              
              {orderData.delivery_time && (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                  <i className="ri-time-line text-green-500 mt-1"></i>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">배달 시간</div>
                    <div className="text-gray-900 font-semibold">
                      {(() => {
                        const parts = orderData.delivery_time.split(' ');
                        if (parts.length >= 3) {
                          const dateStr = parts[0];
                          const timeSlot = parts.slice(1).join(' ');
                          const [year, month, day] = dateStr.split('-').map(Number);
                          const date = new Date(year, month - 1, day);
                          const formattedDate = date.toLocaleDateString('ko-KR', {
                            month: 'long',
                            day: 'numeric'
                          });
                          return `${formattedDate} ${timeSlot}`;
                        }
                        return orderData.delivery_time;
                      })()}
                    </div>
                  </div>
                </div>
              )}
              
              {orderData.pickup_time && (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                  <i className="ri-time-line text-green-500 mt-1"></i>
                  <div>
                    <div className="text-sm text-gray-600 font-medium">픽업 시간</div>
                    <div className="text-gray-900 font-semibold">{orderData.pickup_time}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 문의 및 상태 확인 */}
          <div className="border-t border-gray-200 pt-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">문의 안내</h3>
              <p className="text-gray-600 mb-2">주문 취소나 문의사항이 있으시면</p>
              <p className="text-xl font-bold text-orange-600">{orderData.stores.phone}</p>
              <p className="text-gray-600">로 연락해주세요</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-message-3-line text-white"></i>
              </div>
              <p className="text-gray-600 text-sm">
                입금 후 주문 상태는 밴드 글 링크에서 확인하세요.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 복사 완료 토스트 */}
      {copied && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg z-50 font-semibold">
          계좌번호가 복사되었습니다
        </div>
      )}
      
      <Footer />
    </div>
  );
}