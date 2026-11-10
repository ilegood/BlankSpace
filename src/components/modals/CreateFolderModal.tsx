import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { useToast } from '../toast/ToastContext';

export const CreateFolderModal: React.FC = () => {
  const { isCreateFolderOpen, closeCreateFolderModal, createFolder } = useWorkspace();
  const toast = useToast();
  const [folderName, setFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isCreateFolderOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setIsLoading(true);
    try {
      await createFolder(folderName.trim());
      toast.success('폴더 생성 완료', `'${folderName.trim()}' 폴더가 생성되었습니다.`);
      setFolderName('');
      closeCreateFolderModal();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      {/* 일반 모달: 콘텐츠 크기에 맞춤 */}
      <div className="bg-white dark:bg-[#292936] border border-[#ECEEF3] dark:border-[#3A3948] rounded-2xl shadow-modal w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#3A3948]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-lavender-100 dark:bg-lavender-950/60 text-lavender-600 dark:text-lavender-400 flex items-center justify-center">
              <FolderPlus className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-semibold text-slate-800 dark:text-[#E8E7EF] text-sm">새 폴더 생성</h2>
          </div>
          <button
            onClick={closeCreateFolderModal}
            className="p-1 rounded-lg text-slate-400 dark:text-[#A5A3B5] hover:text-slate-600 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#1E1E27] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#E8E7EF] mb-1.5">
              폴더 이름 <span className="text-lavender-600 dark:text-lavender-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="예: 세계관, 캐릭터, 레퍼런스"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#3A3948] focus:outline-none focus:border-lavender-500 focus:ring-1 focus:ring-lavender-200 transition-all text-slate-800 dark:text-[#E8E7EF] placeholder-slate-400 dark:placeholder-[#A5A3B5]/50 bg-white dark:bg-[#1E1E27]"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#3A3948]">
            <button
              type="button"
              onClick={closeCreateFolderModal}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-100 dark:hover:bg-[#1E1E27] rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || !folderName.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-lavender-600 hover:bg-lavender-700 active:bg-lavender-800 disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              {isLoading ? '생성 중...' : '폴더 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

