import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { EditorHeader } from '../EditorHeader';
import { DocumentLinkModal } from '../../modals/DocumentLinkModal';

interface MapMarker {
  id: string;
  name: string;
  x: number;
  y: number;
  linkedDocId?: string;
  linkedDocTitle?: string;
  description?: string;
  shape: 'dot' | 'pin' | 'star';
  size: 'small' | 'normal' | 'large';
}

interface MapPageItem {
  id: string;
  name: string;
  imageUrl?: string;
  markers: MapMarker[];
}

const DEFAULT_MAP_PAGES: MapPageItem[] = [
  {
    id: 'mp-1',
    name: '전체 지도',
    markers: [
      { id: 'mk-1', name: '지역 A', x: 32, y: 34, linkedDocId: 'doc-world-sheet', linkedDocTitle: '지역 A 문서', description: '북부 산악 지대', shape: 'dot', size: 'normal' },
      { id: 'mk-2', name: '지역 B', x: 64, y: 28, linkedDocId: 'doc-char-a', linkedDocTitle: '지역 B 문서', description: '수도 에르젠 왕국', shape: 'dot', size: 'normal' },
      { id: 'mk-3', name: '장소 C', x: 48, y: 66, description: '고대 유적지', shape: 'dot', size: 'normal' },
      { id: 'mk-4', name: '지역 D', x: 74, y: 74, linkedDocId: 'doc-world-sheet', linkedDocTitle: '남부 항구', description: '무역 중심지', shape: 'dot', size: 'normal' },
    ],
  },
  { id: 'mp-2', name: '구역 A', markers: [] },
  { id: 'mp-3', name: '구역 B', markers: [] },
];

export const WorldMapEditor: React.FC<{ templateOverrideId?: string | null }> = ({
  templateOverrideId,
}) => {
  const { activeDocument, activePage, openDocument, openTemplateEditor, updateDocument, updatePage } =
    useWorkspace();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [mapPages, setMapPages] = useState<MapPageItem[]>(DEFAULT_MAP_PAGES);
  const [activeMapId, setActiveMapId] = useState('mp-1');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [isDocLinkOpen, setIsDocLinkOpen] = useState(false);
  const [draggingMarkerPos, setDraggingMarkerPos] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const mapBoxRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMarkerId(null);
        setIsAddingMarker(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (activePage?.content) {
      try {
        const parsed = JSON.parse(activePage.content);
        if (Array.isArray(parsed.mapPages)) {
          setMapPages(parsed.mapPages);
          return;
        }
      } catch {
        // ignore
      }
    }
    setMapPages(DEFAULT_MAP_PAGES);
  }, [activePage?.id]);

  const persist = (next: MapPageItem[]) => {
    setMapPages(next);
    if (activePage) updatePage(activePage.id, { content: JSON.stringify({ mapPages: next }) });
  };

  const curMap = mapPages.find((m) => m.id === activeMapId) || mapPages[0];
  const selectedMarker = curMap?.markers.find((m) => m.id === selectedMarkerId) || null;

  const updateMarker = (markerId: string, patch: Partial<MapMarker>) => {
    persist(
      mapPages.map((mp) =>
        mp.id === curMap.id
          ? { ...mp, markers: mp.markers.map((mk) => (mk.id === markerId ? { ...mk, ...patch } : mk)) }
          : mp
      )
    );
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode || !isAddingMarker) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const mk: MapMarker = {
      id: `mk-${Date.now()}`,
      name: `새 장소 ${curMap.markers.length + 1}`,
      x,
      y,
      shape: 'dot',
      size: 'normal',
    };
    persist(
      mapPages.map((mp) =>
        mp.id === curMap.id ? { ...mp, markers: [...mp.markers, mk] } : mp
      )
    );
    setSelectedMarkerId(mk.id);
    setIsAddingMarker(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#15151C]">
      <EditorHeader
        title={isTemplateMode ? '지도 (템플릿)' : activeDocument?.title || '지도'}
        onTitleChange={(t) => activeDocument && updateDocument(activeDocument.id, { title: t })}
        templateType="world-map-factions"
        isEditMode={isEditMode}
        onChangeMode={(edit) => {
          setIsEditMode(edit);
          setIsAddingMarker(false);
        }}
        onExit={() => (isTemplateMode ? openTemplateEditor(null) : openDocument(null))}
        isTemplateMode={isTemplateMode}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Pages Sidebar matching PDF Pages 21 & 25 */}
        <aside className="w-44 shrink-0 border-r border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-4 flex flex-col gap-1.5">
          <div className="px-2 pb-1 text-[11px] font-semibold text-[#8A8998]">페이지</div>
          {mapPages.map((mp) => (
            <button
              key={mp.id}
              type="button"
              onClick={() => {
                setActiveMapId(mp.id);
                setSelectedMarkerId(null);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                mp.id === curMap?.id
                  ? 'bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6] font-semibold'
                  : 'text-[#4E4D59] dark:text-[#B4B2C4] hover:bg-black/5'
              }`}
            >
              {isEditMode && <span className="mr-1.5 text-[#9E9CAF]">⋮⋮</span>}
              {mp.name}
            </button>
          ))}
          {isEditMode && (
            <button
              type="button"
              onClick={() => {
                const name = window.prompt('새 지도 페이지 이름');
                if (!name?.trim()) return;
                const np: MapPageItem = { id: `mp-${Date.now()}`, name: name.trim(), markers: [] };
                persist([...mapPages, np]);
                setActiveMapId(np.id);
              }}
              className="mt-1 px-3 py-2 text-left text-xs font-semibold text-[#6A5ACD] hover:underline"
            >
              + 페이지 추가
            </button>
          )}
        </aside>

        {/* Map Canvas */}
        <div className="flex-1 relative overflow-auto bg-[#EBF1F6] dark:bg-[#181C24] p-6 flex flex-col items-center justify-center">
          <div className="w-full flex items-center justify-between mb-3">
            {isEditMode ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMarker((p) => !p)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold ${
                    isAddingMarker
                      ? 'bg-[#4E3FB5] text-white'
                      : 'bg-[#6A5ACD] hover:bg-[#5A49B8] text-white'
                  }`}
                >
                  {isAddingMarker ? '지도 위를 클릭하세요' : '+ 마커 추가'}
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs font-semibold"
                >
                  지도 이미지 교체
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
                          mapPages.map((mp) =>
                            mp.id === curMap.id ? { ...mp, imageUrl: r.result as string } : mp
                          )
                        );
                      }
                    };
                    r.readAsDataURL(f);
                  }}
                  className="hidden"
                />
              </div>
            ) : (
              <span className="text-xs text-[#6E6D7A] dark:text-[#9E9CAF]">
                마커를 누르면 이미지와 설명이 뜹니다. 설명은 접고 펼 수 있습니다.
              </span>
            )}
          </div>

          <div
            ref={mapBoxRef}
            onClick={(e) => {
              if (isEditMode && isAddingMarker) {
                handleCanvasClick(e);
              } else {
                setSelectedMarkerId(null);
              }
            }}
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
            className={`relative w-full max-w-[760px] h-[460px] rounded-2xl bg-[#DFE9DF] dark:bg-[#232D2B] border border-[#CFDAD0] dark:border-[#32403C] overflow-hidden ${
              isAddingMarker ? 'cursor-crosshair' : ''
            }`}
          >
            {curMap?.imageUrl ? (
              <img src={curMap.imageUrl} alt={curMap.name} className="bs-animate-fade w-full h-full object-cover" />
            ) : (
              <svg viewBox="0 0 800 500" className="w-full h-full opacity-60">
                <path
                  d="M120,160 C160,70 350,60 480,120 C620,170 720,250 670,350 C620,440 460,410 340,390 C220,370 90,280 120,160 Z"
                  fill="#C8DAC8"
                />
              </svg>
            )}

            {curMap?.markers.map((mk) => {
              const isLinked = Boolean(mk.linkedDocId);
              const isSelected = selectedMarkerId === mk.id;
              const renderX = draggingMarkerPos?.id === mk.id ? draggingMarkerPos.x : mk.x;
              const renderY = draggingMarkerPos?.id === mk.id ? draggingMarkerPos.y : mk.y;
              return (
                <div
                  key={mk.id}
                  style={{ left: `${renderX}%`, top: `${renderY}%` }}
                  onMouseEnter={() => setHoveredMarkerId(mk.id)}
                  onMouseLeave={() => setHoveredMarkerId(null)}
                  onMouseDown={(e) => {
                    if (!isEditMode || isAddingMarker || e.button !== 0) return;
                    e.stopPropagation();
                    const box = mapBoxRef.current;
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
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
                >
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#1E1E29] border border-[#E6E3F0] dark:border-[#323244] text-[11px] font-semibold whitespace-nowrap shadow-2xs">
                    {mk.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDescOpen(false);
                      setSelectedMarkerId(isSelected ? null : mk.id);
                    }}
                    className={`w-4 h-4 rounded-full border-2 transition-transform ${
                      isLinked
                        ? 'bg-[#6A5ACD] border-white'
                        : 'bg-white border-[#6A5ACD]'
                    } ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''} ${
                      isSelected ? 'scale-125 ring-4 ring-[#6A5ACD]/25' : 'hover:scale-110'
                    }`}
                  />
                  {!isEditMode && !isSelected && hoveredMarkerId === mk.id && mk.description && (
                    <div className="bs-animate-popover absolute top-11 px-2 py-1 rounded-md bg-[#1B1B1F]/90 text-white text-[10px] whitespace-nowrap pointer-events-none z-20">
                      {mk.description}
                    </div>
                  )}
                </div>
              );
            })}

            {/* View Mode Marker Popover matching PDF Page 25 (collapsed desc by default + auto flip) */}
            {!isEditMode && selectedMarker && (
              <div
                style={{
                  left: `${Math.min(72, Math.max(22, selectedMarker.x))}%`,
                  top: `${selectedMarker.y < 42 ? selectedMarker.y + 6 : selectedMarker.y - 6}%`,
                  transform:
                    selectedMarker.y < 42 ? 'translate(-50%, 0%)' : 'translate(-50%, -100%)',
                }}
                onClick={(e) => e.stopPropagation()}
                className="bs-animate-popover absolute w-64 rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] shadow-2xl overflow-hidden z-30"
              >
                <div className="h-24 bg-[#EBE8F5] dark:bg-[#2C2845] relative">
                  <button
                    type="button"
                    onClick={() => setSelectedMarkerId(null)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-white/85 dark:bg-black/40 flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{selectedMarker.name}</span>
                    {selectedMarker.linkedDocId && (
                      <button
                        type="button"
                        onClick={() => openDocument(selectedMarker.linkedDocId!)}
                        className="text-xs font-semibold text-[#6A5ACD] hover:underline"
                      >
                        문서 열기 ›
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDescOpen((p) => !p)}
                    className="flex items-center justify-between text-xs text-[#6E6D7A] pt-1 border-t border-[#F0EEF7] dark:border-[#2A2938]"
                  >
                    <span>설명</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${descOpen ? '' : '-rotate-90'}`}
                    />
                  </button>
                  <div className="bs-collapse-grid" data-open={descOpen ? 'true' : 'false'}>
                    <div className="bs-collapse-inner">
                      <p className="text-xs text-[#555464] dark:text-[#B4B2C4] pt-0.5">
                        {selectedMarker.description || '설명이 없습니다.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 self-end inline-flex items-center gap-1 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] px-2 py-1 text-xs">
            <button type="button" onClick={() => setZoom((z) => Math.max(70, z - 10))} className="px-1.5">
              −
            </button>
            <span className="w-10 text-center">{zoom}%</span>
            <button type="button" onClick={() => setZoom((z) => Math.min(140, z + 10))} className="px-1.5">
              +
            </button>
          </div>
        </div>

        {/* Edit Mode Marker Inspector matching PDF Page 21 */}
        {isEditMode && selectedMarker && (
          <aside className="w-[270px] shrink-0 border-l border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-5 flex flex-col gap-4 select-none text-xs">
            <div>
              <div className="text-sm font-bold">마커 수정</div>
              <div className="text-[11px] text-[#8A8998] mt-0.5">{selectedMarker.name}</div>
            </div>

            <label className="flex items-center justify-between gap-2">
              <span>이름</span>
              <input
                type="text"
                value={selectedMarker.name}
                onChange={(e) => updateMarker(selectedMarker.id, { name: e.target.value })}
                className="w-36 h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244]"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-[#8A8998]">연결 문서</span>
              {selectedMarker.linkedDocId ? (
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8F7FC] dark:bg-[#262436]">
                  <span className="font-semibold truncate">
                    {selectedMarker.linkedDocTitle || '연결된 문서'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateMarker(selectedMarker.id, {
                        linkedDocId: undefined,
                        linkedDocTitle: undefined,
                      })
                    }
                    className="text-rose-500 font-medium"
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

            <textarea
              rows={3}
              value={selectedMarker.description || ''}
              onChange={(e) => updateMarker(selectedMarker.id, { description: e.target.value })}
              placeholder="지역 설명"
              className="p-2.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] resize-none"
            />

            <button
              type="button"
              onClick={() => {
                persist(
                  mapPages.map((mp) =>
                    mp.id === curMap.id
                      ? { ...mp, markers: mp.markers.filter((m) => m.id !== selectedMarker.id) }
                      : mp
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
          if (selectedMarker) {
            updateMarker(selectedMarker.id, {
              linkedDocId: doc.id,
              linkedDocTitle: doc.title,
            });
          }
        }}
      />
    </div>
  );
};
