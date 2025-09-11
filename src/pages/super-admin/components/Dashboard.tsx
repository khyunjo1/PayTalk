import { useState, useEffect } from 'react';
import { getHomeStats } from '../../../lib/statsApi';
import { getInquiries } from '../../../lib/inquiryApi';
import { supabase } from '../../../lib/supabase';

interface DashboardStats {
  totalStores: number;
  totalOrders: number;
  totalRevenue: number;
  newUsers: number;
  pendingInquiries: number;
  activeStores: number;
  inactiveStores: number;
  todayOrders: number;
  todayRevenue: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
}

interface RecentOrder {
  id: string;
  store_name: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

interface TopStore {
  id: string;
  name: string;
  order_count: number;
  revenue: number;
}

interface NewStore {
  id: string;
  name: string;
  created_at: string;
  owner_name: string;
}

interface PendingInquiry {
  id: string;
  name: string;
  store_name: string;
  phone: string;
  created_at: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStores: 0,
    totalOrders: 0,
    totalRevenue: 0,
    newUsers: 0,
    pendingInquiries: 0,
    activeStores: 0,
    inactiveStores: 0,
    todayOrders: 0,
    todayRevenue: 0,
    weeklyGrowth: 0,
    monthlyGrowth: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topStores, setTopStores] = useState<TopStore[]>([]);
  const [newStores, setNewStores] = useState<NewStore[]>([]);
  const [pendingInquiries, setPendingInquiries] = useState<PendingInquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 병렬로 모든 데이터 로드
      const [
        homeStats,
        inquiries,
        ordersData,
        storesData,
        usersData
      ] = await Promise.all([
        getHomeStats(),
        getInquiries(),
        loadOrdersData(),
        loadStoresData(),
        loadUsersData()
      ]);

      // 통계 계산
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const todayOrders = ordersData.filter(order => 
        new Date(order.created_at) >= todayStart
      );
      const weekOrders = ordersData.filter(order => 
        new Date(order.created_at) >= weekAgo
      );
      const monthOrders = ordersData.filter(order => 
        new Date(order.created_at) >= monthAgo
      );

      const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total_amount, 0);
      const weekRevenue = weekOrders.reduce((sum, order) => sum + order.total_amount, 0);
      const monthRevenue = monthOrders.reduce((sum, order) => sum + order.total_amount, 0);

      const weeklyGrowth = calculateGrowthRate(weekOrders.length, ordersData.length - weekOrders.length);
      const monthlyGrowth = calculateGrowthRate(monthOrders.length, ordersData.length - monthOrders.length);

      setStats({
        totalStores: homeStats.totalStores,
        totalOrders: homeStats.totalOrders,
        totalRevenue: monthRevenue,
        newUsers: usersData.length,
        pendingInquiries: inquiries.filter(i => i.status === '미확인').length,
        activeStores: storesData.filter(s => s.is_active).length,
        inactiveStores: storesData.filter(s => !s.is_active).length,
        todayOrders: todayOrders.length,
        todayRevenue: todayRevenue,
        weeklyGrowth,
        monthlyGrowth
      });

      // 최근 주문 (최근 10개)
      setRecentOrders(ordersData.slice(0, 10));

      // 상위 매장 (주문 수 기준 상위 5개)
      const storeStats = calculateStoreStats(ordersData);
      setTopStores(storeStats.slice(0, 5));

      // 신규 매장 (최근 7일 내 가입)
      const recentStores = storesData.filter(store => 
        new Date(store.created_at) >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      );
      setNewStores(recentStores.slice(0, 5));

      // 미확인 문의
      setPendingInquiries(inquiries.filter(i => i.status === '미확인').slice(0, 5));

    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrdersData = async () => {
    // 먼저 orders 테이블의 모든 컬럼을 조회
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Orders 데이터 로드 실패:', error);
      return [];
    }
    
    // 매장 정보를 별도로 조회
    const storeIds = [...new Set(data?.map(order => order.store_id).filter(Boolean))];
    let storesMap = new Map();
    
    if (storeIds.length > 0) {
      const { data: storesData } = await supabase
        .from('stores')
        .select('id, name')
        .in('id', storeIds);
      
      storesMap = new Map(storesData?.map(store => [store.id, store]) || []);
    }
    
    return data?.map(order => ({
      ...order,
      total_amount: order.amount || order.total_price || order.price || order.total_amount || 0,
      customer_name: order.customer_name || order.customer || order.name || 'Unknown',
      stores: storesMap.get(order.store_id) || { name: 'Unknown' }
    })) || [];
  };

  const loadStoresData = async () => {
    const { data, error } = await supabase
      .from('stores')
      .select(`
        id,
        name,
        created_at,
        is_active,
        owner_id
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // 매장 소유자 정보를 별도로 조회
    const ownerIds = [...new Set(data?.map(store => store.owner_id).filter(Boolean))];
    let ownersMap = new Map();
    
    if (ownerIds.length > 0) {
      const { data: ownersData } = await supabase
        .from('users')
        .select('id, name')
        .in('id', ownerIds);
      
      ownersMap = new Map(ownersData?.map(owner => [owner.id, owner]) || []);
    }
    
    return data?.map(store => ({
      ...store,
      users: ownersMap.get(store.owner_id) || { name: 'Unknown' }
    })) || [];
  };

  const loadUsersData = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, created_at')
      .eq('role', 'admin')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;
    return data || [];
  };

  const calculateStoreStats = (orders: any[]) => {
    const storeMap = new Map();
    
    orders.forEach(order => {
      const storeName = order.stores?.name || 'Unknown';
      if (!storeMap.has(storeName)) {
        storeMap.set(storeName, {
          id: order.stores?.id || '',
          name: storeName,
          order_count: 0,
          revenue: 0
        });
      }
      
      const store = storeMap.get(storeName);
      store.order_count++;
      store.revenue += order.total_amount;
    });

    return Array.from(storeMap.values()).sort((a, b) => b.order_count - a.order_count);
  };

  const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">대시보드</h2>
        <p className="text-gray-600">페이톡 전체 현황을 한눈에 확인하세요</p>
      </div>

      {/* 핵심 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 매장 수</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalStores}</p>
              <p className="text-sm text-gray-500">
                활성 {stats.activeStores} / 비활성 {stats.inactiveStores}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="ri-store-line text-2xl text-blue-500"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 주문 수</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</p>
              <p className="text-sm text-gray-500">오늘 {stats.todayOrders}건</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="ri-shopping-cart-line text-2xl text-green-500"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 매출</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-gray-500">오늘 {formatCurrency(stats.todayRevenue)}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-2xl text-orange-500"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">신규 사용자</p>
              <p className="text-3xl font-bold text-gray-900">{stats.newUsers}</p>
              <p className="text-sm text-gray-500">이번 달</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <i className="ri-user-add-line text-2xl text-purple-500"></i>
            </div>
          </div>
        </div>
      </div>

      {/* 성장 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">성장률 분석</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">주간 성장률</span>
              <span className={`text-sm font-medium ${stats.weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.weeklyGrowth >= 0 ? '+' : ''}{stats.weeklyGrowth}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">월간 성장률</span>
              <span className={`text-sm font-medium ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">시스템 상태</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API 상태</span>
              <span className="text-sm font-medium text-green-600">정상</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">데이터베이스</span>
              <span className="text-sm font-medium text-green-600">정상</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">미확인 문의</span>
              <span className="text-sm font-medium text-orange-600">{stats.pendingInquiries}건</span>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 주문 현황 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">최근 주문 현황</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2">매장</th>
                <th className="text-left py-2">고객</th>
                <th className="text-left py-2">금액</th>
                <th className="text-left py-2">상태</th>
                <th className="text-left py-2">주문시간</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100">
                  <td className="py-2">{order.stores?.name || 'Unknown'}</td>
                  <td className="py-2">{order.customer_name}</td>
                  <td className="py-2">{formatCurrency(order.total_amount)}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.status === '입금확인' ? 'bg-green-100 text-green-800' :
                      order.status === '배달완료' ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-2">{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 매장별 분석 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">상위 매장</h3>
          <div className="space-y-3">
            {topStores.map((store, index) => (
              <div key={store.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">{store.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{store.order_count}건</p>
                  <p className="text-xs text-gray-500">{formatCurrency(store.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">신규 매장</h3>
          <div className="space-y-3">
            {newStores.map((store) => (
              <div key={store.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{store.name}</p>
                  <p className="text-xs text-gray-500">{store.owner_name}</p>
                </div>
                <span className="text-xs text-gray-500">{formatDate(store.created_at)}</span>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* 미확인 문의 */}
      {pendingInquiries.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">미확인 문의</h3>
          <div className="space-y-3">
            {pendingInquiries.map((inquiry) => (
              <div key={inquiry.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{inquiry.name}</p>
                  <p className="text-xs text-gray-500">{inquiry.store_name} • {inquiry.phone}</p>
                </div>
                <span className="text-xs text-gray-500">{formatDate(inquiry.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}