import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { EditorHeader } from '../EditorHeader';

interface TaskGroup {
  id: string;
  name: string;
  collapsed?: boolean;
}

interface ScheduleTask {
  id: string;
  groupId: string;
  name: string;
  startCol: number;
  spanCols: number;
  progress: number;
  memo?: string;
}

const DEFAULT_GROUPS: TaskGroup[] = [
  { id: 'grp-1', name: '그룹 1' },
  { id: 'grp-2', name: '그룹 2' },
];

const DEFAULT_TASKS: ScheduleTask[] = [
  { id: 'tk-1', groupId: 'grp-1', name: '작업 1', startCol: 0, spanCols: 4, progress: 35 },
  { id: 'tk-2', groupId: 'grp-1', name: '작업 2', startCol: 3, spanCols: 6, progress: 50 },
  { id: 'tk-3', groupId: 'grp-2', name: '작업 3', startCol: 6, spanCols: 5, progress: 35 },
  { id: 'tk-4', groupId: 'grp-2', name: '작업 4', startCol: 9, spanCols: 5, progress: 28 },
];

const WEEK_DAYS = ['월', '화', '수', '목', '금', '토', '일', '월', '화', '수', '목', '금', '토', '일'];

export const ScheduleEditor: React.FC<{ templateOverrideId?: string | null }> = ({
  templateOverrideId,
}) => {
  const { activeDocument, activePage, openDocument, openTemplateEditor, updateDocument, updatePage } =
    useWorkspace();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [scale, setScale] = useState<'day' | 'week' | 'month'>('week');
  const [groups, setGroups] = useState<TaskGroup[]>(DEFAULT_GROUPS);
  const [tasks, setTasks] = useState<ScheduleTask[]>(DEFAULT_TASKS);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>('tk-2');

  // Interactive schedule range + live drag state (§6-9)
  const [startDate, setStartDate] = useState('2026-11-16');
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState('2026-12-14');
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [liveBar, setLiveBar] = useState<{ id: string; startCol: number; spanCols: number } | null>(
    null
  );
  const ganttScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activePage?.content) {
      try {
        const parsed = JSON.parse(activePage.content);
        if (Array.isArray(parsed.tasks)) {
          setGroups(parsed.groups || DEFAULT_GROUPS);
          setTasks(parsed.tasks);
          return;
        }
      } catch {
        // ignore
      }
    }
    setGroups(DEFAULT_GROUPS);
    setTasks(DEFAULT_TASKS);
  }, [activePage?.id]);

  const persist = (nextGroups: TaskGroup[], nextTasks: ScheduleTask[]) => {
    setGroups(nextGroups);
    setTasks(nextTasks);
    if (activePage) {
      updatePage(activePage.id, {
        content: JSON.stringify({ groups: nextGroups, tasks: nextTasks }),
      });
    }
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;
  const cols = scale === 'month' ? 12 : 14;

  const startBarDrag = (
    e: React.MouseEvent,
    tk: ScheduleTask,
    mode: 'move' | 'left' | 'right',
    trackEl: HTMLDivElement | null
  ) => {
    if (!isEditMode || e.button !== 0 || !trackEl) return;
    e.stopPropagation();
    setSelectedTaskId(tk.id);
    const sx = e.clientX;
    const trackWidth = Math.max(100, trackEl.getBoundingClientRect().width);
    const colW = trackWidth / cols;
    const origStart = tk.startCol;
    const origSpan = tk.spanCols;
    let finalStart = origStart;
    let finalSpan = origSpan;
    let moved = false;

    const onMove = (ev: MouseEvent) => {
      const deltaCols = Math.round((ev.clientX - sx) / colW);
      if (!moved && Math.abs(ev.clientX - sx) < 4) return;
      moved = true;

      if (mode === 'move') {
        finalStart = Math.max(0, Math.min(cols - origSpan, origStart + deltaCols));
        finalSpan = origSpan;
      } else if (mode === 'right') {
        finalSpan = Math.max(1, Math.min(cols - origStart, origSpan + deltaCols));
        finalStart = origStart;
      } else {
        const clampedDelta = Math.max(-origStart, Math.min(origSpan - 1, deltaCols));
        finalStart = origStart + clampedDelta;
        finalSpan = origSpan - clampedDelta;
      }
      setLiveBar({ id: tk.id, startCol: finalStart, spanCols: finalSpan });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setLiveBar(null);
      if (moved && (finalStart !== origStart || finalSpan !== origSpan)) {
        persist(
          groups,
          tasks.map((t) =>
            t.id === tk.id ? { ...t, startCol: finalStart, spanCols: finalSpan } : t
          )
        );
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#15151C]">
      <EditorHeader
        title={isTemplateMode ? '일정 (템플릿)' : activeDocument?.title || '일정'}
        onTitleChange={(t) => activeDocument && updateDocument(activeDocument.id, { title: t })}
        templateType="general-timeline"
        isEditMode={isEditMode}
        onChangeMode={setIsEditMode}
        onExit={() => (isTemplateMode ? openTemplateEditor(null) : openDocument(null))}
        isTemplateMode={isTemplateMode}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div ref={ganttScrollRef} className="flex-1 overflow-auto p-5 bg-white dark:bg-[#15151C]">
          {/* Top Gantt Controls matching PDF Pages 51 & 55 */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 relative">
            <div className="flex items-center gap-2">
              {isEditMode && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const nt: ScheduleTask = {
                        id: `tk-${Date.now()}`,
                        groupId: groups[0]?.id || 'grp-1',
                        name: `작업 ${tasks.length + 1}`,
                        startCol: 2,
                        spanCols: 4,
                        progress: 0,
                      };
                      persist(groups, [...tasks, nt]);
                      setSelectedTaskId(nt.id);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#6A5ACD] text-white text-xs font-semibold"
                  >
                    + 작업
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ng: TaskGroup = {
                        id: `grp-${Date.now()}`,
                        name: `그룹 ${groups.length + 1}`,
                      };
                      persist([...groups, ng], tasks);
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] text-xs font-semibold"
                  >
                    + 그룹
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs relative">
              <span className="text-[#8A8998]">기간</span>
              <button
                type="button"
                onClick={() => setDateMenuOpen((p) => !p)}
                className="px-3 py-1 rounded-xl border border-[#E6E3F0] dark:border-[#323244] hover:border-[#6A5ACD]"
              >
                {startDate} ▾
              </button>
              <span>~</span>
              <button
                type="button"
                onClick={() => setDateMenuOpen((p) => !p)}
                className="px-3 py-1 rounded-xl border border-[#E6E3F0] dark:border-[#323244] hover:border-[#6A5ACD]"
              >
                {hasEndDate ? endDate : '종료일 없음'} ▾
              </button>

              {dateMenuOpen && (
                <div className="bs-animate-popover absolute left-0 top-9 z-30 w-64 rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] shadow-xl p-3 flex flex-col gap-2.5 text-xs">
                  <label className="flex items-center justify-between">
                    <span>시작일</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244]"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>종료일 지정</span>
                    <input
                      type="checkbox"
                      checked={hasEndDate}
                      onChange={(e) => setHasEndDate(e.target.checked)}
                      className="accent-[#6A5ACD]"
                    />
                  </label>
                  {hasEndDate && (
                    <label className="flex items-center justify-between">
                      <span>종료일</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-2 py-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244]"
                      />
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={() => setDateMenuOpen(false)}
                    className="self-end px-2.5 py-1 rounded-lg bg-[#6A5ACD] text-white font-semibold"
                  >
                    닫기
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  const box = ganttScrollRef.current;
                  if (box) {
                    const targetX = Math.max(0, box.scrollWidth * 0.34 - box.clientWidth / 2);
                    box.scrollTo({ left: targetX, behavior: 'smooth' });
                  }
                }}
                className="px-3 py-1 rounded-xl border border-[#E6E3F0] dark:border-[#323244] font-semibold hover:border-[#6A5ACD]"
              >
                오늘
              </button>

              <div className="inline-flex rounded-xl border border-[#E6E3F0] dark:border-[#323244] p-0.5">
                {[
                  { id: 'day', label: '일' },
                  { id: 'week', label: '주' },
                  { id: 'month', label: '월' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setScale(s.id as any)}
                    className={`px-2.5 py-1 rounded-lg font-semibold ${
                      scale === s.id ? 'bg-[#6A5ACD] text-white' : 'text-[#6E6D7A]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Gantt Table */}
          <div className="rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] overflow-hidden relative min-w-[760px]">
            {/* Orange Today Vertical Line */}
            <div
              style={{ left: 'calc(180px + (100% - 180px) * 0.34)' }}
              className="absolute top-0 bottom-0 w-[1.5px] bg-[#D97724] z-20 pointer-events-none"
            >
              <span className="absolute top-1 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#D97724] text-white text-[10px] font-bold">
                오늘
              </span>
            </div>

            {/* Header Row */}
            <div className="grid grid-cols-[180px_1fr] border-b border-[#EAE7F2] dark:border-[#2E2D3D] bg-[#FAF9FE] dark:bg-[#181822] text-xs">
              <div className="px-4 py-3 font-semibold text-[#6E6D7A]">작업</div>
              <div className="flex flex-col">
                <div className="grid grid-cols-2 text-center py-1 text-[11px] font-semibold text-[#6E6D7A]">
                  <span>{scale === 'month' ? '1월 ~ 2월' : '1주차'}</span>
                  <span>{scale === 'month' ? '2월 ~ 3월' : '2주차'}</span>
                </div>
                <div
                  className="grid text-center text-[11px] text-[#8A8998] pb-1.5"
                  style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: cols }).map((_, i) => (
                    <span key={i}>{scale === 'month' ? i + 1 : WEEK_DAYS[i % 14]}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Groups & Tasks */}
            {groups.map((grp) => {
              const grpTasks = tasks.filter((t) => t.groupId === grp.id);
              return (
                <React.Fragment key={grp.id}>
                  <div className="grid grid-cols-[180px_1fr] border-b border-[#F0EEF7] dark:border-[#2A2938] items-center h-11">
                    <button
                      type="button"
                      onClick={() =>
                        persist(
                          groups.map((g) =>
                            g.id === grp.id ? { ...g, collapsed: !g.collapsed } : g
                          ),
                          tasks
                        )
                      }
                      className="px-4 flex items-center gap-1.5 text-xs font-bold text-left"
                    >
                      {grp.collapsed ? (
                        <ChevronRight className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                      <span>{grp.name}</span>
                    </button>
                    <div className="px-4">
                      <div className="h-1.5 w-1/2 rounded-full bg-[#3D328A]" />
                    </div>
                  </div>

                  {!grp.collapsed &&
                    grpTasks.map((tk) => {
                      const isSel = selectedTaskId === tk.id;
                      const startCol = liveBar?.id === tk.id ? liveBar.startCol : tk.startCol;
                      const spanCols = liveBar?.id === tk.id ? liveBar.spanCols : tk.spanCols;
                      const leftPct = (startCol / cols) * 100;
                      const widthPct = (spanCols / cols) * 100;
                      let trackRef: HTMLDivElement | null = null;
                      return (
                        <div
                          key={tk.id}
                          onClick={() => setSelectedTaskId(tk.id)}
                          className="grid grid-cols-[180px_1fr] border-b border-[#F0EEF7] dark:border-[#2A2938] items-center h-12 hover:bg-[#FAF9FE] dark:hover:bg-[#1E1E29] cursor-pointer"
                        >
                          <div className="pl-7 pr-3 text-xs font-medium truncate">{tk.name}</div>
                          <div
                            ref={(el) => {
                              trackRef = el;
                            }}
                            className="relative h-full flex items-center"
                          >
                            <div
                              onMouseDown={(e) => startBarDrag(e, tk, 'move', trackRef)}
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                              className={`group absolute h-7 rounded-lg bg-[#A598EC] overflow-hidden flex items-center ${
                                isEditMode ? 'cursor-grab active:cursor-grabbing' : ''
                              } ${isSel ? 'ring-2 ring-[#1B1B1F] dark:ring-white' : ''}`}
                            >
                              <div
                                style={{ width: `${tk.progress}%` }}
                                className="h-full bg-[#6A5ACD] transition-[width] duration-150"
                              />
                              {isEditMode && (
                                <>
                                  <span
                                    onMouseDown={(e) => startBarDrag(e, tk, 'left', trackRef)}
                                    className="opacity-0 group-hover:opacity-100 absolute left-0 inset-y-0 w-2 bg-white/40 cursor-ew-resize"
                                  />
                                  <span
                                    onMouseDown={(e) => startBarDrag(e, tk, 'right', trackRef)}
                                    className="opacity-0 group-hover:opacity-100 absolute right-0 inset-y-0 w-2 bg-white/40 cursor-ew-resize"
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Right Task Inspector in Edit Mode */}
        {isEditMode && selectedTask && (
          <aside className="w-[270px] shrink-0 border-l border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-5 flex flex-col gap-3.5 select-none text-xs">
            <div>
              <div className="text-sm font-bold">작업 수정</div>
              <div className="text-[11px] text-[#8A8998] mt-0.5">{selectedTask.name}</div>
            </div>

            <label className="flex items-center justify-between gap-2">
              <span>이름</span>
              <input
                type="text"
                value={selectedTask.name}
                onChange={(e) =>
                  persist(
                    groups,
                    tasks.map((t) =>
                      t.id === selectedTask.id ? { ...t, name: e.target.value } : t
                    )
                  )
                }
                className="w-36 h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244]"
              />
            </label>

            <label className="flex items-center justify-between gap-2">
              <span>진행률</span>
              <input
                type="number"
                min={0}
                max={100}
                value={selectedTask.progress}
                onChange={(e) =>
                  persist(
                    groups,
                    tasks.map((t) =>
                      t.id === selectedTask.id
                        ? { ...t, progress: Math.min(100, Math.max(0, Number(e.target.value))) }
                        : t
                    )
                  )
                }
                className="w-24 h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] text-right"
              />
            </label>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  persist(groups, [
                    ...tasks,
                    { ...selectedTask, id: `tk-${Date.now()}`, name: `${selectedTask.name} 복사` },
                  ])
                }
                className="px-3.5 py-1.5 rounded-xl border border-[#E6E3F0] font-semibold"
              >
                복제
              </button>
              <button
                type="button"
                onClick={() => {
                  persist(groups, tasks.filter((t) => t.id !== selectedTask.id));
                  setSelectedTaskId(null);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 font-semibold"
              >
                삭제
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
