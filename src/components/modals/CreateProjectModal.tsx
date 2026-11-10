import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';

export const CreateProjectModal: React.FC = () => {
  const { isCreateProjectOpen, closeCreateProjectModal, createProject } = useWorkspace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isCreateProjectOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await createProject(name.trim(), description.trim(), coverUrl.trim() || undefined);
      setName('');
      setDescription('');
      setCoverUrl('');
      closeCreateProjectModal();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
      {/* 일반 모달: 콘텐츠에 맞게 유동적인 크기 */}
      <div className="bg-white border border-[#ECEEF3] rounded-2xl shadow-modal w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-lavender-100 text-lavender-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h2 className="font-semibold text-slate-800 text-sm">새 프로젝트 생성</h2>
          </div>
          <button
            onClick={closeCreateProjectModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              프로젝트 이름 <span className="text-lavender-600">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 프로젝트 에테르, 잃어버린 세계"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 focus:ring-1 focus:ring-lavender-200 transition-all text-slate-800 placeholder-slate-400 !bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              프로젝트 한 줄 설명 (선택)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="프로젝트의 주요 콘셉트나 목표를 간단히 작성해 보세요."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 focus:ring-1 focus:ring-lavender-200 transition-all text-slate-800 placeholder-slate-400 resize-none !bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              커버 이미지 URL (선택)
            </label>
            <input
              type="url"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="비워두면 기본 판타지 배경 이미지가 지정됩니다."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 focus:ring-1 focus:ring-lavender-200 transition-all text-slate-800 placeholder-slate-400 !bg-white"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={closeCreateProjectModal}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-lavender-600 hover:bg-lavender-700 active:bg-lavender-800 disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              {isLoading ? '생성 중...' : '프로젝트 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

