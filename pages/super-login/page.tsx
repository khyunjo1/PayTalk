import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewAuth } from '../../hooks/useNewAuth';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function SuperLogin() {
  const navigate = useNavigate();
  const { user, loginSuperAdmin, loading: authLoading } = useNewAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await loginSuperAdmin(password);
      navigate('/super-admin');
    } catch (error: any) {
      setError(error.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-white">
      <Header />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* 헤더 */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <i className="ri-shield-keyhole-line text-white text-2xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">슈퍼 어드민</h1>
              {user ? (
                <div className="text-green-600 font-semibold">
                  {user.name}님 반갑습니다! 🎉
                </div>
              ) : (
                <p className="text-gray-500">관리자 로그인</p>
              )}
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            {/* 로그인 폼 또는 관리자 페이지 버튼 */}
            {user ? (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">슈퍼 어드민 페이지로 이동하세요</p>
                  <button
                    onClick={() => navigate('/super-admin')}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    슈퍼 어드민 페이지로 이동
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="관리자 비밀번호를 입력하세요"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {loading ? '로그인 중...' : '로그인'}
                </button>
              </form>
            )}

            {/* 안내 메시지 */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                슈퍼 어드민만 접근할 수 있는 페이지입니다.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
