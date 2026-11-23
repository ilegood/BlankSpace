import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { EditorHeader } from '../EditorHeader';
import { DocumentLinkModal } from '../../modals/DocumentLinkModal';

interface UiMarker {
  id: string;
  num: number;
  name: string;
  desc: string;
  x: number;
  y: number;
  linkedDocId?: string;
  linkedDocTitle?: string;
}

interface UiPage {
  id: string;
  name: string;
  imageUrl?: string;
  markers: UiMarker[];
}

const DEFAULT_UI_PAGES: UiPage[] = [
  {
    id: 'up-1',
    name: '플레이 화면',
    markers: [
      { id: 'um-1', num: 1, name: '체력/스태미나', desc: '캐릭터 현재 상태 바', x: 18, y: 18 },
      { id: 'um-2', num: 2, name: '상단 알림', desc: '퀘스트/시간 안내', x: 48, y: 14 },
      {
        id: 'um-3',
        num: 3,
        name: '기능 이름',
        desc: '기능 설명',
        x: 78,
        y: 22,
        linkedDocId: 'doc-overview',
        linkedDocTitle: '관련 문서',
      },
      { id: 'um-4', num: 4, name: '미니맵', desc: '현재 구역 표시', x: 22, y: 54 },
      { id: 'um-5', num: 5, name: '상호작용 버튼', desc: 'NPC 대화 및 채집', x: 74, y: 55 },
      { id: 'um-6', num: 6, name: '퀵슬롯', desc: '단축키 1~6 아이템', x: 35, y: 80 },
      { id: 'um-7', num: 7, name: '시스템 메뉴', desc: '가방·도감·설정', x: 72, y: 80 },
    ],
  },
  { id: 'up-2', name: '인벤토리 화면', markers: [] },
  { id: 'up-3', name: '게임 오버 화면', markers: [] },
];

export const UiUxEditor: React.FC<{ templateOverrideId?: string | null }> = ({
  templateOverrideId,
}) => {
  const { activeDocument, activePage, openDocument, openTemplateEditor, updateDocument, updatePage } =
    useWorkspace();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [uiPages, setUiPages] = useState<UiPage[]>(DEFAULT_UI_PAGES);
  const [activeUiId, setActiveUiId] = useState('up-1');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [addingMode, setAddingMode] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [isDocLinkOpen, setIsDocLinkOpen] = useState(false);
  const [draggingMarkerPos, setDraggingMarkerPos] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMarkerId(null);
        setAddingMode(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (activePage?.content) {
      try {
        const parsed = JSON.parse(activePage.content);
        if (Array.isArray(parsed.uiPages)) {
          setUiPages(parsed.uiPages);
          return;
        }
      } catch {
        // ignore
      }
    }
    setUiPages(DEFAULT_UI_PAGES);
  }, [activePage?.id]);

  const persist = (next: UiPage[]) => {
    setUiPages(next);
    if (activePage) updatePage(activePage.id, { content: JSON.stringify({ uiPages: next }) });
  };

  const curPage = uiPages.find((p) => p.id === activeUiId) || uiPages[0];
  const selected = curPage?.markers.find((m) => m.id === selectedMarkerId) || null;

  const updateMarker = (id: string, patch: Partial<UiMarker>) => {
    persist(
      uiPages.map((pg) =>
        pg.id === curPage.id
          ? { ...pg, markers: pg.markers.map((m) => (m.id === id ? { ...m, ...patch } : m)) }
          : pg
      )
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#15151C]">
      <EditorHeader
        title={isTemplateMode ? 'UI/UX (템플릿)' : activeDocument?.title || 'UI/UX'}
        onTitleChange={(t) => activeDocument && updateDocument(activeDocument.id, { title: t })}
        templateType="game-ui-ux"
        isEditMode={isEditMode}
        onChangeMode={(edit) => {
          setIsEditMode(edit);
          setAddingMode(false);
        }}
        onExit={() => (isTemplateMode ? openTemplateEditor(null) : openDocument(null))}
        isTemplateMode={isTemplateMode}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <aside className="w-44 shrink-0 border-r border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-4 flex flex-col gap-1.5">
          <div className="px-2 pb-1 text-[11px] font-semibold text-[#8A8998]">페이지</div>
          {uiPages.map((pg) => (
            <button
              key={pg.id}
              type="button"
              onClick={() => {
                setActiveUiId(pg.id);
                setSelectedMarkerId(null);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                pg.id === curPage?.id
                  ? 'bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] font-semibold'
                  : 'text-[#4E4D59] dark:text-[#B4B2C4] hover:bg-black/5'
              }`}
            >
              {isEditMode && <span className="mr-1.5 text-[#9E9CAF]">⋮⋮</span>}
              {pg.name}
            </button>
          ))}
          {isEditMode && (
            <button
              type="button"
              onClick={() => {
                const name = window.prompt('새 화면 페이지 이름');
                if (!name?.trim()) return;
                const np: UiPage = { id: `up-${Date.now()}`, name: name.trim(), markers: [] };
                persist([...uiPages, np]);
                setActiveUiId(np.id);
              }}
              className="mt-1 px-3 py-2 text-left text-xs font-semibold text-[#6A5ACD] hover:underline"
            >
              + 페이지 추가
            </button>
          )}
        </aside>

        <div className="flex-1 overflow-auto p-6 bg-[#FAF9FE] dark:bg-[#15151C] flex flex-col items-center">
          <div className="w-full max-w-[700px] mb-3 flex items-center gap-2">
            {isEditMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setAddingMode((p) => !p)}
                  className="px-3.5 py-2 rounded-xl bg-[#6A5ACD] text-white text-xs font-semibold"
                >
                  {addingMode ? '이미지 위를 클릭하세요' : '+ 마커 추가'}
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs font-semibold"
                >
                  이미지 교체
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = () => {
                      if (typeof r.result === 'string') {
                        persist(
                          uiPages.map((pg) =>
                            pg.id === curPage.id ? { ...pg, imageUrl: r.result as string } : pg
                          )
                        );
                      }
                    };
                    r.readAsDataURL(f);
                  }}
                  className="hidden"
                />
              </>
            ) : (
              <span className="text-xs text-[#8A8998]">
                번호 마커를 누르면 그 UI의 기능 설명이 뜹니다.
              </span>
            )}
          </div>

          <div
            ref={boardRef}
            onClick={(e) => {
              if (!isEditMode || !addingMode) {
                setSelectedMarkerId(null);
                return;
              }
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
              const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
              const mk: UiMarker = {
                id: `um-${Date.now()}`,
                num: curPage.markers.length + 1,
                name: '기능 이름',
                desc: '기능 설명',
                x,
                y,
              };
              persist(
                uiPages.map((pg) =>
                  pg.id === curPage.id ? { ...pg, markers: [...pg.markers, mk] } : pg
                )
              );
              setSelectedMarkerId(mk.id);
              setAddingMode(false);
            }}
            className={`relative w-full max-w-[700px] h-[470px] rounded-2xl bg-[#E3E0F1] dark:bg-[#232236] border border-[#D4CFE6] dark:border-[#35334C] flex items-center justify-center overflow-hidden ${
              addingMode ? 'cursor-crosshair' : ''
            }`}
          >
            {curPage?.imageUrl ? (
              <img src={curPage.imageUrl} alt={curPage.name} className="bs-animate-fade w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-[#6E6D7A] dark:text-[#9E9CAF]">UI 화면 이미지</span>
            )}

            {curPage?.markers.map((mk) => {
              const rx = draggingMarkerPos?.id === mk.id ? draggingMarkerPos.x : mk.x;
              const ry = draggingMarkerPos?.id === mk.id ? draggingMarkerPos.y : mk.y;
              return (
                <button
                  key={mk.id}
                  type="button"
                  onMouseDown={(e) => {
                    if (!isEditMode || addingMode || e.button !== 0) return;
                    e.stopPropagation();
                    const box = boardRef.current;
                    if (!box) return;
                    const sx = e.clientX;
                    const sy = e.clientY;
                    let moved = false;
                    let fx = mk.x;
                    let fy = mk.y;

                    const onMove = (ev: MouseEvent) => {
                      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
                      moved = true;
                      const rect = box.getBoundingClientRect();
                      fx = Math.min(96, Math.max(4, Math.round(((ev.clientX - rect.left) / rect.width) * 100)));
                      fy = Math.min(96, Math.max(4, Math.round(((ev.clientY - rect.top) / rect.height) * 100)));
                      setDraggingMarkerPos({ id: mk.id, x: fx, y: fy });
                    };
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                      setDraggingMarkerPos(null);
                      if (moved) updateMarker(mk.id, { x: fx, y: fy });
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDescOpen(false);
                    setSelectedMarkerId(selectedMarkerId === mk.id ? null : mk.id);
                  }}
                  style={{ left: `${rx}%`, top: `${ry}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#6A5ACD] text-white text-[11px] font-bold flex items-center justify-center shadow transition-transform ${
                    isEditMode ? 'cursor-grab active:cursor-grabbing' : ''
                  } ${
                    selectedMarkerId === mk.id ? 'ring-4 ring-[#6A5ACD]/30 scale-110' : 'hover:scale-105'
                  }`}
                >
                  {mk.num}
                </button>
              );
            })}

            {/* View Mode Marker Popover matching PDF Page 35 (desc collapsed by default + auto flip) */}
            {!isEditMode && selected && (
              <div
                style={{
                  left: `${Math.min(72, Math.max(24, selected.x))}%`,
                  top: `${selected.y < 38 ? selected.y + 6 : selected.y - 6}%`,
                  transform: selected.y < 38 ? 'translate(-50%, 0%)' : 'translate(-50%, -100%)',
                }}
                onClick={(e) => e.stopPropagation()}
                className="bs-animate-popover absolute w-64 rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] shadow-2xl p-4 flex flex-col gap-2.5 z-30"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#6A5ACD] text-white text-[10px] font-bold flex items-center justify-center">
                      {selected.num}
                    </span>
                    <span className="text-xs font-bold">{selected.name}</span>
                  </div>
                  <button type="button" onClick={() => setSelectedMarkerId(null)}>
                    <X className="w-3.5 h-3.5 text-[#8A8998]" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setDescOpen((p) => !p)}
                  className="flex items-center justify-between text-xs text-[#6E6D7A] pt-1 border-t border-[#F0EEF7] dark:border-[#2A2938]"
                >
                  <span>기능 설명</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${descOpen ? '' : '-rotate-90'}`}
                  />
                </button>
                <div className="bs-collapse-grid" data-open={descOpen ? 'true' : 'false'}>
                  <div className="bs-collapse-inner">
                    <p className="text-xs text-[#555464] dark:text-[#B4B2C4] pt-0.5">
                      {selected.desc}
                    </p>
                  </div>
                </div>

                {selected.linkedDocId && (
                  <button
                    type="button"
                    onClick={() => openDocument(selected.linkedDocId!)}
                    className="text-left text-xs font-semibold text-[#6A5ACD] hover:underline"
                  >
                    문서 열기 ›
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Marker Inspector in Edit Mode matching PDF Page 31 */}
        {isEditMode && selected && (
          <aside className="w-[270px] shrink-0 border-l border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-5 flex flex-col gap-4 select-none text-xs">
            <div>
              <div className="text-sm font-bold">마커 수정</div>
              <div className="text-[11px] text-[#8A8998] mt-0.5">마커 {selected.num}</div>
            </div>

            <label className="flex items-center justify-between gap-2">
              <span>번호</span>
              <input
                type="number"
                value={selected.num}
                onChange={(e) => updateMarker(selected.id, { num: Number(e.target.value) })}
                className="w-24 h-8 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-right"
              />
            </label>

            <label className="flex items-center justify-between gap-2">
              <span>이름</span>
              <input
                type="text"
                value={selected.name}
                onChange={(e) => updateMarker(selected.id, { name: e.target.value })}
                className="w-36 h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244]"
              />
            </label>

            <textarea
              rows={3}
              value={selected.desc}
              onChange={(e) => updateMarker(selected.id, { desc: e.target.value })}
              className="p-2.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] resize-none"
            />

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-[#8A8998]">연결 문서</span>
              {selected.linkedDocId ? (
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8F7FC] dark:bg-[#262436]">
                  <span className="font-semibold truncate">{selected.linkedDocTitle}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateMarker(selected.id, {
                        linkedDocId: undefined,
                        linkedDocTitle: undefined,
                      })
                    }
                    className="text-rose-500"
                  >
                    해제
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDocLinkOpen(true)}
                  className="text-left text-[#6A5ACD] font-semibold hover:underline"
                >
                  + 문서 연결
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                persist(
                  uiPages.map((pg) =>
                    pg.id === curPage.id
                      ? { ...pg, markers: pg.markers.filter((m) => m.id !== selected.id) }
                      : pg
                  )
                );
                setSelectedMarkerId(null);
              }}
              className="self-start px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 font-semibold"
            >
              마커 삭제
            </button>
          </aside>
        )}
      </div>

      <DocumentLinkModal
        isOpen={isDocLinkOpen}
        onClose={() => setIsDocLinkOpen(false)}
        onSelect={(doc) => {
          if (selected) {
            updateMarker(selected.id, { linkedDocId: doc.id, linkedDocTitle: doc.title });
          }
        }}
      />
    </div>
  );
};
