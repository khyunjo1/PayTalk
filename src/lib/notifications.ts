// 카카오 알림톡 발송 함수들

interface NotificationData {
  orderId: string
  customerName: string
  storeName: string
  totalAmount: number
  orderTime: string
  bankAccount?: string
  accountHolder?: string
  deliveryTime?: string
}

// 주문 접수 알림톡 발송
export const sendOrderNotification = async (data: NotificationData) => {
  try {
    const templateId = import.meta.env.VITE_KAKAO_ORDER_TEMPLATE_ID
    const apiKey = import.meta.env.VITE_KAKAO_REST_API_KEY
    
    if (!templateId || !apiKey) {
      console.error('알림톡 템플릿 ID 또는 API 키가 설정되지 않았습니다.')
      return
    }
    
    const message = {
      template_id: templateId,
      template_args: {
        고객명: data.customerName,
        주문번호: data.orderId,
        매장명: data.storeName,
        결제금액: data.totalAmount.toLocaleString(),
        주문시간: data.orderTime,
        계좌번호: data.bankAccount || '',
        예금주명: data.accountHolder || '',
        입금마감시간: new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString() // 2시간 후
      }
    }
    
    // 실제 구현에서는 백엔드 API를 통해 발송
    console.log('주문 접수 알림톡 발송:', message)
    
    // TODO: 실제 카카오 비즈메시지 API 호출
    // const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `KakaoAK ${apiKey}`,
    //     'Content-Type': 'application/x-www-form-urlencoded'
    //   },
    //   body: new URLSearchParams(message)
    // })
    
  } catch (error) {
    console.error('주문 접수 알림톡 발송 오류:', error)
  }
}

// 입금 확인 알림톡 발송
export const sendPaymentNotification = async (data: NotificationData) => {
  try {
    const templateId = import.meta.env.VITE_KAKAO_PAYMENT_TEMPLATE_ID
    const apiKey = import.meta.env.VITE_KAKAO_REST_API_KEY
    
    if (!templateId || !apiKey) {
      console.error('알림톡 템플릿 ID 또는 API 키가 설정되지 않았습니다.')
      return
    }
    
    const message = {
      template_id: templateId,
      template_args: {
        고객명: data.customerName,
        주문번호: data.orderId,
        매장명: data.storeName,
        결제금액: data.totalAmount.toLocaleString(),
        배달시간: data.deliveryTime || '30분 내'
      }
    }
    
    console.log('입금 확인 알림톡 발송:', message)
    
  } catch (error) {
    console.error('입금 확인 알림톡 발송 오류:', error)
  }
}

// 배달 완료 알림톡 발송
export const sendDeliveryNotification = async (data: NotificationData) => {
  try {
    const templateId = import.meta.env.VITE_KAKAO_DELIVERY_TEMPLATE_ID
    const apiKey = import.meta.env.VITE_KAKAO_REST_API_KEY
    
    if (!templateId || !apiKey) {
      console.error('알림톡 템플릿 ID 또는 API 키가 설정되지 않았습니다.')
      return
    }
    
    const message = {
      template_id: templateId,
      template_args: {
        고객명: data.customerName,
        주문번호: data.orderId,
        매장명: data.storeName,
        결제금액: data.totalAmount.toLocaleString(),
        배달완료시간: new Date().toLocaleString()
      }
    }
    
    console.log('배달 완료 알림톡 발송:', message)
    
  } catch (error) {
    console.error('배달 완료 알림톡 발송 오류:', error)
  }
}
