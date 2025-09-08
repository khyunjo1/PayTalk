import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStores, createStore, updateStore, deleteStore } from '../../../lib/storeApi';
import type { Store } from '../../../types';

interface StoreManagementProps {
  showToast: (message: string) => void;
}

export default function StoreManagement({ showToast }: StoreManagementProps) {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // 실제 매장 데이터 로드 (캐싱 추가)
  useEffect(() => {
    const loadStores = async () => {
      // 이미 데이터가 있으면 다시 로드하지 않음
      if (stores.length > 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const storesData = await getStores();
        
        // 데이터베이스 매장을 컴포넌트 형식으로 변환
        const formattedStores: Store[] = storesData.map(store => ({
          id: store.id,
          name: store.name,
          category: store.category || '한식반찬',
          owner: store.owner_name || '미지정',
          phone: store.phone || '',
          status: store.is_active ? 'active' : 'inactive',
          deliveryFee: store.delivery_fee || 0,
          deliveryArea: store.delivery_area || '',
          businessHoursStart: store.business_hours_start || '09:00',
          businessHoursEnd: store.business_hours_end || '22:00',
          orderCutoffTime: store.order_cutoff_time || '15:00',
          pickupTimeSlots: store.pickup_time_slots || [],
          deliveryTimeSlots: store.delivery_time_slots || [],
          bankAccount: store.bank_account || '',
          accountHolder: store.account_holder || '',
        }));

        
        setStores(formattedStores);
        console.log('✅ 매장 데이터 로드됨:', formattedStores.length, '개');
      } catch (error) {
        console.error('❌ 매장 데이터 로드 실패:', error);
        showToast('매장 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadStores();
  }, [showToast]); // stores.length 제거하여 무한루프 방지

  const [newStore, setNewStore] = useState({
    name: '',
    category: '한식반찬',
    owner: '',
    phone: '',
    deliveryFee: 2000,
    deliveryArea: '',
    businessHoursStart: '09:00',
    businessHoursEnd: '22:00',
    orderCutoffTime: '15:00',
    bankAccount: '',
    accountHolder: '',
    pickupTimeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
    deliveryTimeSlots: [
      { name: '아침 배송', start: '08:00', end: '10:00', enabled: false },
      { name: '점심 배송', start: '11:30', end: '14:00', enabled: true },
      { name: '오후 배송', start: '14:30', end: '17:00', enabled: false },
      { name: '저녁 배송', start: '17:30', end: '20:00', enabled: true }
    ]
  });

  const filteredStores = useMemo(() => 
    stores.filter(store => 
      selectedStatus === 'all' || store.status === selectedStatus
    ), [stores, selectedStatus]
  );

  const handleAddStore = useCallback(async () => {
    // 폼 검증
    if (!newStore.name.trim()) {
      showToast('매장명을 입력해주세요');
      return;
    }
    if (newStore.name.trim().length < 2) {
      showToast('매장명은 2글자 이상 입력해주세요');
      return;
    }
    if (!newStore.phone.trim()) {
      showToast('전화번호를 입력해주세요');
      return;
    }
    if (!newStore.deliveryArea.trim()) {
      showToast('배달지역을 입력해주세요');
      return;
    }
    if (!newStore.bankAccount.trim()) {
      showToast('계좌번호를 입력해주세요');
      return;
    }
    if (!newStore.accountHolder.trim()) {
      showToast('예금주명을 입력해주세요');
      return;
    }
    if (newStore.deliveryFee < 0) {
      showToast('배달비는 0원 이상이어야 합니다');
      return;
    }

    try {
      const storeData = {
        name: newStore.name,
        category: newStore.category,
        owner_name: newStore.owner,
        phone: newStore.phone,
        delivery_fee: newStore.deliveryFee,
        delivery_area: newStore.deliveryArea,
        business_hours_start: newStore.businessHoursStart,
        business_hours_end: newStore.businessHoursEnd,
        order_cutoff_time: newStore.orderCutoffTime,
        bank_account: newStore.bankAccount,
        account_holder: newStore.accountHolder,
        is_active: true,
        pickup_time_slots: newStore.pickupTimeSlots,
        delivery_time_slots: newStore.deliveryTimeSlots
      };

      console.log('🔄 매장 생성 데이터:', storeData);

      const createdStore = await createStore(storeData);
      
      // 새 매장을 목록에 추가
      const formattedStore: Store = {
        id: createdStore.id,
        name: createdStore.name,
        category: createdStore.category || '한식반찬',
        owner: createdStore.owner_name || '미지정',
        phone: createdStore.phone || '',
        status: createdStore.is_active ? 'active' : 'inactive',
        deliveryFee: createdStore.delivery_fee || 0,
        deliveryArea: createdStore.delivery_area || '',
        businessHoursStart: createdStore.business_hours_start || '09:00',
        businessHoursEnd: createdStore.business_hours_end || '22:00',
        orderCutoffTime: createdStore.order_cutoff_time || '15:00',
        pickupTimeSlots: createdStore.pickup_time_slots || [],
        deliveryTimeSlots: createdStore.delivery_time_slots || [],
        bankAccount: createdStore.bank_account || '',
        accountHolder: createdStore.account_holder || '',
      };

      setStores([...stores, formattedStore]);
      setShowAddModal(false);
      setNewStore({
      name: '',
      category: '한식반찬',
      owner: '',
      phone: '',
      deliveryFee: 2000,
      deliveryArea: '',
        businessHoursStart: '09:00',
        businessHoursEnd: '22:00',
        orderCutoffTime: '15:00',
        bankAccount: '',
        accountHolder: '',
        pickupTimeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
        deliveryTimeSlots: [
          { name: '아침 배송', start: '08:00', end: '10:00', enabled: false },
          { name: '점심 배송', start: '11:30', end: '14:00', enabled: true },
          { name: '오후 배송', start: '14:30', end: '17:00', enabled: false },
          { name: '저녁 배송', start: '17:30', end: '20:00', enabled: true }
        ]
      });
      showToast('새 매장이 추가되었습니다');
    } catch (error) {
      console.error('❌ 매장 추가 실패:', error);
      showToast('매장 추가에 실패했습니다');
    }
  }, [newStore, showToast, stores]);

  const handleEditStore = (store: Store) => {
    setEditingStore(store);
    setShowEditModal(true);
  };

  const handleUpdateStore = async () => {
    if (!editingStore) return;

    // 폼 검증
    if (!editingStore.name.trim()) {
      showToast('매장명을 입력해주세요');
      return;
    }
    if (editingStore.name.trim().length < 2) {
      showToast('매장명은 2글자 이상 입력해주세요');
      return;
    }
    if (!editingStore.phone.trim()) {
      showToast('전화번호를 입력해주세요');
      return;
    }
    if (!editingStore.deliveryArea.trim()) {
      showToast('배달지역을 입력해주세요');
      return;
    }
    if (!editingStore.bankAccount.trim()) {
      showToast('계좌번호를 입력해주세요');
      return;
    }
    if (!editingStore.accountHolder.trim()) {
      showToast('예금주명을 입력해주세요');
      return;
    }
    if (editingStore.deliveryFee < 0) {
      showToast('배달비는 0원 이상이어야 합니다');
      return;
    }

    try {
      const updateData = {
        name: editingStore.name,
        category: editingStore.category,
        owner_name: editingStore.owner,
        phone: editingStore.phone,
        delivery_fee: editingStore.deliveryFee,
        delivery_area: editingStore.deliveryArea,
        business_hours_start: editingStore.businessHoursStart,
        business_hours_end: editingStore.businessHoursEnd,
        order_cutoff_time: editingStore.orderCutoffTime,
        bank_account: editingStore.bankAccount,
        account_holder: editingStore.accountHolder,
        pickup_time_slots: editingStore.pickupTimeSlots,
        delivery_time_slots: editingStore.deliveryTimeSlots
      };

      console.log('🔄 매장 수정 데이터:', updateData);

      await updateStore(editingStore.id, updateData);
      
    setStores(stores.map(store => 
        store.id === editingStore.id ? editingStore : store
      ));
      
      setShowEditModal(false);
      setEditingStore(null);
      showToast('매장 정보가 업데이트되었습니다');
    } catch (error) {
      console.error('❌ 매장 업데이트 실패:', error);
      showToast('매장 업데이트에 실패했습니다');
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('정말로 이 매장을 삭제하시겠습니까?')) return;

    try {
      await deleteStore(storeId);
      setStores(stores.filter(store => store.id !== storeId));
      showToast('매장이 삭제되었습니다');
    } catch (error) {
      console.error('❌ 매장 삭제 실패:', error);
      showToast('매장 삭제에 실패했습니다');
    }
  };

  const handleViewStoreAdmin = (store: Store) => {
    // 매장 관리자 페이지로 이동 (storeId를 쿼리 파라미터로 전달)
    navigate(`/admin?storeId=${store.id}&storeName=${encodeURIComponent(store.name)}`);
    showToast(`${store.name} 관리자 페이지로 이동합니다`);
  };

  const toggleStoreStatus = async (storeId: string) => {
    try {
      const store = stores.find(s => s.id === storeId);
      if (!store) return;

      const newStatus = store.status === 'active' ? 'inactive' : 'active';
      
      // 데이터베이스 업데이트
      await updateStore(storeId, { is_active: newStatus === 'active' });
      
      // UI 업데이트
      setStores(stores.map(store => 
        store.id === storeId 
          ? { ...store, status: newStatus }
          : store
      ));
      
      showToast(`매장이 ${newStatus === 'active' ? '운영 재개' : '운영 중단'}되었습니다`);
    } catch (error) {
      console.error('❌ 매장 상태 변경 실패:', error);
      showToast('매장 상태 변경에 실패했습니다');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">매장 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">매장 관리</h2>
          <p className="text-gray-600">등록된 매장과 운영 상태를 관리합니다</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white hover:bg-orange-500 text-gray-700 hover:text-white px-4 py-2 rounded-lg border border-gray-300 hover:border-orange-500 transition-colors"
        >
          + 새 매장 추가
        </button>
      </div>

      {/* 필터 */}
      <div className="flex items-center space-x-4">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">전체 매장</option>
          <option value="active">운영 중</option>
          <option value="inactive">운영 중단</option>
        </select>
        <div className="text-sm text-gray-600">
          총 {filteredStores.length}개 매장
        </div>
      </div>

      {/* 매장 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores.map((store) => (
          <div key={store.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{store.name}</h3>
                <p className="text-sm text-gray-600">{store.category}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      store.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                {store.status === 'active' ? '운영 중' : '운영 중단'}
                    </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <span className="w-16 font-medium">사장님:</span>
                <span>{store.owner}</span>
              </div>
              <div className="flex items-center">
                <span className="w-16 font-medium">전화:</span>
                <span>{store.phone}</span>
              </div>
              <div className="flex items-center">
                <span className="w-16 font-medium">배달비:</span>
                <span>{store.deliveryFee.toLocaleString()}원</span>
              </div>
              <div className="flex items-center">
                <span className="w-16 font-medium">배달지역:</span>
                <span>{store.deliveryArea}</span>
              </div>
              <div className="flex items-center">
                <span className="w-16 font-medium">운영시간:</span>
                <span>{store.businessHoursStart} - {store.businessHoursEnd}</span>
              </div>
              <div className="flex items-center">
                <span className="w-16 font-medium">주문마감:</span>
                <span>{store.orderCutoffTime || '15:00'}</span>
              </div>
            </div>

            <div className="space-y-2">
              {/* 관리자 페이지 버튼 */}
              <button
                onClick={() => handleViewStoreAdmin(store)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
              >
                <i className="ri-admin-line mr-2"></i>
                관리자 페이지 보기
              </button>
              
              {/* 기존 버튼들 */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditStore(store)}
                  className="flex-1 bg-white hover:bg-orange-500 text-gray-700 hover:text-white px-3 py-2 rounded-lg text-sm border border-gray-300 hover:border-orange-500 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => toggleStoreStatus(store.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                    store.status === 'active'
                      ? 'bg-red-50 hover:bg-red-500 text-red-700 hover:text-white border-red-300 hover:border-red-500'
                      : 'bg-green-50 hover:bg-green-500 text-green-700 hover:text-white border-green-300 hover:border-green-500'
                  }`}
                >
                  {store.status === 'active' ? '중단' : '재개'}
                </button>
                <button
                  onClick={() => handleDeleteStore(store.id)}
                  className="bg-red-50 hover:bg-red-500 text-red-700 hover:text-white px-3 py-2 rounded-lg text-sm border border-red-300 hover:border-red-500 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
              ))}
      </div>

      {/* 새 매장 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">새 매장 추가</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">매장명</label>
                <input
                  type="text"
                  value={newStore.name}
                  onChange={(e) => setNewStore({...newStore, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="매장명을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={newStore.category}
                  onChange={(e) => setNewStore({...newStore, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="한식반찬">한식반찬</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사장님 이름</label>
                <input
                  type="text"
                  value={newStore.owner}
                  onChange={(e) => setNewStore({...newStore, owner: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="사장님 이름을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <input
                  type="text"
                  value={newStore.phone}
                  onChange={(e) => setNewStore({...newStore, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="전화번호를 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배달비</label>
                <input
                  type="number"
                  value={newStore.deliveryFee}
                  onChange={(e) => setNewStore({...newStore, deliveryFee: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배달지역</label>
                <input
                  type="text"
                  value={newStore.deliveryArea}
                  onChange={(e) => setNewStore({...newStore, deliveryArea: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="예: 강남구, 서초구"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">운영시작</label>
                  <input
                    type="time"
                    value={newStore.businessHoursStart}
                    onChange={(e) => setNewStore({...newStore, businessHoursStart: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">운영종료</label>
                  <input
                    type="time"
                    value={newStore.businessHoursEnd}
                    onChange={(e) => setNewStore({...newStore, businessHoursEnd: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주문마감시간</label>
                <input
                  type="time"
                  value={newStore.orderCutoffTime}
                  onChange={(e) => setNewStore({...newStore, orderCutoffTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">이 시간 이후 주문은 다음날 배달됩니다</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
                <input
                  type="text"
                  value={newStore.bankAccount}
                  onChange={(e) => setNewStore({...newStore, bankAccount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="계좌번호를 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">예금주</label>
                <input
                  type="text"
                  value={newStore.accountHolder}
                  onChange={(e) => setNewStore({...newStore, accountHolder: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="예금주명을 입력하세요"
                />
              </div>
              
              
              {/* 픽업시간 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">픽업시간 설정</label>
                <div className="grid grid-cols-4 gap-2">
                  {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(time => (
                    <label key={time} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newStore.pickupTimeSlots.includes(time)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewStore({...newStore, pickupTimeSlots: [...newStore.pickupTimeSlots, time]});
                          } else {
                            setNewStore({...newStore, pickupTimeSlots: newStore.pickupTimeSlots.filter(t => t !== time)});
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{time}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* 배달시간 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">배달시간 설정</label>
                <div className="space-y-3">
                  {newStore.deliveryTimeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        checked={slot.enabled}
                        onChange={(e) => {
                          const updatedSlots = [...newStore.deliveryTimeSlots];
                          updatedSlots[index].enabled = e.target.checked;
                          setNewStore({...newStore, deliveryTimeSlots: updatedSlots});
                        }}
                        className="mr-2"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={slot.name}
                            onChange={(e) => {
                              const updatedSlots = [...newStore.deliveryTimeSlots];
                              updatedSlots[index].name = e.target.value;
                              setNewStore({...newStore, deliveryTimeSlots: updatedSlots});
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-20"
                            placeholder="시간대명"
                          />
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => {
                              const updatedSlots = [...newStore.deliveryTimeSlots];
                              updatedSlots[index].start = e.target.value;
                              setNewStore({...newStore, deliveryTimeSlots: updatedSlots});
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-gray-500">~</span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => {
                              const updatedSlots = [...newStore.deliveryTimeSlots];
                              updatedSlots[index].end = e.target.value;
                              setNewStore({...newStore, deliveryTimeSlots: updatedSlots});
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddStore}
                className="flex-1 bg-white hover:bg-orange-500 text-gray-700 hover:text-white px-4 py-2 rounded-lg border border-gray-300 hover:border-orange-500 transition-colors"
              >
                추가
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* 매장 수정 모달 */}
      {showEditModal && editingStore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">매장 정보 수정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">매장명</label>
                <input
                  type="text"
                  value={editingStore.name}
                  onChange={(e) => setEditingStore({...editingStore, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={editingStore.category}
                  onChange={(e) => setEditingStore({...editingStore, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="한식반찬">한식반찬</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사장님 이름</label>
                <input
                  type="text"
                  value={editingStore.owner}
                  onChange={(e) => setEditingStore({...editingStore, owner: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="사장님 이름을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                <input
                  type="text"
                  value={editingStore.phone}
                  onChange={(e) => setEditingStore({...editingStore, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배달비</label>
                <input
                  type="number"
                  value={editingStore.deliveryFee}
                  onChange={(e) => setEditingStore({...editingStore, deliveryFee: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배달지역</label>
                <input
                  type="text"
                  value={editingStore.deliveryArea}
                  onChange={(e) => setEditingStore({...editingStore, deliveryArea: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">운영시작</label>
                  <input
                    type="time"
                    value={editingStore.businessHoursStart}
                    onChange={(e) => setEditingStore({...editingStore, businessHoursStart: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">운영종료</label>
                  <input
                    type="time"
                    value={editingStore.businessHoursEnd}
                    onChange={(e) => setEditingStore({...editingStore, businessHoursEnd: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">주문마감시간</label>
                <input
                  type="time"
                  value={editingStore.orderCutoffTime}
                  onChange={(e) => setEditingStore({...editingStore, orderCutoffTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">이 시간 이후 주문은 다음날 배달됩니다</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
                <input
                  type="text"
                  value={editingStore.bankAccount}
                  onChange={(e) => setEditingStore({...editingStore, bankAccount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">예금주</label>
                <input
                  type="text"
                  value={editingStore.accountHolder}
                  onChange={(e) => setEditingStore({...editingStore, accountHolder: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              
              {/* 픽업시간 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">픽업시간 설정</label>
                <div className="grid grid-cols-4 gap-2">
                  {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(time => (
                    <label key={time} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingStore.pickupTimeSlots.includes(time)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditingStore({...editingStore, pickupTimeSlots: [...editingStore.pickupTimeSlots, time]});
                          } else {
                            setEditingStore({...editingStore, pickupTimeSlots: editingStore.pickupTimeSlots.filter(t => t !== time)});
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{time}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 배달시간 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">배달시간 설정</label>
                <div className="space-y-3">
                  {editingStore.deliveryTimeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <input
                        type="checkbox"
                        checked={slot.enabled}
                        onChange={(e) => {
                          const updatedSlots = [...editingStore.deliveryTimeSlots];
                          updatedSlots[index].enabled = e.target.checked;
                          setEditingStore({...editingStore, deliveryTimeSlots: updatedSlots});
                        }}
                        className="mr-2"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={slot.name}
                            onChange={(e) => {
                              const updatedSlots = [...editingStore.deliveryTimeSlots];
                              updatedSlots[index].name = e.target.value;
                              setEditingStore({...editingStore, deliveryTimeSlots: updatedSlots});
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-20"
                            placeholder="시간대명"
                          />
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => {
                              const updatedSlots = [...editingStore.deliveryTimeSlots];
                              updatedSlots[index].start = e.target.value;
                              setEditingStore({...editingStore, deliveryTimeSlots: updatedSlots});
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-gray-500">~</span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => {
                              const updatedSlots = [...editingStore.deliveryTimeSlots];
                              updatedSlots[index].end = e.target.value;
                              setEditingStore({...editingStore, deliveryTimeSlots: updatedSlots});
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateStore}
                className="flex-1 bg-white hover:bg-orange-500 text-gray-700 hover:text-white px-4 py-2 rounded-lg border border-gray-300 hover:border-orange-500 transition-colors"
              >
                수정
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}