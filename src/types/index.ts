// PayTalk 프로젝트 공통 타입 정의

// 사용자 역할 타입
export type UserRole = 'customer' | 'admin' | 'super_admin';

// 사용자 인터페이스
export interface User {
  id: string;
  email: string;
  name: string;
  profile_image?: string;
  phone?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// 매장 상태 타입
export type StoreStatus = 'active' | 'inactive';

// 배달 시간 슬롯 인터페이스
export interface DeliveryTimeSlot {
  name: string;
  start: string;
  end: string;
  enabled: boolean;
}

// 매장 인터페이스 (데이터베이스)
export interface StoreDB {
  id: string;
  name: string;
  category: string;
  owner_name?: string;
  delivery_area: string;
  delivery_fee: number;
  phone: string;
  business_hours_start?: string;
  business_hours_end?: string;
  pickup_time_slots?: string[];
  delivery_time_slots?: DeliveryTimeSlot[];
  bank_account: string;
  account_holder: string;
  image_url?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

// 매장 인터페이스 (컴포넌트용)
export interface Store {
  id: string;
  name: string;
  category: string;
  owner: string;
  phone: string;
  status: StoreStatus;
  deliveryFee: number;
  deliveryArea: string;
  businessHoursStart: string;
  businessHoursEnd: string;
  pickupTimeSlots: string[];
  deliveryTimeSlots: DeliveryTimeSlot[];
  bankAccount: string;
  accountHolder: string;
  image_url?: string;
}

// 메뉴 인터페이스 (데이터베이스)
export interface MenuDB {
  id: string;
  store_id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image_url?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

// 메뉴 인터페이스 (컴포넌트용)
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  isAvailable: boolean;
  storeId: string;
  image_url?: string;
}

// 메뉴 생성 데이터 타입
export interface CreateMenuData {
  store_id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  image_url?: string;
  is_available?: boolean;
}

// 메뉴 수정 데이터 타입
export interface UpdateMenuData {
  name?: string;
  price?: number;
  category?: string;
  description?: string;
  image_url?: string;
  is_available?: boolean;
}

// 매장 생성 데이터 타입
export interface CreateStoreData {
  name: string;
  category: string;
  owner_name?: string;
  delivery_area: string;
  delivery_fee: number;
  phone: string;
  business_hours_start?: string;
  business_hours_end?: string;
  pickup_time_slots?: string[];
  delivery_time_slots?: DeliveryTimeSlot[];
  bank_account: string;
  account_holder: string;
  image_url?: string;
  is_active?: boolean;
}

// 매장 수정 데이터 타입
export interface UpdateStoreData {
  name?: string;
  category?: string;
  owner_name?: string;
  delivery_area?: string;
  delivery_fee?: number;
  phone?: string;
  business_hours_start?: string;
  business_hours_end?: string;
  pickup_time_slots?: string[];
  delivery_time_slots?: DeliveryTimeSlot[];
  bank_account?: string;
  account_holder?: string;
  image_url?: string;
  is_active?: boolean;
}

// API 응답 타입
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// 폼 상태 타입
export interface FormState {
  isLoading: boolean;
  error?: string;
  success?: string;
}

// 토스트 메시지 타입
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}
