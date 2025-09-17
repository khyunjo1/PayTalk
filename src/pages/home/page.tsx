import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { createInquiry } from '../../lib/inquiryApi';
import { getHomeStats, type HomeStats } from '../../lib/statsApi';
// import PushNotificationSettings from '../../components/PushNotificationSettings';
// import PushNotificationTest from '../../components/PushNotificationTest';
// import PushDiagnostics from '../../components/PushDiagnostics';
import { updateManifest } from '../../utils/manifestGenerator';

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryData, setInquiryData] = useState({
    name: '',
    phone: '',
    storeName: ''
  });
  const [stats, setStats] = useState<HomeStats>({
    totalStores: 0,
    totalOrders: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadStats();
    handleRedirect();
  }, []);

  const handleRedirect = () => {
    const redirect = searchParams.get('redirect');
    const storeId = searchParams.get('storeId');
    
    if (redirect === 'admin') {
      // 사장님용: 루트(admin-dashboard)로 리다이렉트
      updateManifest('admin');
      navigate('/');
    } else if (redirect === 'menu' && storeId) {
      // 소비자용: 특정 매장 메뉴로 리다이렉트
      updateManifest('menu', storeId);
      navigate(`/menu/${storeId}`);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await getHomeStats();
      setStats(data);
    } catch (error) {
      console.error('통계 로드 실패:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createInquiry({
        name: inquiryData.name,
        phone: inquiryData.phone,
        store_name: inquiryData.storeName
      });

      alert('문의가 성공적으로 제출되었습니다. 빠른 시일 내에 연락드리겠습니다.');
      setInquiryData({ name: '', phone: '', storeName: '' });
      setShowInquiryModal(false);
    } catch (error) {
      console.error('문의 제출 오류:', error);
      alert('문의 제출에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* 히어로 섹션 */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-20">
        
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">페이톡</h1>
          <p className="text-xl mb-12 max-w-2xl mx-auto">
            반찬 사장님들을 위한 스마트한 주문 관리 시스템
          </p>
          
          {/* 통계 섹션 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
              <div className="text-2xl sm:text-4xl font-bold mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-white bg-opacity-30 h-8 sm:h-10 w-16 sm:w-20 mx-auto rounded"></div>
                ) : (
                  stats.totalStores.toLocaleString()
                )}
              </div>
              <div className="text-sm sm:text-lg opacity-90">가입된 매장</div>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 sm:p-6">
              <div className="text-2xl sm:text-4xl font-bold mb-2">
                {statsLoading ? (
                  <div className="animate-pulse bg-white bg-opacity-30 h-8 sm:h-10 w-16 sm:w-20 mx-auto rounded"></div>
                ) : (
                  stats.totalOrders.toLocaleString()
                )}
              </div>
              <div className="text-sm sm:text-lg opacity-90">총 주문 수</div>
            </div>
            
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="text-2xl sm:text-4xl font-bold mb-2 text-green-300">
                0원
              </div>
              <div className="text-sm sm:text-lg opacity-90">수수료</div>
            </div>
          </div>
        </div>
      </section>

      {/* 푸시 알림 설정 */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4 space-y-6">
          {/* <PushNotificationSettings />
          <PushNotificationTest />
          <PushDiagnostics /> */}
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            페이톡만의 특별한 장점
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-smartphone-line text-2xl text-orange-500"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">간편한 주문 관리</h3>
              <p className="text-gray-600">
                직관적인 인터페이스로 주문을 쉽게 관리하고 상태를 실시간으로 추적할 수 있습니다.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-bar-chart-line text-2xl text-orange-500"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">상세한 통계</h3>
              <p className="text-gray-600">
                매출, 주문 현황, 인기 메뉴 등 사장님에게 필요한 모든 데이터를 한눈에 확인하세요.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-money-dollar-circle-line text-2xl text-green-500"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">수수료 0원</h3>
              <p className="text-gray-600">
                배달의민족, 단골앱과 달리 수수료가 전혀 없습니다. 모든 수익이 사장님의 것입니다.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-shield-check-line text-2xl text-blue-500"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">직접 고객 관리</h3>
              <p className="text-gray-600">
                중간 업체 없이 고객과 직접 소통하여 더 나은 서비스와 관계를 구축할 수 있습니다.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-settings-3-line text-2xl text-purple-500"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">완전한 자율성</h3>
              <p className="text-gray-600">
                메뉴, 가격, 운영시간을 자유롭게 설정하고 언제든지 변경할 수 있습니다.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-customer-service-line text-2xl text-red-500"></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">24/7 고객 지원</h3>
              <p className="text-gray-600">
                언제든지 문의사항이 있으시면 연락주세요. 빠르고 친절한 지원을 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="bg-gray-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">지금 시작하세요</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            페이톡과 함께 반찬 사업을 더욱 효율적으로 관리해보세요.
          </p>
          <button
            onClick={() => setShowInquiryModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            매장 문의하기
          </button>
        </div>
      </section>

      {/* 문의 모달 */}
      {showInquiryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">매장 개설 문의</h3>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 *
                </label>
                <input
                  type="text"
                  required
                  value={inquiryData.name}
                  onChange={(e) => setInquiryData({...inquiryData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="이름을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호 *
                </label>
                <input
                  type="tel"
                  required
                  value={inquiryData.phone}
                  onChange={(e) => setInquiryData({...inquiryData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="010-1234-5678"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  가게 이름 *
                </label>
                <input
                  type="text"
                  required
                  value={inquiryData.storeName}
                  onChange={(e) => setInquiryData({...inquiryData, storeName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="가게 이름을 입력하세요"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInquiryModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  문의 제출
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 내 주문 보러가기 버튼 - 푸터 바로 위 */}
      <div className="w-full bg-white border-t border-gray-200 py-4">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => {
              const storeId = prompt('매장 ID를 입력해주세요:');
              if (storeId) {
                navigate(`/order-status/${storeId}`);
              }
            }}
            className="group w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-out"
          >
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center group-hover:bg-opacity-30 transition-all duration-300">
              <i className="ri-shopping-bag-3-line text-lg"></i>
            </div>
            <span>내 주문 보러가기</span>
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}