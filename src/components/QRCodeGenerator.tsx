import { useState } from 'react';

interface QRCodeGeneratorProps {
  storeId?: string;
  storeName?: string;
}

export default function QRCodeGenerator({ storeId, storeName }: QRCodeGeneratorProps) {
  const [showQR, setShowQR] = useState(false);
  
  const generateQRUrl = () => {
    const baseUrl = window.location.origin;
    if (storeId) {
      return `${baseUrl}/?redirect=menu&storeId=${storeId}`;
    }
    return `${baseUrl}/?redirect=admin`;
  };

  const qrUrl = generateQRUrl();

  return (
    <div className="text-center">
      <button
        onClick={() => setShowQR(!showQR)}
        className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
      >
        <i className="ri-qr-code-line text-lg mr-2"></i>
        {storeId ? '메뉴 QR 코드' : '관리자 QR 코드'}
      </button>
      
      {showQR && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-2">
            {storeId ? `${storeName} 메뉴` : '관리자'} PWA 설치용 QR 코드
          </h3>
          <div className="mb-4">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
              alt="QR Code"
              className="mx-auto"
            />
          </div>
          <p className="text-sm text-gray-600 mb-2">
            이 QR 코드를 스캔하여 PWA를 설치하세요
          </p>
          <div className="text-xs text-gray-500 break-all">
            {qrUrl}
          </div>
        </div>
      )}
    </div>
  );
}
