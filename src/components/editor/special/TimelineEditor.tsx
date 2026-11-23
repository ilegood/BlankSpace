import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { EditorHeader } from '../EditorHeader';
import { DocumentLinkModal } from '../../modals/DocumentLinkModal';

interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  desc: string;
  linkedDocId?: string;
  linkedDocTitle?: string;
}

const DEFAULT_EVENTS: TimelineEvent[] = [
  { id: 'ev1', time: '시점 1', title: '사건 1', desc: '세계 형성의 기원' },
  { id: 'ev2', time: '시점 2', title: '사건 2', desc: '제1시대 개막' },
  { id: 'ev3', time: '시점 3', title: '사건 3', desc: '대륙 대전쟁 발발', linkedDocId: 'doc-world-sheet', linkedDocTitle: '관련 문서' },
  { id: 'ev4', time: '시점 4', title: '사건 4', desc: '에르젠 왕국 성립' },
  { id: 'ev5', time: '시점 5', title: '사건 5', desc: '신규 시대 도래' },
];

export const TimelineEditor: React.FC<{ templateOverrideId?: string | null }> = ({
  templateOverrideId,
}) => {
  const { activeDocument, activePage, openDocument, openTemplateEditor, updateDocument, updatePage } =
    useWorkspace();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [unit, setUnit] = useState<'year' | 'month' | 'day' | 'custom'>('month');
  const [events, setEvents] = useState<TimelineEvent[]>(DEFAULT_EVENTS);
  const [selectedId, setSelectedId] = useState<string | null>('ev3');
  const [isDocLinkOpen, setIsDocLinkOpen] = useState(false);
  const [dragEventId, setDragEventId] = useState<string | null>(null);
  const [dragHoverIdx, setDragHoverIdx] = useState<number | null>(null);

  const sortChronologically = (list: TimelineEvent[]) =>
    [...list].sort((a, b) => {
      const na = Number(a.time.replace(/[^\d.-]/g, ''));
      const nb = Number(b.time.replace(/[^\d.-]/g, ''));
      if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
      return a.time.localeCompare(b.time, 'ko');
    });

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
        {/* Timeline Dot Canvas matching PDF Page 22 */}
        <div className="flex-1 relative overflow-auto canvas-dot-grid p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            {isEditMode && (
              <button
                type="button"
                onClick={() => {
                  const ev: TimelineEvent = {
                    id: `ev-${Date.now()}`,
                    time: `시점 ${events.length + 1}`,
                    title: `사건 ${events.length + 1}`,
                    desc: '사건 설명',
                  };
                  persist([...events, ev]);
                  setSelectedId(ev.id);
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
                  onClick={() => setUnit(u.id as any)}
                  className={`px-3 py-1 rounded-lg font-semibold ${
                    unit === u.id ? 'bg-[#6A5ACD] text-white' : 'text-[#6E6D7A]'
                  }`}
                >
                  {u.label}
                </button>
              ))}
            </div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => persist(sortChronologically(events))}
                  className="px-3 py-2 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29] text-xs font-semibold hover:border-[#6A5ACD]"
                >
                  시점순 정렬
                </button>
              )}
            </div>

          {/* Alternating Timeline Cards */}
          <div className="relative my-auto py-16 min-w-[780px]">
            <div className="h-[3px] bg-[#D8D4EC] dark:bg-[#32304A] w-full rounded-full" />
            <div className="grid grid-flow-col auto-cols-[175px] gap-4 -mt-[140px]">
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
                    <div className="text-[11px] text-[#8A8998]">{ev.time}</div>
                    <div className="text-xs font-bold mt-0.5">{ev.title}</div>
                    <div className="text-[11px] text-[#6E6D7A] dark:text-[#9E9CAF] mt-1 line-clamp-2">
                      {ev.desc}
                    </div>
                  </div>
                );
                return (
                  <div
                    key={ev.id}
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
                        persist(copy);
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
            시간축 방식은 제안안입니다. 사건은 시점 순서로 자동 정렬됩니다.
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
                type="text"
                value={selected.title}
                onChange={(e) =>
                  persist(
                    events.map((ev) =>
                      ev.id === selected.id ? { ...ev, title: e.target.value } : ev
                    )
                  )
                }
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
