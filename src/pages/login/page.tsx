import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewAuth } from '../../hooks/useNewAuth';
import { registerOwner } from '../../lib/authApi';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useNewAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 로그인 폼 상태
  const [loginForm, setLoginForm] = useState({
    phone: '',
    password: ''
  });

  // 회원가입 폼 상태
  const [registerForm, setRegisterForm] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 입력값 검증
    if (!loginForm.phone || !loginForm.password) {
      setError('전화번호와 비밀번호를 모두 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      await login(loginForm.phone, loginForm.password);
      navigate('/admin-dashboard');
    } catch (error: any) {
      setError(error.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // 비밀번호 확인
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    // 비밀번호 길이 확인 (정확히 4자리)
    if (registerForm.password.length !== 4) {
      setError('비밀번호는 4자리 숫자여야 합니다.');
      setLoading(false);
      return;
    }

    // 숫자만 입력되었는지 확인
    if (!/^\d{4}$/.test(registerForm.password)) {
      setError('비밀번호는 4자리 숫자만 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      await registerOwner({
        name: registerForm.name,
        phone: registerForm.phone,
        password: registerForm.password
      });
      
      setSuccess('회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.');
      setRegisterForm({
        name: '',
        phone: '',
        password: '',
        confirmPassword: ''
      });
      
      // 3초 후 로그인 폼으로 전환
      setTimeout(() => {
        setIsLogin(true);
        setSuccess('');
      }, 3000);
    } catch (error: any) {
      setError(error.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <Header />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* 헤더 */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white font-bold text-2xl">P</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">PayTalk</h1>
              <p className="text-gray-500">
                {isLogin ? '사장님 로그인' : '사장님 회원가입'}
              </p>
            </div>

            {/* 에러/성공 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                {success}
              </div>
            )}

            {/* 로그인 폼 */}
            {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={loginForm.phone}
                    onChange={(e) => {
                      // 숫자만 입력 허용
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setLoginForm({...loginForm, phone: value});
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="01012345678"
                    maxLength={11}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호
                  </label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => {
                      // 숫자만 입력 허용
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setLoginForm({...loginForm, password: value});
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="4자리 숫자 비밀번호를 입력하세요"
                    maxLength={4}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {loading ? '로그인 중...' : '로그인'}
                </button>
              </form>
            ) : (
              /* 회원가입 폼 */
              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="이름을 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={registerForm.phone}
                    onChange={(e) => {
                      // 숫자만 입력 허용
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setRegisterForm({...registerForm, phone: value});
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="01012345678"
                    maxLength={11}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 (4자리 숫자)
                  </label>
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => {
                      // 숫자만 입력 허용
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setRegisterForm({...registerForm, password: value});
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="4자리 숫자 비밀번호를 입력하세요"
                    maxLength={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => {
                      // 숫자만 입력 허용
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setRegisterForm({...registerForm, confirmPassword: value});
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="4자리 숫자 비밀번호를 다시 입력하세요"
                    maxLength={4}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {loading ? '회원가입 중...' : '회원가입'}
                </button>
              </form>
            )}

            {/* 전환 버튼 */}
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                }}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                {isLogin ? '아직 계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
