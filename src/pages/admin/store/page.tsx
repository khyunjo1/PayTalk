import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNewAuth } from '../../../hooks/useNewAuth';
import { getStore, updateStore } from '../../../lib/storeApi';
import Header from '../../../components/Header';
import { StoreDB } from '../../../types';

export default function AdminStore() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const { user, loading } = useNewAuth();
  const [store, setStore] = useState<StoreDB | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    delivery_area: '',
    phone: '',
    business_hours_start: '',
    business_hours_end: '',
    order_cutoff_time: '',
    minimum_order_amount: '',
    bank_account: '',
    account_holder: ''
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin-login');
      return;
    }

    if (!loading && user && user.role !== 'admin') {
      navigate('/admin-dashboard');
      return;
    }

    if (storeId) {
      loadStore();
    }
  }, [user, loading, navigate, storeId]);

  const loadStore = async () => {
    if (!storeId) return;
    
    try {
      setStoreLoading(true);
      console.log('🔍 매장 정보 로드 시작 - 매장 ID:', storeId);
      const currentStore = await getStore(storeId);
      console.log('✅ 매장 정보 로드 성공:', currentStore);
      
      setStore(currentStore);
      setFormData({
        name: currentStore.name || '',
        category: currentStore.category || '',
        delivery_area: currentStore.delivery_area || '',
        phone: currentStore.phone || '',
        business_hours_start: currentStore.business_hours_start || '',
        business_hours_end: currentStore.business_hours_end || '',
        order_cutoff_time: currentStore.order_cutoff_time || '',
        minimum_order_amount: currentStore.minimum_order_amount?.toString() || '',
        bank_account: currentStore.bank_account || '',
        account_holder: currentStore.account_holder || ''
      });
    } catch (error) {
      console.error('❌ 매장 로드 실패:', error);
    } finally {
      setStoreLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;

    try {
      const updateData = {
        name: formData.name,
        category: formData.category,
        delivery_area: formData.delivery_area,
        phone: formData.phone,
        business_hours_start: formData.business_hours_start,
        business_hours_end: formData.business_hours_end,
        order_cutoff_time: formData.order_cutoff_time,
        minimum_order_amount: formData.minimum_order_amount ? parseInt(formData.minimum_order_amount) : 0,
        bank_account: formData.bank_account,
        account_holder: formData.account_holder
      };

      const updatedStore = await updateStore(storeId, updateData);
      setStore(updatedStore);
      setShowForm(false);
      alert('매장 정보가 업데이트되었습니다.');
    } catch (error) {
      console.error('매장 정보 업데이트 실패:', error);
      alert('매장 정보 업데이트에 실패했습니다.');
    }
  };


  if (loading || storeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <i className="ri-lock-line text-2xl text-red-600"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600">관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <i className="ri-error-warning-line text-2xl text-red-600"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">매장을 찾을 수 없습니다</h2>
          <p className="text-gray-600">매장 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="ri-arrow-left-line text-xl text-gray-600"></i>
              </button>
              <h1 className="text-xl font-bold text-gray-800">매장관리</h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <i className="ri-edit-line"></i>
              정보 수정
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* 매장 정보 카드 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{store.name}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">매장명</label>
                <p className="text-gray-800">{store.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <p className="text-gray-800">{store.category || '카테고리가 없습니다.'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배달지역</label>
                <p className="text-gray-800">{store.delivery_area || '배달지역이 없습니다.'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <p className="text-gray-800">{store.phone || '전화번호가 없습니다.'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">운영시간</label>
                <p className="text-gray-800">
                  {store.business_hours_start && store.business_hours_end 
                    ? `${store.business_hours_start} - ${store.business_hours_end}`
                    : '운영시간이 설정되지 않았습니다.'
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주문마감시간</label>
                <p className="text-gray-800">{store.order_cutoff_time || '주문마감시간이 설정되지 않았습니다.'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">최소 주문금액</label>
                <p className="text-gray-800">₩{store.minimum_order_amount?.toLocaleString() || '0'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
                <p className="text-gray-800">{store.bank_account || '계좌번호가 없습니다.'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">예금주명</label>
                <p className="text-gray-800">{store.account_holder || '예금주명이 없습니다.'}</p>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* 매장 정보 수정 폼 */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl mx-4 w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">매장 정보 수정</h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    매장명 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    카테고리
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="예: 한식반찬"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  배달지역
                </label>
                <input
                  type="text"
                  value={formData.delivery_area}
                  onChange={(e) => setFormData({ ...formData, delivery_area: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="예: 진주, 삼천포, 사천"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="예: 01032626543"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    운영시간 시작
                  </label>
                  <input
                    type="time"
                    value={formData.business_hours_start}
                    onChange={(e) => setFormData({ ...formData, business_hours_start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    운영시간 종료
                  </label>
                  <input
                    type="time"
                    value={formData.business_hours_end}
                    onChange={(e) => setFormData({ ...formData, business_hours_end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주문마감시간
                </label>
                <input
                  type="time"
                  value={formData.order_cutoff_time}
                  onChange={(e) => setFormData({ ...formData, order_cutoff_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최소 주문금액
                </label>
                <input
                  type="number"
                  value={formData.minimum_order_amount}
                  onChange={(e) => setFormData({ ...formData, minimum_order_amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  min="0"
                  placeholder="예: 10000"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    계좌번호
                  </label>
                  <input
                    type="text"
                    value={formData.bank_account}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="예: 3333-33-33333"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    예금주명
                  </label>
                  <input
                    type="text"
                    value={formData.account_holder}
                    onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="예: 윤윤자"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
