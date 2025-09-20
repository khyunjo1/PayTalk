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
  payment_method: 'bank_transfer' | 'zeropay';
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
            payment_method,
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
      
      <div className="max-w-md mx-auto px-3 py-4 space-y-4 sm:space-y-6">
        {/* 주문 완료 영역 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <i className="ri-check-line text-2xl sm:text-3xl text-green-600"></i>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">주문 완료!</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">주문번호: {orderData.id.slice(-8).toUpperCase()}</p>
          <p className="text-xs sm:text-sm text-gray-500">입금 확인 후 조리가 시작됩니다</p>
        </div>

        {/* 결제 금액 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">주문 메뉴</h3>
          <div className="space-y-2 sm:space-y-3">
            {orderData.order_items?.map((item, index) => (
              <div key={index} className="flex justify-between items-start py-2">
                <div className="flex-1 min-w-0 pr-2">
                  <span className="text-sm sm:text-base text-gray-900 font-medium block">{item.menus.name}</span>
                  <span className="text-xs sm:text-sm text-gray-500">× {item.quantity}개</span>
                </div>
                <span className="text-sm sm:text-base text-gray-800 font-semibold flex-shrink-0">
                  {(item.price * item.quantity).toLocaleString()}원
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm sm:text-base text-gray-600">상품 금액</span>
              <span className="text-sm sm:text-base text-gray-800">{orderData.subtotal.toLocaleString()}원</span>
            </div>
            {orderData.order_type === 'delivery' && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm sm:text-base text-gray-600">배달비</span>
                <span className="text-sm sm:text-base text-gray-800">
                  {(orderData.delivery_fee || (orderData.total - orderData.subtotal) || 0).toLocaleString()}원
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="text-base sm:text-lg font-bold text-gray-900">총 결제 금액</span>
              <span className="text-xl sm:text-2xl font-bold text-orange-600">{orderData.total.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* 결제 정보 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">
            {orderData.payment_method === 'bank_transfer' ? '입금 정보' : '제로페이 결제'}
          </h3>
          
          {orderData.payment_method === 'bank_transfer' ? (
            <>
              <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 font-mono break-all">
                  {orderData.stores.bank_account}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">
                  예금주: {orderData.stores.account_holder}
                </div>
              </div>

              <button
                onClick={copyAccountNumber}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm hover:shadow-md text-sm sm:text-base min-h-[48px]"
              >
                <i className="ri-file-copy-line text-base"></i>
                복사
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-4 border border-blue-200">
                <div className="text-sm text-blue-700 font-semibold mb-4">제로페이 QR 코드입니다</div>
                <div className="bg-white rounded-xl p-4 shadow-lg inline-block">
                  <img 
                    src="/zeropay-qr.JPG" 
                    alt="제로페이 QR 코드" 
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <div className="text-xs text-blue-600 mt-3">
                  QR 코드를 스캔하여 결제를 완료해주세요
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 배달/픽업 정보 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <i className={`${orderData.order_type === 'delivery' ? 'ri-truck-line' : 'ri-calendar-line'} text-orange-500 text-base sm:text-lg`}></i>
            {orderData.order_type === 'delivery' ? '배달 정보' : '픽업 정보'}
          </h3>
          
          <div className="space-y-2 sm:space-y-3">
            {orderData.delivery_address && (
              <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-xl">
                <i className="ri-map-pin-line text-orange-500 mt-1 text-sm sm:text-base"></i>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">배달 주소</div>
                  <div className="text-sm sm:text-base text-gray-900 font-semibold break-words">{orderData.delivery_address}</div>
                </div>
              </div>
            )}
            
            {orderData.delivery_time && (
              <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-xl">
                <i className="ri-time-line text-orange-500 mt-1 text-sm sm:text-base"></i>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">배달 시간</div>
                  <div className="text-sm sm:text-base text-gray-900 font-bold break-words">
                    {(() => {
                      try {
                        const parts = orderData.delivery_time.split(' ');
                        if (parts.length >= 3) {
                          const dateStr = parts[0];
                          const timeSlot = parts.slice(1).join(' ');
                          
                          // 날짜 형식 검증 및 파싱
                          const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                          if (dateMatch) {
                            const [, year, month, day] = dateMatch;
                            const yearNum = parseInt(year);
                            const monthNum = parseInt(month);
                            const dayNum = parseInt(day);
                            
                            // 유효한 날짜인지 확인
                            if (yearNum >= 2020 && yearNum <= 2030 && 
                                monthNum >= 1 && monthNum <= 12 && 
                                dayNum >= 1 && dayNum <= 31) {
                              const date = new Date(yearNum, monthNum - 1, dayNum);
                              
                              // 생성된 날짜가 유효한지 확인
                              if (!isNaN(date.getTime()) && 
                                  date.getFullYear() === yearNum && 
                                  date.getMonth() === monthNum - 1 && 
                                  date.getDate() === dayNum) {
                                const formattedDate = date.toLocaleDateString('ko-KR', {
                                  month: 'long',
                                  day: 'numeric'
                                });
                                return `${formattedDate} ${timeSlot}`;
                              }
                            }
                          }
                        }
                        // 파싱 실패 시 원본 문자열 반환
                        return orderData.delivery_time;
                      } catch (error) {
                        console.error('날짜 파싱 오류:', error);
                        return orderData.delivery_time;
                      }
                    })()}
                  </div>
                </div>
              </div>
            )}
            
            {orderData.pickup_time && (
              <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-xl">
                <i className="ri-time-line text-orange-500 mt-1 text-sm sm:text-base"></i>
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">픽업 시간</div>
                  <div className="text-sm sm:text-base text-gray-900 font-bold break-words">{orderData.pickup_time}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 문의 안내 카드 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 text-center">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">문의 안내</h3>
          <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4">주문 취소나 문의사항이 있으시면</p>
          <a 
            href={`tel:${orderData.stores.phone}`}
            className="text-xl sm:text-2xl font-bold text-orange-600 hover:text-orange-700 transition-colors block mb-2"
          >
            {orderData.stores.phone}
          </a>
          <p className="text-gray-500 text-xs sm:text-sm mb-3 sm:mb-2">로 연락해주세요</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <i className="ri-information-line text-gray-600 text-sm sm:text-base"></i>
            <p className="text-gray-700 text-sm sm:text-base font-medium">입금 후 주문 상태는 밴드 글 링크에서 확인하세요</p>
          </div>
        </div>

        {/* 하단 고객센터 정보 */}
      </div>

      {/* 복사 완료 토스트 */}
      {copied && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 text-sm font-medium text-center sm:text-left">
          계좌번호가 복사되었습니다
        </div>
      )}
      
      <Footer />
    </div>
  );
}