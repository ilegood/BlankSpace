import React, { useRef, useEffect } from 'react';
import { Plus, FolderPlus, FilePlus } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';

export const FabButton: React.FC = () => {
  const {
    isFabOpen,
    toggleFab,
    closeFab,
    openCreateFolderModal,
    openCreateDocumentModal,
  } = useWorkspace();

  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeFab();
      }
    };
    if (isFabOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFabOpen, closeFab]);

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3 select-none" ref={menuRef}>
      {/* Expanded Menu */}
      {isFabOpen && (
        <div className="bg-white border border-[#ECEEF3] rounded-2xl shadow-modal p-1.5 flex flex-col gap-1 w-44 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <button
            onClick={openCreateFolderModal}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left"
          >
            <FolderPlus className="w-4 h-4 text-slate-500" />
            <span>폴더 추가</span>
          </button>
          <button
            onClick={openCreateDocumentModal}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-lavender-700 bg-lavender-50/80 hover:bg-lavender-100 transition-colors text-left"
          >
            <FilePlus className="w-4 h-4 text-lavender-600" />
            <span>문서 추가</span>
          </button>
        </div>
      )}

      {/* Main Floating Button */}
      <button
        onClick={toggleFab}
        title="항목 추가"
        className={`w-12 h-12 rounded-full bg-gradient-to-tr from-lavender-600 to-lavender-500 text-white flex items-center justify-center shadow-lg hover:shadow-lavender-400/40 hover:scale-105 active:scale-95 transition-all duration-200 ${
          isFabOpen ? 'rotate-45' : ''
        }`}
      >
        <Plus className="w-6 h-6 stroke-[2.2]" />
      </button>
    </div>
  );
};

