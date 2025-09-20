// 주문 관리 API 함수
// 요구사항 5: 주문 상태 변경 + 푸시 알림

import { supabase } from './supabase';
import { getStoreOrderNotificationMessage } from './pushApi';

// 주문 생성
export const createOrder = async (orderData: {
  user_id: string;
  store_id: string;
  order_type: 'delivery' | 'pickup';
  delivery_address?: string;
  delivery_time?: string;
  pickup_time?: string;
  special_requests?: string;
  depositor_name?: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  subtotal: number;
  delivery_fee?: number;
  total: number;
  delivery_area_id?: string;
  payment_method: 'bank_transfer' | 'zeropay';
  items: Array<{
    menu_id: string;
    quantity: number;
    price: number;
  }>;
  daily_menu_data?: {
    daily_menu_id: string;
    menu_date: string;
    items: Array<{
      menuId: string;
      quantity: number;
    }>;
  };
}) => {
  // 주문 생성
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: orderData.user_id,
      store_id: orderData.store_id,
      order_type: orderData.order_type,
      delivery_address: orderData.delivery_address,
      delivery_time: orderData.delivery_time,
      pickup_time: orderData.pickup_time,
      special_requests: orderData.special_requests,
      depositor_name: orderData.depositor_name,
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      customer_address: orderData.customer_address,
      subtotal: orderData.subtotal,
      delivery_fee: orderData.delivery_fee || 0,
      total: orderData.total,
      delivery_area_id: orderData.delivery_area_id && orderData.delivery_area_id.trim() !== '' ? orderData.delivery_area_id : null,
      payment_method: orderData.payment_method,
      status: '입금대기',
      // 일일 메뉴 주문인 경우 메뉴 날짜 저장
      menu_date: orderData.daily_menu_data?.menu_date || null
    })
    .select()
    .single();

  if (orderError) {
    console.error('주문 생성 오류:', orderError);
    console.error('주문 데이터:', orderData);
    throw new Error(`주문 생성 실패: ${orderError.message} (코드: ${orderError.code})`);
  }

  // 주문 아이템들 생성
  const orderItems = orderData.items.map(item => {
    if (!item.menu_id || item.menu_id.trim() === '') {
      throw new Error('유효하지 않은 메뉴 ID입니다.');
    }
    return {
      order_id: order.id,
      menu_id: item.menu_id,
      quantity: item.quantity,
      price: item.price
    };
  });

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    console.error('주문 아이템 생성 오류:', itemsError);
    console.error('주문 아이템 데이터:', orderItems);
    throw new Error(`주문 아이템 생성 실패: ${itemsError.message} (코드: ${itemsError.code})`);
  }

  // 일일 메뉴 주문 데이터 저장 및 수량 차감 (임시 비활성화)
  if (orderData.daily_menu_data) {
    console.log('일일 메뉴 주문 데이터:', orderData.daily_menu_data);
    console.log('일일 메뉴 주문 데이터 저장은 임시로 비활성화되었습니다.');
    // TODO: daily_menu_orders 테이블 생성 후 활성화
    /*
    try {
      const dailyMenuOrders = orderData.daily_menu_data.items.map(item => ({
        daily_menu_id: orderData.daily_menu_data!.daily_menu_id,
        order_id: order.id,
        menu_id: item.menuId,
        quantity: item.quantity
      }));

      const { error: dailyMenuOrdersError } = await supabase
        .from('daily_menu_orders')
        .insert(dailyMenuOrders);

      if (dailyMenuOrdersError) {
        console.error('일일 메뉴 주문 데이터 저장 오류:', dailyMenuOrdersError);
        // 일일 메뉴 주문 데이터 저장 실패해도 주문은 성공으로 처리
      } else {
        console.log('일일 메뉴 주문 데이터 저장 성공');
      }
    } catch (error) {
      console.error('일일 메뉴 주문 데이터 저장 중 오류:', error);
      // 일일 메뉴 주문 데이터 저장 실패해도 주문은 성공으로 처리
    }
    */
  }

  // 푸시 알림 발송 (비동기로 처리하여 주문 생성에 영향 없도록)
  try {
    // 매장 정보만 가져오기 (users 테이블 접근 제거)
    const [storeData, menuData] = await Promise.all([
      supabase.from('stores').select('name, phone, bank_account, account_holder, owner_id').eq('id', orderData.store_id).single(),
      supabase.from('menus').select('name').in('id', orderData.items.map(item => item.menu_id))
    ]);

    if (storeData.data && menuData.data) {
      // 주문 아이템 이름 생성 (현재 사용하지 않음)
      // const orderItemsText = orderData.items.map(item => {
      //   const menu = menuData.data.find(m => m.id === item.menu_id);
      //   return `${menu?.name || '메뉴'} x${item.quantity}`;
      // }).join(', ');

      // 고객 알림은 제거 - 사장님에게만 알림 발송
      console.log('고객 알림은 발송하지 않습니다. 사장님에게만 알림을 발송합니다.');

      // 사장님에게 신규 주문 푸시 알림 발송
      if (storeData.data.owner_id) {
        const storeNotification = getStoreOrderNotificationMessage(storeData.data.name, order.id);
        console.log('=== 사장님 푸시 알림 발송 시작 ===');
        console.log('사장님 정보:', {
          ownerId: storeData.data.owner_id,
          storeName: storeData.data.name,
          orderId: order.id,
          notification: storeNotification
        });
        
        try {
          // 사장님에게 푸시 알림 발송
          console.log('사장님에게 푸시 알림 발송 시도...');
          
          // 서버사이드 푸시 알림 발송 (Edge Function)
          const { data: pushResult, error: pushError } = await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: storeData.data.owner_id,
              title: storeNotification.title,
              body: storeNotification.body,
              data: { orderId: order.id, type: 'new_order' }
            }
          });
          
          if (pushError) {
            console.error('❌ 서버사이드 푸시 알림 발송 실패:', pushError);
            console.log('ℹ️ 사장님이 PWA를 설치하고 푸시 알림을 활성화해야 합니다');
          } else {
            console.log('✅ 서버사이드 푸시 알림 발송 성공:', pushResult);
          }
        } catch (pushError) {
          console.error('사장님 푸시 알림 발송 중 오류:', pushError);
        }
        
        console.log('=== 사장님 푸시 알림 발송 완료 ===');
      } else {
        console.warn('⚠️ 매장에 owner_id가 설정되지 않음 - 푸시 알림을 발송할 수 없습니다:', storeData.data);
        console.log('ℹ️ 주문은 정상적으로 생성되었습니다. 매장 관리자에게 연락하여 owner_id를 설정해주세요.');
      }
      // const ownerNotification = await sendNewOrderNotificationToOwner({
      //   ownerPhone: storeData.data.phone,
      //   storeName: storeData.data.name,
      //   orderId: order.id,
      //   customerName: userData.data.name,
      //   orderItems: orderItemsText,
      //   totalAmount: orderData.total,
      //   orderType: orderData.order_type,
      //   deliveryAddress: orderData.delivery_address,
      //   deliveryTime: orderData.delivery_time,
      //   pickupTime: orderData.pickup_time
      // });

      // 알림톡 발송 로그 저장
      // await logAlimtalkSent({
      //   orderId: order.id,
      //   recipientPhone: userData.data.phone,
      //   templateId: 'ORDER_RECEIVED_TEMPLATE',
      //   success: customerNotification
      // });

      // await logAlimtalkSent({
      //   orderId: order.id,
      //   recipientPhone: storeData.data.phone,
      //   templateId: 'NEW_ORDER_TEMPLATE',
      //   success: ownerNotification
      // });
    }
  } catch (alimtalkError) {
    console.error('알림톡 발송 오류:', alimtalkError);
    // 알림톡 발송 실패해도 주문은 정상 처리
  }

  return order;
};


// 매장의 주문 목록 가져오기 (사장님용)
export const getStoreOrders = async (storeId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('매장 주문 목록 가져오기 오류:', error);
    throw error;
  }

  // 주문 아이템과 일일 메뉴 주문도 함께 가져오기
  const ordersWithItems = await Promise.all(
    (data || []).map(async (order) => {
      // 일반 주문 아이템
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          menus (
            id,
            name,
            price
          )
        `)
        .eq('order_id', order.id);

      if (itemsError) {
        console.error('주문 아이템 가져오기 오류:', itemsError);
      }

      // 일일 메뉴 주문 (임시 비활성화)
      const dailyMenuOrders: any[] = []; // 빈 배열로 설정
      console.log('일일 메뉴 주문 조회는 임시로 비활성화되었습니다.');

      return { 
        ...order, 
        order_items: items || [],
        daily_menu_orders: dailyMenuOrders
      };
    })
  );

  return ordersWithItems;
};

// 주문 상태 업데이트
export const updateOrderStatus = async (orderId: string, status: '입금대기' | '입금확인' | '배달완료' | '주문취소') => {
  console.log('주문 상태 업데이트 시작:', { orderId, status });
  
  // 먼저 주문이 존재하는지 확인
  const { data: existingOrder, error: checkError } = await supabase
    .from('orders')
    .select('id, status, store_id')
    .eq('id', orderId)
    .single();
    
  if (checkError) {
    console.error('주문 존재 확인 오류:', checkError);
    throw new Error(`주문을 찾을 수 없습니다: ${checkError.message}`);
  }
  
  console.log('기존 주문 정보:', existingOrder);
  
  // 현재 사용자 정보 확인
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('사용자 정보 확인 오류:', userError);
  } else {
    console.log('현재 사용자:', user?.id, user?.email);
  }
  
  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select(`
      *,
      stores (
        name,
        phone
      ),
      order_items (
        quantity,
        price,
        menus (
          name
        )
      )
    `)
    .single();

  if (error) {
    console.error('주문 상태 업데이트 오류:', error);
    console.error('주문 ID:', orderId);
    console.error('새 상태:', status);
    console.error('에러 상세:', error.message, error.details, error.hint);
    console.error('에러 코드:', error.code);
    throw error;
  }

  console.log('주문 상태 업데이트 성공:', { orderId, status, data });

  // 주문 상태 변경 이벤트 발생 (다른 페이지에서 감지)
  window.dispatchEvent(new CustomEvent('orderStatusChanged', {
    detail: { orderId, status, updatedOrder: data }
  }));

  // 소비자 푸시 알림은 제거됨 - 고객은 주문 조회 페이지에서 확인

  return data;
};

// 주문 상세 정보 가져오기 (주문 아이템 포함)
export const getOrderDetails = async (orderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      stores (
        id,
        name,
        phone,
        bank_account,
        account_holder
      ),
      users (
        id,
        name,
        phone
      ),
      order_items (
        id,
        quantity,
        price,
        menus (
          id,
          name,
          category
        )
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('주문 상세 정보 가져오기 오류:', error);
    throw error;
  }

  return data;
};

// 주문 ID로 주문 정보 가져오기 (배민 스타일 주문상세용)
export const getOrderById = async (orderId: string) => {
  console.log('🔍 getOrderById 호출:', orderId);
  
  // 1. 주문 기본 정보 조회
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      stores (
        id,
        name,
        phone,
        bank_account,
        account_holder
      )
    `)
    .eq('id', orderId)
    .single();

  if (orderError) {
    console.error('❌ 주문 정보 가져오기 오류:', orderError);
    throw orderError;
  }

  console.log('✅ 주문 기본 정보 조회 성공:', orderData);

  // 2. 주문 아이템들 별도 조회
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select(`
      id,
      quantity,
      price,
      menus (
        id,
        name,
        price,
        description
      )
    `)
    .eq('order_id', orderId);

  if (itemsError) {
    console.error('❌ 주문 아이템 가져오기 오류:', itemsError);
  }

  console.log('✅ 주문 아이템 조회 성공:', orderItems);
  console.log('🔍 주문 아이템 개수:', orderItems?.length || 0);

  // 3. 주문 정보와 아이템 정보 결합
  const result = {
    ...orderData,
    order_items: orderItems || []
  };

  console.log('🔍 최종 결과:', result);
  
  return result;
};

// 주문 읽음 처리
export const markOrderAsRead = async (orderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .update({
      read_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('주문 읽음 처리 오류:', error);
    throw error;
  }

  console.log('주문 읽음 처리 완료:', orderId);
  return data;
};
