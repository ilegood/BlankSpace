import React, { useState, useEffect, useRef } from 'react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { EditorHeader } from '../EditorHeader';
import { DocumentLinkModal } from '../../modals/DocumentLinkModal';
import { runFlipForSortItems } from '../../../hooks/useLongPressSort';

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  desc: string;
  imageUrl?: string;
  linkedDocId?: string;
  linkedDocTitle?: string;
}

const DEFAULT_EVENTS: TimelineEvent[] = [
  { id: 'ev1', time: '100년', title: '사건 1', desc: '세계 형성의 기원' },
  { id: 'ev2', time: '220년', title: '사건 2', desc: '제1시대 개막' },
  { id: 'ev3', time: '340년', title: '사건 3', desc: '대륙 대전쟁 발발', linkedDocId: 'doc-world-sheet', linkedDocTitle: '관련 문서' },
  { id: 'ev4', time: '510년', title: '사건 4', desc: '에르젠 왕국 성립' },
  { id: 'ev5', time: '780년', title: '사건 5', desc: '신규 시대 도래' },
];

const UNIT_SUFFIX: Record<'year' | 'month' | 'day' | 'custom', string> = {
  year: '년',
  month: '월',
  day: '일',
  custom: '',
};

export const TimelineEditor: React.FC<{ templateOverrideId?: string | null }> = ({
  templateOverrideId,
}) => {
  const { activeDocument, activePage, openDocument, openTemplateEditor, updateDocument, updatePage } =
    useWorkspace();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [unit, setUnit] = useState<'year' | 'month' | 'day' | 'custom'>('year');
  const [sortMode, setSortMode] = useState<'custom' | 'alpha'>('custom');
  const [events, setEvents] = useState<TimelineEvent[]>(DEFAULT_EVENTS);
  const [selectedId, setSelectedId] = useState<string | null>('ev3');
  const [isDocLinkOpen, setIsDocLinkOpen] = useState(false);
  const [dragEventId, setDragEventId] = useState<string | null>(null);
  const [dragHoverIdx, setDragHoverIdx] = useState<number | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const sortAlphabetically = (list: TimelineEvent[]) =>
    [...list].sort((a, b) => a.title.localeCompare(b.title, 'ko'));

  useEffect(() => {
    if (activePage?.content) {
      try {
        const parsed = JSON.parse(activePage.content);
        if (Array.isArray(parsed.events)) {
          setEvents(parsed.events);
          return;
        }
      } catch {
        // ignore
      }
    }
    setEvents(DEFAULT_EVENTS);
  }, [activePage?.id]);

  const persist = (next: TimelineEvent[]) => {
    setEvents(next);
    if (activePage) updatePage(activePage.id, { content: JSON.stringify({ events: next }) });
  };

  const selected = events.find((e) => e.id === selectedId) || null;
  const colWidth = events.length > 8 ? 135 : events.length > 6 ? 150 : 175;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#15151C]">
      <EditorHeader
        title={isTemplateMode ? '타임라인 (템플릿)' : activeDocument?.title || '타임라인'}
        onTitleChange={(t) => activeDocument && updateDocument(activeDocument.id, { title: t })}
        templateType="world-chronicle"
        isEditMode={isEditMode}
        onChangeMode={setIsEditMode}
        onExit={() => (isTemplateMode ? openTemplateEditor(null) : openDocument(null))}
        isTemplateMode={isTemplateMode}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Timeline Dot Canvas */}
        <div className="flex-1 relative overflow-x-auto overflow-y-auto canvas-dot-grid p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            {isEditMode && (
              <button
                type="button"
                onClick={() => {
                  const suffix = UNIT_SUFFIX[unit];
                  const nextNum = (events.length + 1) * (unit === 'year' ? 100 : 1);
                  const ev: TimelineEvent = {
                    id: `ev-${Date.now()}`,
                    time: suffix ? `${nextNum}${suffix}` : `시점 ${events.length + 1}`,
                    title: `사건 ${events.length + 1}`,
                    desc: '사건 설명',
                  };
                  runFlipForSortItems(320, () => {
                    const nextList = [...events, ev];
                    persist(sortMode === 'alpha' ? sortAlphabetically(nextList) : nextList);
                  });
                  setSelectedId(ev.id);
                  window.setTimeout(() => titleInputRef.current?.focus(), 60);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#6A5ACD] text-white text-xs font-semibold"
              >
                + 사건 추가
              </button>
            )}

            <div className="inline-flex rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] p-0.5 text-xs">
              {[
                { id: 'year', label: '년' },
                { id: 'month', label: '월' },
                { id: 'day', label: '일' },
                { id: 'custom', label: '직접' },
              ].map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    const nextUnit = u.id as 'year' | 'month' | 'day' | 'custom';
                    setUnit(nextUnit);
                    const sfx = UNIT_SUFFIX[nextUnit];
                    if (sfx) {
                      runFlipForSortItems(320, () => {
                        const updated = events.map((ev, i) => {
                          const num = Number(ev.time.replace(/[^\d.-]/g, ''));
                          const val = !Number.isNaN(num) && num > 0 ? num : i + 1;
                          return { ...ev, time: `${val}${sfx}` };
                        });
                        persist(updated);
                      });
                    }
                  }}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    unit === u.id ? 'bg-[#6A5ACD] text-white' : 'text-[#6E6D7A]'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>

            <div className="inline-flex rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSortMode('alpha');
                  runFlipForSortItems(320, () => {
                    persist(sortAlphabetically(events));
                  });
                }}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  sortMode === 'alpha' ? 'bg-[#6A5ACD] text-white' : 'text-[#6E6D7A]'
                }`}
              >
                가나다순
              </button>
              <button
                type="button"
                onClick={() => setSortMode('custom')}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  sortMode === 'custom' ? 'bg-[#6A5ACD] text-white' : 'text-[#6E6D7A]'
                }`}
              >
                직접 정렬
              </button>
            </div>
          </div>

          {/* Alternating Timeline Cards with Time Axis Ticks */}
          <div
            data-export-root="true"
            style={{ minWidth: Math.max(720, events.length * (colWidth + 16)) }}
            className="relative my-auto py-16 pr-6"
          >
            <div className="relative h-[3px] bg-[#D8D4EC] dark:bg-[#32304A] w-full rounded-full">
              {events.map((ev, idx) => (
                <span
                  key={`tick-${ev.id}`}
                  style={{
                    left: `${((idx + 0.5) / Math.max(1, events.length)) * 100}%`,
                  }}
                  className="bs-animate-fade absolute -top-5 -translate-x-1/2 text-[10px] font-semibold text-[#8A8998] whitespace-nowrap pointer-events-none"
                >
                  {ev.time}
                </span>
              ))}
            </div>
            <div
              style={{ gridAutoColumns: `${colWidth}px` }}
              className="grid grid-flow-col gap-4 -mt-[140px]"
            >
              {events.map((ev, idx) => {
                const isTop = idx % 2 === 0;
                const isSel = selectedId === ev.id;
                const isDropTarget = dragHoverIdx === idx && dragEventId && dragEventId !== ev.id;
                const cardBox = (
                  <div
                    draggable={isEditMode}
                    onDragStart={(e) => {
                      if (!isEditMode) return;
                      setDragEventId(ev.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDragEventId(null);
                      setDragHoverIdx(null);
                    }}
                    onClick={() => {
                      setSelectedId(ev.id);
                      if (!isEditMode && ev.linkedDocId) openDocument(ev.linkedDocId);
                    }}
                    className={`bs-card-interactive w-full rounded-2xl bg-white dark:bg-[#1E1E29] border p-3.5 cursor-pointer ${
                      isSel
                        ? 'border-[#6A5ACD] border-2 shadow-md'
                        : 'border-[#E6E3F0] dark:border-[#2E2D3D]'
                    } ${dragEventId === ev.id ? 'opacity-45' : ''} ${
                      isDropTarget ? 'ring-2 ring-[#6A5ACD]' : ''
                    }`}
                  >
                    <div className="text-[11px] font-semibold text-[#6A5ACD] dark:text-[#9A8FE6]">
                      {ev.time}
                    </div>
                    <div className="text-xs font-bold mt-0.5 truncate">{ev.title}</div>
                    {ev.imageUrl && (
                      <img
                        src={ev.imageUrl}
                        alt={ev.title}
                        className="mt-1.5 w-full h-14 object-cover rounded-lg"
                      />
                    )}
                    <div className="text-[11px] text-[#6E6D7A] dark:text-[#9E9CAF] mt-1 line-clamp-2">
                      {ev.desc}
                    </div>
                  </div>
                );
                return (
                  <div
                    key={ev.id}
                    data-sort-id={ev.id}
                    onDragOver={(e) => {
                      if (!isEditMode || !dragEventId) return;
                      e.preventDefault();
                      setDragHoverIdx(idx);
                    }}
                    onDrop={(e) => {
                      if (!isEditMode || !dragEventId) return;
                      e.preventDefault();
                      const fromIdx = events.findIndex((x) => x.id === dragEventId);
                      if (fromIdx >= 0 && fromIdx !== idx) {
                        const copy = [...events];
                        const [moved] = copy.splice(fromIdx, 1);
                        copy.splice(idx, 0, moved);
                        setSortMode('custom');
                        runFlipForSortItems(320, () => {
                          persist(copy);
                        });
                      }
                      setDragEventId(null);
                      setDragHoverIdx(null);
                    }}
                    className="flex flex-col items-center"
                  >
                    {isTop ? (
                      <>
                        {cardBox}
                        <div className="w-0.5 h-8 bg-[#9A8FE6]" />
                        <div className="w-3 h-3 rounded-full bg-[#6A5ACD]" />
                      </>
                    ) : (
                      <>
                        <div className="h-[130px]" />
                        <div className="w-3 h-3 rounded-full bg-[#6A5ACD]" />
                        <div className="w-0.5 h-8 bg-[#9A8FE6]" />
                        {cardBox}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-center text-[11px] text-[#8A8998]">
            가나다순 정렬 또는 드래그를 통한 직접 정렬을 사용할 수 있으며, 사건이 많아지면 좌우로 스크롤할 수 있습니다.
          </p>
        </div>

        {/* Right Event Inspector in Edit Mode */}
        {isEditMode && selected && (
          <aside className="w-[270px] shrink-0 border-l border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-5 flex flex-col gap-4 select-none text-xs">
            <div>
              <div className="text-sm font-bold">사건 수정</div>
              <div className="text-[11px] text-[#8A8998]">{selected.title}</div>
            </div>

            <label className="flex items-center justify-between gap-2">
              <span>이름</span>
              <input
                ref={titleInputRef}
                type="text"
                value={selected.title}
                onChange={(e) => {
                  const next = events.map((ev) =>
                    ev.id === selected.id ? { ...ev, title: e.target.value } : ev
                  );
                  persist(sortMode === 'alpha' ? sortAlphabetically(next) : next);
                }}
                className="w-36 h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244]"
              />
            </label>

            <label className="flex items-center justify-between gap-2">
              <span>시점</span>
              <input
                type="text"
                value={selected.time}
                onChange={(e) =>
                  persist(
                    events.map((ev) =>
                      ev.id === selected.id ? { ...ev, time: e.target.value } : ev
                    )
                  )
                }
                className="w-36 h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244]"
              />
            </label>

            <textarea
              rows={3}
              value={selected.desc}
              onChange={(e) =>
                persist(
                  events.map((ev) =>
                    ev.id === selected.id ? { ...ev, desc: e.target.value } : ev
                  )
                )
              }
              className="p-2.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] resize-none"
            />

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-[#8A8998]">관련 문서</span>
              {selected.linkedDocId ? (
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8F7FC] dark:bg-[#262436]">
                  <span className="font-semibold truncate">{selected.linkedDocTitle}</span>
                  <button
                    type="button"
                    onClick={() =>
                      persist(
                        events.map((ev) =>
                          ev.id === selected.id
                            ? { ...ev, linkedDocId: undefined, linkedDocTitle: undefined }
                            : ev
                        )
                      )
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
                persist(events.filter((ev) => ev.id !== selected.id));
                setSelectedId(null);
              }}
              className="self-start px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 font-semibold"
            >
              사건 삭제
            </button>
          </aside>
        )}
      </div>

      <DocumentLinkModal
        isOpen={isDocLinkOpen}
        onClose={() => setIsDocLinkOpen(false)}
        onSelect={(doc) => {
          if (selected) {
            persist(
              events.map((ev) =>
                ev.id === selected.id
                  ? { ...ev, linkedDocId: doc.id, linkedDocTitle: doc.title }
                  : ev
              )
            );
          }
        }}
      />
    </div>
  );
};
