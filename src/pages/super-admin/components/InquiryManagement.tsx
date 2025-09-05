
import { useState } from 'react';

interface Inquiry {
  id: string;
  name: string;
  storeName: string;
  storeAddress: string;
  phone: string;
  other?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface InquiryManagementProps {
  showToast: (message: string) => void;
}

export default function InquiryManagement({ showToast }: InquiryManagementProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([
    {
      id: '1',
      name: '김사장',
      storeName: '전통반찬집',
      storeAddress: '서울시 강남구 테헤란로 123',
      phone: '02-1234-5678',
      other: '주말 영업 가능, 배달 가능 지역은 강남구 전체입니다.',
      status: 'pending',
      createdAt: '2024-01-15T10:30:00'
    },
    {
      id: '2',
      name: '이사장',
      storeName: '홈메이드반찬',
      storeAddress: '경기도 성남시 분당구 정자로 456',
      phone: '031-987-6543',
      other: '오전 9시부터 오후 8시까지 영업',
      status: 'pending',
      createdAt: '2024-01-14T14:20:00'
    },
    {
      id: '3',
      name: '박사장',
      storeName: '건강반찬마켓',
      storeAddress: '인천시 남동구 구월로 789',
      phone: '032-555-7777',
      status: 'approved',
      createdAt: '2024-01-10T09:15:00'
    }
  ]);

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const filteredInquiries = selectedStatus === 'all' 
    ? inquiries 
    : inquiries.filter(inquiry => inquiry.status === selectedStatus);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'approved': return '승인됨';
      case 'rejected': return '거절됨';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('ko-KR'),
      time: date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const handleApprove = (inquiryId: string) => {
    const inquiry = inquiries.find(i => i.id === inquiryId);
    if (!inquiry) return;

    if (confirm(`${inquiry.storeName} 매장 개설을 승인하시겠습니까?`)) {
      setInquiries(inquiries.map(i => 
        i.id === inquiryId 
          ? { ...i, status: 'approved' }
          : i
      ));
      showToast(`${inquiry.storeName} 매장 개설이 승인되었습니다`);
    }
  };

  const handleReject = (inquiryId: string) => {
    const inquiry = inquiries.find(i => i.id === inquiryId);
    if (!inquiry) return;

    if (confirm(`${inquiry.storeName} 매장 개설 문의를 거절하시겠습니까?`)) {
      setInquiries(inquiries.map(i => 
        i.id === inquiryId 
          ? { ...i, status: 'rejected' }
          : i
      ));
      showToast(`${inquiry.storeName} 매장 개설 문의가 거절되었습니다`);
    }
  };

  const handleViewDetails = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">문의 관리</h2>
          <p className="text-gray-600">매장 개설 문의를 관리합니다</p>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${
              selectedStatus === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setSelectedStatus('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${
              selectedStatus === 'pending'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            대기중
          </button>
          <button
            onClick={() => setSelectedStatus('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${
              selectedStatus === 'approved'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            승인됨
          </button>
          <button
            onClick={() => setSelectedStatus('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer ${
              selectedStatus === 'rejected'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            거절됨
          </button>
        </div>
      </div>

      {/* 문의 테이블 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신청자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">매장명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주소</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신청일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInquiries.map((inquiry) => {
                const { date, time } = formatDate(inquiry.createdAt);
                return (
                  <tr key={inquiry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{inquiry.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{inquiry.storeName}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {inquiry.storeAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {inquiry.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{date}</div>
                      <div className="text-xs text-gray-500">{time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(inquiry.status)}`}>
                        {getStatusLabel(inquiry.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(inquiry)}
                          className="text-blue-600 hover:text-blue-900 cursor-pointer"
                          title="상세보기"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                        {inquiry.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(inquiry.id)}
                              className="text-green-600 hover:text-green-900 cursor-pointer"
                              title="승인"
                            >
                              <i className="ri-check-line"></i>
                            </button>
                            <button
                              onClick={() => handleReject(inquiry.id)}
                              className="text-red-600 hover:text-red-900 cursor-pointer"
                              title="거절"
                            >
                              <i className="ri-close-line"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 상세보기 모달 */}
      {showDetailModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">매장 개설 문의 상세</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">신청자</label>
                <p className="text-gray-900">{selectedInquiry.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">매장명</label>
                <p className="text-gray-900">{selectedInquiry.storeName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">매장 주소</label>
                <p className="text-gray-900">{selectedInquiry.storeAddress}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                <p className="text-gray-900">{selectedInquiry.phone}</p>
              </div>

              {selectedInquiry.other && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">기타사항</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedInquiry.other}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedInquiry.status)}`}>
                  {getStatusLabel(selectedInquiry.status)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">신청일시</label>
                <p className="text-gray-900">{formatDate(selectedInquiry.createdAt).date} {formatDate(selectedInquiry.createdAt).time}</p>
              </div>
            </div>

            {selectedInquiry.status === 'pending' && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    handleApprove(selectedInquiry.id);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  승인
                </button>
                <button
                  onClick={() => {
                    handleReject(selectedInquiry.id);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg whitespace-nowrap cursor-pointer"
                >
                  거절
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
