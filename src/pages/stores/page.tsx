import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUserStores, getAllStores, addStoreToUser } from '../../lib/storeApi';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

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
  minimum_order_amount?: number;
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
    minimum_order_amount: 10000,
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
    minimum_order_amount: 8000,
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
    minimum_order_amount: 12000,
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
    minimum_order_amount: 15000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];


export default function Stores() {
  const navigate = useNavigate();
  const { user, userProfile, loading } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);

  // 사용자별 개인 매장 데이터 로드
  useEffect(() => {
    const loadUserStores = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingStores(true);
        const userStoresData = await getUserStores(user.id);
        
        // 데이터베이스 매장을 컴포넌트 형식으로 변환
        const formattedStores: Store[] = userStoresData.map(store => ({
          id: store.id,
          name: store.name,
          category: store.category || '한식반찬',
          delivery_area: store.delivery_area || '',
          minimum_order_amount: store.minimum_order_amount || 0,
          phone: store.phone || '',
          business_hours_start: store.business_hours_start || '09:00',
          business_hours_end: store.business_hours_end || '22:00',
          order_cutoff_time: store.order_cutoff_time,
          pickup_time_slots: store.pickup_time_slots || [],
          delivery_time_slots: store.delivery_time_slots || [],
          bank_account: store.bank_account || '',
          account_holder: store.account_holder || '',
          created_at: store.created_at,
          updated_at: store.updated_at,
        }));
        
        setStores(formattedStores);
        console.log('✅ 사용자 매장 데이터 로드됨:', formattedStores.length, '개');
      } catch (error) {
        console.error('❌ 사용자 매장 데이터 로드 실패:', error);
        // 실패 시 빈 배열로 설정
        setStores([]);
      } finally {
        setLoadingStores(false);
      }
    };

    loadUserStores();
  }, [user?.id]);

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

  const [showAddStore, setShowAddStore] = useState(false);
  const [addStoreStep, setAddStoreStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Store[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showOwnerInquiry, setShowOwnerInquiry] = useState(false);
  const [ownerInquiry, setOwnerInquiry] = useState<OwnerInquiry>({
    name: '',
    storeName: '',
    phone: ''
  });
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [recentStores] = useState<Store[]>([]);
  


  const handleStoreClick = (storeId: string) => {
    navigate(`/menu/${storeId}`);
  };

  const handleStoreSearch = async () => {
    if (!user?.id || !searchQuery.trim()) return;
    
    try {
      setLoadingSearch(true);
      const allStoresData = await getAllStores();
      
      // 사용자가 이미 등록한 매장 ID 목록
      const userStoreIds = stores.map(store => store.id);
      
      // 검색어와 일치하는 매장들 필터링 (대소문자 구분 없이)
      const matchingStores = allStoresData.filter(store => 
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !userStoreIds.includes(store.id)
      );
      
      // 컴포넌트 형식으로 변환
      const formattedStores: Store[] = matchingStores.map(store => ({
        id: store.id,
        name: store.name,
        category: store.category || '한식반찬',
        delivery_area: store.delivery_area || '',
        minimum_order_amount: store.minimum_order_amount || 0,
        phone: store.phone || '',
        business_hours_start: store.business_hours_start || '09:00',
        business_hours_end: store.business_hours_end || '22:00',
        order_cutoff_time: store.order_cutoff_time,
        pickup_time_slots: store.pickup_time_slots || [],
        delivery_time_slots: store.delivery_time_slots || [],
        bank_account: store.bank_account || '',
        account_holder: store.account_holder || '',
        created_at: store.created_at,
        updated_at: store.updated_at,
      }));
      
      setSearchResults(formattedStores);
    setAddStoreStep(2);
    } catch (error) {
      console.error('❌ 매장 검색 실패:', error);
      alert('매장 검색에 실패했습니다.');
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSelectSearchResult = async (selectedStore: Store) => {
    if (!user?.id) return;
    
    try {
      // 사용자 매장 목록에 추가
      await addStoreToUser(user.id, selectedStore.id);
      
      // 로컬 상태 업데이트
      setStores([...stores, selectedStore]);
      
      // 모달 닫기
    setShowAddStore(false);
    setAddStoreStep(1);
    setSearchResults([]);
      setSearchQuery('');
      
      alert(`${selectedStore.name}이(가) 매장 목록에 추가되었습니다!`);
    } catch (error) {
      console.error('❌ 매장 추가 실패:', error);
      alert('매장 추가에 실패했습니다. 다시 시도해주세요.');
    }
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


  const renderAddStoreModal = () => {
    if (!showAddStore) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md">
          {addStoreStep === 1 && (
            <>
              <h3 className="text-lg font-semibold mb-4">매장 검색하기</h3>
              <p className="text-sm text-gray-600 mb-4">
                이용하고 싶은 매장명을 검색해보세요.
              </p>
              <div className="space-y-3">
                <div className="flex gap-2">
              <input
                type="text"
                    placeholder="매장명을 입력하세요 (예: 장수반찬)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleStoreSearch()}
                    className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                <button
                    onClick={handleStoreSearch}
                    disabled={!searchQuery.trim() || loadingSearch}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                >
                    {loadingSearch ? '검색중...' : '검색'}
                </button>
                </div>
                <button
                  onClick={() => setShowAddStore(false)}
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  취소
                </button>
              </div>
            </>
          )}

          {addStoreStep === 2 && (
            <>
              <h3 className="text-lg font-semibold mb-4">검색 결과</h3>
              {loadingSearch ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">매장을 검색하는 중...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {searchResults.length === 1 ? (
                    // 검색 결과가 1개면 바로 추가 버튼 표시
                    <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                      <div className="font-medium text-gray-800 mb-2">{searchResults[0].name}</div>
                      <div className="text-sm text-gray-600 mb-2">{searchResults[0].category}</div>
                      <div className="text-xs text-gray-500 mb-3">
                        배달지역: {searchResults[0].delivery_area} | 배달비: {searchResults[0].delivery_fee?.toLocaleString()}원
                      </div>
                      <button
                        onClick={() => handleSelectSearchResult(searchResults[0])}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
                      >
                        이 매장 추가하기
                      </button>
                    </div>
                  ) : (
                    // 검색 결과가 여러 개면 목록 표시
                    <>
                      <p className="text-sm text-gray-600 mb-3">
                        "{searchQuery}"와 일치하는 매장이 {searchResults.length}개 있습니다. 원하는 매장을 선택해주세요.
                      </p>
                      {searchResults.map((store) => (
                        <div
                          key={store.id}
                          onClick={() => handleSelectSearchResult(store)}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors"
                        >
                          <div className="font-medium text-gray-800">{store.name}</div>
                          <div className="text-sm text-gray-600">{store.category}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            배달지역: {store.delivery_area} | 배달비: {store.delivery_fee?.toLocaleString()}원
                          </div>
                    </div>
                  ))}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-search-line text-xl text-gray-400"></i>
                  </div>
                  <p className="text-gray-600 mb-2">"{searchQuery}"와 일치하는 매장이 없습니다</p>
                  <p className="text-sm text-gray-500 mb-4">다른 매장명으로 검색해보세요.</p>
                </div>
              )}
              <button
                onClick={() => {
                  setAddStoreStep(1);
                  setSearchResults([]);
                }}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
              >
                다시 검색하기
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
                뒤로가기
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


  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      

      <div className="p-4">

        {/* 매장 추가 섹션 */}
        <div className="mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">찾으시는 매장이 없으신가요?</h3>
              <p className="text-sm text-gray-600">새로운 매장을 등록해보세요</p>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => setShowAddStore(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center justify-center transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <i className="ri-add-line mr-2"></i>
                <span className="font-medium">새 매장 등록하기</span>
              </button>
            </div>
          </div>
        </div>

        {/* 매장 목록 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">내 매장 목록</h2>
          {loadingStores ? (
          <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl shadow-lg overflow-hidden animate-pulse border border-gray-200">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="h-6 bg-gray-300 rounded-lg mb-2 w-3/4"></div>
                        <div className="h-4 bg-gray-300 rounded-full w-1/3"></div>
                      </div>
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-300 rounded w-full"></div>
                      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                    </div>
                    <div className="bg-gray-300 rounded-lg p-3 mb-4">
                      <div className="h-4 bg-gray-400 rounded w-1/2"></div>
                    </div>
                    <div className="h-12 bg-gray-300 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
          ) : stores.length > 0 ? (
            <div className="space-y-4">
              {stores.map((store, index) => {
                // 모든 매장을 오렌지 색상으로 통일
                const theme = { 
                  bg: 'from-orange-50 to-orange-100', 
                  border: 'border-orange-200', 
                  accent: 'text-orange-600' 
                };
                
                return (
                  <div
                    key={store.id}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="p-4">
                      {/* 매장 헤더 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg mb-1">{store.name}</h3>
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700">
                              <i className="ri-restaurant-line mr-1"></i>
                              {store.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 배달 정보 - 2줄로 분리 */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="ri-map-pin-line mr-2 text-gray-400"></i>
                          <span className="font-medium">배달가능지역:</span>
                          <span className="ml-1">{store.delivery_area || '정보 없음'}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="ri-money-dollar-circle-line mr-2 text-gray-400"></i>
                          <span className="font-medium">최소주문:</span>
                          <span className="ml-1 font-semibold text-orange-600">{store.minimum_order_amount?.toLocaleString() || '0'}원</span>
                        </div>
                      </div>
                      
                      {/* 주문마감 시간 - 간결하게 */}
                      <div className="bg-gray-50 rounded-md p-3 mb-4">
                        <div className="flex items-center text-sm">
                          <i className="ri-time-line mr-2 text-orange-500"></i>
                          <span className="font-medium text-gray-700">주문마감:</span>
                          <span className="ml-1 font-semibold text-orange-600">{formatTime(store.order_cutoff_time || '15:00')}</span>
                          <span className="ml-1 text-gray-500">이후 주문은 다음날 배달</span>
                        </div>
                      </div>
                      
                      {/* 반찬보기 버튼 - 카드 하단으로 이동 */}
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
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-store-line text-2xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">등록된 매장이 없습니다</h3>
              <p className="text-gray-500 mb-4">위의 "새 매장 등록하기" 버튼을 눌러<br />이용하고 싶은 매장을 추가해보세요!</p>
            </div>
          )}
        </div>
      </div>

      {/* 모달들은 그대로 유지 */}
      {renderAddStoreModal()}
      {renderOwnerInquiryModal()}

      <Footer />
    </div>
  );
}
