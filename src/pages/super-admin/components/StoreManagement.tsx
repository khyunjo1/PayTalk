import { useState } from 'react';

interface Store {
  id: string;
  name: string;
  category: string;
  owner: string;
  phone: string;
  status: 'active' | 'inactive';
  deliveryFee: number;
  deliveryArea: string;
  businessHoursStart: string;
  businessHoursEnd: string;
  pickupTimeSlots: string[];
  deliveryTimeSlots: Array<{
    name: string;
    start: string;
    end: string;
    enabled: boolean;
  }>;
  bankAccount: string;
  accountHolder: string;
}

interface StoreManagementProps {
  showToast: (message: string) => void;
}

export default function StoreManagement({ showToast }: StoreManagementProps) {
  const [stores, setStores] = useState<Store[]>([
    {
      id: '1',
      name: '이천반찬',
      category: '한식반찬',
      owner: '김사장',
      phone: '031-123-4567',
      status: 'active',
      deliveryFee: 2000,
      deliveryArea: '강남구, 서초구',
      businessHoursStart: '09:00',
      businessHoursEnd: '22:00',
      pickupTimeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
      deliveryTimeSlots: [
        { name: '아침 배송', start: '08:00', end: '10:00', enabled: false },
        { name: '점심 배송', start: '11:30', end: '14:00', enabled: true },
        { name: '오후 배송', start: '14:30', end: '17:00', enabled: false },
        { name: '저녁 배송', start: '17:30', end: '20:00', enabled: true }
      ],
      bankAccount: '123456-78-901234',
      accountHolder: '반찬나라'
    },
    {
      id: '2',
      name: '맛있는 반찬집',
      category: '한식반찬',
      owner: '박사장',
      phone: '02-987-6543',
      status: 'active',
      deliveryFee: 1500,
      deliveryArea: '송파구, 강동구',
      businessHoursStart: '08:00',
      businessHoursEnd: '21:00',
      pickupTimeSlots: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
      deliveryTimeSlots: [
        { name: '아침 배송', start: '08:00', end: '10:00', enabled: true },
        { name: '점심 배송', start: '11:30', end: '14:00', enabled: true },
        { name: '오후 배송', start: '14:30', end: '17:00', enabled: true },
        { name: '저녁 배송', start: '17:30', end: '20:00', enabled: true }
      ],
      bankAccount: '987654-32-109876',
      accountHolder: '맛있는반찬'
    },
    {
      id: '3',
      name: '할머니반찬',
      category: '한식반찬',
      owner: '이사장',
      phone: '031-555-7777',
      status: 'inactive',
      deliveryFee: 2500,
      deliveryArea: '마포구, 용산구',
      businessHoursStart: '10:00',
      businessHoursEnd: '20:00',
      pickupTimeSlots: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
      deliveryTimeSlots: [
        { name: '아침 배송', start: '08:00', end: '10:00', enabled: false },
        { name: '점심 배송', start: '11:30', end: '14:00', enabled: true },
        { name: '오후 배송', start: '14:30', end: '17:00', enabled: false },
        { name: '저녁 배송', start: '17:30', end: '19:30', enabled: true }
      ],
      bankAccount: '555666-77-888999',
      accountHolder: '할머니반찬'
    }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '한식반찬',
    owner: '',
    phone: '',
    deliveryFee: 2000,
    deliveryArea: '',
    businessHoursStart: '09:00',
    businessHoursEnd: '22:00',
    pickupTimeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
    deliveryTimeSlots: [
      { name: '아침 배송', start: '08:00', end: '10:00', enabled: false },
      { name: '점심 배송', start: '11:30', end: '14:00', enabled: true },
      { name: '오후 배송', start: '14:30', end: '17:00', enabled: false },
      { name: '저녁 배송', start: '17:30', end: '20:00', enabled: true }
    ],
    bankAccount: '',
    accountHolder: '',
    image: ''
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.owner || !formData.phone || !formData.deliveryArea) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (editingStore) {
      // 수정
      setStores(stores.map(store => 
        store.id === editingStore.id 
          ? { ...store, ...formData, status: store.status }
          : store
      ));
      showToast('매장 정보가 수정되었습니다');
    } else {
      // 추가
      const newStore: Store = {
        id: Date.now().toString(),
        ...formData,
        status: 'active'
      };
      setStores([...stores, newStore]);
      showToast('새 매장이 등록되었습니다');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '한식반찬',
      owner: '',
      phone: '',
      deliveryFee: 2000,
      deliveryArea: '',
      businessHoursStart: '09:00',
      businessHoursEnd: '22:00',
      pickupTimeSlots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
      deliveryTimeSlots: [
        { name: '아침 배송', start: '08:00', end: '10:00', enabled: false },
        { name: '점심 배송', start: '11:30', end: '14:00', enabled: true },
        { name: '오후 배송', start: '14:30', end: '17:00', enabled: false },
        { name: '저녁 배송', start: '17:30', end: '20:00', enabled: true }
      ],
      bankAccount: '',
      accountHolder: '',
      image: ''
    });
    setShowAddModal(false);
    setEditingStore(null);
  };

  const handleEdit = (store: Store) => {
    setFormData({
      name: store.name,
      category: store.category,
      owner: store.owner,
      phone: store.phone,
      deliveryFee: store.deliveryFee,
      deliveryArea: store.deliveryArea,
      businessHoursStart: store.businessHoursStart,
      businessHoursEnd: store.businessHoursEnd,
      pickupTimeSlots: store.pickupTimeSlots,
      deliveryTimeSlots: store.deliveryTimeSlots,
      bankAccount: store.bankAccount,
      accountHolder: store.accountHolder,
      image: (store as any).image || ''
    });
    setEditingStore(store);
    setShowAddModal(true);
  };

  const toggleStatus = (storeId: string) => {
    setStores(stores.map(store => 
      store.id === storeId 
        ? { ...store, status: store.status === 'active' ? 'inactive' : 'active' }
        : store
    ));
    showToast('매장 상태가 변경되었습니다');
  };

  const deleteStore = (storeId: string) => {
    if (confirm('정말로 삭제하시겠습니까?')) {
      setStores(stores.filter(store => store.id !== storeId));
      showToast('매장이 삭제되었습니다');
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">매장 관리</h2>
          <p className="text-gray-600">플랫폼에 등록된 매장을 관리합니다</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center whitespace-nowrap cursor-pointer"
        >
          <i className="ri-add-line mr-2"></i>
          새 매장 추가
        </button>
      </div>

      {/* 매장 테이블 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매장명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사장님</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">배달정보</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{store.name}</div>
                    <div className="text-sm text-gray-500">{store.businessHoursStart} - {store.businessHoursEnd}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{store.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{store.owner}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{store.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      store.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {store.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>{store.deliveryArea}</div>
                    <div className="text-xs text-gray-500">배달비 {store.deliveryFee.toLocaleString()}원</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(store)}
                        className="text-blue-600 hover:text-blue-900 cursor-pointer"
                      >
                        <i className="ri-edit-line"></i>
                      </button>
                      <button
                        onClick={() => toggleStatus(store.id)}
                        className={`${store.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} cursor-pointer`}
                      >
                        <i className={`ri-${store.status === 'active' ? 'pause' : 'play'}-circle-line`}></i>
                      </button>
                      <button
                        onClick={() => deleteStore(store.id)}
                        className="text-red-600 hover:text-red-900 cursor-pointer"
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 매장 추가/수정 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingStore ? '매장 수정' : '새 매장 추가'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">매장명 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  placeholder="매장명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm pr-8"
                >
                  <option value="한식반찬">한식반찬</option>
                  <option value="중식반찬">중식반찬</option>
                  <option value="일식반찬">일식반찬</option>
                  <option value="양식반찬">양식반찬</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사장님 성함 *</label>
                <input
                  type="text"
                  value={formData.owner}
                  onChange={(e) => setFormData({...formData, owner: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  placeholder="사장님 성함을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처 *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  placeholder="연락처를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배달 가능 지역 *</label>
                <input
                  type="text"
                  value={formData.deliveryArea}
                  onChange={(e) => setFormData({...formData, deliveryArea: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  placeholder="예: 강남구, 서초구"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배달비</label>
                <input
                  type="number"
                  value={formData.deliveryFee}
                  onChange={(e) => setFormData({...formData, deliveryFee: parseInt(e.target.value) || 0})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  placeholder="배달비를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">영업시간</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={formData.businessHoursStart}
                    onChange={(e) => setFormData({...formData, businessHoursStart: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="time"
                    value={formData.businessHoursEnd}
                    onChange={(e) => setFormData({...formData, businessHoursEnd: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  매장 운영 시간 (픽업 가능 시간)
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">픽업 가능 시간</label>
                <div className="grid grid-cols-3 gap-2">
                  {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((time) => (
                    <label key={time} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.pickupTimeSlots.includes(time)}
                        onChange={(e) => {
                          const newSlots = e.target.checked 
                            ? [...formData.pickupTimeSlots, time]
                            : formData.pickupTimeSlots.filter(t => t !== time);
                          setFormData({...formData, pickupTimeSlots: newSlots});
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{time}</span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  영업시간 내에서 픽업 가능한 시간을 선택하세요
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">배송 시간대 설정</label>
                <div className="space-y-3">
                  {formData.deliveryTimeSlots.map((slot, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={slot.enabled}
                            onChange={(e) => {
                              const newSlots = [...formData.deliveryTimeSlots];
                              newSlots[index].enabled = e.target.checked;
                              setFormData({...formData, deliveryTimeSlots: newSlots});
                            }}
                            className="mr-2"
                          />
                          <span className="font-medium">{slot.name}</span>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => {
                            const newSlots = [...formData.deliveryTimeSlots];
                            newSlots[index].start = e.target.value;
                            setFormData({...formData, deliveryTimeSlots: newSlots});
                          }}
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          disabled={!slot.enabled}
                        />
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => {
                            const newSlots = [...formData.deliveryTimeSlots];
                            newSlots[index].end = e.target.value;
                            setFormData({...formData, deliveryTimeSlots: newSlots});
                          }}
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          disabled={!slot.enabled}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  고객이 선택할 수 있는 배송 시간대를 설정하세요
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">입금 계좌</label>
                <input
                  type="text"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({...formData, bankAccount: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  placeholder="예: 123456-78-901234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">예금주명</label>
                <input
                  type="text"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({...formData, accountHolder: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                  placeholder="예: 반찬나라"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">매장 이미지</label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                    placeholder="이미지 URL을 입력하세요"
                  />
                  {formData.image && (
                    <div className="mt-2">
                      <img 
                        src={formData.image} 
                        alt="미리보기" 
                        className="w-full h-32 object-cover object-top rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    또는 Stable Diffusion으로 이미지를 생성해보세요:
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData, 
                        image: `https://readdy.ai/api/search-image?query=Traditional%20Korean%20side%20dishes%20banchan%2C%20fresh%20vegetables%2C%20kimchi%2C%20pickled%20radish%2C%20bean%20sprouts%2C%20healthy%20Korean%20food%2C%20professional%20restaurant%20photography%20with%20simple%20white%20background%2C%20appetizing%20presentation&width=400&height=240&seq=${Date.now()}&orientation=landscape`
                      })}
                      className="ml-1 text-blue-600 hover:text-blue-800 cursor-pointer underline"
                    >
                      한식반찬 이미지 생성
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
              >
                {editingStore ? '수정' : '등록'}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}