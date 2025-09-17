import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDeliveryAreas, createDeliveryArea, updateDeliveryArea, deleteDeliveryArea } from '../../../../lib/deliveryAreaApi';
import { supabase } from '../../../../lib/supabase';
import { useNewAuth } from '../../../../hooks/useNewAuth';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';

interface DeliveryArea {
  id: string;
  store_id: string;
  area_name: string;
  delivery_fee: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  description: string;
  image_url: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export default function DeliverySettingsPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { user } = useNewAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null);
  const [formData, setFormData] = useState({
    area_name: '',
    delivery_fee: 0
  });

  useEffect(() => {
    if (storeId && user) {
      loadStoreData();
      loadDeliveryAreas();
    }
  }, [storeId, user]);

  const loadStoreData = async () => {
    try {
      console.log('🔍 매장 정보 로드 시도:', { storeId, userId: user?.id });
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .eq('owner_id', user?.id)
        .single();

      if (error) {
        console.error('❌ 매장 정보 로드 실패:', error);
        throw error;
      }
      
      console.log('✅ 매장 정보 로드 성공:', data);
      setStore(data);
    } catch (error) {
      console.error('매장 정보 로드 실패:', error);
    }
  };

  const loadDeliveryAreas = async () => {
    try {
      setLoading(true);
      const areas = await getDeliveryAreas(storeId as string);
      setDeliveryAreas(areas);
    } catch (error) {
      console.error('배달지역 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.area_name.trim() || formData.delivery_fee < 0) return;

    try {
      console.log('🔍 배달지역 저장 시도:', { 
        storeId, 
        userId: user?.id, 
        formData, 
        editingArea: editingArea?.id 
      });

      if (editingArea) {
        await updateDeliveryArea(editingArea.id, formData.area_name, formData.delivery_fee);
      } else {
        await createDeliveryArea(storeId as string, formData.area_name, formData.delivery_fee);
      }
      
      console.log('✅ 배달지역 저장 성공');
      await loadDeliveryAreas();
      setShowAddModal(false);
      setEditingArea(null);
      setFormData({ area_name: '', delivery_fee: 0 });
    } catch (error) {
      console.error('❌ 배달지역 저장 실패:', error);
    }
  };

  const handleEdit = (area: DeliveryArea) => {
    setEditingArea(area);
    setFormData({
      area_name: area.area_name,
      delivery_fee: area.delivery_fee
    });
    setShowAddModal(true);
  };

  const handleDelete = async (areaId: string) => {
    if (!confirm('정말로 이 배달지역을 삭제하시겠습니까?')) return;

    try {
      await deleteDeliveryArea(areaId);
      await loadDeliveryAreas();
    } catch (error) {
      console.error('배달지역 삭제 실패:', error);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingArea(null);
    setFormData({ area_name: '', delivery_fee: 0 });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 중...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">매장 정보를 불러오는 중...</p>
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
              <h1 className="text-xl font-bold text-gray-800">배달비 설정</h1>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <i className="ri-add-line"></i>
              지역 추가
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">

        {/* 배달지역 목록 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">로딩 중...</p>
            </div>
          ) : deliveryAreas.length === 0 ? (
            <div className="text-center py-8">
              <i className="ri-truck-line text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-600 mb-4">등록된 배달지역이 없습니다.</p>
              <p className="text-sm text-gray-500">"지역 추가" 버튼을 눌러 배달지역을 추가해보세요.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {deliveryAreas.map((area) => (
                <div key={area.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{area.area_name}</h3>
                    <p className="text-sm text-gray-600">배달비: {area.delivery_fee.toLocaleString()}원</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(area)}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      title="수정"
                    >
                      <i className="ri-edit-line"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(area.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="삭제"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 지역 추가/수정 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {editingArea ? '배달지역 수정' : '배달지역 추가'}
              </h3>
              <p className="text-gray-600 text-sm">
                배달지역명과 배달비를 입력해주세요.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  배달지역명
                </label>
                <input
                  type="text"
                  value={formData.area_name}
                  onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
                  placeholder="예: 강남구, 서초구, 송파구"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  배달비 (원)
                </label>
                <input
                  type="number"
                  value={formData.delivery_fee || ''}
                  onChange={(e) => setFormData({ ...formData, delivery_fee: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-medium transition-all duration-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {editingArea ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}