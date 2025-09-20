import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNewAuth } from '../../../../hooks/useNewAuth';
import { getStore, updateStore } from '../../../../lib/storeApi';
import { supabase } from '../../../../lib/supabase';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';

interface DeliveryTimeSlot {
  name: string;
  start: string;
  end: string;
  enabled: boolean;
}

export default function DeliveryTimesPage() {
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  const { user, loading } = useNewAuth();
  const [store, setStore] = useState<any>(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [deliveryTimeSlots, setDeliveryTimeSlots] = useState<DeliveryTimeSlot[]>([]);
  const [saving, setSaving] = useState(false);

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
      setLoadingStore(true);
      const storeData = await getStore(storeId);
      setStore(storeData);
      setDeliveryTimeSlots(storeData.delivery_time_slots || []);
    } catch (error) {
      console.error('매장 정보 로드 실패:', error);
    } finally {
      setLoadingStore(false);
    }
  };

  const addDeliveryTimeSlot = () => {
    setDeliveryTimeSlots([
      ...deliveryTimeSlots,
      { name: '', start: '', end: '', enabled: true }
    ]);
  };

  const addDefaultDeliveryTimeSlots = () => {
    const defaultSlots = [
      { name: '아침 배송', start: '08:00', end: '10:00', enabled: true },
      { name: '점심 배송', start: '11:30', end: '14:00', enabled: true },
      { name: '저녁 배송', start: '17:30', end: '20:00', enabled: true }
    ];
    
    setDeliveryTimeSlots([...deliveryTimeSlots, ...defaultSlots]);
  };

  const updateDeliveryTimeSlot = (index: number, field: keyof DeliveryTimeSlot, value: string | boolean) => {
    const updatedSlots = deliveryTimeSlots.map((slot, i) =>
      i === index ? { ...slot, [field]: value } : slot
    );
    setDeliveryTimeSlots(updatedSlots);
  };

  const removeDeliveryTimeSlot = (index: number) => {
    const updatedSlots = deliveryTimeSlots.filter((_, i) => i !== index);
    setDeliveryTimeSlots(updatedSlots);
  };

  const handleSave = async () => {
    if (!storeId) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('stores')
        .update({
          delivery_time_slots: deliveryTimeSlots,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId);

      if (error) throw error;

      alert('배송 시간대가 저장되었습니다.');
      navigate(`/admin/${storeId}/store`);
    } catch (error) {
      console.error('배송 시간대 저장 실패:', error);
      alert('배송 시간대 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingStore) {
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
            <i className="ri-store-line text-2xl text-red-600"></i>
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
      
      <div className="max-w-4xl mx-auto p-4">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(`/admin/${storeId}/store`)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <i className="ri-arrow-left-line text-xl text-gray-600"></i>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">배송 시간대 관리</h1>
              <p className="text-gray-600">{store.name}</p>
            </div>
          </div>
        </div>

        {/* 배송 시간대 설정 */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <i className="ri-truck-line text-orange-500"></i>
              배송 시간대 설정
            </h2>
            <div className="flex gap-2">
              <button
                onClick={addDefaultDeliveryTimeSlots}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
              >
                <i className="ri-add-circle-line text-xs"></i>
                기본 시간대 추가
              </button>
            </div>
          </div>
          
          {deliveryTimeSlots.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <i className="ri-truck-line text-5xl text-gray-400 mb-4"></i>
              <p className="text-gray-500 mb-6 text-lg">설정된 배송 시간대가 없습니다</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={addDefaultDeliveryTimeSlots}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                >
                  <i className="ri-add-circle-line"></i>
                  기본 시간대 추가
                </button>
                <button
                  onClick={addDeliveryTimeSlot}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <i className="ri-add-line"></i>
                  직접 추가
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveryTimeSlots.map((slot, index) => (
                <div key={index} className={`p-5 border-2 rounded-xl transition-all ${
                  slot.enabled 
                    ? 'border-orange-200 bg-orange-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <i className="ri-truck-line text-orange-500"></i>
                      <span className="font-semibold text-gray-800">시간대 {index + 1}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        slot.enabled 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {slot.enabled ? '활성' : '비활성'}
                      </span>
                    </div>
                    <button
                      onClick={() => removeDeliveryTimeSlot(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <i className="ri-delete-bin-line text-lg"></i>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">시간대 이름</label>
                      <input
                        type="text"
                        value={slot.name}
                        onChange={(e) => updateDeliveryTimeSlot(index, 'name', e.target.value)}
                        placeholder="예: 아침 배송"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">시작시간</label>
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateDeliveryTimeSlot(index, 'start', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">종료시간</label>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateDeliveryTimeSlot(index, 'end', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`enabled-${index}`}
                        checked={slot.enabled}
                        onChange={(e) => updateDeliveryTimeSlot(index, 'enabled', e.target.checked)}
                        className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor={`enabled-${index}`} className="ml-3 text-sm font-medium text-gray-700">
                        이 시간대 활성화
                      </label>
                    </div>
                    {slot.name && slot.start && slot.end && (
                      <div className="text-sm text-gray-500 font-medium">
                        {slot.name}: {slot.start} - {slot.end}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={addDeliveryTimeSlot}
                  className="flex-1 py-3 px-4 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-orange-500 hover:text-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ri-add-line"></i>
                  시간대 추가
                </button>
                <button
                  onClick={addDefaultDeliveryTimeSlots}
                  className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                >
                  <i className="ri-add-circle-line"></i>
                  기본 시간대
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 저장 버튼 */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => navigate(`/admin/${storeId}/store`)}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                저장 중...
              </>
            ) : (
              <>
                <i className="ri-save-line"></i>
                저장
              </>
            )}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
