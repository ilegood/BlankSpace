import React, { useState } from 'react';
import { Star, FileText, MoreHorizontal, Edit2, Trash2, Check, X } from 'lucide-react';
import { Document } from '../../types';
import { formatRelativeTime } from '../../utils/time';
import { TEMPLATES } from '../../templates/templateList';
import { useWorkspace } from '../../store/WorkspaceContext';
import { toast, customConfirm } from '../toast/ToastContext';

interface DocumentCardProps {
  document: Document;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  const {
    setActiveDocument,
    toggleFavoriteDocument,
    deleteDocument,
    updateDocumentTitle,
    reorderItems,
    sortOption,
    setSortOption,
  } = useWorkspace();

  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState(document.title);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const template = TEMPLATES.find((t) => t.id === document.templateType);
  const templateName = template?.name || '문서';

  const handleRenameSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (titleInput.trim() && titleInput.trim() !== document.title) {
      await updateDocumentTitle(document.id, titleInput.trim());
      toast.success('문서 제목 변경', `'${titleInput.trim()}'으로 변경되었습니다.`);
    }
    setIsRenaming(false);
  };

  const handleDelete = async () => {
    setMenuPos(null);
    const confirmed = await customConfirm({
      title: '문서 삭제',
      message: `'${document.title}' 문서를 삭제하시겠습니까?`,
      confirmText: '문서 삭제',
      isDanger: true,
    });
    if (confirmed) {
      await deleteDocument(document.id);
      toast.success('문서 삭제 완료', `'${document.title}' 문서가 삭제되었습니다.`);
    }
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const isNearBottom = rect.bottom + 85 > windowHeight;
    const top = isNearBottom ? rect.top - 85 : rect.bottom + 4;
    setMenuPos({
      top: Math.max(10, top),
      left: Math.min(rect.left, window.innerWidth - 130),
    });
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'document', id: document.id })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;

    try {
      const data = JSON.parse(dataStr) as { type: 'folder' | 'document'; id: string };
      if (!data.id || data.id === document.id) return;

      if (data.type === 'document') {
        // 커스텀 정렬 상태에서만 항목 순서 변경 허용 (기존 정렬 방식과의 충돌 방지)
        if (sortOption === 'custom') {
          await reorderItems('document', data.id, document.id);
        }
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  return (
    <>
      <div
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isRenaming) setActiveDocument(document.id);
        }}
        className={`group bg-white dark:bg-[#292936] border rounded-2xl overflow-hidden flex flex-col transition-all duration-200 cursor-pointer select-none ${
          isDragging ? 'opacity-40 scale-95 border-dashed border-lavender-400' : ''
        } ${
          isDragOver
            ? 'border-lavender-500 bg-lavender-50/50 dark:bg-[#352E58]/40 shadow-md ring-2 ring-lavender-300 scale-[1.01]'
            : 'border-[#ECEEF3] dark:border-[#3A3948] hover:border-lavender-300 dark:hover:border-[#A995F5] hover:shadow-soft-hover'
        }`}
      >
        {/* Thumbnail Preview Area */}
        <div className="h-28 w-full bg-slate-50 dark:bg-[#1E1E27] relative overflow-hidden border-b border-slate-100 dark:border-[#3A3948] flex items-center justify-center">
          {document.coverImage ? (
            <img
              src={document.coverImage}
              alt={document.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-300 dark:text-[#A5A3B5] gap-1">
              <FileText className="w-8 h-8 stroke-1 text-slate-300 dark:text-[#A5A3B5]" />
              <span className="text-[11px] font-medium">문서 미리보기</span>
            </div>
          )}

          {/* Top-Right Menu Trigger */}
          <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleOpenMenu}
              className="p-1 rounded-lg bg-white/80 dark:bg-[#292936]/80 hover:bg-white dark:hover:bg-[#292936] text-slate-600 dark:text-[#E8E7EF] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              title="문서 메뉴"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 flex flex-col gap-2.5 flex-1 justify-between">
          <div className="flex flex-col gap-2">
            {/* Title or Inline Edit */}
            {isRenaming ? (
              <form
                onSubmit={handleRenameSubmit}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1"
              >
                <input
                  type="text"
                  autoFocus
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="text-xs font-semibold px-2 py-0.5 rounded border border-lavender-400 focus:outline-none bg-white dark:bg-[#1E1E27] text-slate-800 dark:text-[#E8E7EF] w-full"
                />
                <button type="submit" className="p-1 text-lavender-600 dark:text-[#A995F5] hover:bg-lavender-50 dark:hover:bg-[#352E58] rounded">
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsRenaming(false)}
                  className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E1E27] rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-[#A5A3B5] shrink-0" />
                <h3 className="font-semibold text-slate-800 dark:text-[#F3F2F8] text-[14px] truncate group-hover:text-lavender-700 dark:group-hover:text-[#B7A5FF] transition-colors">
                  {document.title}
                </h3>
              </div>
            )}

            {/* Template Tag Badge */}
            <div>
              <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-lavender-100/80 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] border border-lavender-200/50 dark:border-[#524580]/60">
                {templateName}
              </span>
            </div>
          </div>

          {/* Footer info: Last Updated + Star */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100/70 dark:border-[#3A3948] text-[11.5px] text-slate-400 dark:text-[#A5A3B5]">
            <span>{formatRelativeTime(document.updatedAt)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavoriteDocument(document.id);
              }}
              className={`p-1 rounded transition-colors ${
                document.isFavorite
                  ? 'text-lavender-600 dark:text-[#A995F5] fill-lavender-600'
                  : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  document.isFavorite ? 'fill-lavender-600 dark:fill-[#A995F5]' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Global Fixed Positioned Menu */}
      {menuPos && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setMenuPos(null);
            }}
          />
          <div
            style={{
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            className="fixed z-50 bg-white dark:bg-[#292936] border border-[#ECEEF3] dark:border-[#3A3948] rounded-xl shadow-modal p-1 w-32 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              onClick={() => {
                setMenuPos(null);
                setIsRenaming(true);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-[#E8E7EF] hover:bg-lavender-50 dark:hover:bg-[#1E1E27] hover:text-lavender-700 dark:hover:text-[#B7A5FF] transition-colors text-left"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-400 dark:text-[#A5A3B5]" />
              <span>이름 변경</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>문서 삭제</span>
            </button>
          </div>
        </>
      )}
    </>
  );
};
