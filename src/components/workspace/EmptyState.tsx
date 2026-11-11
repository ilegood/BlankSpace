import React from 'react';
import { Sparkles, Plus, FolderPlus, FilePlus } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';

interface EmptyStateProps {
  type: 'no-project' | 'empty-workspace';
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  const { openCreateProjectModal, openCreateFolderModal, openCreateDocumentModal } = useWorkspace();

  if (type === 'no-project') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-lavender-100/80 dark:bg-[#352E58] text-lavender-600 dark:text-[#B7A5FF] flex items-center justify-center mb-4 shadow-soft">
          <Sparkles className="w-8 h-8 fill-lavender-200 dark:fill-[#554884] stroke-[1.5]" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-[#E8E7EF] tracking-tight">
          당신만의 창작 공간을 시작해 보세요
        </h2>
        <p className="text-xs text-slate-500 dark:text-[#A5A3B5] max-w-sm mt-1.5 leading-relaxed">
          게임 개발의 모든 기획, 캐릭터, 세계관, 레퍼런스를 한곳에 정리할 수 있습니다.
        </p>
        <button
          onClick={openCreateProjectModal}
          className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 active:bg-lavender-800 text-white font-semibold text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>새 프로젝트 만들기</span>
        </button>
      </div>
    );
  }

  return (
    <div className="py-16 flex flex-col items-center justify-center text-center select-none">
      <div className="w-14 h-14 rounded-2xl bg-slate-100/70 dark:bg-[#292936] text-slate-400 dark:text-[#A5A3B5] flex items-center justify-center mb-3">
        <Sparkles className="w-6 h-6 stroke-1" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-[#E8E7EF]">이 공간은 아직 비어 있습니다</h3>
      <p className="text-xs text-slate-400 dark:text-[#A5A3B5] max-w-xs mt-1">
        오른쪽 아래의 <span className="text-lavender-600 dark:text-[#B7A5FF] font-bold">+</span> 버튼을 누르거나 아래 버튼으로 시작해 보세요.
      </p>
      <div className="flex items-center gap-2.5 mt-5">
        <button
          onClick={openCreateFolderModal}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-white dark:bg-[#292936] hover:border-lavender-300 dark:hover:border-[#A995F5] hover:bg-lavender-50/40 dark:hover:bg-[#352E58]/40 text-slate-700 dark:text-[#E8E7EF] text-xs font-medium transition-all"
        >
          <FolderPlus className="w-3.5 h-3.5 text-slate-500 dark:text-[#A5A3B5]" />
          <span>폴더 추가</span>
        </button>
        <button
          onClick={openCreateDocumentModal}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-lavender-100 dark:bg-[#352E58] text-lavender-800 dark:text-[#B7A5FF] hover:bg-lavender-200 dark:hover:bg-[#43396E] text-xs font-semibold transition-all border border-lavender-200/50 dark:border-[#524580]/60"
        >
          <FilePlus className="w-3.5 h-3.5 text-lavender-600 dark:text-[#B7A5FF]" />
          <span>문서 추가</span>
        </button>
      </div>
    </div>
  );
};

