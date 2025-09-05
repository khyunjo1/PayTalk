import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface Store {
  id: string;
  name: string;
  category: string;
  deliveryArea: string;
  deliveryFee: number;
  image: string;
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
    id: '1',
    name: '이천반찬',
    category: '한식반찬',
    deliveryArea: '강남구, 서초구',
    deliveryFee: 2000,
    image: 'https://readdy.ai/api/search-image?query=Traditional%20Korean%20side%20dishes%20banchan%20in%20clean%20white%20containers%2C%20fresh%20vegetables%2C%20kimchi%2C%20pickled%20radish%2C%20bean%20sprouts%2C%20spinach%2C%20professional%20food%20photography%20with%20simple%20white%20background%2C%20appetizing%20presentation%2C%20high%20quality%20restaurant%20style&width=400&height=240&seq=store1&orientation=landscape'
  },
  {
    id: '2',
    name: '맛있는 반찬집',
    category: '한식반찬',
    deliveryArea: '송파구, 강동구',
    deliveryFee: 1500,
    image: 'https://readdy.ai/api/search-image?query=Korean%20homestyle%20side%20dishes%20banchan%20beautifully%20arranged%20in%20traditional%20bowls%2C%20colorful%20vegetables%2C%20fermented%20foods%2C%20healthy%20meals%2C%20clean%20white%20background%2C%20restaurant%20quality%20presentation%2C%20appetizing%20food%20photography&width=400&height=240&seq=store2&orientation=landscape'
  },
  {
    id: '4',
    name: '건강반찬마켓',
    category: '한식반찬',
    deliveryArea: '성북구, 동대문구',
    deliveryFee: 3000,
    image: 'https://readdy.ai/api/search-image?query=Healthy%20Korean%20side%20dishes%20banchan%20with%20organic%20vegetables%2C%20clean%20modern%20containers%2C%20nutritious%20fermented%20foods%2C%20fresh%20ingredients%2C%20professional%20market%20style%20photography%20with%20white%20background&width=400&height=240&seq=store4&orientation=landscape'
  },
  {
    id: '5',
    name: '전통반찬집',
    category: '한식반찬',
    deliveryArea: '중구, 종로구',
    deliveryFee: 1800,
    image: 'https://readdy.ai/api/search-image?query=Traditional%20Korean%20banchan%20side%20dishes%20in%20authentic%20style%2C%20classic%20fermented%20vegetables%2C%20kimchi%20varieties%2C%20traditional%20presentation%20in%20ceramic%20dishes%2C%20heritage%20Korean%20food%20photography%20with%20simple%20background&width=400&height=240&seq=store5&orientation=landscape'
  }
];

const DUMMY_SEARCH_STORES = [
  { id: '6', name: '집밥반찬', category: '한식반찬' },
  { id: '7', name: '엄마손반찬', category: '한식반찬' },
  { id: '8', name: '정성반찬', category: '한식반찬' },
  { id: '9', name: '새마을반찬', category: '한식반찬' },
  { id: '3', name: '할머니 손맛', category: '한식반찬' }
];

export default function Stores() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [stores, setStores] = useState<Store[]>(MOCK_STORES);

  useEffect(() => {
    // 로그인하지 않은 사용자는 홈페이지로 리다이렉트
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStores, setFilteredStores] = useState<Store[]>(MOCK_STORES);
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
        store.deliveryArea.toLowerCase().includes(searchTerm.toLowerCase())
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
      deliveryArea: '강남구',
      deliveryFee: 2000,
      image: 'https://readdy.ai/api/search-image?query=Fresh%20Korean%20banchan%20side%20dishes%20in%20modern%20containers%2C%20healthy%20vegetables%2C%20traditional%20Korean%20food%2C%20clean%20white%20background%2C%20professional%20food%20photography%2C%20appetizing%20presentation&width=400&height=240&seq=' + selectedStore.id + '&orientation=landscape'
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
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
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
              <button
                onClick={() => navigate('/admin')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center whitespace-nowrap cursor-pointer text-sm"
              >
                <i className="ri-store-line mr-1"></i>
                내 반찬가게 관리
              </button>
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
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg flex items-center justify-center whitespace-nowrap cursor-pointer"
          >
            <i className="ri-store-line mr-2"></i>
            매장개설 문의
          </button>
        </div>

        {/* 매장 목록 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">등록된 매장</h2>
          <div className="space-y-4">
            {filteredStores.map((store) => (
              <div
                key={store.id}
                onClick={() => handleStoreClick(store.id)}
                className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <img
                  src={store.image}
                  alt={store.name}
                  className="w-full h-32 object-cover object-top"
                />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{store.name}</h3>
                      <p className="text-sm text-gray-600">{store.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <i className="ri-map-pin-line mr-1"></i>
                      <span>{store.deliveryArea}</span>
                    </div>
                    <div className="flex items-center">
                      <i className="ri-truck-line mr-1"></i>
                      <span>배달비 {store.deliveryFee.toLocaleString()}원</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                  <span>support@paytalk.co.kr</span>
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
                <p>© 2024 페이톡. 모든 권리 보유.</p>
                <p className="mt-1">사업자등록번호: 123-45-67890 | 대표: 김페이톡</p>
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
