import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Image as ImageIcon,
  Sparkles,
  Maximize2,
  X,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { generateId } from '../../../utils/id';
import { exportElementAsPng } from '../../../utils/exportImage';

export interface AnimationFrame {
  id: string;
  name: string;
  imageUrl: string;
  durationMs?: number; // Custom duration or default by FPS
}

export interface AnimationData {
  fps: number;
  isLoop: boolean;
  frames: AnimationFrame[];
}

// Sample pixel/action character frames
const SAMPLE_FRAMES: AnimationFrame[] = [
  {
    id: 'f-1',
    name: '대기 모션 1',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'f-2',
    name: '대기 모션 2',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'f-3',
    name: '준비 자세',
    imageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'f-4',
    name: '도약/공격',
    imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=300&auto=format&fit=crop',
  },
];

export const AnimationEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const handleExportImage = async () => {
    if (!previewContainerRef.current || !activeDocument) return;
    await exportElementAsPng(previewContainerRef.current, {
      fileName: `${activeDocument.title}-애니메이션`,
    });
  };

  const [frames, setFrames] = useState<AnimationFrame[]>([]);
  const [fps, setFps] = useState<number>(8);
  const [isLoop, setIsLoop] = useState<boolean>(true);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [showGridBg, setShowGridBg] = useState<boolean>(true);

  // Add Frame Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [frameNameInput, setFrameNameInput] = useState('');
  const [frameUrlInput, setFrameUrlInput] = useState('');

  // Selected Frame in Inspector
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);

  // Animation Loop Timer
  const animTimerRef = useRef<number | null>(null);

  // Load from activePage.content
  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content) as AnimationData;
        if (parsed.frames) {
          setFrames(parsed.frames);
          setFps(parsed.fps || 8);
          setIsLoop(parsed.isLoop !== undefined ? parsed.isLoop : true);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse animation content:', e);
    }

    setFrames(SAMPLE_FRAMES);
    setFps(6);
    setIsLoop(true);
  }, [activePage?.id]);

  // Persist
  const persistAnimation = (newFrames: AnimationFrame[], newFps: number, newLoop: boolean) => {
    if (!activePage) return;
    setSaveStatus('saving');
    const payload: AnimationData = {
      frames: newFrames,
      fps: newFps,
      isLoop: newLoop,
    };
    updatePageContent(activePage.id, JSON.stringify(payload));
    setTimeout(() => setSaveStatus('saved'), 300);
  };

  // Playback tick effect
  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
      return;
    }

    const intervalMs = Math.max(16, Math.floor(1000 / fps));
    animTimerRef.current = window.setInterval(() => {
      setCurrentFrameIndex((prev) => {
        if (prev + 1 >= frames.length) {
          if (!isLoop) {
            setIsPlaying(false);
            return prev;
          }
          return 0;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
    };
  }, [isPlaying, fps, frames.length, isLoop]);

  const togglePlay = () => {
    if (frames.length === 0) return;
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (currentFrameIndex >= frames.length - 1 && !isLoop) {
        setCurrentFrameIndex(0);
      }
      setIsPlaying(true);
    }
  };

  const handleResetPlayback = () => {
    setIsPlaying(false);
    setCurrentFrameIndex(0);
  };

  const handleAddFrame = () => {
    if (!frameUrlInput.trim()) return;
    const newFrame: AnimationFrame = {
      id: `frame-${generateId()}`,
      name: frameNameInput.trim() || `프레임 ${frames.length + 1}`,
      imageUrl: frameUrlInput.trim(),
    };
    const updated = [...frames, newFrame];
    setFrames(updated);
    persistAnimation(updated, fps, isLoop);
    setIsAddModalOpen(false);
    setFrameNameInput('');
    setFrameUrlInput('');
  };

  const handleDeleteFrame = (id: string) => {
    const updated = frames.filter((f) => f.id !== id);
    setFrames(updated);
    persistAnimation(updated, fps, isLoop);
    if (currentFrameIndex >= updated.length) {
      setCurrentFrameIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleDuplicateFrame = (index: number) => {
    const target = frames[index];
    const duplicated: AnimationFrame = {
      ...target,
      id: `frame-${generateId()}`,
      name: `${target.name} (복제)`,
    };
    const updated = [...frames];
    updated.splice(index + 1, 0, duplicated);
    setFrames(updated);
    persistAnimation(updated, fps, isLoop);
  };

  const moveFrame = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= frames.length) return;
    const updated = [...frames];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFrames(updated);
    persistAnimation(updated, fps, isLoop);
    setCurrentFrameIndex(targetIndex);
  };

  const currentFrame = frames[currentFrameIndex] || null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] relative overflow-hidden">
      {/* Header */}
      <SpecialEditorHeader
        saveStatus={saveStatus}
        onExportImage={handleExportImage}
        extraControls={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>프레임 추가</span>
            </button>
          </div>
        }
      />

      {/* Main Split Layout: Top Preview + Bottom Frame Timeline */}
      <div ref={previewContainerRef} className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Top: Animation Preview Screen & Controls */}
        <div className="flex-1 min-h-[320px] p-6 flex flex-col items-center justify-center relative border-b border-slate-200">
          {/* Canvas Box */}
          <div
            className={`w-72 h-72 rounded-3xl border-2 border-slate-300 shadow-soft overflow-hidden flex items-center justify-center relative select-none transition-all ${
              showGridBg
                ? 'bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:16px_16px] bg-[#F8FAFC]'
                : 'bg-white'
            }`}
          >
            {currentFrame ? (
              <img
                src={currentFrame.imageUrl}
                alt={currentFrame.name}
                className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-md"
              />
            ) : (
              <div className="flex flex-col items-center text-slate-400 gap-2">
                <ImageIcon className="w-10 h-10 stroke-1 text-slate-300" />
                <span className="text-xs">등록된 프레임이 없습니다</span>
              </div>
            )}

            {/* Frame Indicator Pill */}
            {frames.length > 0 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-white flex items-center gap-1.5 shadow-sm">
                <span>{currentFrameIndex + 1}</span>
                <span className="text-white/50">/</span>
                <span>{frames.length}</span>
                <span className="text-white/40 text-[10px]">({currentFrame?.name})</span>
              </div>
            )}
          </div>

          {/* Floating Player Control Bar */}
          <div className="mt-5 bg-white border border-slate-200 rounded-2xl p-2.5 shadow-soft flex items-center gap-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              disabled={frames.length === 0}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all shadow-xs ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-lavender-600 hover:bg-lavender-700 disabled:opacity-50'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
            </button>

            {/* Reset Frame */}
            <button
              onClick={handleResetPlayback}
              title="첫 프레임으로 리셋"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-slate-200" />

            {/* Loop Toggle */}
            <button
              onClick={() => {
                const next = !isLoop;
                setIsLoop(next);
                persistAnimation(frames, fps, next);
              }}
              title="반복 재생 (Loop)"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                isLoop
                  ? 'bg-lavender-100 text-lavender-700'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Repeat className="w-4 h-4" />
              <span>루프 {isLoop ? 'ON' : 'OFF'}</span>
            </button>

            <div className="h-5 w-px bg-slate-200" />

            {/* FPS Control */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">{fps} FPS</span>
              <input
                type="range"
                min="1"
                max="30"
                value={fps}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFps(val);
                  persistAnimation(frames, val, isLoop);
                }}
                className="w-24 accent-lavender-600 cursor-pointer"
              />
            </div>

            <div className="h-5 w-px bg-slate-200" />

            {/* Background Grid Toggle */}
            <button
              onClick={() => setShowGridBg(!showGridBg)}
              className={`text-xs px-2.5 py-1.5 rounded-xl border transition-colors ${
                showGridBg
                  ? 'bg-slate-100 text-slate-700 border-slate-300 font-medium'
                  : 'text-slate-400 border-transparent hover:bg-slate-50'
              }`}
            >
              배경 격자
            </button>
          </div>
        </div>

        {/* Bottom: Timeline Frame Strip */}
        <div className="h-56 bg-white p-5 flex flex-col gap-3 shrink-0 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-800">프레임 타임라인</span>
              <span className="text-xs text-slate-400">({frames.length}개 프레임)</span>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1 text-xs text-lavender-600 hover:text-lavender-700 font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 프레임 등록</span>
            </button>
          </div>

          {/* Horizontal Frames Scroller */}
          <div className="flex-1 flex items-center gap-3 overflow-x-auto pb-2 select-none">
            {frames.map((frame, index) => {
              const isCurrent = currentFrameIndex === index;

              return (
                <div
                  key={frame.id}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentFrameIndex(index);
                  }}
                  className={`w-32 h-36 rounded-2xl border-2 shrink-0 p-2 flex flex-col justify-between cursor-pointer transition-all bg-white ${
                    isCurrent
                      ? 'border-lavender-600 ring-4 ring-lavender-100 shadow-md scale-102'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="flex-1 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 relative">
                    <img
                      src={frame.imageUrl}
                      alt={frame.name}
                      className="w-full h-full object-contain p-1"
                    />
                    <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Frame Name */}
                  <div className="mt-1.5 px-0.5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[70px]">
                      {frame.name}
                    </span>

                    {/* Quick Move / Action buttons */}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveFrame(index, 'left');
                        }}
                        disabled={index === 0}
                        className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-20"
                        title="앞으로 이동"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveFrame(index, 'right');
                        }}
                        disabled={index === frames.length - 1}
                        className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-20"
                        title="뒤로 이동"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFrame(frame.id);
                        }}
                        className="p-0.5 text-slate-400 hover:text-rose-500"
                        title="삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty Add Frame Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-32 h-36 rounded-2xl border-2 border-dashed border-slate-300 hover:border-lavender-400 text-slate-400 hover:text-lavender-600 flex flex-col items-center justify-center gap-1.5 shrink-0 bg-slate-50/50 hover:bg-lavender-50/30 transition-all"
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs font-semibold">프레임 추가</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Frame Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800">애니메이션 프레임 추가</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">프레임 이름</label>
                <input
                  type="text"
                  value={frameNameInput}
                  onChange={(e) => setFrameNameInput(e.target.value)}
                  placeholder={`예: 달리기 프레임 ${frames.length + 1}`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  이미지 URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={frameUrlInput}
                  onChange={(e) => setFrameUrlInput(e.target.value)}
                  placeholder="https://example.com/sprite_01.png"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 !bg-white text-slate-800"
                />
              </div>

              {/* Preview Thumbnail */}
              {frameUrlInput.trim() && (
                <div className="mt-2 flex flex-col items-center">
                  <span className="text-[11px] text-slate-400 mb-1">미리보기</span>
                  <div className="w-24 h-24 rounded-xl border border-slate-200 p-1 bg-slate-50 flex items-center justify-center overflow-hidden">
                    <img
                      src={frameUrlInput}
                      alt="preview"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleAddFrame}
                disabled={!frameUrlInput.trim()}
                className="px-5 py-2 rounded-xl bg-lavender-600 hover:bg-lavender-700 disabled:opacity-50 text-xs font-semibold text-white shadow-soft"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

