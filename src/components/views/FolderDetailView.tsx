import React, { useState } from 'react';
import { MoreHorizontal, Trash2, Edit2, Copy } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { TEMPLATES } from '../../templates/templateList';
import { useToast } from '../toast/ToastContext';
import { useLongPressSort } from '../../hooks/useLongPressSort';

export const FolderDetailView: React.FC = () => {
  const {
    activeProject,
    activeFolder,
    folderBreadcrumbs,
    currentFolders,
    currentDocuments,
    viewMode,
    setNavSection,
    openProject,
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

  const {
    pressingId,
    draggingId,
    hoverTargetId,
    hoverFolderCenterId,
    pointer,
    wasDraggedRef,
    startPress,
  } = useLongPressSort({
    onReorder: (fromId, toId) => {
      const isFromFolder = currentFolders.some((f) => f.id === fromId);
      const isToFolder = currentFolders.some((f) => f.id === toId);
      if (isFromFolder && isToFolder) reorderItems('folder', fromId, toId);
      else if (!isFromFolder && !isToFolder) reorderItems('document', fromId, toId);
    },
    onDropIntoFolder: (docId, folderId) => {
      const folder = currentFolders.find((f) => f.id === folderId);
      if (!folder) return;
      const prevParent = activeFolder?.id || null;
      moveDocumentToFolder(docId, folderId);
      showToast(`'${folder.name}' 폴더로 이동했습니다`, {
        onUndo: () => moveDocumentToFolder(docId, prevParent),
      });
    },
    onForbiddenDrop: () => {
      showToast('문서는 같은 프로젝트 안에서만 이동할 수 있습니다', { variant: 'error' });
    },
  });

  if (!activeProject || !activeFolder) return null;

  const hasItems = currentFolders.length > 0 || currentDocuments.length > 0;
  const draggingDoc = currentDocuments.find((d) => d.id === draggingId);
  const draggingFolder = currentFolders.find((f) => f.id === draggingId);

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-12 bg-white dark:bg-[#15151C] bs-animate-page">
      <div className="max-w-[1160px] mx-auto flex flex-col gap-5 pt-1">
        <nav className="flex items-center flex-wrap gap-1.5 text-[12px] text-[#8A8998] dark:text-[#7D7B8E]">
          <button
            type="button"
            onClick={() => setNavSection('main')}
            className="hover:text-[#1B1B1F] dark:hover:text-white"
          >
            메인
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => openProject(activeProject.id)}
            className="hover:text-[#1B1B1F] dark:hover:text-white"
          >
            {activeProject.name}
          </button>
          {folderBreadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <span>/</span>
              {idx === folderBreadcrumbs.length - 1 ? (
                <span className="text-[#4E4D59] dark:text-[#C5C3D4] font-medium">{crumb.name}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => openFolder(crumb.id)}
                  className="hover:text-[#1B1B1F] dark:hover:text-white"
                >
                  {crumb.name}
                </button>
              )}
            </React.Fragment>
          ))}
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#F5E6C4] dark:bg-[#3A3022] text-[#8E6A26] dark:text-[#E5C17B] flex items-center justify-center text-xs font-bold shrink-0">
              폴더
            </div>
            <div>
              <h1 className="text-[22px] font-bold tracking-tight text-[#1B1B1F] dark:text-[#F1F0F6]">
                {activeFolder.name}
              </h1>
              <p className="text-[12.5px] text-[#8A8998] dark:text-[#8E8C9F]">
                {activeFolder.description || '폴더 설명'}
              </p>
            </div>
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
            이 폴더가 비어 있습니다. 하위 폴더나 문서를 추가해 보세요.
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {currentFolders.map((folder) => {
              const isDropCenter = hoverFolderCenterId === folder.id;
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
                  className={`bs-card-interactive group relative rounded-2xl border bg-white dark:bg-[#1E1E29] p-4 cursor-pointer flex flex-col gap-3 select-none ${
                    draggingId === folder.id
                      ? 'opacity-30 border-dashed border-[#6A5ACD]'
                      : isDropCenter
                        ? 'border-[#6A5ACD] ring-2 ring-[#6A5ACD]/30 scale-[1.03]'
                        : hoverTargetId === folder.id
                          ? 'border-[#6A5ACD]'
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
                      <input
                        type="text"
                        autoFocus
                        value={renaming.val}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setRenaming({ ...renaming, val: e.target.value })}
                        onBlur={() => {
                          if (renaming.val.trim()) updateFolder(folder.id, { name: renaming.val.trim() });
                          setRenaming(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        className="w-full px-2 py-0.5 rounded border border-[#6A5ACD] text-sm font-bold"
                      />
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
                  className={`bs-card-interactive group relative rounded-2xl border bg-white dark:bg-[#1E1E29] p-4 cursor-pointer flex flex-col gap-3 select-none ${
                    draggingId === doc.id
                      ? 'opacity-30 border-dashed border-[#6A5ACD]'
                      : hoverTargetId === doc.id
                        ? 'border-[#6A5ACD]'
                        : 'border-[#E6E3F0] dark:border-[#2E2D3D] hover:border-[#B6ACEA]'
                  } ${pressingId === doc.id ? 'scale-[0.98]' : ''}`}
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
                      <input
                        type="text"
                        autoFocus
                        value={renaming.val}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setRenaming({ ...renaming, val: e.target.value })}
                        onBlur={() => {
                          if (renaming.val.trim()) updateDocument(doc.id, { title: renaming.val.trim() });
                          setRenaming(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        className="w-full px-2 py-0.5 rounded border border-[#6A5ACD] text-sm font-bold"
                      />
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
                className="px-4 py-3 flex items-center justify-between hover:bg-[#FAF9FE] dark:hover:bg-[#242334] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F5E6C4] dark:bg-[#3A3022] text-[#8E6A26] dark:text-[#E5C17B]">
                    폴더
                  </span>
                  <span className="text-[13.5px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                    {folder.name}
                  </span>
                </div>
              </div>
            ))}
            {currentDocuments.map((doc) => {
              const tpl = TEMPLATES.find((t) => t.id === doc.templateType);
              return (
                <div
                  key={doc.id}
                  onClick={() => openDocument(doc.id)}
                  className="px-4 py-3 flex items-center justify-between hover:bg-[#FAF9FE] dark:hover:bg-[#242334] cursor-pointer"
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
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[11.5px] text-[#8A8998] dark:text-[#787689] pt-1">
          문서는 같은 프로젝트 안에서만 이동할 수 있습니다. 삭제하면 하위 구조와 함께 휴지통으로 이동합니다.
        </p>
      </div>

      {(draggingDoc || draggingFolder) && (
        <div
          style={{ left: pointer.x - 80, top: pointer.y - 26 }}
          className="fixed z-[100] pointer-events-none w-44 rounded-2xl border-2 border-[#6A5ACD] bg-white/95 dark:bg-[#1E1E29]/95 p-3 shadow-2xl scale-105 text-xs font-bold truncate"
        >
          {draggingDoc ? draggingDoc.title : draggingFolder?.name}
        </div>
      )}
    </div>
  );
};
