import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Undo2, Eraser } from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { EditorHeader } from '../EditorHeader';

type MemoTool = 'text' | 'image' | 'video' | 'audio' | 'youtube' | 'draw';

interface MemoBoardElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'youtube';
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  mediaUrl?: string;
}

interface DrawStroke {
  id: string;
  points: { x: number; y: number }[];
  color?: string;
  width?: number;
}

const DEFAULT_MEMO_ITEMS: MemoBoardElement[] = [
  { id: 'mb-1', type: 'text', x: 110, y: 60, w: 220, h: 105, text: '아이디어와 메모를 자유롭게 배치하세요.' },
  { id: 'mb-2', type: 'audio', x: 355, y: 60, w: 185, h: 95, text: '음성 메모' },
  { id: 'mb-3', type: 'image', x: 110, y: 205, w: 175, h: 140 },
  { id: 'mb-4', type: 'youtube', x: 305, y: 205, w: 220, h: 145, text: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
];

const DEFAULT_STROKES: DrawStroke[] = [
  {
    id: 'st-1',
    color: '#6A5ACD',
    width: 3,
    points: [
      { x: 560, y: 310 },
      { x: 600, y: 270 },
      { x: 645, y: 290 },
      { x: 695, y: 215 },
      { x: 745, y: 255 },
      { x: 775, y: 305 },
    ],
  },
];

const DRAW_COLORS = ['#6A5ACD', '#1B1B1F', '#E11D48', '#059669'];
const DRAW_WIDTHS = [2, 4, 7];

function getYoutubeEmbedUrl(raw?: string): string | null {
  if (!raw) return null;
  const m = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export const MemoBoardEditor: React.FC<{ templateOverrideId?: string | null }> = ({
  templateOverrideId,
}) => {
  const { activeDocument, activePage, openDocument, openTemplateEditor, updateDocument, updatePage } =
    useWorkspace();

  const isTemplateMode = Boolean(templateOverrideId);
  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [activeTool, setActiveTool] = useState<MemoTool>('text');
  const [drawColor, setDrawColor] = useState(DRAW_COLORS[0]);
  const [drawWidth, setDrawWidth] = useState(DRAW_WIDTHS[1]);
  const [isEraser, setIsEraser] = useState(false);
  const [items, setItems] = useState<MemoBoardElement[]>(DEFAULT_MEMO_ITEMS);
  const [strokes, setStrokes] = useState<DrawStroke[]>(DEFAULT_STROKES);
  const [selectedId, setSelectedId] = useState<string | null>('mb-3');
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[] | null>(null);
  const [liveBox, setLiveBox] = useState<{
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioPlayerRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (activePage?.content) {
      try {
        const parsed = JSON.parse(activePage.content);
        if (Array.isArray(parsed.items)) {
          setItems(parsed.items);
          setStrokes(parsed.strokes || []);
          return;
        }
      } catch {
        // ignore
      }
    }
    setItems(DEFAULT_MEMO_ITEMS);
    setStrokes(DEFAULT_STROKES);
  }, [activePage?.id]);

  const persist = (nextItems: MemoBoardElement[], nextStrokes = strokes) => {
    setItems(nextItems);
    setStrokes(nextStrokes);
    if (activePage) {
      updatePage(activePage.id, {
        content: JSON.stringify({ items: nextItems, strokes: nextStrokes }),
      });
    }
  };

  useEffect(() => {
    if (!isEditMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && strokes.length > 0) {
        e.preventDefault();
        persist(items, strokes.slice(0, -1));
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        persist(items.filter((x) => x.id !== selectedId));
        setSelectedId(null);
      }
    };
    const onPaste = (e: ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (!files || files.length === 0) return;
      const img = Array.from(files).find((f) => f.type.startsWith('image/'));
      if (!img) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const item: MemoBoardElement = {
            id: `mb-${Date.now()}`,
            type: 'image',
            x: 180 + (items.length % 4) * 28,
            y: 120 + (items.length % 4) * 28,
            w: 210,
            h: 155,
            mediaUrl: reader.result,
          };
          persist([...items, item]);
          setSelectedId(item.id);
        }
      };
      reader.readAsDataURL(img);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('paste', onPaste);
    };
  }, [isEditMode, items, strokes, selectedId]);

  const addToolItem = (tool: Exclude<MemoTool, 'draw'>) => {
    if (tool === 'image' || tool === 'audio' || tool === 'video') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = tool === 'image' ? 'image/*' : tool === 'audio' ? 'audio/*' : 'video/*';
      input.onchange = () => {
        const f = input.files?.[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          if (typeof r.result !== 'string') return;
          const item: MemoBoardElement = {
            id: `mb-${Date.now()}`,
            type: tool,
            x: 160 + (items.length % 4) * 28,
            y: 90 + (items.length % 4) * 28,
            w: 220,
            h: tool === 'audio' ? 95 : 155,
            text: f.name,
            mediaUrl: r.result,
          };
          persist([...items, item]);
          setSelectedId(item.id);
        };
        r.readAsDataURL(f);
      };
      input.click();
      return;
    }

    const item: MemoBoardElement = {
      id: `mb-${Date.now()}`,
      type: tool,
      x: 160 + (items.length % 4) * 28,
      y: 90 + (items.length % 4) * 28,
      w: 220,
      h: tool === 'text' ? 110 : 150,
      text: tool === 'youtube' ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : '새 메모',
    };
    persist([...items, item]);
    setSelectedId(item.id);
  };

  const togglePlayAudio = (item: MemoBoardElement) => {
    audioPlayerRef.current?.pause();
    if (playingAudioId === item.id) {
      setPlayingAudioId(null);
      return;
    }
    setPlayingAudioId(item.id);
    if (item.mediaUrl) {
      const audio = new Audio(item.mediaUrl);
      audioPlayerRef.current = audio;
      audio.play().catch(() => {});
      audio.onended = () => setPlayingAudioId(null);
    } else {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.5);
        }
      } catch {
        // ignore
      }
      window.setTimeout(() => setPlayingAudioId(null), 600);
    }
  };

  const selectedItem = items.find((i) => i.id === selectedId) || null;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#15151C]">
      <EditorHeader
        title={isTemplateMode ? '메모 (템플릿)' : activeDocument?.title || '메모'}
        onTitleChange={(t) => activeDocument && updateDocument(activeDocument.id, { title: t })}
        templateType="general-idea-board"
        isEditMode={isEditMode}
        onChangeMode={setIsEditMode}
        onExit={() => (isTemplateMode ? openTemplateEditor(null) : openDocument(null))}
        isTemplateMode={isTemplateMode}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div
          onMouseDown={(e) => {
            if (!isEditMode || activeTool !== 'draw') {
              if ((e.target as HTMLElement) === e.currentTarget) setSelectedId(null);
              return;
            }
            if (isEraser) return;
            const rect = e.currentTarget.getBoundingClientRect();
            setDrawingPoints([
              {
                x: e.clientX - rect.left + e.currentTarget.scrollLeft,
                y: e.clientY - rect.top + e.currentTarget.scrollTop,
              },
            ]);
          }}
          onMouseMove={(e) => {
            if (!drawingPoints) return;
            const rect = e.currentTarget.getBoundingClientRect();
            setDrawingPoints((prev) =>
              prev
                ? [
                    ...prev,
                    {
                      x: e.clientX - rect.left + e.currentTarget.scrollLeft,
                      y: e.clientY - rect.top + e.currentTarget.scrollTop,
                    },
                  ]
                : null
            );
          }}
          onMouseUp={() => {
            if (drawingPoints && drawingPoints.length > 1) {
              persist(items, [
                ...strokes,
                {
                  id: `st-${Date.now()}`,
                  points: drawingPoints,
                  color: drawColor,
                  width: drawWidth,
                },
              ]);
            }
            setDrawingPoints(null);
          }}
          onDragOver={(e) => {
            if (isEditMode) e.preventDefault();
          }}
          onDrop={(e) => {
            if (!isEditMode) return;
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => {
              if (typeof r.result !== 'string') return;
              const kind: MemoBoardElement['type'] = f.type.startsWith('audio/')
                ? 'audio'
                : f.type.startsWith('video/')
                  ? 'video'
                  : 'image';
              const item: MemoBoardElement = {
                id: `mb-${Date.now()}`,
                type: kind,
                x: 180,
                y: 120,
                w: 220,
                h: kind === 'audio' ? 95 : 155,
                text: f.name,
                mediaUrl: r.result,
              };
              persist([...items, item]);
            };
            r.readAsDataURL(f);
          }}
          className={`flex-1 relative overflow-auto canvas-dot-grid ${
            isEditMode && activeTool === 'draw' ? 'cursor-crosshair' : ''
          }`}
        >
          {/* Left Floating Tool Palette */}
          {isEditMode && (
            <div
              data-export-ignore="true"
              onMouseDown={(e) => e.stopPropagation()}
              className="fixed top-20 left-16 z-30 w-32 rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] p-2.5 shadow-md flex flex-col gap-1 text-xs"
            >
              {[
                { id: 'text' as const, label: '텍스트' },
                { id: 'image' as const, label: '이미지' },
                { id: 'video' as const, label: '영상' },
                { id: 'audio' as const, label: '오디오' },
                { id: 'youtube' as const, label: 'YouTube' },
                { id: 'draw' as const, label: '그리기' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTool(t.id);
                    if (t.id !== 'draw') {
                      setIsEraser(false);
                      addToolItem(t.id);
                    }
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl font-medium transition-colors ${
                    activeTool === t.id
                      ? 'bg-[#F3F1FB] dark:bg-[#2C2845] text-[#6A5ACD] font-semibold'
                      : 'text-[#4E4D59] dark:text-[#B4B2C4] hover:bg-black/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}

              {/* Drawing Sub-controls: 4 colors, 3 stroke widths, eraser */}
              {activeTool === 'draw' && (
                <div className="mt-1.5 pt-2 border-t border-[#F0EEF7] dark:border-[#2A2938] flex flex-col gap-2">
                  <div className="text-[10.5px] font-semibold text-[#8A8998] px-1">펜 색상 (4종)</div>
                  <div className="flex items-center justify-between px-1">
                    {DRAW_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setDrawColor(c);
                          setIsEraser(false);
                        }}
                        className={`w-5 h-5 rounded-full border border-black/15 ${
                          !isEraser && drawColor === c ? 'ring-2 ring-[#6A5ACD]' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="text-[10.5px] font-semibold text-[#8A8998] px-1">굵기 (3종)</div>
                  <div className="grid grid-cols-3 gap-1">
                    {DRAW_WIDTHS.map((w, idx) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => {
                          setDrawWidth(w);
                          setIsEraser(false);
                        }}
                        className={`py-1 rounded-lg border text-[10.5px] font-semibold ${
                          !isEraser && drawWidth === w
                            ? 'border-[#6A5ACD] bg-[#F3F1FB] text-[#6A5ACD]'
                            : 'border-[#E6E3F0] dark:border-[#323244]'
                        }`}
                      >
                        {idx === 0 ? '얇게' : idx === 1 ? '보통' : '굵게'}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEraser((p) => !p)}
                    className={`w-full py-1.5 px-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 ${
                      isEraser
                        ? 'bg-[#6A5ACD] text-white border-[#6A5ACD]'
                        : 'border-[#E6E3F0] dark:border-[#323244] text-[#6E6D7A]'
                    }`}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    지우개 {isEraser ? '(켜짐)' : ''}
                  </button>
                </div>
              )}

              {strokes.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    persist(items, strokes.slice(0, -1));
                  }}
                  className="mt-1 pt-1.5 border-t border-[#F0EEF7] dark:border-[#2A2938] w-full text-left px-2 py-1 text-[11px] text-[#6E6D7A] hover:text-[#6A5ACD] flex items-center gap-1"
                >
                  <Undo2 className="w-3 h-3" />
                  선 취소
                </button>
              )}
            </div>
          )}

          {/* Freehand SVG Layer */}
          <svg
            className={`absolute inset-0 min-w-[1400px] min-h-[900px] ${
              isEditMode && activeTool === 'draw' && isEraser
                ? 'pointer-events-auto'
                : 'pointer-events-none'
            }`}
          >
            {strokes.map((st) => (
              <polyline
                key={st.id}
                fill="none"
                stroke={st.color || '#6A5ACD'}
                strokeWidth={st.width || 3}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={st.points.map((p) => `${p.x},${p.y}`).join(' ')}
                onClick={(e) => {
                  if (isEditMode && activeTool === 'draw' && isEraser) {
                    e.stopPropagation();
                    persist(
                      items,
                      strokes.filter((s) => s.id !== st.id)
                    );
                  }
                }}
                onMouseEnter={(e) => {
                  if (isEditMode && activeTool === 'draw' && isEraser && e.buttons === 1) {
                    persist(
                      items,
                      strokes.filter((s) => s.id !== st.id)
                    );
                  }
                }}
                className={
                  isEditMode && activeTool === 'draw' && isEraser
                    ? 'cursor-pointer hover:opacity-50'
                    : ''
                }
              />
            ))}
            {drawingPoints && (
              <polyline
                fill="none"
                stroke={drawColor}
                strokeWidth={drawWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={drawingPoints.map((p) => `${p.x},${p.y}`).join(' ')}
              />
            )}
          </svg>

          {/* Board Items */}
          {items.map((item) => {
            const isSel = selectedId === item.id;
            const rx = liveBox?.id === item.id ? liveBox.x : item.x;
            const ry = liveBox?.id === item.id ? liveBox.y : item.y;
            const rw = liveBox?.id === item.id ? liveBox.w : item.w;
            const rh = liveBox?.id === item.id ? liveBox.h : item.h;

            const startDrag = (e: React.MouseEvent) => {
              if (!isEditMode || activeTool === 'draw' || e.button !== 0) return;
              if ((e.target as HTMLElement).closest('textarea, button, video, iframe, [data-resize-handle]'))
                return;
              e.stopPropagation();
              setSelectedId(item.id);
              const sx = e.clientX;
              const sy = e.clientY;
              const ox = item.x;
              const oy = item.y;
              let moved = false;
              let fx = ox;
              let fy = oy;

              const onMove = (ev: MouseEvent) => {
                if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 5) return;
                moved = true;
                fx = Math.max(12, Math.round(ox + ev.clientX - sx));
                fy = Math.max(12, Math.round(oy + ev.clientY - sy));
                setLiveBox({ id: item.id, x: fx, y: fy, w: item.w, h: item.h });
              };
              const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
                setLiveBox(null);
                if (moved) persist(items.map((x) => (x.id === item.id ? { ...x, x: fx, y: fy } : x)));
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            };

            const startResize = (e: React.MouseEvent) => {
              if (!isEditMode || e.button !== 0) return;
              e.stopPropagation();
              const sx = e.clientX;
              const sy = e.clientY;
              const ow = item.w;
              const oh = item.h;
              let fw = ow;
              let fh = oh;
              const onMove = (ev: MouseEvent) => {
                fw = Math.max(120, Math.round(ow + ev.clientX - sx));
                fh = Math.max(70, Math.round(oh + ev.clientY - sy));
                setLiveBox({ id: item.id, x: item.x, y: item.y, w: fw, h: fh });
              };
              const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
                setLiveBox(null);
                if (fw !== ow || fh !== oh) {
                  persist(items.map((x) => (x.id === item.id ? { ...x, w: fw, h: fh } : x)));
                }
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            };

            const ytEmbed = item.type === 'youtube' ? getYoutubeEmbedUrl(item.text || item.mediaUrl) : null;

            return (
              <div
                key={item.id}
                onMouseDown={startDrag}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEditMode) setSelectedId(item.id);
                }}
                style={{ left: rx, top: ry, width: rw, height: rh }}
                className={`absolute rounded-2xl p-3.5 transition-shadow overflow-hidden ${
                  isEditMode && activeTool !== 'draw' ? 'cursor-move' : ''
                } ${
                  item.type === 'text'
                    ? 'bg-white dark:bg-[#1E1E29] border border-[#E6E3F0] dark:border-[#2E2D3D]'
                    : item.type === 'audio'
                      ? 'bg-white dark:bg-[#1E1E29] border border-[#E6E3F0] dark:border-[#2E2D3D] flex items-center justify-center gap-3'
                      : 'bg-[#EBE8F5] dark:bg-[#262438] border border-[#DCD8EC] dark:border-[#35334C] flex flex-col items-center justify-center'
                } ${isSel && isEditMode ? 'ring-2 ring-[#6A5ACD]' : ''}`}
              >
                {isEditMode && isSel && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        persist(items.filter((x) => x.id !== item.id));
                        setSelectedId(null);
                      }}
                      className="absolute top-1.5 right-1.5 z-20 w-5 h-5 rounded-full bg-[#1B1B1F] text-white flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <span
                      data-resize-handle="true"
                      onMouseDown={startResize}
                      className="absolute bottom-1 right-1 z-20 w-3 h-3 rounded-xs bg-white border-2 border-[#6A5ACD] cursor-nwse-resize"
                    />
                  </>
                )}

                {item.type === 'text' && (
                  <textarea
                    readOnly={!isEditMode}
                    value={item.text || ''}
                    onChange={(e) =>
                      persist(
                        items.map((x) => (x.id === item.id ? { ...x, text: e.target.value } : x))
                      )
                    }
                    className="w-full h-full bg-transparent text-xs text-[#1B1B1F] dark:text-[#F1F0F6] resize-none focus:outline-none"
                  />
                )}

                {item.type === 'image' &&
                  (item.mediaUrl ? (
                    <img
                      src={item.mediaUrl}
                      alt={item.text || ''}
                      className="bs-animate-fade w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <span className="text-[11px] text-[#6E6D7A]">이미지 (우측에서 업로드)</span>
                  ))}

                {item.type === 'audio' && (
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlayAudio(item);
                      }}
                      className="w-8 h-8 rounded-full bg-[#6A5ACD] text-white flex items-center justify-center shrink-0"
                    >
                      {playingAudioId === item.id ? (
                        <Pause className="w-3.5 h-3.5 fill-white" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      )}
                    </button>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-semibold truncate max-w-[110px]">
                        {item.text || '오디오 메모'}
                      </span>
                      <div className="flex items-end gap-0.5 h-4 mt-0.5">
                        {[6, 12, 9, 16, 10, 14, 7, 13].map((h, idx) => (
                          <span
                            key={idx}
                            style={{ height: h }}
                            className={`w-1 rounded-full bg-[#9A8FE6] ${
                              playingAudioId === item.id ? 'animate-pulse' : ''
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {item.type === 'video' &&
                  (item.mediaUrl ? (
                    <video
                      src={item.mediaUrl}
                      controls
                      className="w-full h-full object-contain rounded-xl bg-black"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-8 h-8 rounded-full bg-[#6A5ACD] text-white flex items-center justify-center">
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      </div>
                      <span className="text-[11px] text-[#6E6D7A]">영상 (우측에서 업로드)</span>
                    </div>
                  ))}

                {item.type === 'youtube' &&
                  (ytEmbed ? (
                    <iframe
                      src={ytEmbed}
                      title={item.text || 'YouTube'}
                      className="w-full h-full rounded-xl border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-9 h-9 rounded-full bg-[#6A5ACD] text-white flex items-center justify-center">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                      <span className="text-[11px] text-[#6E6D7A] dark:text-[#9E9CAF] text-center truncate max-w-[160px]">
                        {item.text || 'YouTube URL을 입력하세요'}
                      </span>
                    </div>
                  ))}
              </div>
            );
          })}

          <div className="fixed bottom-4 right-6 text-[11px] text-[#8A8998]">
            붙여넣기(Ctrl+V)나 끌어다 놓기로도 추가할 수 있습니다
          </div>
        </div>

        {/* Right Inspector Panel in Edit Mode for selected Memo item */}
        {isEditMode && selectedItem && (
          <aside className="w-[260px] shrink-0 border-l border-[#EAE7F2] dark:border-[#2C2B3B] bg-white dark:bg-[#181822] p-5 flex flex-col gap-3.5 select-none text-xs">
            <div className="text-sm font-bold">메모 항목 수정</div>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-[#8A8998]">
                {selectedItem.type === 'youtube' ? 'YouTube URL' : '내용 / 제목'}
              </span>
              <input
                type="text"
                value={selectedItem.text || ''}
                onChange={(e) =>
                  persist(
                    items.map((x) =>
                      x.id === selectedItem.id ? { ...x, text: e.target.value } : x
                    )
                  )
                }
                placeholder={
                  selectedItem.type === 'youtube'
                    ? 'https://www.youtube.com/watch?v=...'
                    : '제목 또는 메모'
                }
                className="h-8 px-2.5 rounded-lg border border-[#E6E3F0] dark:border-[#323244] bg-white dark:bg-[#1E1E29]"
              />
            </label>

            {(selectedItem.type === 'image' ||
              selectedItem.type === 'video' ||
              selectedItem.type === 'audio') && (
              <button
                type="button"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept =
                    selectedItem.type === 'image'
                      ? 'image/*'
                      : selectedItem.type === 'audio'
                        ? 'audio/*'
                        : 'video/*';
                  input.onchange = () => {
                    const f = input.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = () => {
                      if (typeof r.result === 'string') {
                        persist(
                          items.map((x) =>
                            x.id === selectedItem.id
                              ? { ...x, mediaUrl: r.result as string, text: f.name }
                              : x
                          )
                        );
                      }
                    };
                    r.readAsDataURL(f);
                  };
                  input.click();
                }}
                className="h-8 px-3 rounded-xl bg-[#6A5ACD] text-white font-semibold"
              >
                파일 업로드 / 교체
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                persist(items.filter((x) => x.id !== selectedItem.id));
                setSelectedId(null);
              }}
              className="self-start px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 font-semibold"
            >
              삭제
            </button>
          </aside>
        )}
      </div>
    </div>
  );
};
