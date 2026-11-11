import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  Save,
  Star,
  Download,
  Eye,
  Edit3,
  HelpCircle,
  Sun,
  Moon,
  MousePointer,
  PenTool,
  Eraser,
  StickyNote,
  Image as ImageIcon,
  Video,
  Music,
  PlaySquare,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Undo2,
  Redo2,
  Plus,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { useTheme } from '../../../store/ThemeContext';
import { useToast } from '../../toast/ToastContext';
import { exportElementAsPng } from '../../../utils/exportImage';
import { IdeaBoardHelpModal } from './IdeaBoardHelpModal';

// Types for Freeform Canvas Elements
export type ElementType = 'memo' | 'image' | 'video' | 'audio' | 'youtube';

export interface BoardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height?: number;
  title?: string;
  content?: string;
  src?: string;
  color?: string; // For sticky notes: white, lavender, slate, mint, dark (no yellowish tone)
  zIndex: number;
}

export interface DrawingPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

// Custom Styled Audio Player for Idea Board Cards
const BoardAudioPlayer: React.FC<{ src?: string; title?: string }> = ({ src, title }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrentTime(audio.currentTime);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      audio.currentTime = 0;
      setCurrentTime(0);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white dark:bg-[#252433] rounded-2xl border border-slate-200/90 dark:border-[#3A3948] p-4 flex flex-col gap-3 shadow-soft w-full select-none">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-lavender-100 dark:bg-[#352E58] text-lavender-600 dark:text-[#B7A5FF] flex items-center justify-center shrink-0">
            <Music className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs text-slate-800 dark:text-[#F3F2F8] truncate">
            {title || '오디오 트랙'}
          </span>
        </div>
        <button
          type="button"
          onClick={toggleMute}
          className="p-1 rounded-md text-slate-400 dark:text-[#A5A3B5] hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#352E58] transition-colors shrink-0"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Controls & Seekbar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-lavender-600 hover:bg-lavender-700 text-white flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />}
        </button>

        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="relative w-full flex items-center">
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-[#352E58] overflow-hidden">
              <div
                className="h-full bg-lavender-500 rounded-full transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-[#8E8B9E] font-medium px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Initial Sample Dummy Data (Clean tones, NO yellowish tint!)
const INITIAL_ELEMENTS: BoardElement[] = [
  {
    id: 'memo-1',
    type: 'memo',
    x: 120,
    y: 100,
    width: 270,
    title: '💡 세계관 핵심 컨셉 메모',
    content: '- 하늘에 떠 있는 부유섬 "아에테리아"\n- 고대 마력 엔진과 증기기관의 결합\n- 비행선 항로를 순찰하는 아르젠과 카일의 첫 만남 구상',
    color: 'white',
    zIndex: 1,
  },
  {
    id: 'image-1',
    type: 'image',
    x: 430,
    y: 80,
    width: 290,
    title: '도시 컨셉 무드보드',
    src: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    zIndex: 2,
  },
  {
    id: 'memo-2',
    type: 'memo',
    x: 120,
    y: 330,
    width: 270,
    title: '📌 퀘스트 아이디어',
    content: '1. 하층 안개 숲에서 실종된 전송석 탐색\n2. 블랙마켓 상인과의 비밀 거래\n3. 공중 요새 침투 잠입 미션',
    color: 'lavender',
    zIndex: 3,
  },
  {
    id: 'youtube-1',
    type: 'youtube',
    x: 430,
    y: 330,
    width: 340,
    title: '레퍼런스 배경 영상',
    src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    zIndex: 4,
  },
  {
    id: 'audio-1',
    type: 'audio',
    x: 800,
    y: 100,
    width: 320,
    title: '타이틀 테마곡 스케치 (BGM)',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    zIndex: 5,
  },
  {
    id: 'memo-3',
    type: 'memo',
    x: 800,
    y: 260,
    width: 280,
    title: '✨ 시나리오 복선 노트',
    content: '아르젠의 펜던트는 단순한 유품이 아니라 고대 기계의 마지막 기동 키라는 복선 깔아두기.',
    color: 'slate',
    zIndex: 6,
  },
];

// Initial Drawings (Empty by default, No static arrows!)
const INITIAL_DRAWINGS: DrawingPath[] = [];

export const IdeaBoardEditor: React.FC = () => {
  const {
    activeDocument,
    activePage,
    setActiveDocument,
    updateDocumentTitle,
    updatePageContent,
    toggleFavoriteDocument,
    saveStatus,
  } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const { toast, customPrompt } = useToast();

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // View / Edit Mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Document Title state
  const [docTitle, setDocTitle] = useState(activeDocument?.title || '메모 + 아이디어 보드');
  useEffect(() => {
    if (activeDocument) setDocTitle(activeDocument.title);
  }, [activeDocument]);

  const handleTitleBlur = () => {
    if (activeDocument && docTitle.trim() && docTitle !== activeDocument.title) {
      updateDocumentTitle(activeDocument.id, docTitle.trim());
    }
  };

  // Keyboard shortcut Ctrl+E / Cmd+E for View/Edit mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        setIsEditMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Board Canvas State
  const [elements, setElements] = useState<BoardElement[]>(INITIAL_ELEMENTS);
  const [drawings, setDrawings] = useState<DrawingPath[]>(INITIAL_DRAWINGS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-save & Load Sync Refs (불필요한 자동 저장 및 깜빡임 원천 방지)
  const isLoadedForPageIdRef = useRef<string | null>(null);
  const lastSavedJsonRef = useRef<string>('');

  // Load from page content or fallback to initial elements (100% data preservation)
  useEffect(() => {
    if (!activePage) return;

    let initialElements = INITIAL_ELEMENTS;
    let initialDrawings: DrawingPath[] = [];

    if (activePage.content) {
      try {
        if (activePage.content.startsWith('{')) {
          const parsed = JSON.parse(activePage.content);
          if (parsed.elements && Array.isArray(parsed.elements)) {
            initialElements = parsed.elements;
          }
          if (parsed.drawings && Array.isArray(parsed.drawings)) {
            // 기존에 저장되어 있던 고정된 화살표(초기 더미 draw-1) 삭제
            initialDrawings = parsed.drawings.filter((d: any) => d.id !== 'draw-1');
          }
        } else if (activePage.content.trim()) {
          // 기존 텍스트 메모가 있었던 경우 메모 카드로 자동 변환 보존
          initialElements = [
            {
              id: 'legacy-memo-1',
              type: 'memo',
              x: 150,
              y: 120,
              width: 320,
              height: 240,
              title: activePage.title || '기존 메모',
              content: activePage.content,
              color: 'lavender',
              zIndex: 1,
            },
          ];
        }
      } catch {
        // ignore
      }
    }

    setElements(initialElements);
    setDrawings(initialDrawings);

    // 로드된 직후의 상태 JSON을 기록하여 사용자 조작 전 불필요한 자동 저장이 발동하지 않도록 차단
    const loadedJson = JSON.stringify({
      schemaVersion: 2,
      elements: initialElements,
      drawings: initialDrawings,
    });
    lastSavedJsonRef.current = loadedJson;
    isLoadedForPageIdRef.current = activePage.id;
  }, [activePage?.id]);

  // Debounced auto-save: 실제 사용자의 변경이 발생했을 때만 1회 저장
  useEffect(() => {
    if (!activePage) return;
    if (isLoadedForPageIdRef.current !== activePage.id) return;

    const currentJson = JSON.stringify({
      schemaVersion: 2,
      elements,
      drawings,
    });

    // 변경 내용이 없으면 저장하지 않음 (저장 중 깜빡임 방지)
    if (currentJson === lastSavedJsonRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      lastSavedJsonRef.current = currentJson;
      updatePageContent(activePage.id, currentJson);
    }, 600);

    return () => clearTimeout(timer);
  }, [elements, drawings, activePage?.id, updatePageContent]);

  // Tool Modes: 'select' | 'pen' | 'eraser'
  const [activeTool, setActiveTool] = useState<'select' | 'pen' | 'eraser'>('select');
  const [penColor, setPenColor] = useState<string>('#8B5CF6'); // Lavender
  const [penWidth, setPenWidth] = useState<number>(3);

  // Canvas Viewport Pan & Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Drawing in progress (Reactive state for instant real-time stroke rendering)
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const isDrawingRef = useRef(false);

  // Erase drawings near coordinate (Radius: 24px)
  const eraseDrawingsNear = useCallback((x: number, y: number) => {
    setDrawings((prev) =>
      prev.filter((draw) => {
        const isNear = draw.points.some((pt) => {
          const dist = Math.hypot(pt.x - x, pt.y - y);
          return dist < 24;
        });
        return !isNear;
      })
    );
  }, []);

  // Delete single drawing
  const deleteDrawing = (id: string) => {
    setDrawings((prev) => prev.filter((d) => d.id !== id));
  };

  // Dragging Element (Zero-lag 60fps GPU Direct Transform)
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const dragCardRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    mouseStartX: number;
    mouseStartY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Export as PNG
  const handleExportPng = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      await exportElementAsPng(printRef.current, {
        fileName: `${activeDocument?.title || 'idea-board'}-${new Date().toISOString().slice(0, 10)}.png`,
      });
      toast.success('아이디어 보드가 이미지로 저장되었습니다.');
    } catch {
      toast.error('이미지 내보내기에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  // 1. Add Text Memo (Sticky Note)
  const handleAddMemo = (color: string = 'white') => {
    const newElement: BoardElement = {
      id: `memo-${Date.now()}`,
      type: 'memo',
      x: -pan.x + 200 + Math.random() * 60,
      y: -pan.y + 150 + Math.random() * 60,
      width: 270,
      title: '새 메모',
      content: '여기에 자유롭게 아이디어를 작성하세요...',
      color,
      zIndex: elements.length + 1,
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedId(newElement.id);
    setActiveTool('select');
  };

  // 2. Add Image
  const handleAddImage = async () => {
    const url = await customPrompt({
      title: '이미지 추가',
      message: '삽입할 이미지 URL을 입력하세요:',
      placeholder: 'https://...',
      defaultValue: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
      confirmText: '추가',
    });
    if (!url) return;

    const newElement: BoardElement = {
      id: `img-${Date.now()}`,
      type: 'image',
      x: -pan.x + 240,
      y: -pan.y + 180,
      width: 280,
      height: 220,
      title: '이미지 카드',
      src: url.trim(),
      zIndex: elements.length + 1,
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedId(newElement.id);
    setActiveTool('select');
  };

  // 3. Add Video
  const handleAddVideo = async () => {
    const url = await customPrompt({
      title: '동영상 추가',
      message: '삽입할 동영상 파일 URL을 입력하세요:',
      placeholder: 'https://.../video.mp4',
      defaultValue: '',
      confirmText: '추가',
    });
    if (!url) return;

    const newElement: BoardElement = {
      id: `video-${Date.now()}`,
      type: 'video',
      x: -pan.x + 240,
      y: -pan.y + 180,
      width: 320,
      height: 200,
      title: '동영상 클립',
      src: url.trim(),
      zIndex: elements.length + 1,
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedId(newElement.id);
    setActiveTool('select');
  };

  // 4. Add Audio
  const handleAddAudio = async () => {
    const url = await customPrompt({
      title: '사운드 / 오디오 추가',
      message: '삽입할 오디오 URL을 입력하세요:',
      placeholder: 'https://.../audio.mp3',
      defaultValue: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      confirmText: '추가',
    });
    if (!url) return;

    const newElement: BoardElement = {
      id: `audio-${Date.now()}`,
      type: 'audio',
      x: -pan.x + 240,
      y: -pan.y + 180,
      width: 300,
      height: 120,
      title: '새 오디오 트랙',
      src: url.trim(),
      zIndex: elements.length + 1,
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedId(newElement.id);
    setActiveTool('select');
  };

  // 5. Add YouTube
  const handleAddYoutube = async () => {
    const url = await customPrompt({
      title: 'YouTube 영상 추가',
      message: '삽입할 YouTube 동영상 URL을 입력하세요:',
      placeholder: 'https://www.youtube.com/watch?v=...',
      defaultValue: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      confirmText: '추가',
    });
    if (!url) return;

    let embedUrl = url.trim();
    if (embedUrl.includes('watch?v=')) {
      embedUrl = embedUrl.replace('watch?v=', 'embed/');
    } else if (embedUrl.includes('youtu.be/')) {
      embedUrl = embedUrl.replace('youtu.be/', 'www.youtube.com/embed/');
    }

    const newElement: BoardElement = {
      id: `yt-${Date.now()}`,
      type: 'youtube',
      x: -pan.x + 240,
      y: -pan.y + 180,
      width: 340,
      height: 210,
      title: 'YouTube 영상',
      src: embedUrl,
      zIndex: elements.length + 1,
    };
    setElements((prev) => [...prev, newElement]);
    setSelectedId(newElement.id);
    setActiveTool('select');
  };

  // Delete selected element
  const handleDeleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  // Canvas Mouse Events (Pan, Draw, Drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    // 1. Pen Drawing mode
    if (isEditMode && activeTool === 'pen') {
      const rect = canvasContainerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      isDrawingRef.current = true;
      setCurrentStroke([{ x, y }]);
      return;
    }

    // 2. Eraser mode (click to erase lines near cursor)
    if (isEditMode && activeTool === 'eraser') {
      const rect = canvasContainerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      eraseDrawingsNear(x, y);
      return;
    }

    // 3. Middle click or select mode: Pan background
    if (e.button === 1 || activeTool === 'select') {
      const target = e.target as HTMLElement;
      if (
        target === canvasContainerRef.current ||
        target.id === 'canvas-board' ||
        target.tagName === 'svg'
      ) {
        setIsPanning(true);
        startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
        setSelectedId(null);
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPanRef.current.x,
        y: e.clientY - startPanRef.current.y,
      });
      return;
    }

    // Real-time smooth drawing
    if (isDrawingRef.current && activeTool === 'pen') {
      const rect = canvasContainerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      setCurrentStroke((prev) => [...prev, { x, y }]);
      return;
    }

    // Dragging eraser across lines
    if (e.buttons === 1 && isEditMode && activeTool === 'eraser') {
      const rect = canvasContainerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      eraseDrawingsNear(x, y);
      return;
    }

    // Dragging board card element (Zero-lag 60fps GPU Direct Transform)
    if (isDraggingElement && dragCardRef.current) {
      const dx = (e.clientX - dragCardRef.current.mouseStartX) / zoom;
      const dy = (e.clientY - dragCardRef.current.mouseStartY) / zoom;
      const newX = Math.round(dragCardRef.current.startX + dx);
      const newY = Math.round(dragCardRef.current.startY + dy);
      dragCardRef.current.currentX = newX;
      dragCardRef.current.currentY = newY;
      const cardDom = document.getElementById(`board-card-${dragCardRef.current.id}`);
      if (cardDom) {
        cardDom.style.transform = `translate(${newX}px, ${newY}px)`;
      }
      return;
    }
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (dragCardRef.current) {
      const { id, currentX, currentY, startX, startY } = dragCardRef.current;
      if (currentX !== startX || currentY !== startY) {
        setElements((prev) =>
          prev.map((el) => (el.id === id ? { ...el, x: currentX, y: currentY } : el))
        );
      }
      dragCardRef.current = null;
      setIsDraggingElement(false);
    }
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      if (currentStroke.length > 1) {
        setDrawings((prev) => [
          ...prev,
          {
            id: `draw-${Date.now()}`,
            points: currentStroke,
            color: penColor,
            width: penWidth,
          },
        ]);
      }
      setCurrentStroke([]);
    }
  };

  // Start dragging an element
  const handleElementMouseDown = (e: React.MouseEvent, el: BoardElement) => {
    if (!isEditMode) return;
    if (activeTool !== 'select') return;
    e.stopPropagation();
    setSelectedId(el.id);
    setIsDraggingElement(true);
    dragCardRef.current = {
      id: el.id,
      startX: el.x,
      startY: el.y,
      mouseStartX: e.clientX,
      mouseStartY: e.clientY,
      currentX: el.x,
      currentY: el.y,
    };
  };

  // Helper for sticky note color styles (Clean tones, No yellowish tint!)
  const getNoteColorClass = (color?: string) => {
    switch (color) {
      case 'lavender':
        return 'bg-[#F5F3FF] dark:bg-[#25203A] border-[#DDD6FE] dark:border-[#4C3F7A] text-slate-800 dark:text-[#F3F2F8]';
      case 'slate':
      case 'gray':
        return 'bg-[#F8FAFC] dark:bg-[#1E202B] border-[#E2E8F0] dark:border-[#383B4F] text-slate-800 dark:text-[#F3F2F8]';
      case 'mint':
        return 'bg-[#F0FDF4] dark:bg-[#182B23] border-[#BBF7D0] dark:border-[#2F5443] text-slate-800 dark:text-[#F3F2F8]';
      case 'dark':
        return 'bg-[#181822] border-[#36364A] text-white';
      case 'white':
      default:
        return 'bg-white dark:bg-[#1E1E28] border-slate-200 dark:border-[#333344] text-slate-800 dark:text-[#F3F2F8]';
    }
  };

  if (!activeDocument) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8F9FC] dark:bg-[#15151D] relative select-none overflow-hidden transition-colors duration-200">
      {/* 1. Header Bar */}
      <header className="h-14 px-6 border-b border-[#ECEEF3] dark:border-[#3A3948] bg-white dark:bg-[#1E1E27] flex items-center justify-between shrink-0 z-30 shadow-xs transition-colors">
        {/* Left: 목록으로 | 이름 | 파일 형식 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => setActiveDocument(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-xs font-semibold text-slate-700 dark:text-[#E8E7EF] hover:bg-slate-50 dark:hover:bg-[#292936] transition-colors shrink-0"
            title="목록으로 나가기"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400 dark:text-[#A5A3B5]" />
            <span>목록으로</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] shrink-0" />

          {/* Document Title: 보기 모드일 때는 연한 배경을 완전히 없애고 헤더 배경과 100% 동일하게 순수 텍스트로 표시 */}
          {isEditMode ? (
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              placeholder="제목 없는 메모"
              className="text-sm font-bold text-slate-800 dark:text-[#F3F2F8] bg-slate-100/70 dark:bg-[#2A2938] border border-slate-200 dark:border-[#3A3948] px-2.5 py-1 rounded-lg focus:border-lavender-500 focus:outline-none cursor-text truncate max-w-xs md:max-w-md transition-all"
            />
          ) : (
            <span
              className="text-sm font-bold text-slate-800 dark:text-[#F3F2F8] bg-transparent border-0 px-1 py-1 truncate max-w-xs md:max-w-md select-text cursor-default"
            >
              {docTitle || '제목 없는 메모'}
            </span>
          )}

          <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] shrink-0" />

          {/* Template Badge (파일 형식) */}
          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-lavender-100 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] border border-lavender-200/60 dark:border-[#524580] shrink-0">
            메모
          </span>
        </div>

        {/* Right: 보기/편집 | 자동 저장됨 | 다크모드 | 이미지 저장 | 즐겨찾기 | 도움말 */}
        <div className="flex items-center gap-2.5 text-xs text-slate-400 dark:text-[#A5A3B5] shrink-0">
          {/* 1. 보기 / 편집 스위치 */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#292936] border border-slate-200/80 dark:border-[#3A3948]">
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                !isEditMode
                  ? 'bg-white dark:bg-[#1E1E27] text-lavender-600 dark:text-[#B7A5FF] shadow-xs'
                  : 'text-slate-500 dark:text-[#8E8B9E] hover:text-slate-700 dark:hover:text-[#E8E7EF]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>보기</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                isEditMode
                  ? 'bg-lavender-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-[#8E8B9E] hover:text-slate-700 dark:hover:text-[#E8E7EF]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>편집</span>
            </button>
          </div>

          <span className="text-slate-200 dark:text-[#3A3948]">|</span>

          {/* 2. 자동 저장됨 배지 */}
          <div className="flex items-center gap-1.5 text-[11.5px]">
            <Save
              className={`w-3.5 h-3.5 ${
                saveStatus === 'saving'
                  ? 'text-amber-500 animate-pulse'
                  : 'text-slate-400 dark:text-[#A5A3B5]'
              }`}
            />
            <span
              className={
                saveStatus === 'saving'
                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                  : 'text-slate-400 dark:text-[#A5A3B5]'
              }
            >
              {saveStatus === 'saving' ? '저장 중...' : '자동 저장됨'}
            </span>
          </div>

          <span className="text-slate-200 dark:text-[#3A3948]">|</span>

          {/* 3. 다크 모드 토글 */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#3A3948] hover:bg-lavender-50 dark:hover:bg-[#292936] transition-colors"
            title="다크 모드 토글"
          >
            {isDark ? (
              <Moon className="w-3.5 h-3.5 text-[#A995F5]" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            )}
          </button>

          {/* 4. 이미지 저장 버튼 */}
          <button
            onClick={handleExportPng}
            disabled={isExporting}
            title="캔버스 보드 이미지로 저장 (PNG)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#E8E7EF] hover:text-lavender-700 dark:hover:text-[#B7A5FF] hover:bg-lavender-50 dark:hover:bg-[#292936] hover:border-lavender-200 transition-colors text-xs font-medium"
          >
            <Download
              className={`w-3.5 h-3.5 ${
                isExporting ? 'animate-bounce text-lavender-600' : 'text-slate-400 dark:text-[#A5A3B5]'
              }`}
            />
            <span>{isExporting ? '저장 중...' : '이미지 저장'}</span>
          </button>

          {/* 5. 즐겨찾기 버튼 */}
          <button
            onClick={() => toggleFavoriteDocument(activeDocument.id)}
            title="즐겨찾기 토글"
            className={`p-1.5 rounded-lg border transition-colors ${
              activeDocument.isFavorite
                ? 'border-lavender-200 dark:border-[#554884] bg-lavender-50 dark:bg-[#352E58] text-lavender-600 dark:text-[#A995F5]'
                : 'border-slate-200 dark:border-[#3A3948] text-slate-400 dark:text-[#A5A3B5] hover:text-slate-600 dark:hover:text-[#E8E7EF]'
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                activeDocument.isFavorite ? 'fill-lavender-600 dark:fill-[#A995F5]' : ''
              }`}
            />
          </button>

          {/* 6. 도움말 버튼 */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            title="메모 보드 사용법 안내"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#3A3948] hover:bg-lavender-50 dark:hover:bg-[#292936] text-slate-500 hover:text-lavender-600 dark:text-[#A5A3B5] transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Top Canvas Floating Toolbar (Visible ONLY in Edit Mode) */}
      {isEditMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white/95 dark:bg-[#20202C]/95 border border-slate-200/90 dark:border-[#3A3948] shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap flex-nowrap shrink-0 max-w-[95vw] overflow-x-auto">
          {/* Tool Selector: Select / Pen / Eraser */}
          <div className="flex items-center gap-1 pr-2 border-r border-slate-200 dark:border-[#3A3948] flex-nowrap shrink-0">
            <button
              type="button"
              onClick={() => setActiveTool('select')}
              title="선택 & 이동 툴"
              className={`p-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                activeTool === 'select'
                  ? 'bg-lavender-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-100 dark:hover:bg-[#2D2D3D]'
              }`}
            >
              <MousePointer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('pen')}
              title="자유 드로잉 펜"
              className={`p-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                activeTool === 'pen'
                  ? 'bg-lavender-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-100 dark:hover:bg-[#2D2D3D]'
              }`}
            >
              <PenTool className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('eraser')}
              title="지우개 툴"
              className={`p-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 ${
                activeTool === 'eraser'
                  ? 'bg-lavender-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-100 dark:hover:bg-[#2D2D3D]'
              }`}
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Pen Color & Width (Shown when Pen Tool is active) */}
          {activeTool === 'pen' && (
            <div className="flex items-center gap-1.5 px-2 border-r border-slate-200 dark:border-[#3A3948] flex-nowrap shrink-0">
              {['#8B5CF6', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#1E293B'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setPenColor(color)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform whitespace-nowrap shrink-0 ${
                    penColor === color ? 'scale-115 border-white dark:border-slate-800 shadow-xs' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] mx-1" />
              {[2, 4, 8].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setPenWidth(w)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors whitespace-nowrap shrink-0 ${
                    penWidth === w
                      ? 'bg-lavender-100 dark:bg-[#352E58] text-lavender-700 dark:text-white'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>
          )}

          {/* Add Elements: Only the 5 allowed media + Text Memo */}
          <div className="flex items-center gap-1 pr-2 border-r border-slate-200 dark:border-[#3A3948] flex-nowrap shrink-0">
            <button
              type="button"
              onClick={() => handleAddMemo('white')}
              title="텍스트 추가"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-lavender-50 dark:hover:bg-lavender-950/40 text-lavender-700 dark:text-[#B7A5FF] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <StickyNote className="w-3.5 h-3.5" />
              <span>+ 텍스트</span>
            </button>
            <button
              type="button"
              onClick={handleAddImage}
              title="이미지 추가"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>+ 이미지</span>
            </button>
            <button
              type="button"
              onClick={handleAddVideo}
              title="동영상 추가"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Video className="w-3.5 h-3.5" />
              <span>+ 동영상</span>
            </button>
            <button
              type="button"
              onClick={handleAddAudio}
              title="사운드 (오디오) 추가"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Music className="w-3.5 h-3.5" />
              <span>+ 사운드</span>
            </button>
            <button
              type="button"
              onClick={handleAddYoutube}
              title="YouTube 영상 추가"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <PlaySquare className="w-3.5 h-3.5" />
              <span>+ 유튜브</span>
            </button>
          </div>

          {/* Delete Selected Item */}
          {selectedId && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              title="선택된 요소 삭제"
              className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Zoom & View Controls */}
          <div className="flex items-center gap-1 pl-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(1))))}
              title="축소"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#2D2D3D]"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-slate-500 w-9 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.0, Number((z + 0.1).toFixed(1))))}
              title="확대"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-[#2D2D3D]"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              title="100% 뷰 리셋"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-[#2D2D3D]"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Freeform Infinite Canvas Board */}
      <div
        id="canvas-board"
        ref={canvasContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`flex-1 w-full h-full relative overflow-hidden ${
          activeTool === 'pen'
            ? 'cursor-crosshair'
            : activeTool === 'eraser'
            ? 'cursor-cell'
            : isPanning
            ? 'cursor-grabbing'
            : 'cursor-grab'
        }`}
        style={{
          backgroundImage: isDark
            ? 'radial-gradient(#2C2C3D 1.2px, transparent 1.2px)'
            : 'radial-gradient(#CBD5E1 1.2px, transparent 1.2px)',
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* Printable/Exportable Canvas Container */}
        <div
          ref={printRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* SVG Freeform Drawing Layer */}
          <svg className="absolute inset-0 w-[5000px] h-[5000px] overflow-visible pointer-events-none z-10">
            {/* Completed drawings */}
            {drawings.map((draw) => {
              if (draw.points.length < 2) return null;
              const d = draw.points.reduce(
                (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                ''
              );
              return (
                <path
                  key={draw.id}
                  d={d}
                  stroke={draw.color}
                  strokeWidth={draw.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className={
                    isEditMode && activeTool === 'eraser'
                      ? 'pointer-events-auto cursor-pointer hover:opacity-40 transition-opacity'
                      : 'pointer-events-none'
                  }
                  onClick={() => {
                    if (isEditMode && activeTool === 'eraser') {
                      deleteDrawing(draw.id);
                    }
                  }}
                />
              );
            })}

            {/* Real-time Currently drawing stroke */}
            {currentStroke.length > 1 && (
              <path
                d={currentStroke.reduce(
                  (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
                  ''
                )}
                stroke={penColor}
                strokeWidth={penWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </svg>

          {/* Render Elements on Canvas */}
          {elements.map((el) => {
            const isSelected = selectedId === el.id;
            const isThisDragging = isDraggingElement && selectedId === el.id;

            return (
              <div
                key={el.id}
                id={`board-card-${el.id}`}
                onMouseDown={(e) => handleElementMouseDown(e, el)}
                style={{
                  transform: `translate(${el.x}px, ${el.y}px)`,
                  width: `${el.width}px`,
                  zIndex: isThisDragging ? 999 : el.zIndex,
                }}
                className={`absolute pointer-events-auto rounded-2xl select-none h-fit ${
                  isThisDragging
                    ? 'cursor-grabbing ring-2 ring-lavender-500 shadow-2xl transition-none'
                    : isEditMode
                    ? 'cursor-move'
                    : 'cursor-default'
                } ${
                  isSelected && isEditMode && !isThisDragging
                    ? 'ring-2 ring-lavender-500 shadow-xl'
                    : !isThisDragging
                    ? 'hover:shadow-md'
                    : ''
                }`}
              >
                {/* 1. TEXT MEMO (Sticky Note - Clean, Unified Background) */}
                {el.type === 'memo' && (
                  <div className={`p-4 rounded-2xl border flex flex-col h-fit shadow-soft ${getNoteColorClass(el.color)}`}>
                    <div className="flex items-center justify-between pb-2 border-b border-black/5 dark:border-white/10 mb-2">
                      <input
                        type="text"
                        value={el.title || ''}
                        readOnly={!isEditMode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setElements((prev) =>
                            prev.map((item) => (item.id === el.id ? { ...item, title: val } : item))
                          );
                        }}
                        placeholder="제목 없음"
                        className="font-bold text-xs bg-transparent border-0 p-0 focus:outline-none w-full truncate text-slate-800 dark:text-[#F3F2F8]"
                      />
                      {/* Color Picker Chips (Clean Tones: White, Lavender, Slate, Mint) */}
                      {isEditMode && isSelected && (
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          {(['white', 'lavender', 'slate', 'mint'] as const).map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setElements((prev) =>
                                  prev.map((item) => (item.id === el.id ? { ...item, color: c } : item))
                                );
                              }}
                              className={`w-3.5 h-3.5 rounded-full border ${
                                c === 'white'
                                  ? 'bg-white border-slate-300'
                                  : c === 'lavender'
                                  ? 'bg-violet-200 border-violet-400'
                                  : c === 'slate'
                                  ? 'bg-slate-200 border-slate-400'
                                  : 'bg-emerald-200 border-emerald-400'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <textarea
                      value={el.content || ''}
                      readOnly={!isEditMode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setElements((prev) =>
                          prev.map((item) => (item.id === el.id ? { ...item, content: val } : item))
                        );
                      }}
                      placeholder="내용을 입력하세요..."
                      rows={4}
                      className="w-full bg-transparent border-0 p-0 text-xs leading-relaxed focus:outline-none focus:ring-0 resize-none min-h-[90px] text-slate-700 dark:text-[#E8E7EF] shadow-none outline-none"
                    />
                  </div>
                )}

                {/* 2. IMAGE CARD */}
                {el.type === 'image' && (
                  <div className="bg-white dark:bg-[#252433] rounded-2xl border border-slate-200 dark:border-[#3A3948] overflow-hidden flex flex-col p-2 shadow-soft">
                    <img
                      src={el.src}
                      alt={el.title || 'image'}
                      className="w-full h-40 object-cover rounded-xl pointer-events-none"
                    />
                    <div className="pt-2 px-1 text-xs font-semibold text-slate-700 dark:text-[#E8E7EF] truncate">
                      {el.title}
                    </div>
                  </div>
                )}

                {/* 3. VIDEO CARD */}
                {el.type === 'video' && (
                  <div className="bg-white dark:bg-[#252433] rounded-2xl border border-slate-200 dark:border-[#3A3948] overflow-hidden flex flex-col p-2 shadow-soft">
                    <video
                      src={el.src}
                      controls
                      className="w-full h-36 bg-black rounded-xl object-contain"
                    />
                    <div className="pt-2 px-1 text-xs font-semibold text-slate-700 dark:text-[#E8E7EF] truncate">
                      {el.title}
                    </div>
                  </div>
                )}

                {/* 4. AUDIO CARD (Custom Styled BlankSpace Audio Player) */}
                {el.type === 'audio' && (
                  <BoardAudioPlayer src={el.src} title={el.title} />
                )}

                {/* 5. YOUTUBE EMBED */}
                {el.type === 'youtube' && (
                  <div className="bg-white dark:bg-[#252433] rounded-2xl border border-slate-200 dark:border-[#3A3948] overflow-hidden flex flex-col p-2 shadow-soft">
                    <iframe
                      src={el.src}
                      title={el.title || 'YouTube'}
                      className="w-full h-36 rounded-xl border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    <div className="pt-2 px-1 text-xs font-semibold text-slate-700 dark:text-[#E8E7EF] truncate">
                      {el.title}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Help Guide Modal */}
      <IdeaBoardHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
