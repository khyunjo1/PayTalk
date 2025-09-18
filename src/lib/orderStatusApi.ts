// 고객 주문 조회 API 함수

import { supabase } from './supabase';

// 전화번호로 모든 주문 내역 조회 (페이지네이션 지원)
export const getOrdersByPhone = async (phone: string, storeId: string, page: number = 1, limit: number = 5) => {
  try {
    console.log('전화번호로 주문 조회:', { phone, storeId, page, limit });
    
    const offset = (page - 1) * limit;
    
    // 먼저 해당 전화번호로 모든 주문 조회 (디버깅용)
    const { data: allOrders, error: allError } = await supabase
      .from('orders')
      .select('id, status, customer_name, customer_phone, created_at, store_id')
      .eq('customer_phone', phone)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    
    console.log('🔍 해당 전화번호의 모든 주문:', allOrders);
    
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        stores (
          id,
          name,
          phone
        ),
        order_items (
          quantity,
          price,
          menus (
            id,
            name,
            price
          )
        )
      `)
      .eq('customer_phone', phone)
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('주문 조회 오류:', error);
      throw error;
    }

    console.log('조회된 주문 수:', orders?.length || 0);
    console.log('📋 주문 상세:', orders);
    
    // 총 주문 수 계산
    const totalCount = allOrders?.length || 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      orders: orders || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('주문 조회 실패:', error);
    throw error;
  }
};

// 매장 정보 조회
export const getStoreInfo = async (storeId: string) => {
  try {
    const { data: store, error } = await supabase
      .from('stores')
      .select('id, name, phone, delivery_area, category')
      .eq('id', storeId)
      .single();

    if (error) {
      console.error('매장 정보 조회 오류:', error);
      throw error;
    }

    return store;
  } catch (error) {
    console.error('매장 정보 조회 실패:', error);
    throw error;
  }
};

// 주문 상태별 한글 표시
export const getOrderStatusText = (status: string): string => {
  switch (status) {
    case '입금대기':
      return '입금 대기 중';
    case '입금확인':
      return '입금 확인됨';
    case '배달완료':
      return '배달 완료';
    case '주문취소':
      return '주문 취소됨';
    default:
      return status;
  }
};

// 주문 상태별 색상
export const getOrderStatusColor = (status: string): string => {
  switch (status) {
    case '입금대기':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case '입금확인':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case '배달완료':
      return 'text-teal-600 bg-teal-50 border-teal-200';
    case '주문취소':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};
