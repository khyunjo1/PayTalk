// 카카오 알림톡 API 함수
// 카카오 Bizmessage API를 사용하여 알림톡 발송

interface AlimtalkMessage {
  to: string; // 수신자 전화번호
  templateId: string; // 템플릿 ID
  templateArgs: Record<string, string>; // 템플릿 변수
}

interface OrderNotificationData {
  customerName: string;
  customerPhone: string;
  storeName: string;
  orderId: string;
  orderItems: string;
  totalAmount: number;
  deliveryAddress?: string;
  deliveryTime?: string;
  pickupTime?: string;
  depositorName: string;
  bankAccount?: string;
  accountHolder?: string;
}

// 카카오 Bizmessage API 설정
const KAKAO_API_URL = 'https://kapi.kakao.com/v2/api/talk/memo/send';
const KAKAO_BIZMESSAGE_URL = 'https://kapi.kakao.com/v2/api/talk/memo/send';

// 알림톡 발송 함수
export const sendAlimtalk = async (message: AlimtalkMessage): Promise<boolean> => {
  try {
    const accessToken = import.meta.env.VITE_KAKAO_ACCESS_TOKEN;
    
    if (!accessToken) {
      console.error('카카오 액세스 토큰이 설정되지 않았습니다.');
      return false;
    }

    const response = await fetch(KAKAO_BIZMESSAGE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        template_id: message.templateId,
        receiver_uuids: message.to,
        ...message.templateArgs
      })
    });

    if (!response.ok) {
      console.error('알림톡 발송 실패:', response.status, response.statusText);
      return false;
    }

    console.log('알림톡 발송 성공');
    return true;
  } catch (error) {
    console.error('알림톡 발송 오류:', error);
    return false;
  }
};

// 주문 접수 알림톡 발송
export const sendOrderReceivedNotification = async (data: OrderNotificationData): Promise<boolean> => {
  const message: AlimtalkMessage = {
    to: data.customerPhone,
    templateId: 'ORDER_RECEIVED_TEMPLATE', // 실제 템플릿 ID로 변경 필요
    templateArgs: {
      customer_name: data.customerName,
      store_name: data.storeName,
      order_id: data.orderId,
      order_items: data.orderItems,
      total_amount: data.totalAmount.toLocaleString(),
      delivery_address: data.deliveryAddress || '픽업',
      delivery_time: data.deliveryTime || data.pickupTime || '미정',
      depositor_name: data.depositorName,
      bank_account: data.bankAccount || '',
      account_holder: data.accountHolder || ''
    }
  };

  return await sendAlimtalk(message);
};

// 주문 상태 변경 알림톡 발송
export const sendOrderStatusNotification = async (
  data: OrderNotificationData, 
  status: '입금확인' | '배달완료'
): Promise<boolean> => {
  const statusMessages = {
    '입금확인': {
      templateId: 'PAYMENT_CONFIRMED_TEMPLATE',
      message: '입금이 확인되었습니다. 곧 준비하여 배달해드리겠습니다.'
    },
    '배달완료': {
      templateId: 'DELIVERY_COMPLETED_TEMPLATE',
      message: '주문이 완료되었습니다. 맛있게 드세요!'
    }
  };

  const statusInfo = statusMessages[status];
  
  const message: AlimtalkMessage = {
    to: data.customerPhone,
    templateId: statusInfo.templateId,
    templateArgs: {
      customer_name: data.customerName,
      store_name: data.storeName,
      order_id: data.orderId,
      status_message: statusInfo.message,
      delivery_address: data.deliveryAddress || '픽업',
      delivery_time: data.deliveryTime || data.pickupTime || '미정'
    }
  };

  return await sendAlimtalk(message);
};

// 사장님에게 신규 주문 알림톡 발송
export const sendNewOrderNotificationToOwner = async (data: {
  ownerPhone: string;
  storeName: string;
  orderId: string;
  customerName: string;
  orderItems: string;
  totalAmount: number;
  orderType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  deliveryTime?: string;
  pickupTime?: string;
}): Promise<boolean> => {
  const message: AlimtalkMessage = {
    to: data.ownerPhone,
    templateId: 'NEW_ORDER_TEMPLATE', // 실제 템플릿 ID로 변경 필요
    templateArgs: {
      store_name: data.storeName,
      order_id: data.orderId,
      customer_name: data.customerName,
      order_items: data.orderItems,
      total_amount: data.totalAmount.toLocaleString(),
      order_type: data.orderType === 'delivery' ? '배달' : '픽업',
      delivery_address: data.deliveryAddress || '픽업',
      delivery_time: data.deliveryTime || data.pickupTime || '미정'
    }
  };

  return await sendAlimtalk(message);
};

// 알림톡 발송 로그 저장 (선택사항)
export const logAlimtalkSent = async (data: {
  orderId: string;
  recipientPhone: string;
  templateId: string;
  success: boolean;
  errorMessage?: string;
}) => {
  try {
    // Supabase에 알림톡 발송 로그 저장
    const { supabase } = await import('./supabase');
    
    await supabase.from('alimtalk_logs').insert({
      order_id: data.orderId,
      recipient_phone: data.recipientPhone,
      template_id: data.templateId,
      success: data.success,
      error_message: data.errorMessage || null,
      sent_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('알림톡 로그 저장 오류:', error);
  }
};
