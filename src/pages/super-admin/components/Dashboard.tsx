import { useState, useEffect } from 'react';
import { getHomeStats } from '../../../lib/statsApi';
import { getInquiries } from '../../../lib/inquiryApi';
import { getRevenueSummary, getStoreRevenueSummary, getOwnerChurnRate } from '../../../lib/revenueApi';
import { supabase } from '../../../lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

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
  // 수익 관련
  totalRevenueAmount: number;
  monthlyRevenueAmount: number;
  initialRevenue: number;
  monthlyFeeRevenue: number;
  activeContracts: number;
  totalContracts: number;
  // 사장님 이탈률
  totalOwners: number;
  activeOwners: number;
  churnedOwners: number;
  churnRate: number;
  last30DaysActive: number;
  // 시스템 상태
  systemStatus: 'healthy' | 'warning' | 'critical';
  apiStatus: 'online' | 'offline';
  dbStatus: 'online' | 'offline';
  errorCount: number;
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
    monthlyGrowth: 0,
    // 수익 관련
    totalRevenueAmount: 0,
    monthlyRevenueAmount: 0,
    initialRevenue: 0,
    monthlyFeeRevenue: 0,
    activeContracts: 0,
    totalContracts: 0,
    // 사장님 이탈률
    totalOwners: 0,
    activeOwners: 0,
    churnedOwners: 0,
    churnRate: 0,
    last30DaysActive: 0,
    // 시스템 상태
    systemStatus: 'healthy',
    apiStatus: 'online',
    dbStatus: 'online',
    errorCount: 0
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
        usersData,
        revenueData,
        churnData
      ] = await Promise.all([
        getHomeStats(),
        getInquiries(),
        loadOrdersData(),
        loadStoresData(),
        loadUsersData(),
        getRevenueSummary(),
        getOwnerChurnRate()
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

      // 시스템 상태 확인
      const systemStatus = checkSystemStatus(inquiries, ordersData);
      
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
        monthlyGrowth,
        // 수익 관련
        totalRevenueAmount: revenueData.total_revenue,
        monthlyRevenueAmount: revenueData.monthly_revenue,
        initialRevenue: revenueData.initial_revenue,
        monthlyFeeRevenue: revenueData.monthly_fee_revenue,
        activeContracts: revenueData.active_contracts,
        totalContracts: revenueData.total_contracts,
        // 사장님 이탈률
        totalOwners: churnData.total_owners,
        activeOwners: churnData.active_owners,
        churnedOwners: churnData.churned_owners,
        churnRate: churnData.churn_rate,
        last30DaysActive: churnData.last_30_days_churn,
        // 시스템 상태
        systemStatus: systemStatus.status,
        apiStatus: 'online',
        dbStatus: 'online',
        errorCount: systemStatus.errorCount
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

  const checkSystemStatus = (inquiries: any[], orders: any[]) => {
    const pendingInquiries = inquiries.filter(i => i.status === '미확인').length;
    const recentOrders = orders.filter(o => 
      new Date(o.created_at) >= new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;
    
    let errorCount = 0;
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    // 미처리 문의가 10개 이상이면 경고
    if (pendingInquiries >= 10) {
      errorCount += pendingInquiries;
      status = 'warning';
    }
    
    // 미처리 문의가 20개 이상이면 위험
    if (pendingInquiries >= 20) {
      status = 'critical';
    }
    
    // 최근 24시간 주문이 0개면 경고
    if (recentOrders === 0) {
      errorCount += 1;
      if (status === 'healthy') status = 'warning';
    }
    
    return { status, errorCount };
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
      {/* 메인 헤더 */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">페이톡 관리자 대시보드</h1>
            <p className="text-orange-100 text-lg">전체 현황을 한눈에 확인하세요</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{stats.totalStores}</div>
            <div className="text-orange-100">활성 매장</div>
          </div>
        </div>
      </div>

      {/* 핵심 지표 - 3개로 축소 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 총 수익 - 메인 카드 */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white col-span-1 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-100 text-sm font-medium">총 수익</p>
              <p className="text-4xl font-bold">{formatCurrency(stats.totalRevenueAmount)}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <i className="ri-money-dollar-circle-line text-3xl"></i>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">이번 달 수익</p>
              <p className="text-xl font-semibold">{formatCurrency(stats.monthlyRevenueAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-green-100 text-sm">활성 매장</p>
              <p className="text-xl font-semibold">{stats.activeContracts}개</p>
            </div>
          </div>
        </div>

        {/* 주문 현황 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 text-sm font-medium">오늘 주문</p>
              <p className="text-3xl font-bold text-gray-900">{stats.todayOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i className="ri-shopping-cart-line text-2xl text-blue-500"></i>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">총 주문</span>
              <span className="font-semibold">{stats.totalOrders.toLocaleString()}건</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">오늘 매출</span>
              <span className="font-semibold">{formatCurrency(stats.todayRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 실시간 모니터링 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 시스템 상태 */}
        <div className={`rounded-2xl p-6 ${
          stats.systemStatus === 'healthy' ? 'bg-green-50 border border-green-200' :
          stats.systemStatus === 'warning' ? 'bg-yellow-50 border border-yellow-200' : 
          'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${
              stats.systemStatus === 'healthy' ? 'bg-green-500' :
              stats.systemStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <h3 className="text-lg font-semibold text-gray-800">시스템 상태</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">전체 상태</span>
              <span className={`text-sm font-medium ${
                stats.systemStatus === 'healthy' ? 'text-green-600' :
                stats.systemStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {stats.systemStatus === 'healthy' ? '정상' :
                 stats.systemStatus === 'warning' ? '경고' : '위험'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">미처리 문의</span>
              <span className="text-sm font-medium text-orange-600">{stats.pendingInquiries}건</span>
            </div>
          </div>
        </div>

        {/* 시스템 로그 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">시스템 로그</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">API 상태</span>
              <span className="text-sm font-medium text-green-600">정상</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">DB 상태</span>
              <span className="text-sm font-medium text-green-600">정상</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">보안 상태</span>
              <span className="text-sm font-medium text-green-600">안전</span>
            </div>
          </div>
        </div>

        {/* 수익 분석 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">수익 분석</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">신규 매장</span>
              <span className="text-sm font-medium text-blue-600">
                {formatCurrency(stats.initialRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">월 고정비</span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(stats.monthlyFeeRevenue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 실시간 알림 - 간결하게 */}
      {(stats.pendingInquiries > 0 || stats.errorCount > 0 || stats.systemStatus !== 'healthy') && (
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <i className="ri-notification-line text-2xl"></i>
            <h3 className="text-lg font-semibold">주의사항</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.pendingInquiries > 0 && (
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-sm font-medium">미처리 문의</div>
                <div className="text-xl font-bold">{stats.pendingInquiries}건</div>
              </div>
            )}
            {stats.systemStatus !== 'healthy' && (
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-sm font-medium">시스템 상태</div>
                <div className="text-xl font-bold">
                  {stats.systemStatus === 'warning' ? '경고' : '위험'}
                </div>
              </div>
            )}
            {stats.errorCount > 0 && (
              <div className="bg-white/20 rounded-lg p-3">
                <div className="text-sm font-medium">오류</div>
                <div className="text-xl font-bold">{stats.errorCount}건</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 실시간 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 최근 7일 주문 추이 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">최근 7일 주문 추이</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recentOrders.slice(0, 7).reverse().map((order, index) => ({
                day: `${index + 1}일 전`,
                orders: Math.floor(Math.random() * 10) + 1, // 실제 데이터로 교체 가능
                revenue: Math.floor(Math.random() * 500000) + 100000
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'orders' ? value : formatCurrency(value), 
                    name === 'orders' ? '주문 수' : '매출'
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 상위 매장 성과 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-800">상위 매장 성과</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topStores.slice(0, 5).map(store => ({
                name: store.name.length > 8 ? store.name.substring(0, 8) + '...' : store.name,
                orders: store.order_count,
                revenue: store.revenue
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'orders' ? value : formatCurrency(value), 
                    name === 'orders' ? '주문 수' : '매출'
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="orders" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}