import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  return (
    <div className="bg-gradient-to-r from-orange-50 via-white to-orange-50 shadow-lg border-b border-orange-100">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="https://static.readdy.ai/image/912b0945f01d9fdb4ff4544659653c90/2d4890bd82abce85d430bd82d04df8d6.png" 
              alt="페이톡 로고" 
              className="w-6 h-6"
            />
            <h1 className="text-lg font-bold text-orange-500" style={{ fontFamily: "Pacifico, serif" }}>
              페이톡
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/orders')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-3 py-2 rounded-lg flex items-center whitespace-nowrap cursor-pointer text-xs font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <i className="ri-file-list-3-line mr-2"></i>
              주문내역
            </button>
            {userProfile?.role === 'owner' && (
              <>
                <button
                  onClick={() => navigate('/owner/orders')}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-3 py-2 rounded-lg flex items-center whitespace-nowrap cursor-pointer text-xs font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <i className="ri-shopping-cart-line mr-2"></i>
                  주문관리
                </button>
                <button
                  onClick={() => navigate('/owner/menu')}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-3 py-2 rounded-lg flex items-center whitespace-nowrap cursor-pointer text-xs font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <i className="ri-restaurant-line mr-2"></i>
                  메뉴관리
                </button>
              </>
            )}
            {userProfile?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="bg-white hover:bg-orange-500 text-gray-700 hover:text-white px-3 py-2 rounded-lg flex items-center whitespace-nowrap cursor-pointer text-xs font-medium border border-gray-300 hover:border-orange-500 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <i className="ri-store-line mr-2"></i>
                내 반찬가게 관리
              </button>
            )}
            {userProfile?.role === 'super_admin' && (
              <button
                onClick={() => navigate('/super-admin')}
                className="bg-white hover:bg-orange-500 text-gray-700 hover:text-white px-3 py-2 rounded-lg flex items-center whitespace-nowrap cursor-pointer text-xs font-medium border border-gray-300 hover:border-orange-500 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <i className="ri-admin-line mr-2"></i>
                슈퍼어드민
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
