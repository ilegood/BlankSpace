import React, { useState } from 'react';
import { Folder as FolderIcon, MoreHorizontal, Edit2, Trash2, Check, X, CornerDownRight } from 'lucide-react';
import { Folder } from '../../types';
import { useWorkspace } from '../../store/WorkspaceContext';
import { toast, customConfirm } from '../toast/ToastContext';

interface FolderCardProps {
  folder: Folder;
}

export const FolderCard: React.FC<FolderCardProps> = ({ folder }) => {
  const {
    setActiveFolder,
    documents,
    folders,
    deleteFolder,
    renameFolder,
    moveItem,
    reorderItems,
    sortOption,
  } = useWorkspace();

  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(folder.name);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Count children
  const childFoldersCount = folders.filter((f) => f.parentFolderId === folder.id).length;
  const childDocsCount = documents.filter((d) => d.folderId === folder.id).length;
  const totalItems = childFoldersCount + childDocsCount;

  const handleRenameSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (nameInput.trim() && nameInput.trim() !== folder.name) {
      await renameFolder(folder.id, nameInput.trim());
      toast.success('폴더 이름 변경', `'${nameInput.trim()}'으로 변경되었습니다.`);
    }
    setIsRenaming(false);
  };

  const handleDelete = async () => {
    setMenuPos(null);
    const confirmed = await customConfirm({
      title: '폴더 삭제',
      message: `'${folder.name}' 폴더를 삭제하시겠습니까?\n내부에 포함된 모든 하위 폴더와 문서도 함께 삭제됩니다.`,
      confirmText: '폴더 삭제',
      isDanger: true,
    });

    if (confirmed) {
      await deleteFolder(folder.id);
      toast.success('폴더 삭제 완료', `'${folder.name}' 폴더가 삭제되었습니다.`);
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

  // Drag Source handlers
  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'folder', id: folder.id })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Drop Target handlers
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
      if (!data.id) return;

      if (data.type === 'document') {
        await moveItem('document', data.id, folder.id);
        toast.success('이동 완료', '문서가 폴더로 이동되었습니다.');
      } else if (data.type === 'folder') {
        if (data.id === folder.id) return;

        // Try moving folder into this folder
        const res = await moveItem('folder', data.id, folder.id);
        if (res.success) {
          toast.success('이동 완료', '폴더가 이동되었습니다.');
        } else if (sortOption === 'custom') {
          await reorderItems('folder', data.id, folder.id);
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
          if (!isRenaming) setActiveFolder(folder.id);
        }}
        className={`group relative bg-white dark:bg-[#292936] border rounded-2xl p-4 flex flex-col justify-between h-36 transition-all duration-200 cursor-pointer select-none ${
          isDragging ? 'opacity-40 scale-95 border-dashed border-lavender-400' : ''
        } ${
          isDragOver
            ? 'border-lavender-500 bg-lavender-50/80 dark:bg-[#352E58]/40 shadow-md ring-2 ring-lavender-300 scale-[1.02]'
            : 'border-[#ECEEF3] dark:border-[#3A3948] hover:border-lavender-300 dark:hover:border-[#A995F5] hover:shadow-soft-hover'
        }`}
      >
        {/* Drop target badge when hovering */}
        {isDragOver && (
          <div className="absolute inset-x-0 -top-3 flex justify-center pointer-events-none z-10 animate-in fade-in">
            <span className="bg-lavender-600 dark:bg-[#A995F5] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
              <CornerDownRight className="w-3 h-3" />
              <span>이 폴더로 이동</span>
            </span>
          </div>
        )}

        {/* Top row: Folder Icon + More Menu */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-10 rounded-xl bg-lavender-100/90 dark:bg-[#352E58] text-lavender-600 dark:text-[#B7A5FF] flex items-center justify-center transition-transform group-hover:scale-105">
            <FolderIcon className="w-6 h-6 fill-lavender-400/30 dark:fill-[#554884] text-lavender-600 dark:text-[#B7A5FF]" />
          </div>

          <button
            onClick={handleOpenMenu}
            className="p-1 rounded-lg text-slate-400 dark:text-[#A5A3B5] hover:text-slate-700 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#1E1E27] transition-colors"
            title="폴더 옵션"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom info / Inline rename */}
        <div className="flex flex-col" onClick={(e) => isRenaming && e.stopPropagation()}>
          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} className="flex items-center gap-1">
              <input
                type="text"
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="text-xs font-semibold px-2 py-0.5 rounded border border-lavender-400 focus:outline-none bg-white dark:bg-[#1E1E27] text-slate-800 dark:text-[#E8E7EF] w-full"
              />
              <button
                type="submit"
                className="p-1 text-lavender-600 dark:text-[#A995F5] hover:bg-lavender-50 dark:hover:bg-[#352E58] rounded"
              >
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
            <>
              <h3 className="font-semibold text-slate-800 dark:text-[#E8E7EF] text-[14.5px] truncate group-hover:text-lavender-700 dark:group-hover:text-[#B7A5FF] transition-colors">
                {folder.name}
              </h3>
              <span className="text-xs text-slate-400 dark:text-[#A5A3B5] mt-0.5">
                {totalItems}개 항목
              </span>
            </>
          )}
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
              <span>폴더 삭제</span>
            </button>
          </div>
        </>
      )}
    </>
  );
};
