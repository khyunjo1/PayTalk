export default function Footer() {
  return (
    <footer className="bg-gray-50 py-6 mt-6 no-print">
      <div className="px-4 max-w-6xl mx-auto">
        <div className="mb-4">
          {/* 회사 정보 */}
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
  );
}
