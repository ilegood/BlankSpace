import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
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
  color?: string;
  memo?: string;
}

const DEFAULT_GROUPS: TaskGroup[] = [
  { id: 'grp-1', name: '그룹 1' },
  { id: 'grp-2', name: '그룹 2' },
];

const DEFAULT_TASKS: ScheduleTask[] = [
  { id: 'tk-1', groupId: 'grp-1', name: '작업 1', startCol: 0, spanCols: 4, progress: 35, color: '#6A5ACD' },
  { id: 'tk-2', groupId: 'grp-1', name: '작업 2', startCol: 3, spanCols: 6, progress: 50, color: '#6A5ACD' },
  { id: 'tk-3', groupId: 'grp-2', name: '작업 3', startCol: 6, spanCols: 5, progress: 35, color: '#0F766E' },
  { id: 'tk-4', groupId: 'grp-2', name: '작업 4', startCol: 9, spanCols: 5, progress: 28, color: '#D97724' },
];

const TASK_COLORS = ['#6A5ACD', '#0F766E', '#D97724', '#E11D48', '#2563EB'];

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
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

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
          if (parsed.startDate) setStartDate(parsed.startDate);
          if (parsed.endDate) setEndDate(parsed.endDate);
          if (typeof parsed.hasEndDate === 'boolean') setHasEndDate(parsed.hasEndDate);
          return;
        }
      } catch {
        // ignore
      }
    }
    setGroups(DEFAULT_GROUPS);
    setTasks(DEFAULT_TASKS);
  }, [activePage?.id]);

  const persist = (
    nextGroups: TaskGroup[],
    nextTasks: ScheduleTask[],
    nextStart = startDate,
    nextEnd = endDate,
    nextHasEnd = hasEndDate
  ) => {
    setGroups(nextGroups);
    setTasks(nextTasks);
    if (activePage) {
      updatePage(activePage.id, {
        content: JSON.stringify({
          groups: nextGroups,
          tasks: nextTasks,
          startDate: nextStart,
          endDate: nextEnd,
          hasEndDate: nextHasEnd,
        }),
      });
    }
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || null;

  const fullRangeDays = (() => {
    if (!hasEndDate) return null;
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return 14;
    const diff = Math.round((e - s) / 86400000) + 1;
    return Math.max(7, Math.min(42, diff));
  })();

  const cols = fullRangeDays ?? (scale === 'month' ? 12 : 14);

  const getColDate = (colIdx: number): Date => {
    const base = new Date(startDate);
    if (Number.isNaN(base.getTime())) return new Date(2026, 10, 16 + colIdx);
    if (scale === 'month' && !hasEndDate) {
      return new Date(base.getFullYear(), base.getMonth() + colIdx, 1);
    }
    return new Date(base.getTime() + colIdx * 86400000);
  };

  const formatColDateLabel = (colIdx: number) => {
    const d = getColDate(colIdx);
    if (scale === 'month' && !hasEndDate) {
      return `${d.getFullYear()}.${d.getMonth() + 1}월`;
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const firstDate = getColDate(0);
  const midDate = getColDate(Math.floor(cols / 2));
  const lastDate = getColDate(cols - 1);
  const leftHeaderSummary =
    scale === 'month' && !hasEndDate
      ? `${firstDate.getFullYear()}년 ${firstDate.getMonth() + 1}월 ~ ${midDate.getMonth() + 1}월`
      : `${firstDate.getMonth() + 1}월 ${firstDate.getDate()}일 ~ ${midDate.getMonth() + 1}월 ${midDate.getDate()}일`;
  const rightHeaderSummary =
    scale === 'month' && !hasEndDate
      ? `${midDate.getFullYear()}년 ${midDate.getMonth() + 1}월 ~ ${lastDate.getMonth() + 1}월`
      : `${midDate.getMonth() + 1}월 ${midDate.getDate()}일 ~ ${lastDate.getMonth() + 1}월 ${lastDate.getDate()}일`;

  const startBarDrag = (
    e: React.MouseEvent,
    tk: ScheduleTask,
    mode: 'move' | 'left' | 'right',
    trackEl: HTMLDivElement | null
  ) => {
    if (!isEditMode || e.button !== 0 || !trackEl) return;
    e.stopPropagation();
    setSelectedTaskId(tk.id);
    setSelectedGroupId(null);
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
          {/* Top Gantt Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 relative">
            <div className="flex items-center gap-2">
              {isEditMode && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const nt: ScheduleTask = {
                        id: `tk-${Date.now()}`,
                        groupId: selectedGroupId || groups[0]?.id || 'grp-1',
                        name: `작업 ${tasks.length + 1}`,
                        startCol: 2,
                        spanCols: 4,
                        progress: 0,
                        color: '#6A5ACD',
                      };
                      persist(groups, [...tasks, nt]);
                      setSelectedTaskId(nt.id);
                      setSelectedGroupId(null);
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
                      setSelectedGroupId(ng.id);
                      setSelectedTaskId(null);
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
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        persist(groups, tasks, e.target.value, endDate, hasEndDate);
                      }}
                      className="px-2 py-1 rounded-lg border border-[#E6E3F0] dark:border-[#323244]"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span>종료일 지정</span>
                    <input
                      type="checkbox"
                      checked={hasEndDate}
                      onChange={(e) => {
                        setHasEndDate(e.target.checked);
                        persist(groups, tasks, startDate, endDate, e.target.checked);
                      }}
                      className="accent-[#6A5ACD]"
                    />
                  </label>
                  {hasEndDate && (
                    <label className="flex items-center justify-between">
                      <span>종료일</span>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          persist(groups, tasks, startDate, e.target.value, hasEndDate);
                        }}
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

              {!hasEndDate ? (
                <div className="inline-flex rounded-xl border border-[#E6E3F0] dark:border-[#323244] p-0.5 bs-animate-fade">
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
              ) : (
                <span className="bs-animate-fade px-2.5 py-1 rounded-xl bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6] text-[11px] font-semibold">
                  전체 기간 맞춤 ({cols}일)
                </span>
              )}
            </div>
          </div>

          {/* Gantt Table */}
          <div
            data-export-root="true"
            className="rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] overflow-hidden relative min-w-[760px]"
          >
            {/* Orange Today Vertical Line */}
            <div
              style={{ left: 'calc(180px + (100% - 180px) * 0.34)' }}
              className="absolute top-0 bottom-0 w-[1.5px] bg-[#D97724] z-20 pointer-events-none"
            >
              <span className="absolute top-1 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#D97724] text-white text-[10px] font-bold">
                오늘
              </span>
            </div>

            {/* Header Row synchronized with startDate */}
            <div className="grid grid-cols-[180px_1fr] border-b border-[#EAE7F2] dark:border-[#2E2D3D] bg-[#FAF9FE] dark:bg-[#181822] text-xs">
              <div className="px-4 py-3 font-semibold text-[#6E6D7A]">작업</div>
              <div className="flex flex-col">
                <div className="grid grid-cols-2 text-center py-1 text-[11px] font-semibold text-[#6E6D7A]">
                  <span>{leftHeaderSummary}</span>
                  <span>{rightHeaderSummary}</span>
                </div>
                <div
                  className="grid text-center text-[10.5px] text-[#8A8998] pb-1.5"
                  style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: cols }).map((_, i) => {
                    const d = getColDate(i);
                    return (
                      <span key={i}>
                        {scale === 'month' && !hasEndDate
                          ? `${d.getMonth() + 1}월`
                          : `${d.getMonth() + 1}/${d.getDate()}`}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Groups & Tasks */}
            {groups.map((grp) => {
              const grpTasks = tasks.filter((t) => t.groupId === grp.id);
              const isGrpSel = selectedGroupId === grp.id;
              return (
                <React.Fragment key={grp.id}>
                  <div
                    onClick={() => {
                      setSelectedGroupId(grp.id);
                      setSelectedTaskId(null);
                    }}
                    className={`grid grid-cols-[180px_1fr] border-b border-[#F0EEF7] dark:border-[#2A2938] items-center h-11 cursor-pointer ${
                      isGrpSel ? 'bg-[#F3F1FB]/60 dark:bg-[#2C2845]/40' : ''
                    }`}
                  >
                    <div className="px-4 flex items-center gap-1.5 text-xs font-bold text-left">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          persist(
                            groups.map((g) =>
                              g.id === grp.id ? { ...g, collapsed: !g.collapsed } : g
                            ),
                            tasks
                          );
                        }}
                      >
                        {grp.collapsed ? (
                          <ChevronRight className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span className="truncate">{grp.name}</span>
                    </div>
                    {/* Removed the purple horizontal bar on the group header row */}
                    <div className="px-4 text-[11px] text-[#8A8998]">
                      작업 {grpTasks.length}개
                    </div>
                  </div>

                  {!grp.collapsed &&
                    grpTasks.map((tk) => {
                      const isSel = selectedTaskId === tk.id;
                      const startCol = liveBar?.id === tk.id ? liveBar.startCol : tk.startCol;
                      const spanCols = liveBar?.id === tk.id ? liveBar.spanCols : tk.spanCols;
                      const leftPct = (startCol / cols) * 100;
                      const widthPct = (spanCols / cols) * 100;
                      const barColor = tk.color || '#6A5ACD';
                      let trackRef: HTMLDivElement | null = null;
                      return (
                        <div
                          key={tk.id}
                          onClick={() => {
                            setSelectedTaskId(tk.id);
                            setSelectedGroupId(null);
                          }}
                          className="grid grid-cols-[180px_1fr] border-b border-[#F0EEF7] dark:border-[#2A2938] items-center h-12 hover:bg-[#FAF9FE] dark:hover:bg-[#1E1E29] cursor-pointer"
                        >
                          <div className="pl-7 pr-3 text-xs font-medium truncate">{tk.name}</div>
                          <div
                            ref={(el) => {
                              trackRef = el;
                            }}
                            className="relative h-full flex items-center"
                          >
                            {liveBar?.id === tk.id && (
                              <div
                                style={{ left: `${leftPct + widthPct / 2}%` }}
                                className="bs-animate-fade absolute -top-5 -translate-x-1/2 z-30 px-2 py-0.5 rounded-md bg-[#1B1B1F] text-white text-[10px] font-semibold whitespace-nowrap pointer-events-none shadow"
                              >
                                {formatColDateLabel(startCol)} ~{' '}
                                {formatColDateLabel(Math.max(startCol, startCol + spanCols - 1))}
                              </div>
                            )}
                            <div
                              onMouseDown={(e) => startBarDrag(e, tk, 'move', trackRef)}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                backgroundColor: `${barColor}55`,
                              }}
                              className={`group absolute h-7 rounded-lg overflow-hidden flex items-center transition-[width] duration-200 ${
                                isEditMode ? 'cursor-grab active:cursor-grabbing' : ''
                              } ${isSel ? 'ring-2 ring-[#1B1B1F] dark:ring-white' : ''}`}
                            >
                              <div
                                style={{ width: `${tk.progress}%`, backgroundColor: barColor }}
                                className="h-full transition-[width] duration-240"
                              />
                              <span className="absolute inset-0 px-2 flex items-center justify-between text-[10px] font-bold text-white drop-shadow-xs pointer-events-none truncate">
                                <span>
                                  {formatColDateLabel(startCol)}~
                                  {formatColDateLabel(Math.max(startCol, startCol + spanCols - 1))}
                                </span>
                                <span>{tk.progress}%</span>
                              </span>
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

        {/* Right Group or Task Inspector in Edit Mode */}
        {isEditMode && (selectedTask || selectedGroup) && (
          <aside className="w-[270px] shrink-0 border-l border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-5 flex flex-col gap-3.5 select-none text-xs">
            {selectedGroup && !selectedTask ? (
              <>
                <div>
                  <div className="text-sm font-bold">그룹 수정</div>
                  <div className="text-[11px] text-[#8A8998] mt-0.5">{selectedGroup.name}</div>
                </div>
                <label className="flex items-center justify-between gap-2">
                  <span>그룹 이름</span>
                  <input
                    type="text"
                    value={selectedGroup.name}
                    onChange={(e) =>
                      persist(
                        groups.map((g) =>
                          g.id === selectedGroup.id ? { ...g, name: e.target.value } : g
                        ),
                        tasks
                      )
                    }
                    className="w-36 h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244]"
                  />
                </label>
                {groups.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const remainingGroups = groups.filter((g) => g.id !== selectedGroup.id);
                      const fallbackGrpId = remainingGroups[0].id;
                      persist(
                        remainingGroups,
                        tasks.map((t) =>
                          t.groupId === selectedGroup.id ? { ...t, groupId: fallbackGrpId } : t
                        )
                      );
                      setSelectedGroupId(null);
                    }}
                    className="self-start px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 font-semibold inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    그룹 삭제
                  </button>
                )}
              </>
            ) : selectedTask ? (
              <>
                <div>
                  <div className="text-sm font-bold">작업 수정</div>
                  <div className="text-[11px] text-[#8A8998] mt-0.5">
                    {formatColDateLabel(selectedTask.startCol)} ~{' '}
                    {formatColDateLabel(
                      Math.max(selectedTask.startCol, selectedTask.startCol + selectedTask.spanCols - 1)
                    )}
                  </div>
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
                  <span>소속 그룹</span>
                  <select
                    value={selectedTask.groupId}
                    onChange={(e) =>
                      persist(
                        groups,
                        tasks.map((t) =>
                          t.id === selectedTask.id ? { ...t, groupId: e.target.value } : t
                        )
                      )
                    }
                    className="w-36 h-8 px-2 rounded-lg border border-[#E6E3F0] dark:border-[#323244]"
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center justify-between gap-2">
                  <span>진행률 (%)</span>
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

                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-[#8A8998]">작업 바 색상</span>
                  <div className="flex items-center gap-2">
                    {TASK_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          persist(
                            groups,
                            tasks.map((t) =>
                              t.id === selectedTask.id ? { ...t, color: c } : t
                            )
                          )
                        }
                        className={`w-6 h-6 rounded-md ${
                          (selectedTask.color || '#6A5ACD') === c ? 'ring-2 ring-[#6A5ACD]' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={selectedTask.color || '#6A5ACD'}
                      onChange={(e) =>
                        persist(
                          groups,
                          tasks.map((t) =>
                            t.id === selectedTask.id ? { ...t, color: e.target.value } : t
                          )
                        )
                      }
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                </div>

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
              </>
            ) : null}
          </aside>
        )}
      </div>
    </div>
  );
};
