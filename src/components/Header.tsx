import { useNavigate } from 'react-router-dom';
import { useNewAuth } from '../hooks/useNewAuth';

export default function Header() {
  const navigate = useNavigate();
  const { user } = useNewAuth();

  return (
    <div className="bg-white sticky top-0 z-50">
      <div className="px-4 py-3">
        <div className="flex items-center">
          <img 
            src="https://static.readdy.ai/image/912b0945f01d9fdb4ff4544659653c90/2d4890bd82abce85d430bd82d04df8d6.png" 
            alt="페이톡 로고" 
            className="w-12 h-12"
          />
        </div>
      </div>
    </div>
  );
}
