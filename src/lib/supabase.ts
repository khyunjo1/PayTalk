import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY


if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 환경 변수 누락:', { supabaseUrl, supabaseAnonKey });
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Supabase 연결 테스트
export const testSupabaseConnection = async () => {
  try {
    console.log('Supabase 연결 테스트 시작...');
    const { data, error } = await supabase.from('users').select('count').limit(1);
    console.log('Supabase 연결 테스트 결과:', { data, error });
    
    if (error) {
      console.error('Supabase 연결 실패:', error);
      console.error('가능한 원인:');
      console.error('1. Supabase 프로젝트가 일시 중지됨 (무료 요금제)');
      console.error('2. 잘못된 URL 또는 API 키');
      console.error('3. 네트워크 연결 문제');
    }
    
    return { success: !error, error };
  } catch (err) {
    console.error('Supabase 연결 테스트 실패:', err);
    return { success: false, error: err };
  }
};

// 타입 정의
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          profile_image: string
          phone: string
          role: 'customer' | 'owner' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          profile_image?: string
          phone?: string
          role?: 'customer' | 'owner' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          profile_image?: string
          phone?: string
          role?: 'customer' | 'owner' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      user_stores: {
        Row: {
          id: string
          user_id: string
          store_id: string
          role: 'owner' | 'manager'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          store_id: string
          role?: 'owner' | 'manager'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          store_id?: string
          role?: 'owner' | 'manager'
          created_at?: string
          updated_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          name: string
          category: string
          delivery_area: string
          delivery_fee: number
          phone: string
          business_hours_start: string
          business_hours_end: string
          pickup_time_slots: string[]
          delivery_time_slots: Array<{
            name: string
            start: string
            end: string
            enabled: boolean
          }>
          bank_account: string
          account_holder: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          delivery_area: string
          delivery_fee: number
          phone: string
          business_hours_start?: string
          business_hours_end?: string
          pickup_time_slots?: string[]
          delivery_time_slots?: Array<{
            name: string
            start: string
            end: string
            enabled: boolean
          }>
          bank_account: string
          account_holder: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          delivery_area?: string
          delivery_fee?: number
          phone?: string
          business_hours_start?: string
          business_hours_end?: string
          pickup_time_slots?: string[]
          delivery_time_slots?: Array<{
            name: string
            start: string
            end: string
            enabled: boolean
          }>
          bank_account?: string
          account_holder?: string
          created_at?: string
          updated_at?: string
        }
      }
      menus: {
        Row: {
          id: string
          store_id: string
          name: string
          price: number
          category: string
          description: string | null
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          price: number
          category: string
          description?: string | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          price?: number
          category?: string
          description?: string | null
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          store_id: string
          status: '입금대기' | '입금확인' | '배달완료' | '주문취소'
          order_type: 'delivery' | 'pickup'
          delivery_address: string | null
          delivery_time: string | null
          pickup_time: string | null
          special_requests: string | null
          depositor_name: string
          subtotal: number
          delivery_fee: number
          total: number
          delivery_area_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          store_id: string
          status?: '입금대기' | '입금확인' | '배달완료' | '주문취소'
          order_type: 'delivery' | 'pickup'
          delivery_address?: string | null
          delivery_time?: string | null
          pickup_time?: string | null
          special_requests?: string | null
          depositor_name: string
          subtotal: number
          delivery_fee: number
          total: number
          delivery_area_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          store_id?: string
          status?: '입금대기' | '입금확인' | '배달완료' | '주문취소'
          order_type?: 'delivery' | 'pickup'
          delivery_address?: string | null
          delivery_time?: string | null
          pickup_time?: string | null
          special_requests?: string | null
          depositor_name?: string
          subtotal?: number
          delivery_fee?: number
          total?: number
          delivery_area_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_id: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_id: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_id?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
      delivery_areas: {
        Row: {
          id: string
          store_id: string
          area_name: string
          delivery_fee: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          area_name: string
          delivery_fee?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          area_name?: string
          delivery_fee?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
