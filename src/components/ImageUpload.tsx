import { useState, useRef } from 'react';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string | null) => void;
  placeholder?: string;
  className?: string;
}

export default function ImageUpload({ 
  currentImageUrl, 
  onImageChange, 
  placeholder = "이미지를 선택하세요",
  className = ""
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    setIsUploading(true);

    try {
      // 실제 프로덕션에서는 Supabase Storage나 다른 클라우드 스토리지에 업로드
      // 여기서는 간단히 base64로 변환하여 사용
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewUrl(result);
        onImageChange(result);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert('이미지 업로드에 실패했습니다.');
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        이미지
      </label>
      
      {/* 이미지 미리보기 */}
      {previewUrl && (
        <div className="relative">
          <img
            src={previewUrl}
            alt="미리보기"
            className="w-full h-48 object-cover rounded-lg border border-gray-300"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
            disabled={isUploading}
          >
            <i className="ri-close-line text-sm"></i>
          </button>
        </div>
      )}

      {/* 업로드 버튼 */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              업로드 중...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <i className="ri-upload-line mr-2"></i>
              {previewUrl ? '이미지 변경' : '이미지 선택'}
            </div>
          )}
        </button>
        
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemoveImage}
            disabled={isUploading}
            className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="ri-delete-bin-line mr-1"></i>
            삭제
          </button>
        )}
      </div>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 도움말 텍스트 */}
      <p className="text-xs text-gray-500">
        JPG, PNG, GIF 파일만 업로드 가능합니다. (최대 5MB)
      </p>
    </div>
  );
}
