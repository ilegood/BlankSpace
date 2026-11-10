import React, { useState } from 'react';
import { X, Image as ImageIcon, Upload, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '../../../toast/ToastContext';

interface ChangeMapImageModalProps {
  isOpen: boolean;
  currentMapUrl: string;
  onConfirm: (newUrl: string, resetData: boolean) => void;
  onClose: () => void;
}

export const ChangeMapImageModal: React.FC<ChangeMapImageModalProps> = ({
  isOpen,
  currentMapUrl,
  onConfirm,
  onClose,
}) => {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState(currentMapUrl);
  const [resetData, setResetData] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  // Local File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageUrl(result);
        toast.success('로컬 지도 이미지를 불러왔습니다.');
      }
      setIsUploading(false);
    };
    reader.onerror = () => {
      toast.error('이미지 파일을 읽는 중 오류가 발생했습니다.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      toast.warning('지도 이미지 URL을 입력하거나 파일을 선택해주세요.');
      return;
    }
    onConfirm(imageUrl.trim(), resetData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#1E1E27] rounded-2xl border border-slate-200 dark:border-[#3A3948] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-[#3A3948] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-lavender-100 dark:bg-[#352E58] text-lavender-600 dark:text-lavender-300">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-[#E8E7EF]">지도 이미지 설정</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E7EF] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* File Upload Option */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-[#E8E7EF] block mb-1.5">
              내 컴퓨터에서 이미지 업로드
            </label>
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-[#3A3948] hover:border-lavender-400 dark:hover:border-lavender-500 rounded-xl cursor-pointer bg-slate-50 dark:bg-[#252532] transition-colors">
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs font-medium text-slate-600 dark:text-[#A5A3B5]">
                {isUploading ? '이미지 로딩 중...' : '클릭하여 이미지 파일 선택 (JPG, PNG, WebP)'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-px bg-slate-200 dark:bg-[#3A3948] flex-1" />
            <span className="text-[11px] text-slate-400">또는 웹 URL 직접 입력</span>
            <div className="h-px bg-slate-200 dark:bg-[#3A3948] flex-1" />
          </div>

          {/* URL Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-[#E8E7EF] block mb-1">
              이미지 URL
            </label>
            <input
              type="text"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#252532] border border-slate-200 dark:border-[#3A3948] rounded-xl focus:outline-hidden focus:border-lavender-500 text-slate-800 dark:text-[#E8E7EF]"
            />
          </div>

          {/* Preview Thumbnail */}
          {imageUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#3A3948] aspect-video w-full bg-slate-100 dark:bg-[#17171D] relative">
              <img
                src={imageUrl}
                alt="미리보기"
                className="w-full h-full object-cover"
                onError={() => {}}
              />
            </div>
          )}

          {/* Requirement: Data Handling Option When Changing Map */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#252532] border border-slate-200/80 dark:border-[#3A3948] rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-[#E8E7EF]">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>기존 지도 데이터 처리 방식</span>
            </div>
            <div className="space-y-1.5 pt-0.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-[#E8E7EF]">
                <input
                  type="radio"
                  name="resetDataOption"
                  checked={!resetData}
                  onChange={() => setResetData(false)}
                  className="text-lavender-600 focus:ring-lavender-500"
                />
                <span className="font-medium">기존 요소와 경계선 유지 (권장)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-[#E8E7EF]">
                <input
                  type="radio"
                  name="resetDataOption"
                  checked={resetData}
                  onChange={() => setResetData(true)}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  기존 요소와 경계선 초기화 (새 지도로 완전 재작성)
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#3A3948]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-lavender-600 hover:bg-lavender-500 rounded-xl shadow-xs transition-colors"
            >
              지도 적용하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

