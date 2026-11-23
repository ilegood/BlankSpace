import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Trash2, Edit2, Copy, FolderInput, Star } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { TEMPLATES } from '../../templates/templateList';
import { SortOption } from '../../types';
import { useToast } from '../toast/ToastContext';
import { useLongPressSort, runFlipForSortItems } from '../../hooks/useLongPressSort';
import { ModalShell } from '../modals/ModalShell';

const SORT_LABELS: Record<SortOption, string> = {
  custom: '직접 정렬',
  'updated-desc': '최근 수정순',
  'created-desc': '생성일순',
  'name-asc': '이름순',
};

export const ProjectDetailView: React.FC = () => {
  const {
    activeProject,
    folders,
    currentFolders,
    currentDocuments,
    viewMode,
    setViewMode,
    sortOption,
    setSortOption,
    setNavSection,
    openFolder,
    openDocument,
    setIsCreateFolderOpen,
    setIsCreateDocumentOpen,
    updateFolder,
    updateDocument,
    toggleFavoriteFolder,
    toggleFavoriteDocument,
    duplicateFolder,
    duplicateDocument,
    moveFolderToTrash,
    moveDocumentToTrash,
    moveDocumentToFolder,
    restoreItems,
    reorderItems,
  } = useWorkspace();
  const { showToast } = useToast();

  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState<{ kind: 'folder' | 'document'; id: string } | null>(null);
  const [editingItem, setEditingItem] = useState<{
    kind: 'folder' | 'document';
    id: string;
    name: string;
    desc: string;
    coverImage?: string;
  } | null>(null);
  const [moveDocId, setMoveDocId] = useState<string | null>(null);

  const {
    pressingId,
    draggingId,
    hoverTargetId,
    hoverFolderCenterId,
    forbiddenShakeId,
    pointer,
    wasDraggedRef,
    startPress,
  } = useLongPressSort({
    onReorder: (fromId, toId) => {
      const isFromFolder = currentFolders.some((f) => f.id === fromId);
      const isToFolder = currentFolders.some((f) => f.id === toId);
      if (isFromFolder && isToFolder) {
        reorderItems('folder', fromId, toId);
      } else if (!isFromFolder && !isToFolder) {
        reorderItems('document', fromId, toId);
      }
    },
    onDropIntoFolder: (docId, folderId) => {
      const folder = currentFolders.find((f) => f.id === folderId);
      const doc = currentDocuments.find((d) => d.id === docId);
      if (!folder || !doc) return;
      moveDocumentToFolder(docId, folderId);
      showToast(`'${folder.name}' 폴더로 이동했습니다`, {
        onUndo: () => moveDocumentToFolder(docId, null),
      });
    },
    onForbiddenDrop: () => {
      showToast('문서는 같은 프로젝트 안에서만 이동할 수 있습니다', { variant: 'error' });
    },
  });

  if (!activeProject) return null;

  const hasItems = currentFolders.length > 0 || currentDocuments.length > 0;
  const projectFolders = folders.filter((f) => !f.deletedAt && f.projectId === activeProject.id);

  const draggingDoc = currentDocuments.find((d) => d.id === draggingId);
  const draggingFolder = currentFolders.find((f) => f.id === draggingId);

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-12 bg-white dark:bg-[#15151C] bs-animate-page">
      <div className="max-w-[1160px] mx-auto flex flex-col gap-5 pt-1">
        <nav className="flex items-center gap-1.5 text-[12px] text-[#8A8998] dark:text-[#7D7B8E]">
          <button
            type="button"
            onClick={() => setNavSection('main')}
            className="hover:text-[#1B1B1F] dark:hover:text-white transition-colors"
          >
            메인
          </button>
          <span>/</span>
          <span className="text-[#4E4D59] dark:text-[#C5C3D4] font-medium">
            {activeProject.name}
          </span>
        </nav>

        <div
          className="h-[118px] w-full rounded-2xl transition-all duration-300 overflow-hidden relative"
          style={{ backgroundColor: activeProject.coverColor || '#D9D5F3' }}
        >
          {activeProject.coverImage && (
            <img
              src={activeProject.coverImage}
              alt={activeProject.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4 pt-1">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-[#1B1B1F] dark:text-[#F1F0F6]">
              {activeProject.name}
            </h1>
            {activeProject.description && (
              <p className="mt-1 text-[13px] text-[#6E6D7A] dark:text-[#9E9CAF]">
                {activeProject.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* 1. 정렬 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSortMenuOpen((p) => !p)}
                className="h-9 px-3.5 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] text-xs font-medium text-[#1B1B1F] dark:text-[#F1F0F6] hover:border-[#C5BEE8] transition-colors"
              >
                정렬: {SORT_LABELS[sortOption]}
              </button>
              {sortMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setSortMenuOpen(false)} />
                  <div className="bs-animate-popover absolute right-0 mt-1.5 w-40 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] shadow-lg p-1 z-30">
                    {(['custom', 'updated-desc', 'created-desc', 'name-asc'] as SortOption[]).map(
                      (opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setSortOption(opt);
                            setSortMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            sortOption === opt
                              ? 'bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6] font-semibold'
                              : 'text-[#4E4D59] dark:text-[#B4B2C4] hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          {SORT_LABELS[opt]}
                        </button>
                      )
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 2. 카드/목록 */}
            <div className="relative inline-grid grid-cols-2 items-center rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] p-0.5 shrink-0 h-9">
              <span
                aria-hidden="true"
                style={{
                  transform: viewMode === 'grid' ? 'translateX(0%)' : 'translateX(100%)',
                }}
                className="pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-[10px] bg-[#1B1B1F] dark:bg-[#F1F0F6] transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)]"
              />
              <button
                type="button"
                onClick={() => {
                  if (viewMode === 'grid') return;
                  runFlipForSortItems(240, () => setViewMode('grid'));
                }}
                className={`relative z-10 px-3 py-1 rounded-[10px] text-xs font-semibold transition-colors ${
                  viewMode === 'grid' ? 'text-white dark:text-[#15151C]' : 'text-[#6E6D7A]'
                }`}
              >
                카드
              </button>
              <button
                type="button"
                onClick={() => {
                  if (viewMode === 'list') return;
                  runFlipForSortItems(240, () => setViewMode('list'));
                }}
                className={`relative z-10 px-3 py-1 rounded-[10px] text-xs font-semibold transition-colors ${
                  viewMode === 'list' ? 'text-white dark:text-[#15151C]' : 'text-[#6E6D7A]'
                }`}
              >
                목록
              </button>
            </div>

            {/* 3. + 폴더 */}
            <button
              type="button"
              onClick={() => setIsCreateFolderOpen(true)}
              className="h-9 px-3.5 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] text-xs font-semibold text-[#1B1B1F] dark:text-[#F1F0F6] hover:border-[#B6ACEA] active:scale-[0.98] transition-all"
            >
              + 폴더
            </button>

            {/* 4. + 문서 */}
            <button
              type="button"
              onClick={() => setIsCreateDocumentOpen(true)}
              className="h-9 px-4 rounded-xl bg-[#6A5ACD] hover:bg-[#5A49B8] active:scale-[0.98] text-white text-xs font-semibold transition-all"
            >
              + 문서
            </button>
          </div>
        </div>

        {!hasItems ? (
          <div className="rounded-2xl border border-dashed border-[#E6E3F0] dark:border-[#2E2D3D] py-14 text-center text-xs text-[#8A8998]">
            폴더나 문서를 추가하여 프로젝트를 구성해 보세요.
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {currentFolders.map((folder) => {
              const isDropCenter = hoverFolderCenterId === folder.id;
              const isHover = hoverTargetId === folder.id;
              const isDragging = draggingId === folder.id;

              return (
                <div
                  key={folder.id}
                  data-sort-id={folder.id}
                  data-sort-kind="folder"
                  onMouseDown={(e) => startPress(e, folder.id, 'folder')}
                  onClick={() => {
                    if (wasDraggedRef.current) return;
                    openFolder(folder.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenuTarget({ kind: 'folder', id: folder.id });
                  }}
                  className={`bs-card-interactive group relative rounded-2xl border bg-white dark:bg-[#1E1E29] overflow-hidden cursor-pointer flex flex-col select-none ${
                    isDragging
                      ? 'opacity-30 border-dashed border-[#6A5ACD]'
                      : isDropCenter
                        ? 'border-[#6A5ACD] ring-2 ring-[#6A5ACD]/35 bg-[#F3F1FB] dark:bg-[#26233D]'
                        : isHover
                          ? 'border-[#6A5ACD] ring-2 ring-[#6A5ACD]/25'
                          : 'border-[#E6E3F0] dark:border-[#2E2D3D] hover:border-[#B6ACEA]'
                  } ${pressingId === folder.id ? 'scale-[0.98]' : ''}`}
                >
                  {folder.coverImage && (
                    <div className="h-20 w-full overflow-hidden">
                      <img
                        src={folder.coverImage}
                        alt={folder.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                    <div className="flex items-start justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F5E6C4] dark:bg-[#3A3022] text-[#8E6A26] dark:text-[#E5C17B]">
                        폴더
                      </span>
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => toggleFavoriteFolder(folder.id)}
                          className={`p-1 rounded-md transition-opacity ${
                            folder.isFavorite
                              ? 'opacity-100 text-[#6A5ACD]'
                              : 'opacity-0 group-hover:opacity-100 text-[#8A8998]'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${folder.isFavorite ? 'fill-[#6A5ACD]' : ''}`} />
                        </button>
                        <div
                          className={`relative transition-opacity ${
                            menuTarget?.kind === 'folder' && menuTarget.id === folder.id
                              ? 'opacity-100'
                              : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setMenuTarget((prev) =>
                                prev?.id === folder.id ? null : { kind: 'folder', id: folder.id }
                              )
                            }
                            className="p-1 rounded-md text-[#8A8998] hover:text-[#1B1B1F]"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>

                          {menuTarget?.kind === 'folder' && menuTarget.id === folder.id && (
                            <>
                              <div className="fixed inset-0 z-20" onClick={() => setMenuTarget(null)} />
                              <div className="bs-animate-popover absolute right-0 mt-1 w-32 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] shadow-lg p-1 z-30">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuTarget(null);
                                    setEditingItem({
                                      kind: 'folder',
                                      id: folder.id,
                                      name: folder.name,
                                      desc: folder.description || '',
                                      coverImage: folder.coverImage,
                                    });
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-black/5"
                                >
                                  <Edit2 className="w-3 h-3" /> 수정
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuTarget(null);
                                    const cloned = duplicateFolder(folder.id);
                                    if (cloned) showToast(`'${cloned.name}' 폴더로 복제했습니다`);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-black/5"
                                >
                                  <Copy className="w-3 h-3" /> 복제
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuTarget(null);
                                    const { descendantCount } = moveFolderToTrash(folder.id);
                                    showToast(
                                      descendantCount > 0
                                        ? `'${folder.name}' (하위 ${descendantCount}개 포함)을 휴지통으로 이동했습니다`
                                        : `'${folder.name}' 폴더를 휴지통으로 이동했습니다`,
                                      { onUndo: () => restoreItems([{ type: 'folder', id: folder.id }]) }
                                    );
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3 h-3" /> 삭제
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
                        {folder.name}
                      </div>
                      <div className="text-[11.5px] text-[#8A8998] mt-0.5 truncate min-h-[16px]">
                        {folder.description || ''}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {currentDocuments.map((doc) => {
              const tpl = TEMPLATES.find((t) => t.id === doc.templateType);
              const isDragging = draggingId === doc.id;
              const isHover = hoverTargetId === doc.id;
              const isShaking = forbiddenShakeId === doc.id;

              return (
                <div
                  key={doc.id}
                  data-sort-id={doc.id}
                  data-sort-kind="document"
                  onMouseDown={(e) => startPress(e, doc.id, 'document')}
                  onClick={() => {
                    if (wasDraggedRef.current) return;
                    openDocument(doc.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenuTarget({ kind: 'document', id: doc.id });
                  }}
                  className={`bs-card-interactive group relative rounded-2xl border bg-white dark:bg-[#1E1E29] overflow-hidden cursor-pointer flex flex-col select-none ${
                    isDragging
                      ? 'opacity-30 border-dashed border-[#6A5ACD]'
                      : isHover
                        ? 'border-[#6A5ACD]'
                        : 'border-[#E6E3F0] dark:border-[#2E2D3D] hover:border-[#B6ACEA]'
                  } ${pressingId === doc.id ? 'scale-[0.98]' : ''} ${isShaking ? 'bs-animate-shake' : ''}`}
                >
                  {doc.coverImage && (
                    <div className="h-20 w-full overflow-hidden">
                      <img
                        src={doc.coverImage}
                        alt={doc.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                    <div className="flex items-start justify-between">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6]">
                        문서
                      </span>
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => toggleFavoriteDocument(doc.id)}
                          className={`p-1 rounded-md transition-opacity ${
                            doc.isFavorite
                              ? 'opacity-100 text-[#6A5ACD]'
                              : 'opacity-0 group-hover:opacity-100 text-[#8A8998]'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${doc.isFavorite ? 'fill-[#6A5ACD]' : ''}`} />
                        </button>
                        <div
                          className={`relative transition-opacity ${
                            menuTarget?.kind === 'document' && menuTarget.id === doc.id
                              ? 'opacity-100'
                              : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setMenuTarget((prev) =>
                                prev?.id === doc.id ? null : { kind: 'document', id: doc.id }
                              )
                            }
                            className="p-1 rounded-md text-[#8A8998] hover:text-[#1B1B1F]"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>

                          {menuTarget?.kind === 'document' && menuTarget.id === doc.id && (
                            <>
                              <div className="fixed inset-0 z-20" onClick={() => setMenuTarget(null)} />
                              <div className="bs-animate-popover absolute right-0 mt-1 w-32 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] shadow-lg p-1 z-30">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuTarget(null);
                                    setEditingItem({
                                      kind: 'document',
                                      id: doc.id,
                                      name: doc.title,
                                      desc: doc.description || '',
                                      coverImage: doc.coverImage,
                                    });
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-black/5"
                                >
                                  <Edit2 className="w-3 h-3" /> 수정
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuTarget(null);
                                    const cloned = duplicateDocument(doc.id);
                                    if (cloned) showToast(`'${cloned.title}' 문서로 복제했습니다`);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-black/5"
                                >
                                  <Copy className="w-3 h-3" /> 복제
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuTarget(null);
                                    setMoveDocId(doc.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-black/5"
                                >
                                  <FolderInput className="w-3 h-3" /> 이동
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuTarget(null);
                                    moveDocumentToTrash(doc.id);
                                    showToast(`'${doc.title}' 문서를 휴지통으로 이동했습니다`, {
                                      onUndo: () => restoreItems([{ type: 'document', id: doc.id }]),
                                    });
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3 h-3" /> 삭제
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[14px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
                        {doc.title}
                      </div>
                      <div className="text-[11.5px] text-[#8A8998] mt-0.5 truncate">
                        {doc.description || tpl?.name || '문서'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] divide-y divide-[#F0EEF7] dark:divide-[#2A2938]">
            {currentFolders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => openFolder(folder.id)}
                className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-[#FAF9FE] dark:hover:bg-[#242334] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F5E6C4] dark:bg-[#3A3022] text-[#8E6A26] dark:text-[#E5C17B]">
                    폴더
                  </span>
                  <span className="text-[13.5px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                    {folder.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveFolderToTrash(folder.id);
                    showToast(`'${folder.name}' 폴더를 휴지통으로 이동했습니다`, {
                      onUndo: () => restoreItems([{ type: 'folder', id: folder.id }]),
                    });
                  }}
                  className="p-1 text-[#8A8998] hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {currentDocuments.map((doc) => {
              const tpl = TEMPLATES.find((t) => t.id === doc.templateType);
              return (
                <div
                  key={doc.id}
                  onClick={() => openDocument(doc.id)}
                  className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-[#FAF9FE] dark:hover:bg-[#242334] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6]">
                      문서
                    </span>
                    <span className="text-[13.5px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                      {doc.title}
                    </span>
                    <span className="text-xs text-[#8A8998]">{tpl?.name || '문서'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveDocumentToTrash(doc.id);
                      showToast(`'${doc.title}' 문서를 휴지통으로 이동했습니다`, {
                        onUndo: () => restoreItems([{ type: 'document', id: doc.id }]),
                      });
                    }}
                    className="p-1 text-[#8A8998] hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Folder / Document Modal (Name, Description, Banner) */}
      <ModalShell
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        maxWidthClass="max-w-md"
        className="p-6 flex flex-col gap-4"
      >
        {editingItem && (
          <>
            <h3 className="text-base font-bold">
              {editingItem.kind === 'folder' ? '폴더 수정' : '문서 수정'}
            </h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block font-semibold text-[#4E4D59] dark:text-[#B4B2C4] mb-1">
                  이름
                </label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#4E4D59] dark:text-[#B4B2C4] mb-1">
                  설명 (비워두면 표시 안 됨)
                </label>
                <input
                  type="text"
                  value={editingItem.desc}
                  onChange={(e) => setEditingItem({ ...editingItem, desc: e.target.value })}
                  placeholder="설명 입력"
                  className="w-full h-9 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#4E4D59] dark:text-[#B4B2C4] mb-1">
                  배너 이미지 (미설정 시 기본 디자인)
                </label>
                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] font-semibold text-[#6A5ACD] dark:text-[#9A8FE6] cursor-pointer hover:bg-[#F3F1FB] dark:hover:bg-[#2C2845]">
                    배너 이미지 업로드
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const r = new FileReader();
                        r.onload = () =>
                          typeof r.result === 'string' &&
                          setEditingItem({ ...editingItem, coverImage: r.result });
                        r.readAsDataURL(f);
                      }}
                      className="hidden"
                    />
                  </label>
                  {editingItem.coverImage && (
                    <button
                      type="button"
                      onClick={() => setEditingItem({ ...editingItem, coverImage: undefined })}
                      className="text-rose-500 hover:underline"
                    >
                      제거
                    </button>
                  )}
                </div>
                {editingItem.coverImage && (
                  <div className="mt-2 h-20 rounded-xl overflow-hidden border border-[#E6E3F0] dark:border-[#323244]">
                    <img
                      src={editingItem.coverImage}
                      alt="배너"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingItem.name.trim()) return;
                  if (editingItem.kind === 'folder') {
                    updateFolder(editingItem.id, {
                      name: editingItem.name.trim(),
                      description: editingItem.desc.trim(),
                      coverImage: editingItem.coverImage,
                    });
                  } else {
                    updateDocument(editingItem.id, {
                      title: editingItem.name.trim(),
                      description: editingItem.desc.trim(),
                      coverImage: editingItem.coverImage,
                    });
                  }
                  setEditingItem(null);
                  showToast('수정 사항을 저장했습니다');
                }}
                className="px-4 py-2 rounded-xl bg-[#6A5ACD] text-white text-xs font-semibold"
              >
                저장
              </button>
            </div>
          </>
        )}
      </ModalShell>

      {/* Same-project Move Document Modal */}
      {moveDocId && (
        <div
          onClick={() => setMoveDocId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bs-animate-modal w-full max-w-sm rounded-2xl bg-white dark:bg-[#1E1E29] border border-[#E6E3F0] dark:border-[#2E2D3D] p-5 flex flex-col gap-3 text-xs"
          >
            <div className="text-sm font-bold">폴더로 이동 ({activeProject.name})</div>
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
              {projectFolders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    moveDocumentToFolder(moveDocId, f.id);
                    showToast(`'${f.name}' 폴더로 이동했습니다`, {
                      onUndo: () => moveDocumentToFolder(moveDocId, null),
                    });
                    setMoveDocId(null);
                  }}
                  className="text-left px-3 py-2 rounded-xl hover:bg-[#F3F1FB] dark:hover:bg-[#2C2845] font-medium"
                >
                  📁 {f.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {(draggingDoc || draggingFolder) &&
        createPortal(
          <div
            style={{ left: pointer.x + 10, top: pointer.y + 10 }}
            className="fixed z-[9999] pointer-events-none w-44 rounded-2xl border-2 border-[#6A5ACD] bg-white/95 dark:bg-[#1E1E29]/95 px-3.5 py-2.5 shadow-2xl text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6] truncate"
          >
            {draggingDoc ? draggingDoc.title : draggingFolder?.name}
          </div>,
          document.body
        )}
    </div>
  );
};
