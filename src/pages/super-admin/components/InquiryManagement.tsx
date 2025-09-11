import { useState, useEffect } from 'react';
import { getInquiries, updateInquiryStatus, deleteInquiry, type Inquiry } from '../../../lib/inquiryApi';

interface InquiryManagementProps {
  showToast: (message: string) => void;
}

export default function InquiryManagement({ showToast }: InquiryManagementProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const data = await getInquiries();
      setInquiries(data);
    } catch (error) {
      console.error('문의 로드 실패:', error);
      showToast('문의를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (inquiryId: string, newStatus: '확인' | '미확인') => {
    try {
      await updateInquiryStatus(inquiryId, newStatus);
      setInquiries(inquiries.map(inquiry => 
        inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry
      ));
      showToast(`문의 상태가 "${newStatus}"로 변경되었습니다.`);
    } catch (error) {
      console.error('상태 변경 실패:', error);
      showToast('상태 변경에 실패했습니다.');
    }
  };

  const handleDeleteInquiry = (inquiryId: string, name: string) => {
    setInquiryToDelete({ id: inquiryId, name });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteInquiry = async () => {
    if (!inquiryToDelete) return;

    try {
      await deleteInquiry(inquiryToDelete.id);
      setInquiries(inquiries.filter(inquiry => inquiry.id !== inquiryToDelete.id));
      showToast(`${inquiryToDelete.name}님의 문의를 삭제했습니다.`);
    } catch (error) {
      console.error('삭제 실패:', error);
      showToast('삭제에 실패했습니다.');
    } finally {
      setShowDeleteConfirm(false);
      setInquiryToDelete(null);
    }
  };

  const cancelDeleteInquiry = () => {
    setShowDeleteConfirm(false);
    setInquiryToDelete(null);
  };

  // 검색 필터링
  const filteredInquiries = inquiries.filter(inquiry => 
    inquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inquiry.phone.includes(searchTerm) ||
    inquiry.store_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
        <div>
            <h2 className="text-xl font-bold text-gray-800">문의 관리</h2>
            <p className="text-sm text-gray-600 mt-1">
              매장 개설 문의를 확인하고 관리할 수 있습니다.
            </p>
          </div>
          <div className="flex space-x-6">
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-500">
                {inquiries.filter(i => i.status === '미확인').length}
              </div>
              <div className="text-sm text-gray-500">미확인</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-500">
                {inquiries.filter(i => i.status === '확인').length}
              </div>
              <div className="text-sm text-gray-500">확인</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-500">
                {inquiries.length}
              </div>
              <div className="text-sm text-gray-500">전체 문의</div>
            </div>
          </div>
        </div>
        
        {/* 검색 기능 */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="이름, 전화번호, 가게명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
        </div>
      </div>
          {searchTerm && (
          <button
              onClick={() => setSearchTerm('')}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <i className="ri-close-line text-lg"></i>
          </button>
          )}
        </div>
      </div>

      {/* 문의 목록 */}
      {filteredInquiries.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-question-line text-2xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {searchTerm ? '검색 결과가 없습니다' : '문의가 없습니다'}
          </h3>
          <p className="text-gray-500">
            {searchTerm ? '다른 검색어로 시도해보세요.' : '새로운 문의가 있으면 여기에 표시됩니다.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inquiry) => (
            <div key={inquiry.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <i className="ri-user-line text-orange-500 text-xl"></i>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-800">{inquiry.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          inquiry.status === '확인' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {inquiry.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{inquiry.phone}</p>
                      <p className="text-sm text-gray-600 font-medium">{inquiry.store_name}</p>
                      <p className="text-xs text-gray-500">
                        문의일: {formatDate(inquiry.created_at)}
                      </p>
                    </div>
        </div>
      </div>

                <div className="flex items-center space-x-2">
                  {/* 상태 변경 버튼 */}
                  <button
                    onClick={() => handleStatusChange(inquiry.id, inquiry.status === '확인' ? '미확인' : '확인')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                      inquiry.status === '확인'
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    <i className={`ri-${inquiry.status === '확인' ? 'eye-off' : 'eye'}-line`}></i>
                    <span>{inquiry.status === '확인' ? '미확인으로' : '확인으로'}</span>
                  </button>
                  
                  {/* 삭제 버튼 */}
              <button
                    onClick={() => handleDeleteInquiry(inquiry.id, inquiry.name)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
              >
                    <i className="ri-delete-bin-line"></i>
                    <span>삭제</span>
              </button>
            </div>
              </div>
              </div>
          ))}
                </div>
              )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && inquiryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 mx-4 max-w-sm w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-delete-bin-line text-2xl text-red-500"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">문의 삭제</h3>
              <p className="text-gray-600 mb-6">
                <span className="font-semibold text-red-600">{inquiryToDelete.name}</span>님의 문의를 정말로 삭제하시겠습니까?
                <br />
                <span className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다.</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelDeleteInquiry}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={confirmDeleteInquiry}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}