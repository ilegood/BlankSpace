import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { formatShortDate } from '../../utils/time';
import { useToast } from '../toast/ToastContext';

interface TrashSelection {
  type: 'project' | 'folder' | 'document';
  id: string;
}

export const TrashView: React.FC = () => {
  const {
    trashedProjects,
    trashedFolders,
    trashedDocuments,
    activeProjects,
    projects,
    folders,
    restoreItems,
    permanentlyDeleteItems,
    emptyTrash,
    needsRestoreTarget,
  } = useWorkspace();
  const { showToast } = useToast();

  const [selected, setSelected] = useState<TrashSelection[]>([]);
  const [expandedFolderIds, setExpandedFolderIds] = useState<string[]>([]);
  const [confirmPermanentOpen, setConfirmPermanentOpen] = useState(false);
  const [confirmEmptyOpen, setConfirmEmptyOpen] = useState(false);
  const [restoreTargetItem, setRestoreTargetItem] = useState<TrashSelection | null>(null);
  const [chosenProjectId, setChosenProjectId] = useState<string>('');
  const [chosenFolderId, setChosenFolderId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConfirmPermanentOpen(false);
        setConfirmEmptyOpen(false);
        setRestoreTargetItem(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isSelected = (type: TrashSelection['type'], id: string) =>
    selected.some((s) => s.type === type && s.id === id);

  const toggleSelect = (type: TrashSelection['type'], id: string) => {
    setSelected((prev) =>
      prev.some((s) => s.type === type && s.id === id)
        ? prev.filter((s) => !(s.type === type && s.id === id))
        : [...prev, { type, id }]
    );
  };

  const trashedProjSet = new Set(trashedProjects.map((p) => p.id));
  const trashedFolderSet = new Set(trashedFolders.map((f) => f.id));

  const rootTrashedFolders = trashedFolders.filter(
    (f) => !trashedProjSet.has(f.projectId) && (!f.parentFolderId || !trashedFolderSet.has(f.parentFolderId))
  );
  const rootTrashedDocs = trashedDocuments.filter(
    (d) => !trashedProjSet.has(d.projectId) && (!d.folderId || !trashedFolderSet.has(d.folderId))
  );

  const totalCount = trashedProjects.length + rootTrashedFolders.length + rootTrashedDocs.length;

  const getOriginalLocation = (type: 'project' | 'folder' | 'document', id: string) => {
    if (type === 'project') return '—';
    if (type === 'folder') {
      const f = folders.find((item) => item.id === id);
      if (!f) return '원래 위치가 없습니다';
      const p = projects.find((pr) => pr.id === f.projectId && !pr.deletedAt);
      if (!p) return '원래 위치가 없습니다';
      const parent = f.parentFolderId
        ? folders.find((pf) => pf.id === f.parentFolderId && !pf.deletedAt)
        : null;
      if (f.parentFolderId && !parent) return '원래 위치가 없습니다';
      return parent ? `${p.name} / ${parent.name}` : p.name;
    }
    const d = trashedDocuments.find((doc) => doc.id === id);
    if (!d) return '원래 위치가 없습니다';
    const p = projects.find((pr) => pr.id === d.projectId && !pr.deletedAt);
    if (!p) return '원래 위치가 없습니다';
    const f = d.folderId ? folders.find((fl) => fl.id === d.folderId && !fl.deletedAt) : null;
    if (d.folderId && !f) return '원래 위치가 없습니다';
    return f ? `${p.name} / ${f.name}` : p.name;
  };

  const handleRestoreClick = (item: TrashSelection) => {
    if (item.type !== 'project' && needsRestoreTarget(item.type, item.id)) {
      setRestoreTargetItem(item);
      setChosenProjectId(activeProjects[0]?.id || '');
      setChosenFolderId(null);
      return;
    }
    restoreItems([item]);
    setSelected((prev) => prev.filter((s) => !(s.type === item.type && s.id === item.id)));
    showToast('원래 위치로 복원했습니다');
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-12 bg-white dark:bg-[#15151C] bs-animate-fade">
      <div className="max-w-[1160px] mx-auto flex flex-col gap-5 pt-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">휴지통</h1>
            <p className="mt-1 text-[13px] text-[#6E6D7A] dark:text-[#9E9CAF]">
              삭제한 항목은 복원하거나 영구 삭제할 때까지 보관됩니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={() => selected.forEach((item) => handleRestoreClick(item))}
              className="h-9 px-3.5 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] text-xs font-semibold text-[#1B1B1F] dark:text-[#F1F0F6] disabled:opacity-40 transition-opacity"
            >
              선택 항목 복원
            </button>
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={() => setConfirmPermanentOpen(true)}
              className="h-9 px-3.5 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] text-xs font-semibold text-[#1B1B1F] dark:text-[#F1F0F6] disabled:opacity-40 transition-opacity"
            >
              선택 항목 영구 삭제
            </button>
            <button
              type="button"
              disabled={totalCount === 0}
              onClick={() => setConfirmEmptyOpen(true)}
              className="h-9 px-3.5 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-[#F5F4FA] dark:bg-[#242334] text-xs font-semibold text-[#4E4D59] dark:text-[#B4B2C4] disabled:opacity-40 transition-opacity"
            >
              휴지통 비우기
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] overflow-hidden">
          <div className="grid grid-cols-[28px_1.6fr_1.2fr_0.7fr_90px] px-5 py-3 border-b border-[#F0EEF7] dark:border-[#2A2938] text-[11.5px] font-semibold text-[#8A8998] items-center">
            <span></span>
            <span>이름</span>
            <span>원래 위치</span>
            <span>삭제 날짜</span>
            <span className="text-right"></span>
          </div>

          {totalCount === 0 ? (
            <div className="py-16 text-center text-xs text-[#8A8998]">휴지통이 비어 있습니다.</div>
          ) : (
            <div className="divide-y divide-[#F0EEF7] dark:divide-[#2A2938]">
              {trashedProjects.map((proj) => {
                const sel = isSelected('project', proj.id);
                return (
                  <div
                    key={proj.id}
                    onClick={() => toggleSelect('project', proj.id)}
                    className={`grid grid-cols-[28px_1.6fr_1.2fr_0.7fr_90px] items-center px-5 py-3.5 cursor-pointer transition-colors ${
                      sel
                        ? 'bg-[#F8F7FC] dark:bg-[#262436] border-l-2 border-l-[#6A5ACD]'
                        : 'hover:bg-[#FAF9FE] dark:hover:bg-[#242334]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={sel}
                      onChange={() => {}}
                      className="accent-[#6A5ACD] w-3.5 h-3.5 rounded"
                    />
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6] shrink-0">
                        프로
                      </span>
                      <span className="text-[13px] font-semibold text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
                        {proj.name}
                      </span>
                    </div>
                    <span className="text-xs text-[#8A8998]">—</span>
                    <span className="text-xs text-[#8A8998]">
                      {proj.deletedAt ? formatShortDate(proj.deletedAt) : '—'}
                    </span>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreClick({ type: 'project', id: proj.id });
                        }}
                        className="px-3 py-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-medium text-[#1B1B1F] dark:text-[#F1F0F6] hover:border-[#6A5ACD]"
                      >
                        복원
                      </button>
                    </div>
                  </div>
                );
              })}

              {rootTrashedFolders.map((folder) => {
                const sel = isSelected('folder', folder.id);
                const isExpanded = expandedFolderIds.includes(folder.id);
                const childFolders = trashedFolders.filter((f) => f.parentFolderId === folder.id);
                const childDocs = trashedDocuments.filter((d) => d.folderId === folder.id);
                const hasChildren = childFolders.length > 0 || childDocs.length > 0;
                const missingTarget = needsRestoreTarget('folder', folder.id);

                return (
                  <React.Fragment key={folder.id}>
                    <div
                      onClick={() => toggleSelect('folder', folder.id)}
                      className={`grid grid-cols-[28px_1.6fr_1.2fr_0.7fr_90px] items-center px-5 py-3.5 cursor-pointer transition-colors ${
                        sel
                          ? 'bg-[#F8F7FC] dark:bg-[#262436] border-l-2 border-l-[#6A5ACD]'
                          : 'hover:bg-[#FAF9FE] dark:hover:bg-[#242334]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => {}}
                        className="accent-[#6A5ACD] w-3.5 h-3.5 rounded"
                      />
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F5E6C4] dark:bg-[#3A3022] text-[#8E6A26] dark:text-[#E5C17B] shrink-0">
                          폴더
                        </span>
                        {hasChildren && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedFolderIds((prev) =>
                                prev.includes(folder.id)
                                  ? prev.filter((id) => id !== folder.id)
                                  : [...prev, folder.id]
                              );
                            }}
                            className="text-[#8A8998]"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        <span className="text-[13px] font-semibold text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
                          {folder.name}
                        </span>
                        {missingTarget && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EBE8F5] text-[#6A5ACD]">
                            위치 지정 필요
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#6E6D7A] dark:text-[#9E9CAF] truncate">
                        {getOriginalLocation('folder', folder.id)}
                      </span>
                      <span className="text-xs text-[#8A8998]">
                        {folder.deletedAt ? formatShortDate(folder.deletedAt) : '—'}
                      </span>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreClick({ type: 'folder', id: folder.id });
                          }}
                          className="px-3 py-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-medium text-[#1B1B1F] dark:text-[#F1F0F6] hover:border-[#6A5ACD]"
                        >
                          복원
                        </button>
                      </div>
                    </div>

                    {isExpanded &&
                      childFolders.map((cf) => (
                        <div
                          key={cf.id}
                          className="bs-animate-fade grid grid-cols-[28px_1.6fr_1.2fr_0.7fr_90px] items-center px-5 py-3 pl-12 bg-[#FCFCFF] dark:bg-[#191923]"
                        >
                          <span />
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F5E6C4] dark:bg-[#3A3022] text-[#8E6A26] dark:text-[#E5C17B]">
                              폴더
                            </span>
                            <span className="text-xs font-medium text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
                              {cf.name}
                            </span>
                          </div>
                          <span className="text-xs text-[#8A8998]">{folder.name} 안</span>
                          <span className="text-xs text-[#8A8998]"></span>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRestoreClick({ type: 'folder', id: cf.id })}
                              className="px-3 py-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-medium"
                            >
                              복원
                            </button>
                          </div>
                        </div>
                      ))}

                    {isExpanded &&
                      childDocs.map((cd) => (
                        <div
                          key={cd.id}
                          className="bs-animate-fade grid grid-cols-[28px_1.6fr_1.2fr_0.7fr_90px] items-center px-5 py-3 pl-12 bg-[#FCFCFF] dark:bg-[#191923]"
                        >
                          <span />
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6]">
                              문서
                            </span>
                            <span className="text-xs font-medium text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
                              {cd.title}
                            </span>
                          </div>
                          <span className="text-xs text-[#8A8998]">{folder.name} 안</span>
                          <span className="text-xs text-[#8A8998]"></span>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleRestoreClick({ type: 'document', id: cd.id })}
                              className="px-3 py-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-medium"
                            >
                              복원
                            </button>
                          </div>
                        </div>
                      ))}
                  </React.Fragment>
                );
              })}

              {rootTrashedDocs.map((doc) => {
                const sel = isSelected('document', doc.id);
                const missingTarget = needsRestoreTarget('document', doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleSelect('document', doc.id)}
                    className={`grid grid-cols-[28px_1.6fr_1.2fr_0.7fr_90px] items-center px-5 py-3.5 cursor-pointer transition-colors ${
                      sel
                        ? 'bg-[#F8F7FC] dark:bg-[#262436] border-l-2 border-l-[#6A5ACD]'
                        : 'hover:bg-[#FAF9FE] dark:hover:bg-[#242334]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={sel}
                      onChange={() => {}}
                      className="accent-[#6A5ACD] w-3.5 h-3.5 rounded"
                    />
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6] shrink-0">
                        문서
                      </span>
                      <span className="text-[13px] font-semibold text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
                        {doc.title}
                      </span>
                      {missingTarget && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#EBE8F5] text-[#6A5ACD] shrink-0">
                          위치 지정 필요
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#6E6D7A] dark:text-[#9E9CAF] truncate">
                      {getOriginalLocation('document', doc.id)}
                    </span>
                    <span className="text-xs text-[#8A8998]">
                      {doc.deletedAt ? formatShortDate(doc.deletedAt) : '—'}
                    </span>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreClick({ type: 'document', id: doc.id });
                        }}
                        className="px-3 py-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-xs font-medium text-[#1B1B1F] dark:text-[#F1F0F6] hover:border-[#6A5ACD]"
                      >
                        복원
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-[11.5px] text-[#8A8998]">
          폴더를 삭제하면 안에 있던 하위 폴더와 문서도 함께 보관되고, 복원하면 원래 구조로 돌아갑니다.
        </p>
      </div>

      {/* Restore Target Modal (§2-3 backdrop close) */}
      {restoreTargetItem && (
        <div
          onClick={() => setRestoreTargetItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bs-animate-modal w-full max-w-md rounded-2xl bg-white dark:bg-[#1E1E29] border border-[#E6E3F0] dark:border-[#2E2D3D] shadow-2xl p-6 flex flex-col gap-4"
          >
            <div>
              <h3 className="text-base font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                복원할 위치 선택
              </h3>
              <p className="mt-1 text-xs text-[#6E6D7A] dark:text-[#9E9CAF]">
                원래 위치가 없어서 다른 위치에 복원합니다.
              </p>
            </div>

            <div className="rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] max-h-60 overflow-y-auto p-1.5 flex flex-col gap-1">
              {activeProjects.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#8A8998]">
                  복원 가능한 활성 프로젝트가 없습니다.
                </div>
              ) : (
                activeProjects.map((proj) => {
                  const projFolders = folders.filter(
                    (f) => !f.deletedAt && f.projectId === proj.id
                  );
                  const isProjSel = chosenProjectId === proj.id && chosenFolderId === null;
                  return (
                    <div key={proj.id} className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setChosenProjectId(proj.id);
                          setChosenFolderId(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                          isProjSel
                            ? 'bg-[#EBE8F5] dark:bg-[#2C2845] text-[#1B1B1F] dark:text-white font-semibold'
                            : 'text-[#4E4D59] dark:text-[#B4B2C4] hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isProjSel ? 'border-[#6A5ACD] bg-[#6A5ACD]' : 'border-[#C5C2D4]'
                          }`}
                        >
                          {isProjSel && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span>{proj.name} (최상위)</span>
                      </button>

                      {projFolders.map((pf) => {
                        const isFolderSel = chosenProjectId === proj.id && chosenFolderId === pf.id;
                        return (
                          <button
                            key={pf.id}
                            type="button"
                            onClick={() => {
                              setChosenProjectId(proj.id);
                              setChosenFolderId(pf.id);
                            }}
                            className={`w-full text-left pl-7 pr-3 py-1.5 rounded-lg text-xs flex items-center gap-2 ${
                              isFolderSel
                                ? 'bg-[#EBE8F5] dark:bg-[#2C2845] text-[#1B1B1F] dark:text-white font-semibold'
                                : 'text-[#6E6D7A] dark:text-[#9E9CAF] hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isFolderSel ? 'border-[#6A5ACD] bg-[#6A5ACD]' : 'border-[#C5C2D4]'
                              }`}
                            >
                              {isFolderSel && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span>{pf.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRestoreTargetItem(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold"
              >
                취소
              </button>
              <button
                type="button"
                disabled={!chosenProjectId}
                onClick={() => {
                  restoreItems([restoreTargetItem], {
                    projectId: chosenProjectId,
                    folderId: chosenFolderId,
                  });
                  setRestoreTargetItem(null);
                  showToast('선택한 위치로 복원했습니다');
                }}
                className="px-4 py-2 rounded-xl bg-[#6A5ACD] hover:bg-[#5A49B8] disabled:opacity-40 text-white text-xs font-semibold"
              >
                여기에 복원
              </button>
            </div>
          </div>
        </div>
      )}

      {(confirmPermanentOpen || confirmEmptyOpen) && (
        <div
          onClick={() => {
            setConfirmPermanentOpen(false);
            setConfirmEmptyOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bs-animate-modal w-full max-w-sm rounded-2xl bg-white dark:bg-[#1E1E29] border border-[#E6E3F0] dark:border-[#2E2D3D] shadow-2xl p-6 flex flex-col gap-4"
          >
            <div>
              <h3 className="text-base font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                {confirmEmptyOpen ? '휴지통 비우기' : '영구 삭제'}
              </h3>
              <p className="mt-1.5 text-xs text-[#6E6D7A] dark:text-[#9E9CAF]">
                {confirmEmptyOpen
                  ? `휴지통의 ${totalCount}개 항목을 모두 영구 삭제합니다. 이 작업은 되돌릴 수 없습니다.`
                  : `선택한 ${selected.length}개 항목을 영구 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
              </p>
            </div>

            <div className="rounded-xl bg-[#F8F7FC] dark:bg-[#262436] p-3 text-xs text-[#555464] dark:text-[#B4B2C4] leading-relaxed">
              이 항목을 연결한 다른 문서의 링크에는 &quot;영구 삭제된 문서&quot;로 표시됩니다.
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmPermanentOpen(false);
                  setConfirmEmptyOpen(false);
                }}
                className="px-4 py-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmEmptyOpen) {
                    emptyTrash();
                    showToast('휴지통을 비웠습니다');
                  } else {
                    permanentlyDeleteItems(selected);
                    showToast(`${selected.length}개 항목을 영구 삭제했습니다`);
                  }
                  setSelected([]);
                  setConfirmPermanentOpen(false);
                  setConfirmEmptyOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-[#C93638] hover:bg-[#AE2C2E] text-white text-xs font-semibold"
              >
                영구 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
