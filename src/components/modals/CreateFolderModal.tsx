import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { useToast } from '../toast/ToastContext';

export const CreateFolderModal: React.FC = () => {
  const { isCreateFolderOpen, setIsCreateFolderOpen, createFolder } = useWorkspace();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!isCreateFolderOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCreateFolderOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isCreateFolderOpen, setIsCreateFolderOpen]);

  if (!isCreateFolderOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createFolder(name, description);
    showToast(`'${name.trim()}' 폴더가 생성되었습니다`);
    setName('');
    setDescription('');
    setIsCreateFolderOpen(false);
  };

  return (
    <div
      onClick={() => setIsCreateFolderOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bs-animate-modal w-full max-w-md rounded-2xl bg-white dark:bg-[#1E1E29] border border-[#E6E3F0] dark:border-[#2E2D3D] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE7F2] dark:border-[#2E2D3D]">
          <h2 className="text-[15px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">새 폴더</h2>
          <button
            type="button"
            onClick={() => setIsCreateFolderOpen(false)}
            className="p-1 rounded-lg text-[#8A8998] hover:text-[#1B1B1F] dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#4E4D59] dark:text-[#B4B2C4] mb-1.5">
              폴더 이름
            </label>
            <input
              type="text"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 캐릭터"
              className="w-full h-10 px-3.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C] text-sm text-[#1B1B1F] dark:text-[#F1F0F6] focus:outline-none focus:border-[#6A5ACD]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4E4D59] dark:text-[#B4B2C4] mb-1.5">
              폴더 설명
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="폴더 설명"
              className="w-full h-10 px-3.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#15151C] text-sm text-[#1B1B1F] dark:text-[#F1F0F6] focus:outline-none focus:border-[#6A5ACD]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateFolderOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold text-[#4E4D59] dark:text-[#B4B2C4] hover:bg-black/5 dark:hover:bg-white/5"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#6A5ACD] hover:bg-[#5A49B8] text-white text-xs font-semibold"
            >
              폴더 만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
