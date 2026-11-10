import React, { useState } from 'react';
import { Folder as FolderIcon, MoreHorizontal, Edit2, Trash2, Check, X, CornerDownRight } from 'lucide-react';
import { Folder } from '../../types';
import { useWorkspace } from '../../store/WorkspaceContext';

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
    setSortOption,
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
    if (nameInput.trim()) {
      await renameFolder(folder.id, nameInput.trim());
    }
    setIsRenaming(false);
  };

  const handleDelete = async () => {
    setMenuPos(null);
    if (
      window.confirm(
        `'${folder.name}' 폴더를 삭제하시겠습니까?\n내부에 포함된 모든 하위 폴더와 문서도 함께 삭제됩니다.`
      )
    ) {
      await deleteFolder(folder.id);
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
      } else if (data.type === 'folder') {
        if (data.id === folder.id) return;

        // Try moving folder into this folder
        const res = await moveItem('folder', data.id, folder.id);
        if (!res.success) {
          // If cannot move inside (e.g. self or descendant), reorder them instead
          if (sortOption !== 'custom') {
            setSortOption('custom');
          }
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
        className={`group relative bg-white border rounded-2xl p-4 flex flex-col justify-between h-36 transition-all duration-200 cursor-pointer select-none ${
          isDragging ? 'opacity-40 scale-95 border-dashed border-lavender-400' : ''
        } ${
          isDragOver
            ? 'border-lavender-500 bg-lavender-50/80 shadow-md ring-2 ring-lavender-300 scale-[1.02]'
            : 'border-[#ECEEF3] hover:border-lavender-300 hover:shadow-soft-hover'
        }`}
      >
        {/* Drop target badge when hovering */}
        {isDragOver && (
          <div className="absolute inset-x-0 -top-3 flex justify-center pointer-events-none z-10 animate-in fade-in">
            <span className="bg-lavender-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1">
              <CornerDownRight className="w-3 h-3" />
              <span>이 폴더로 이동</span>
            </span>
          </div>
        )}

        {/* Top row: Folder Icon + More Menu */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-10 rounded-xl bg-lavender-100/90 text-lavender-600 flex items-center justify-center transition-transform group-hover:scale-105">
            <FolderIcon className="w-6 h-6 fill-lavender-400/30 text-lavender-600" />
          </div>

          <button
            onClick={handleOpenMenu}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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
                className="text-xs font-semibold px-2 py-0.5 rounded border border-lavender-400 focus:outline-none !bg-white w-full"
              />
              <button
                type="submit"
                className="p-1 text-lavender-600 hover:bg-lavender-50 rounded"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setIsRenaming(false)}
                className="p-1 text-slate-400 hover:bg-slate-100 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <>
              <h3 className="font-semibold text-slate-800 text-[14.5px] truncate group-hover:text-lavender-700 transition-colors">
                {folder.name}
              </h3>
              <span className="text-xs text-slate-400 mt-0.5">
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
            className="fixed z-50 bg-white border border-[#ECEEF3] rounded-xl shadow-modal p-1 w-32 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              onClick={() => {
                setMenuPos(null);
                setIsRenaming(true);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-lavender-50 hover:text-lavender-700 transition-colors text-left"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
              <span>이름 변경</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
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
