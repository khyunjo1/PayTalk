import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getStores } from '../../lib/storeApi';

// 시간 형식을 읽기 쉽게 변환하는 함수
const formatTime = (timeString: string): string => {
  if (!timeString) return '오후 3시';
  
  const [hour, minute] = timeString.split(':').map(Number);
  
  if (hour === 0) {
    return minute === 0 ? '자정' : `오전 12시 ${minute}분`;
  } else if (hour < 12) {
    return minute === 0 ? `오전 ${hour}시` : `오전 ${hour}시 ${minute}분`;
  } else if (hour === 12) {
    return minute === 0 ? '정오' : `오후 12시 ${minute}분`;
  } else {
    const pmHour = hour - 12;
    return minute === 0 ? `오후 ${pmHour}시` : `오후 ${pmHour}시 ${minute}분`;
  }
};

interface Store {
  id: string;
  name: string;
  category: string;
  delivery_area: string;
  delivery_fee: number;
  phone: string;
  business_hours_start: string;
  business_hours_end: string;
  order_cutoff_time?: string;
  pickup_time_slots: string[];
  delivery_time_slots: Array<{
    name: string;
    start: string;
    end: string;
    enabled: boolean;
  }>;
  bank_account: string;
  account_holder: string;
  created_at: string;
  updated_at: string;
}

interface OwnerInquiry {
  name: string;
  storeName: string;
  phone: string;
}

interface StoreOpeningInquiry {
  storeName: string;
  storeAddress: string;
  phone: string;
  other: string;
}

const MOCK_STORES: Store[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: '이천반찬',
    category: '한식반찬',
    delivery_area: '강남구, 서초구',
    delivery_fee: 2000,
    phone: '02-1234-5678',
    business_hours_start: '09:00',
    business_hours_end: '21:00',
    pickup_time_slots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
    delivery_time_slots: [],
    bank_account: '123-456-789',
    account_holder: '이천반찬',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: '맛있는 반찬집',
    category: '한식반찬',
    delivery_area: '송파구, 강동구',
    delivery_fee: 1500,
    phone: '02-2345-6789',
    business_hours_start: '09:00',
    business_hours_end: '21:00',
    pickup_time_slots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
    delivery_time_slots: [],
    bank_account: '234-567-890',
    account_holder: '맛있는 반찬집',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: '건강반찬마켓',
    category: '한식반찬',
    delivery_area: '성북구, 동대문구',
    delivery_fee: 3000,
    phone: '02-3456-7890',
    business_hours_start: '09:00',
    business_hours_end: '21:00',
    pickup_time_slots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
    delivery_time_slots: [],
    bank_account: '345-678-901',
    account_holder: '건강반찬마켓',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: '전통반찬집',
    category: '한식반찬',
    delivery_area: '중구, 종로구',
    delivery_fee: 1800,
    phone: '02-4567-8901',
    business_hours_start: '09:00',
    business_hours_end: '21:00',
    pickup_time_slots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
    delivery_time_slots: [],
    bank_account: '456-789-012',
    account_holder: '전통반찬집',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const DUMMY_SEARCH_STORES = [
  { id: '550e8400-e29b-41d4-a716-446655440006', name: '집밥반찬', category: '한식반찬' },
  { id: '550e8400-e29b-41d4-a716-446655440007', name: '엄마손반찬', category: '한식반찬' },
  { id: '550e8400-e29b-41d4-a716-446655440008', name: '정성반찬', category: '한식반찬' },
  { id: '550e8400-e29b-41d4-a716-446655440009', name: '새마을반찬', category: '한식반찬' },
  { id: '550e8400-e29b-41d4-a716-446655440003', name: '할머니 손맛', category: '한식반찬' }
];

export default function Stores() {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);

  // 실제 매장 데이터 로드
  useEffect(() => {
    const loadStores = async () => {
      try {
        setLoadingStores(true);
        const storesData = await getStores();
        
        // 데이터베이스 매장을 컴포넌트 형식으로 변환
        const formattedStores: Store[] = storesData.map(store => ({
          id: store.id,
          name: store.name,
          category: store.category || '한식반찬',
          delivery_area: store.delivery_area || '',
          delivery_fee: store.delivery_fee || 0,
          phone: store.phone || '',
          business_hours_start: store.business_hours_start || '09:00',
          business_hours_end: store.business_hours_end || '22:00',
          pickup_time_slots: store.pickup_time_slots || [],
          delivery_time_slots: store.delivery_time_slots || [],
          bank_account: store.bank_account || '',
          account_holder: store.account_holder || '',
          created_at: store.created_at,
          updated_at: store.updated_at,
        }));
        
        setStores(formattedStores);
        console.log('✅ Stores 페이지 매장 데이터 로드됨:', formattedStores.length, '개');
      } catch (error) {
        console.error('❌ 매장 데이터 로드 실패:', error);
        // 실패 시 Mock 데이터 사용
        setStores(MOCK_STORES);
      } finally {
        setLoadingStores(false);
      }
    };

    loadStores();
  }, []);

  useEffect(() => {
    // 로그인하지 않은 사용자는 홈페이지로 리다이렉트
    if (!loading && !user) {
      navigate('/');
      return;
    }

    // 관리자(사장님)가 직접 stores 페이지에 접근하면 대시보드로 리다이렉트
    // 단, URL에 allow=true 파라미터가 있으면 허용 (admin-dashboard에서 온 경우)
    if (!loading && user && userProfile && userProfile.role === 'admin') {
      const urlParams = new URLSearchParams(window.location.search);
      const allowAccess = urlParams.get('allow') === 'true';
      if (!allowAccess) {
        navigate('/admin-dashboard');
      }
    }
  }, [user, userProfile, loading, navigate]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [showAddStore, setShowAddStore] = useState(false);
  const [addStoreStep, setAddStoreStep] = useState(1);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showOwnerInquiry, setShowOwnerInquiry] = useState(false);
  const [ownerInquiry, setOwnerInquiry] = useState<OwnerInquiry>({
    name: '',
    storeName: '',
    phone: ''
  });
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [recentStores] = useState<Store[]>([]);
  
  // 매장개설 문의 관련 상태
  const [showStoreOpeningInquiry, setShowStoreOpeningInquiry] = useState(false);
  const [storeOpeningInquiry, setStoreOpeningInquiry] = useState<StoreOpeningInquiry>({
    storeName: '',
    storeAddress: '',
    phone: '',
    other: ''
  });
  const [openingInquirySuccess, setOpeningInquirySuccess] = useState(false);

  useEffect(() => {
    // 로그인 체크
    if (!loading && !user) {
      navigate('/');
      return;
    }

    // 검색 필터링
    if (searchTerm) {
      const filtered = stores.filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.delivery_area.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStores(filtered);
    } else {
      setFilteredStores(stores);
    }
  }, [searchTerm, stores, navigate]);

  const handleStoreClick = (storeId: string) => {
    navigate(`/menu/${storeId}`);
  };

  const handleAddStoreSearch = () => {
    if (!searchTerm.trim()) return;
    
    // 더미 검색 결과
    const results = DUMMY_SEARCH_STORES.filter(store =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(results);
    setAddStoreStep(2);
  };

  const handleSelectSearchResult = (selectedStore: any) => {
    // 중복 체크
    const exists = stores.find(store => store.name === selectedStore.name);
    if (exists) {
      alert('이미 등록된 매장입니다.');
      return;
    }

    // 새 매장 추가
    const newStore: Store = {
      id: selectedStore.id,
      name: selectedStore.name,
      category: selectedStore.category,
            delivery_area: '강남구',
            delivery_fee: 2000,
      phone: '02-0000-0000',
      business_hours_start: '09:00',
      business_hours_end: '21:00',
      pickup_time_slots: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
      delivery_time_slots: [],
      bank_account: '000-000-000',
      account_holder: selectedStore.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setStores([...stores, newStore]);
    setShowAddStore(false);
    setAddStoreStep(1);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleNoResults = () => {
    setAddStoreStep(3);
  };

  const handleOwnerInquirySubmit = () => {
    if (!ownerInquiry.name || !ownerInquiry.storeName || !ownerInquiry.phone) {
      alert('모든 항목을 입력해주세요.');
      return;
    }

    // 문의 접수 시뮬레이션
    setInquirySuccess(true);
    setTimeout(() => {
      setShowOwnerInquiry(false);
      setInquirySuccess(false);
      setOwnerInquiry({ name: '', storeName: '', phone: '' });
    }, 2000);
  };

  const handleStoreOpeningInquirySubmit = () => {
    if (!storeOpeningInquiry.storeName || !storeOpeningInquiry.storeAddress || !storeOpeningInquiry.phone) {
      alert('매장명, 매장주소, 연락처는 필수 입력 항목입니다.');
      return;
    }

    // 매장개설 문의 접수 시뮬레이션
    console.log('매장개설 문의 접수:', storeOpeningInquiry);
    setOpeningInquirySuccess(true);
    setTimeout(() => {
      setShowStoreOpeningInquiry(false);
      setOpeningInquirySuccess(false);
      setStoreOpeningInquiry({ storeName: '', storeAddress: '', phone: '', other: '' });
    }, 2000);
  };

  const renderAddStoreModal = () => {
    if (!showAddStore) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
          {addStoreStep === 1 && (
            <>
              <h3 className="text-lg font-semibold mb-4">매장 추가하기</h3>
              <input
                type="text"
                placeholder="매장명을 검색하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddStoreSearch}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  검색하기
                </button>
                <button
                  onClick={() => setShowAddStore(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  취소
                </button>
              </div>
            </>
          )}

          {addStoreStep === 2 && (
            <>
              <h3 className="text-lg font-semibold mb-4">검색 결과</h3>
              {searchResults.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => handleSelectSearchResult(result)}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-orange-50 cursor-pointer"
                    >
                      <div className="font-medium">{result.name}</div>
                      <div className="text-sm text-gray-600">{result.category}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">검색 결과가 없습니다</p>
                  <button
                    onClick={handleNoResults}
                    className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg whitespace-nowrap cursor-pointer"
                  >
                    매장 등록 문의하기
                  </button>
                </div>
              )}
              <button
                onClick={() => setAddStoreStep(1)}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
              >
                다시 검색
              </button>
            </>
          )}

          {addStoreStep === 3 && (
            <>
              <h3 className="text-lg font-semibold mb-4">매장 등록 문의</h3>
              <p className="text-sm text-gray-600 mb-4">
                원하시는 매장이 없나요? 사장님께 직접 연락드리겠습니다.
              </p>
              <button
                onClick={() => {
                  setShowAddStore(false);
                  setShowOwnerInquiry(true);
                  setAddStoreStep(1);
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer mb-2"
              >
                사장님 문의하기
              </button>
              <button
                onClick={() => setAddStoreStep(1)}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
              >
                다시 검색
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderOwnerInquiryModal = () => {
    if (!showOwnerInquiry) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
          {!inquirySuccess ? (
            <>
              <h3 className="text-lg font-semibold mb-4">매장 사장님 문의</h3>
              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="성함"
                  value={ownerInquiry.name}
                  onChange={(e) => setOwnerInquiry({...ownerInquiry, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="매장명"
                  value={ownerInquiry.storeName}
                  onChange={(e) => setOwnerInquiry({...ownerInquiry, storeName: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="tel"
                  placeholder="연락처"
                  value={ownerInquiry.phone}
                  onChange={(e) => setOwnerInquiry({...ownerInquiry, phone: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleOwnerInquirySubmit}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  문의 접수
                </button>
                <button
                  onClick={() => setShowOwnerInquiry(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  취소
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <i className="ri-check-line text-4xl text-green-500 mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">문의 접수 완료</h3>
              <p className="text-sm text-gray-600">
                빠른 시일 내에 연락드리겠습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStoreOpeningInquiryModal = () => {
    if (!showStoreOpeningInquiry) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
          {!openingInquirySuccess ? (
            <>
              <h3 className="text-lg font-semibold mb-4">매장개설 문의</h3>
              <p className="text-sm text-gray-600 mb-4">
                반찬 배달 서비스에 매장을 등록하고 싶으신가요? 아래 정보를 입력해주세요.
              </p>
              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="매장명 *"
                  value={storeOpeningInquiry.storeName}
                  onChange={(e) => setStoreOpeningInquiry({...storeOpeningInquiry, storeName: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="매장주소 *"
                  value={storeOpeningInquiry.storeAddress}
                  onChange={(e) => setStoreOpeningInquiry({...storeOpeningInquiry, storeAddress: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="tel"
                  placeholder="연락처 *"
                  value={storeOpeningInquiry.phone}
                  onChange={(e) => setStoreOpeningInquiry({...storeOpeningInquiry, phone: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm"
                />
                <textarea
                  placeholder="기타 (운영시간, 특이사항 등)"
                  value={storeOpeningInquiry.other}
                  onChange={(e) => setStoreOpeningInquiry({...storeOpeningInquiry, other: e.target.value})}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleStoreOpeningInquirySubmit}
                  className="flex-1 bg-white hover:bg-orange-500 text-gray-700 hover:text-white py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer border border-gray-300 hover:border-orange-500 transition-colors"
                >
                  개설문의하기
                </button>
                <button
                  onClick={() => setShowStoreOpeningInquiry(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  취소
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <i className="ri-check-line text-4xl text-green-500 mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">개설문의 접수 완료</h3>
              <p className="text-sm text-gray-600">
                매장개설 문의가 접수되었습니다.<br />
                담당자가 확인 후 연락드리겠습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img 
                src="https://static.readdy.ai/image/912b0945f01d9fdb4ff4544659653c90/2d4890bd82abce85d430bd82d04df8d6.png" 
                alt="페이톡 로고" 
                className="w-6 h-6"
              />
              <h1 className="text-xl font-bold text-orange-500" style={{ fontFamily: "Pacifico, serif" }}>
                페이톡
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/orders')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg flex items-center whitespace-nowrap cursor-pointer text-sm"
              >
                <i className="ri-file-list-3-line mr-1"></i>
                주문내역
              </button>
              {userProfile?.role === 'owner' && (
                <>
                  <button
                    onClick={() => navigate('/owner/orders')}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg flex items-center whitespace-nowrap cursor-pointer text-sm"
                  >
                    <i className="ri-shopping-cart-line mr-1"></i>
                    주문관리
                  </button>
                  <button
                    onClick={() => navigate('/owner/menu')}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg flex items-center whitespace-nowrap cursor-pointer text-sm"
                  >
                    <i className="ri-restaurant-line mr-1"></i>
                    메뉴관리
                  </button>
                </>
              )}
              {userProfile?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="bg-white hover:bg-orange-500 text-gray-700 hover:text-white px-3 py-2 rounded-lg flex items-center whitespace-nowrap cursor-pointer text-sm border border-gray-300 hover:border-orange-500 transition-colors"
                >
                  <i className="ri-store-line mr-1"></i>
                  내 반찬가게 관리
                </button>
              )}
            </div>
          </div>
          
          {/* 검색바 */}
          <div className="relative">
            <input
              type="text"
              placeholder="매장명, 카테고리, 배달지역을 검색하세요"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg text-sm"
            />
            <i className="ri-search-line absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* 최근 이용 매장 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">최근 이용 매장</h2>
          {recentStores.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-center">
              <i className="ri-store-3-line text-3xl text-gray-300 mb-2"></i>
              <p className="text-gray-500 text-sm">최근 이용한 매장이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {recentStores.map((store) => (
                <div key={store.id} className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="font-medium text-sm">{store.name}</div>
                  <div className="text-xs text-gray-500">{store.category}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 매장 추가 및 개설문의 버튼 */}
        <div className="mb-6 space-y-3">
          <button
            onClick={() => setShowAddStore(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg flex items-center justify-center whitespace-nowrap cursor-pointer"
          >
            <i className="ri-add-line mr-2"></i>
            새 매장 등록하기
          </button>
          <button
            onClick={() => setShowStoreOpeningInquiry(true)}
            className="w-full bg-white hover:bg-orange-500 text-gray-700 hover:text-white py-3 px-4 rounded-lg flex items-center justify-center whitespace-nowrap cursor-pointer border border-gray-300 hover:border-orange-500 transition-colors"
          >
            <i className="ri-store-line mr-2"></i>
            매장개설 문의
          </button>
        </div>

        {/* 매장 목록 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">등록된 매장</h2>
          {loadingStores ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                  <div className="w-full h-32 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStores.map((store) => (
              <div
                key={store.id}
                onClick={() => handleStoreClick(store.id)}
                className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{store.name}</h3>
                      <p className="text-sm text-gray-600">{store.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <i className="ri-map-pin-line mr-1"></i>
                      <span>배달가능지역: {store.delivery_area || '정보 없음'}</span>
                    </div>
                    <div className="flex items-center">
                      <i className="ri-truck-line mr-1"></i>
                      <span>배달비 {store.delivery_fee?.toLocaleString() || '0'}원</span>
                    </div>
                  </div>
                  
                  {/* 주문접수안내 */}
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <i className="ri-time-line mr-1 text-orange-500"></i>
                    <span>
                      <span className="font-medium text-gray-700">주문마감:</span> {formatTime(store.order_cutoff_time || '15:00')} 이후 주문은 다음날 배달
                    </span>
                  </div>
                  
                  {/* 반찬보기 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStoreClick(store.id);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg flex items-center whitespace-nowrap cursor-pointer text-sm"
                  >
                    <i className="ri-restaurant-line mr-1"></i>
                    반찬보기
                  </button>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>

      {/* 모달들은 그대로 유지 */}
      {renderAddStoreModal()}
      {renderOwnerInquiryModal()}
      {renderStoreOpeningInquiryModal()}

      {/* 푸터 */}
      <footer className="bg-gray-50 py-6 mt-6">
        <div className="px-4 max-w-6xl mx-auto">
          <div className="mb-4">
            {/* 회사 정보 - 연락처 바로 위에 */}
            <div className="mb-3">
              <h3 className="text-lg font-bold text-orange-500" style={{ fontFamily: "Pacifico, serif" }}>
                페이톡
              </h3>
            </div>

            {/* 연락처 정보 */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">연락처</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <i className="ri-phone-line text-orange-500"></i>
                  <span>02-1234-5678</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-mail-line text-orange-500"></i>
                  <span>mnkijo424@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-time-line text-orange-500"></i>
                  <span>평일 09:00 - 18:00</span>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 정보 */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-600 text-sm">
                <p>© 2025 페이톡. 모든 권리 보유.</p>
                <p className="mt-1">사업자등록번호: 227-09-52974 | 대표: 조광현</p>
              </div>
              <div className="flex gap-4 text-sm text-gray-500">
                <a href="#" className="hover:text-orange-500 transition-colors">이용약관</a>
                <a href="#" className="hover:text-orange-500 transition-colors">개인정보처리방침</a>
                <a href="#" className="hover:text-orange-500 transition-colors">사업자정보확인</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
