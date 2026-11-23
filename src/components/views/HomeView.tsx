import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Trash2, Edit2, Copy, Star, CheckSquare } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { Project, SortOption } from '../../types';
import { useToast } from '../toast/ToastContext';
import { useLongPressSort } from '../../hooks/useLongPressSort';
import { ModalShell } from '../modals/ModalShell';

const PASTEL_COLORS = ['#D9D5F3', '#F5D5C6', '#D2E9DC', '#DCE6FA', '#F2DCF0'];

const SORT_LABELS: Record<SortOption, string> = {
  custom: '직접 정렬',
  'updated-desc': '최근 수정순',
  'created-desc': '생성일순',
  'name-asc': '이름순',
};

export const HomeView: React.FC = () => {
  const {
    activeProjects,
    documents,
    recentDocumentIds,
    sortOption,
    setSortOption,
    setIsCreateProjectOpen,
    openProject,
    openDocument,
    updateProject,
    toggleFavoriteProject,
    duplicateProject,
    moveProjectToTrash,
    restoreItems,
    reorderProjects,
    getDocumentPath,
  } = useWorkspace();
  const { showToast } = useToast();

  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [openMenuProjId, setOpenMenuProjId] = useState<string | null>(null);
  const [editingProj, setEditingProj] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('#D9D5F3');
  const [editImage, setEditImage] = useState<string | undefined>(undefined);
  const [starPulseId, setStarPulseId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedProjIds, setSelectedProjIds] = useState<string[]>([]);

  const { pressingId, draggingId, hoverTargetId, pointer, wasDraggedRef, startPress } =
    useLongPressSort({
      onReorder: (fromId, toId) => {
        reorderProjects(fromId, toId);
        showToast('프로젝트 순서를 변경했습니다');
      },
    });

  const recentDocs = recentDocumentIds
    .map((id) => documents.find((d) => d.id === id && !d.deletedAt))
    .filter((d): d is NonNullable<typeof d> => Boolean(d))
    .slice(0, 4);

  const draggingProj = activeProjects.find((p) => p.id === draggingId);

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-12 bg-white dark:bg-[#15151C] bs-animate-fade">
      <div className="max-w-[1160px] mx-auto flex flex-col gap-8 pt-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-[#1B1B1F] dark:text-[#F1F0F6]">
              내 프로젝트
            </h1>
            <p className="mt-1 text-[13px] text-[#6E6D7A] dark:text-[#9E9CAF]">
              작업 중인 창작 프로젝트를 한곳에서 관리합니다.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
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

            <button
              type="button"
              onClick={() => {
                setSelectMode((p) => !p);
                setSelectedProjIds([]);
              }}
              className={`h-9 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                selectMode
                  ? 'border-[#6A5ACD] bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6]'
                  : 'border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] text-[#1B1B1F] dark:text-[#F1F0F6]'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{selectMode ? '선택 취소' : '선택'}</span>
            </button>

            {selectMode && selectedProjIds.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    selectedProjIds.forEach((id) => duplicateProject(id));
                    showToast(`${selectedProjIds.length}개 프로젝트를 복제했습니다`);
                    setSelectedProjIds([]);
                    setSelectMode(false);
                  }}
                  className="h-9 px-3.5 rounded-xl border border-[#6A5ACD] text-xs font-semibold text-[#6A5ACD] dark:text-[#9A8FE6] hover:bg-[#F3F1FB] dark:hover:bg-[#2C2845]"
                >
                  선택 복제 ({selectedProjIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const ids = [...selectedProjIds];
                    ids.forEach((id) => moveProjectToTrash(id));
                    showToast(`${ids.length}개 프로젝트를 삭제했습니다`, {
                      onUndo: () => restoreItems(ids.map((id) => ({ type: 'project', id }))),
                    });
                    setSelectedProjIds([]);
                    setSelectMode(false);
                  }}
                  className="h-9 px-3.5 rounded-xl border border-rose-200 dark:border-rose-800/60 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  선택 삭제 ({selectedProjIds.length})
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsCreateProjectOpen(true)}
              className="h-9 px-4 rounded-xl bg-[#6A5ACD] hover:bg-[#5A49B8] active:scale-[0.98] text-white text-xs font-semibold transition-all"
            >
              + 새 프로젝트
            </button>
          </div>
        </div>

        {/* 최근 작업 */}
        <section className="flex flex-col gap-2.5">
          <h2 className="text-[13.5px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">최근 작업</h2>
          {recentDocs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E6E3F0] dark:border-[#2E2D3D] py-6 text-center text-xs text-[#8A8998]">
              최근에 연 문서가 없습니다.
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] divide-y divide-[#F0EEF7] dark:divide-[#2A2938] overflow-hidden">
              {recentDocs.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => openDocument(doc.id)}
                  className="w-full px-4 py-3 flex items-center justify-between gap-4 hover:bg-[#FAF9FE] dark:hover:bg-[#242334] transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6] shrink-0">
                      문서
                    </span>
                    <span className="text-[13px] font-semibold text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
                      {doc.title}
                    </span>
                  </div>
                  <span className="text-[12px] text-[#8A8998] dark:text-[#7D7B8E] shrink-0">
                    {getDocumentPath(doc)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 모든 프로젝트 (길게 눌러 500ms 드래그 정렬 지원 §2-2) */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[13.5px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
              모든 프로젝트
            </h2>
            <span className="text-[11px] text-[#8A8998]">
              카드를 길게 눌러 순서를 바꿀 수 있습니다
            </span>
          </div>

          {activeProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E6E3F0] dark:border-[#2E2D3D] py-14 text-center flex flex-col items-center gap-3">
              <p className="text-sm text-[#6E6D7A] dark:text-[#9E9CAF]">
                등록된 프로젝트가 없습니다.
              </p>
              <button
                type="button"
                onClick={() => setIsCreateProjectOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#6A5ACD] text-white text-xs font-semibold"
              >
                + 새 프로젝트 만들기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeProjects.map((project, index) => {
                const isDragging = draggingId === project.id;
                const isPressing = pressingId === project.id;
                const isHover = hoverTargetId === project.id;
                const isSelected = selectedProjIds.includes(project.id);

                return (
                  <div
                    key={project.id}
                    data-sort-id={project.id}
                    data-sort-kind="project"
                    tabIndex={0}
                    onMouseDown={(e) => !selectMode && startPress(e, project.id, 'project')}
                    onKeyDown={(e) => {
                      if (e.altKey && e.key === 'ArrowLeft' && index > 0) {
                        e.preventDefault();
                        reorderProjects(project.id, activeProjects[index - 1].id);
                      } else if (
                        e.altKey &&
                        e.key === 'ArrowRight' &&
                        index < activeProjects.length - 1
                      ) {
                        e.preventDefault();
                        reorderProjects(project.id, activeProjects[index + 1].id);
                      } else if (e.key === 'Enter') {
                        openProject(project.id);
                      }
                    }}
                    onClick={() => {
                      if (wasDraggedRef.current) return;
                      if (selectMode) {
                        setSelectedProjIds((prev) =>
                          prev.includes(project.id)
                            ? prev.filter((id) => id !== project.id)
                            : [...prev, project.id]
                        );
                        return;
                      }
                      openProject(project.id);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setOpenMenuProjId(project.id);
                    }}
                    className={`bs-card-interactive group relative rounded-2xl border bg-white dark:bg-[#1E1E29] overflow-hidden cursor-pointer select-none ${
                      isDragging
                        ? 'opacity-30 border-dashed border-[#6A5ACD]'
                        : isSelected || isHover
                          ? 'border-[#6A5ACD] ring-2 ring-[#6A5ACD]/30'
                          : 'border-[#E6E3F0] dark:border-[#2E2D3D] hover:border-[#B6ACEA] dark:hover:border-[#5D51B5]'
                    } ${isPressing ? 'scale-[0.98]' : ''}`}
                  >
                    <div
                      className="h-[110px] w-full relative overflow-hidden"
                      style={{ backgroundColor: project.coverColor || '#D9D5F3' }}
                    >
                      {project.coverImage && (
                        <img
                          src={project.coverImage}
                          alt={project.name}
                          className="w-full h-full object-cover"
                        />
                      )}

                      {selectMode ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProjIds((prev) =>
                              prev.includes(project.id)
                                ? prev.filter((id) => id !== project.id)
                                : [...prev, project.id]
                            );
                          }}
                          className="absolute top-2.5 left-2.5 p-1.5 rounded-lg bg-white/90 dark:bg-[#1E1E29]/90"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="accent-[#6A5ACD]"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteProject(project.id);
                            setStarPulseId(project.id);
                            setTimeout(() => setStarPulseId(null), 260);
                          }}
                          className={`absolute top-2.5 left-2.5 p-1.5 rounded-lg bg-white/80 dark:bg-[#1E1E29]/80 transition-transform ${
                            starPulseId === project.id ? 'scale-125' : ''
                          } ${
                            project.isFavorite
                              ? 'opacity-100 text-[#6A5ACD]'
                              : 'opacity-0 group-hover:opacity-100 text-[#8A8998]'
                          }`}
                          title="즐겨찾기"
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${project.isFavorite ? 'fill-[#6A5ACD]' : ''}`}
                          />
                        </button>
                      )}

                      <div
                        className={`absolute top-2.5 right-2.5 transition-opacity ${
                          openMenuProjId === project.id
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuProjId((prev) => (prev === project.id ? null : project.id))
                          }
                          className="p-1.5 rounded-lg bg-white/85 dark:bg-[#1E1E29]/85 text-[#4E4D59] dark:text-[#F1F0F6] shadow-xs"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {openMenuProjId === project.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setOpenMenuProjId(null)}
                            />
                            <div className="bs-animate-popover absolute right-0 mt-1 w-36 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] shadow-lg p-1 z-30">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuProjId(null);
                                  setEditingProj(project);
                                  setEditName(project.name);
                                  setEditDesc(project.description || '');
                                  setEditColor(project.coverColor || '#D9D5F3');
                                  setEditImage(project.coverImage);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#1B1B1F] dark:text-[#F1F0F6] hover:bg-black/5 dark:hover:bg-white/5"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                프로젝트 수정
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuProjId(null);
                                  const cloned = duplicateProject(project.id);
                                  if (cloned) showToast(`'${cloned.name}' 프로젝트로 복제했습니다`);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#1B1B1F] dark:text-[#F1F0F6] hover:bg-black/5 dark:hover:bg-white/5"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                복제
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuProjId(null);
                                  moveProjectToTrash(project.id);
                                  showToast(`'${project.name}' 프로젝트를 휴지통으로 이동했습니다`, {
                                    onUndo: () => restoreItems([{ type: 'project', id: project.id }]),
                                  });
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                삭제
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="px-4 py-3.5">
                      <div className="text-[14px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
                        {project.name}
                      </div>
                      <div className="mt-1 text-[12px] text-[#8A8998] dark:text-[#8E8C9F] truncate min-h-[16px]">
                        {project.description || ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Edit Project Modal (Name, Description, Banner Color / Image) */}
      <ModalShell
        isOpen={Boolean(editingProj)}
        onClose={() => setEditingProj(null)}
        maxWidthClass="max-w-md"
        className="p-6 flex flex-col gap-4"
      >
        {editingProj && (
          <>
            <h3 className="text-base font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
              프로젝트 수정
            </h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="block font-semibold text-[#4E4D59] dark:text-[#B4B2C4] mb-1">
                  프로젝트 이름
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#4E4D59] dark:text-[#B4B2C4] mb-1">
                  프로젝트 설명
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="프로젝트 설명"
                  className="w-full h-9 px-3 rounded-xl border border-[#E6E3F0] dark:border-[#323244]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#4E4D59] dark:text-[#B4B2C4] mb-1.5">
                  배너 색상 및 이미지
                </label>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {PASTEL_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setEditColor(c);
                          setEditImage(undefined);
                        }}
                        className={`w-7 h-7 rounded-lg ${
                          editColor === c && !editImage ? 'ring-2 ring-[#6A5ACD]' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <label className="px-3 py-1.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] font-semibold text-[#6A5ACD] dark:text-[#9A8FE6] cursor-pointer hover:bg-[#F3F1FB] dark:hover:bg-[#2C2845]">
                    배너 이미지 업로드
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const r = new FileReader();
                        r.onload = () => typeof r.result === 'string' && setEditImage(r.result);
                        r.readAsDataURL(f);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                {editImage && (
                  <div className="mt-2 relative h-20 rounded-xl overflow-hidden border border-[#E6E3F0] dark:border-[#323244]">
                    <img src={editImage} alt="배너" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditImage(undefined)}
                      className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px]"
                    >
                      제거
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingProj(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editName.trim()) return;
                  updateProject(editingProj.id, {
                    name: editName.trim(),
                    description: editDesc.trim(),
                    coverColor: editColor,
                    coverImage: editImage,
                  });
                  setEditingProj(null);
                  showToast('프로젝트 정보를 수정했습니다');
                }}
                className="px-4 py-2 rounded-xl bg-[#6A5ACD] text-white text-xs font-semibold"
              >
                저장
              </button>
            </div>
          </>
        )}
      </ModalShell>

      {/* Floating Drag Ghost rendered via Portal so it follows cursor accurately (§2-2) */}
      {draggingProj &&
        createPortal(
          <div
            style={{ left: pointer.x + 10, top: pointer.y + 10 }}
            className="fixed z-[9999] pointer-events-none w-48 rounded-2xl border-2 border-[#6A5ACD] bg-white/95 dark:bg-[#1E1E29]/95 p-3 shadow-2xl"
          >
            <div
              className="h-7 rounded-lg mb-1.5"
              style={{ backgroundColor: draggingProj.coverColor || '#D9D5F3' }}
            />
            <div className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
              {draggingProj.name}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
