import React, { useState, useRef } from 'react';
import { FileText, Plus, MoreHorizontal, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { DocumentPage } from '../../types';

interface PageSidebarProps {
  onBeforePageChange?: () => void;
}

interface MenuState {
  page: DocumentPage;
  top: number;
  left: number;
}

export const PageSidebar: React.FC<PageSidebarProps> = ({ onBeforePageChange }) => {
  const {
    currentDocumentPages,
    activePage,
    setActivePageId,
    createPage,
    renamePage,
    deletePage,
  } = useWorkspace();

  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [activeMenu, setActiveMenu] = useState<MenuState | null>(null);
  const [pageToDelete, setPageToDelete] = useState<DocumentPage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartRename = (page: DocumentPage) => {
    setEditingPageId(page.id);
    setEditingTitle(page.title);
    setActiveMenu(null);
  };

  const handleSaveRename = (pageId: string) => {
    if (editingTitle.trim()) {
      renamePage(pageId, editingTitle.trim());
    }
    setEditingPageId(null);
  };

  const handleAddPage = async () => {
    onBeforePageChange?.();
    await createPage();
  };

  const handleSelectPage = (pageId: string) => {
    if (activePage?.id === pageId) return;
    onBeforePageChange?.();
    setActivePageId(pageId);
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, page: DocumentPage) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Calculate position: if near bottom, open upward
    const menuHeight = 85;
    const isNearBottom = rect.bottom + menuHeight > windowHeight;
    const top = isNearBottom ? rect.top - menuHeight : rect.bottom + 4;
    const left = Math.min(rect.left, window.innerWidth - 140);

    setActiveMenu({
      page,
      top: Math.max(10, top),
      left,
    });
  };

  const handleConfirmDelete = async () => {
    if (!pageToDelete) return;

    onBeforePageChange?.();
    const res = await deletePage(pageToDelete.id);
    if (!res.success) {
      setErrorMessage(res.message || '페이지를 삭제할 수 없습니다.');
      setTimeout(() => setErrorMessage(null), 3500);
    }
    setPageToDelete(null);
  };

  return (
    <aside className="w-56 bg-[#FBFBFE] border-r border-[#ECEEF3] flex flex-col justify-between shrink-0 select-none relative z-10">
      {/* Upper Area: Header + Page List */}
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-slate-500">
          <span>문서 페이지 ({currentDocumentPages.length})</span>
          <button
            onClick={handleAddPage}
            title="새 페이지 추가"
            className="p-1 rounded-md text-slate-400 hover:text-lavender-600 hover:bg-lavender-100/70 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Error message toast */}
        {errorMessage && (
          <div className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-[11px] flex items-center gap-1.5 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Pages List */}
        <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-220px)]">
          {currentDocumentPages.map((page, index) => {
            const isActive = activePage?.id === page.id;
            const isEditing = editingPageId === page.id;

            return (
              <div
                key={page.id}
                onClick={() => {
                  if (!isEditing) handleSelectPage(page.id);
                }}
                className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 font-semibold shadow-soft border border-slate-200/80'
                    : 'text-slate-600 hover:bg-slate-100/70 font-normal'
                }`}
              >
                {/* Page Title / Inline Editor */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isActive ? 'text-lavender-600' : 'text-slate-400'
                    }`}
                  />
                  {isEditing ? (
                    <div
                      className="flex items-center gap-1 flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(page.id);
                          if (e.key === 'Escape') setEditingPageId(null);
                        }}
                        className="w-full text-xs px-1.5 py-0.5 rounded border border-lavender-400 focus:outline-none !bg-white"
                      />
                      <button
                        onClick={() => handleSaveRename(page.id)}
                        className="p-0.5 text-lavender-600 hover:bg-lavender-50 rounded"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingPageId(null)}
                        className="p-0.5 text-slate-400 hover:bg-slate-100 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="truncate flex-1">
                      {page.title || `페이지 ${index + 1}`}
                    </span>
                  )}
                </div>

                {/* More Action Trigger Button */}
                {!isEditing && (
                  <button
                    onClick={(e) => handleOpenMenu(e, page)}
                    title="페이지 옵션"
                    className={`p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${
                      isActive || activeMenu?.page.id === page.id
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Area: Add Page shortcut */}
      <div className="p-3 border-t border-[#ECEEF3]">
        <button
          onClick={handleAddPage}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 text-xs text-slate-600 hover:border-lavender-400 hover:text-lavender-700 hover:bg-lavender-50/50 transition-all font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>페이지 추가</span>
        </button>
      </div>

      {/* ====================================================================
          Fixed Global Positioned Page Option Menu (Layer Issue Resolved)
         ==================================================================== */}
      {activeMenu && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setActiveMenu(null)}
          />

          {/* Elevated Dropdown Menu */}
          <div
            style={{
              top: `${activeMenu.top}px`,
              left: `${activeMenu.left}px`,
            }}
            className="fixed z-50 bg-white border border-[#ECEEF3] rounded-xl shadow-modal p-1 w-32 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              onClick={() => handleStartRename(activeMenu.page)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-lavender-50 hover:text-lavender-700 transition-colors text-left"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
              <span>이름 변경</span>
            </button>
            <button
              onClick={() => {
                setPageToDelete(activeMenu.page);
                setActiveMenu(null);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>페이지 삭제</span>
            </button>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {pageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#ECEEF3] rounded-2xl shadow-modal w-full max-w-sm p-5 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-800 text-sm">페이지 삭제 확인</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              정말로 <strong className="text-slate-800">'{pageToDelete.title}'</strong> 페이지를 삭제하시겠습니까? 삭제된 페이지의 내용은 복구할 수 없습니다.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPageToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
