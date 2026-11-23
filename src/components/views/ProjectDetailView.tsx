import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Trash2, Edit2, Copy, FolderInput } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { TEMPLATES } from '../../templates/templateList';
import { useToast } from '../toast/ToastContext';
import { useLongPressSort } from '../../hooks/useLongPressSort';

export const ProjectDetailView: React.FC = () => {
  const {
    activeProject,
    folders,
    currentFolders,
    currentDocuments,
    viewMode,
    setNavSection,
    openFolder,
    openDocument,
    setIsCreateFolderOpen,
    setIsCreateDocumentOpen,
    updateFolder,
    updateDocument,
    duplicateFolder,
    duplicateDocument,
    moveFolderToTrash,
    moveDocumentToTrash,
    moveDocumentToFolder,
    restoreItems,
    reorderItems,
  } = useWorkspace();
  const { showToast } = useToast();

  const [menuTarget, setMenuTarget] = useState<{ kind: 'folder' | 'document'; id: string } | null>(null);
  const [renaming, setRenaming] = useState<{ kind: 'folder' | 'document'; id: string; val: string } | null>(null);
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
          className="h-[118px] w-full rounded-2xl transition-all duration-300"
          style={{ backgroundColor: activeProject.coverColor || '#D9D5F3' }}
        />

        <div className="flex flex-wrap items-start justify-between gap-4 pt-1">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-[#1B1B1F] dark:text-[#F1F0F6]">
              {activeProject.name}
            </h1>
            <p className="mt-1 text-[13px] text-[#6E6D7A] dark:text-[#9E9CAF]">
              {activeProject.description || '프로젝트 설명을 여기에 표시합니다.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreateFolderOpen(true)}
              className="h-9 px-3.5 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] text-xs font-semibold text-[#1B1B1F] dark:text-[#F1F0F6] hover:border-[#B6ACEA] active:scale-[0.98] transition-all"
            >
              + 폴더
            </button>
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
                    if (wasDraggedRef.current || renaming?.id === folder.id) return;
                    openFolder(folder.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenuTarget({ kind: 'folder', id: folder.id });
                  }}
                  className={`bs-card-interactive group relative rounded-2xl border bg-white dark:bg-[#1E1E29] p-4 cursor-pointer flex flex-col gap-3 select-none ${
                    isDragging
                      ? 'opacity-30 border-dashed border-[#6A5ACD]'
                      : isDropCenter
                        ? 'border-[#6A5ACD] ring-2 ring-[#6A5ACD]/35 bg-[#F3F1FB] dark:bg-[#26233D]'
                        : isHover
                          ? 'border-[#6A5ACD] ring-2 ring-[#6A5ACD]/25'
                          : 'border-[#E6E3F0] dark:border-[#2E2D3D] hover:border-[#B6ACEA]'
                  } ${pressingId === folder.id ? 'scale-[0.98]' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F5E6C4] dark:bg-[#3A3022] text-[#8E6A26] dark:text-[#E5C17B]">
                      폴더
                    </span>
                    <div
                      className="relative opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
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
                                setRenaming({ kind: 'folder', id: folder.id, val: folder.name });
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-black/5"
                            >
                              <Edit2 className="w-3 h-3" /> 이름 변경
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
                  <div>
                    {renaming?.id === folder.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (renaming.val.trim()) updateFolder(folder.id, { name: renaming.val.trim() });
                          setRenaming(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          autoFocus
                          value={renaming.val}
                          onChange={(e) => setRenaming({ ...renaming, val: e.target.value })}
                          onBlur={() => {
                            if (renaming.val.trim()) updateFolder(folder.id, { name: renaming.val.trim() });
                            setRenaming(null);
                          }}
                          className="w-full px-2 py-0.5 rounded border border-[#6A5ACD] text-sm font-bold"
                        />
                      </form>
                    ) : (
                      <div className="text-[14px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
                        {folder.name}
                      </div>
                    )}
                    <div className="text-[11.5px] text-[#8A8998] mt-0.5">폴더</div>
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
                    if (wasDraggedRef.current || renaming?.id === doc.id) return;
                    openDocument(doc.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenuTarget({ kind: 'document', id: doc.id });
                  }}
                  className={`bs-card-interactive group relative rounded-2xl border bg-white dark:bg-[#1E1E29] p-4 cursor-pointer flex flex-col gap-3 select-none ${
                    isDragging
                      ? 'opacity-30 border-dashed border-[#6A5ACD]'
                      : isHover
                        ? 'border-[#6A5ACD]'
                        : 'border-[#E6E3F0] dark:border-[#2E2D3D] hover:border-[#B6ACEA]'
                  } ${pressingId === doc.id ? 'scale-[0.98]' : ''} ${isShaking ? 'bs-animate-shake' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6]">
                      문서
                    </span>
                    <div
                      className="relative opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
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
                                setRenaming({ kind: 'document', id: doc.id, val: doc.title });
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-black/5"
                            >
                              <Edit2 className="w-3 h-3" /> 이름 변경
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
                  <div>
                    {renaming?.id === doc.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (renaming.val.trim()) updateDocument(doc.id, { title: renaming.val.trim() });
                          setRenaming(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          autoFocus
                          value={renaming.val}
                          onChange={(e) => setRenaming({ ...renaming, val: e.target.value })}
                          onBlur={() => {
                            if (renaming.val.trim()) updateDocument(doc.id, { title: renaming.val.trim() });
                            setRenaming(null);
                          }}
                          className="w-full px-2 py-0.5 rounded border border-[#6A5ACD] text-sm font-bold"
                        />
                      </form>
                    ) : (
                      <div className="text-[14px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
                        {doc.title}
                      </div>
                    )}
                    <div className="text-[11.5px] text-[#8A8998] mt-0.5 truncate">
                      {tpl?.name || '문서'}
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
