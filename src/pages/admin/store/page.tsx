import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNewAuth } from '../../../hooks/useNewAuth';
import { getStores, updateStore } from '../../../lib/storeApi';

interface Store {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  business_hours?: string;
  delivery_fee?: number;
  minimum_order?: number;
  created_at: string;
  updated_at: string;
}

export default function AdminStore() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const { user, loading } = useNewAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    business_hours: '',
    delivery_fee: '',
    minimum_order: ''
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
      const stores = await getStores();
      const currentStore = stores.find(s => s.id === storeId);
      if (currentStore) {
        setStore(currentStore);
        setFormData({
          name: currentStore.name || '',
          description: currentStore.description || '',
          address: currentStore.address || '',
          phone: currentStore.phone || '',
          business_hours: currentStore.business_hours || '',
          delivery_fee: currentStore.delivery_fee?.toString() || '',
          minimum_order: currentStore.minimum_order?.toString() || ''
        });
      }
    } catch (error) {
      console.error('매장 로드 실패:', error);
    } finally {
      setStoreLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;

    try {
      const updateData = {
        ...formData,
        delivery_fee: formData.delivery_fee ? parseFloat(formData.delivery_fee) : 0,
        minimum_order: formData.minimum_order ? parseFloat(formData.minimum_order) : 0
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

  const copyOrderLink = async () => {
    if (!storeId) return;
    
    try {
      const orderLink = `${window.location.origin}/menu/${storeId}`;
      await navigator.clipboard.writeText(orderLink);
      alert('주문 링크가 복사되었습니다!');
    } catch (error) {
      console.error('링크 복사 실패:', error);
      alert('링크 복사에 실패했습니다.');
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
            <div className="flex gap-2">
              <button
                onClick={copyOrderLink}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <i className="ri-link"></i>
                주문 링크 복사
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">매장명</label>
                <p className="text-gray-800">{store.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <p className="text-gray-800">{store.description || '설명이 없습니다.'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                <p className="text-gray-800">{store.address || '주소가 없습니다.'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <p className="text-gray-800">{store.phone || '전화번호가 없습니다.'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">운영시간</label>
                <p className="text-gray-800">{store.business_hours || '운영시간이 설정되지 않았습니다.'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배달비</label>
                <p className="text-gray-800">₩{store.delivery_fee?.toLocaleString() || '0'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">최소 주문금액</label>
                <p className="text-gray-800">₩{store.minimum_order?.toLocaleString() || '0'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주문 링크</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/menu/${storeId}`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={copyOrderLink}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    <i className="ri-file-copy-line"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 매장 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <i className="ri-calendar-line text-2xl text-orange-600"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">가입일</h3>
            <p className="text-gray-600">
              {new Date(store.created_at).toLocaleDateString('ko-KR')}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <i className="ri-shopping-cart-line text-2xl text-blue-600"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">주문 링크</h3>
            <p className="text-gray-600 text-sm">고객이 주문할 수 있는 링크</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <i className="ri-settings-line text-2xl text-green-600"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">관리</h3>
            <p className="text-gray-600 text-sm">매장 정보를 수정할 수 있습니다</p>
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
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  운영시간
                </label>
                <input
                  type="text"
                  value={formData.business_hours}
                  onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="예: 09:00 - 22:00"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    배달비
                  </label>
                  <input
                    type="number"
                    value={formData.delivery_fee}
                    onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    최소 주문금액
                  </label>
                  <input
                    type="number"
                    value={formData.minimum_order}
                    onChange={(e) => setFormData({ ...formData, minimum_order: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    min="0"
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
