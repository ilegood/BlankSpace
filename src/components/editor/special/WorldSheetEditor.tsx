import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  Eye,
  Edit3,
  Download,
  Star,
  HelpCircle,
  Save,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  MousePointer2,
  Hand,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Globe,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { useTheme } from '../../../store/ThemeContext';
import { exportElementAsPng } from '../../../utils/exportImage';
import { getCanvasSurfaceColor } from '../../../utils/canvasTheme';
import {
  CanvasDocumentData,
  CanvasElement,
  CanvasElementType,
} from '../../../types/canvas';
import {
  DEFAULT_WORLD_CANVAS,
  WORLD_BUILTIN_TEMPLATES,
  WORLD_TEMPLATE_STORAGE_KEY,
  convertOldDataToWorldCanvas,
} from './worldSheet/defaultWorldPresets';
import { CanvasElementRenderer } from '../canvas/CanvasElementRenderer';
import { CanvasLibrary } from '../canvas/CanvasLibrary';
import { CanvasInspector } from '../canvas/CanvasInspector';
import { WorldSheetHelpModal } from './worldSheet/WorldSheetHelpModal';
import { useToast } from '../../toast/ToastContext';

export const WorldSheetEditor: React.FC = () => {
  const {
    activeDocument,
    activePage,
    setActiveDocument,
    updateDocumentTitle,
    toggleFavoriteDocument,
    updatePageContent,
  } = useWorkspace();
  const { isDark } = useTheme();
  const { toast } = useToast();

  const printRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // 1. View Mode vs Edit Mode (기획서: 기본값은 VIEW 모드)
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [docTitle, setDocTitle] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // 2. Side Panels Toggle
  const [showLibrary, setShowLibrary] = useState<boolean>(true);
  const [showInspector, setShowInspector] = useState<boolean>(true);

  // 3. Canvas Pan & Navigation State
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<'pointer' | 'hand'>('pointer');
  const panStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number }>({
    clientX: 0,
    clientY: 0,
    panX: 0,
    panY: 0,
  });

  // 4. Canvas State
  const [canvasData, setCanvasData] = useState<CanvasDocumentData>(DEFAULT_WORLD_CANVAS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 5. Undo / Redo History
  const [history, setHistory] = useState<CanvasDocumentData[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const isUndoRedoAction = useRef(false);

  // Initialize title
  useEffect(() => {
    if (activeDocument) {
      setDocTitle(activeDocument.title);
    }
  }, [activeDocument]);

  // Load from page content or default
  useEffect(() => {
    if (!activePage) return;
    const content = activePage.content || '';
    try {
      const trimmed = content.trim();
      const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');
      const parsed = looksLikeJson ? JSON.parse(trimmed) : content;
      const converted = convertOldDataToWorldCanvas(parsed);
      setCanvasData(converted);
      setHistory([converted]);
      setHistoryIdx(0);
      return;
    } catch (e) {
      console.warn('Failed to parse world sheet canvas data:', e);
      const preservedText = convertOldDataToWorldCanvas(content);
      setCanvasData(preservedText);
      setHistory([preservedText]);
      setHistoryIdx(0);
      return;
    }
  }, [activePage?.id]);

  // Push history and persist
  const pushState = useCallback(
    (nextData: CanvasDocumentData) => {
      setCanvasData(nextData);

      if (!isUndoRedoAction.current) {
        setHistory((prev) => {
          const sliced = prev.slice(0, historyIdx + 1);
          return [...sliced, nextData];
        });
        setHistoryIdx((prev) => prev + 1);
      }
      isUndoRedoAction.current = false;

      if (!activePage) return;
      setSaveStatus('saving');
      updatePageContent(activePage.id, JSON.stringify(nextData));
      setTimeout(() => setSaveStatus('saved'), 300);
    },
    [activePage, historyIdx, updatePageContent]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIdx > 0) {
      isUndoRedoAction.current = true;
      const prev = history[historyIdx - 1];
      setHistoryIdx((idx) => idx - 1);
      setCanvasData(prev);
      if (activePage) updatePageContent(activePage.id, JSON.stringify(prev));
    }
  }, [history, historyIdx, activePage, updatePageContent]);

  const handleRedo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      isUndoRedoAction.current = true;
      const next = history[historyIdx + 1];
      setHistoryIdx((idx) => idx + 1);
      setCanvasData(next);
      if (activePage) updatePageContent(activePage.id, JSON.stringify(next));
    }
  }, [history, historyIdx, activePage, updatePageContent]);

  // Title Save
  const handleTitleBlurOrEnter = () => {
    if (activeDocument && docTitle.trim() && docTitle !== activeDocument.title) {
      updateDocumentTitle(activeDocument.id, docTitle.trim());
      toast.success('제목이 변경되었습니다.');
    }
  };

  // Zoom Helpers (25% ~ 250%)
  const handleZoomIn = useCallback(() => {
    setCanvasData((prev) => ({
      ...prev,
      zoom: Math.min(250, prev.zoom + 10),
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setCanvasData((prev) => ({
      ...prev,
      zoom: Math.max(25, prev.zoom - 10),
    }));
  }, []);

  const handleResetZoom = useCallback(() => {
    setCanvasData((prev) => ({ ...prev, zoom: 100 }));
  }, []);

  const handleResetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setCanvasData((prev) => ({ ...prev, zoom: 100 }));
    toast.info('화면과 배율(100%)이 초기화되었습니다.');
  }, [toast]);

  const handleFitToScreen = useCallback(() => {
    if (!workspaceRef.current) {
      handleResetView();
      return;
    }
    const rect = workspaceRef.current.getBoundingClientRect();
    const padding = 60;
    const availableW = Math.max(200, rect.width - padding * 2);
    const availableH = Math.max(200, rect.height - padding * 2);
    const scaleW = availableW / canvasData.canvasWidth;
    const scaleH = availableH / canvasData.canvasHeight;
    const fitScale = Math.min(scaleW, scaleH);
    const nextZoom = Math.max(25, Math.min(150, Math.round((fitScale * 100) / 5) * 5));

    setPan({ x: 0, y: 0 });
    setCanvasData((prev) => ({ ...prev, zoom: nextZoom }));
    toast.info(`화면에 맞춤 (${nextZoom}%)`);
  }, [canvasData.canvasWidth, canvasData.canvasHeight, handleResetView, toast]);

  // Pan Handlers
  const handlePanStart = useCallback(
    (clientX: number, clientY: number) => {
      setIsPanning(true);
      panStartRef.current = {
        clientX,
        clientY,
        panX: pan.x,
        panY: pan.y,
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - panStartRef.current.clientX;
        const dy = moveEvent.clientY - panStartRef.current.clientY;
        setPan({
          x: Math.round(panStartRef.current.panX + dx),
          y: Math.round(panStartRef.current.panY + dy),
        });
      };

      const handleMouseUp = () => {
        setIsPanning(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [pan.x, pan.y]
  );

  const handleWorkspaceMouseDown = (e: React.MouseEvent) => {
    const isMiddleClick = e.button === 1;
    const isHandMode = activeTool === 'hand' || isSpacePressed;
    const target = e.target as HTMLElement;
    const isBgClick =
      target.classList.contains('canvas-workspace-bg') || target === workspaceRef.current;
    const isViewModeBg = !isEditMode && !target.closest('button, a, input, textarea');

    if (isMiddleClick || isHandMode || isBgClick || isViewModeBg) {
      if (isBgClick && isEditMode) {
        setSelectedId(null);
      }
      handlePanStart(e.clientX, e.clientY);
    }
  };

  // Wheel Zoom (Ctrl + Wheel) or Pan (Wheel)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 5 : -5;
      setCanvasData((prev) => ({
        ...prev,
        zoom: Math.max(25, Math.min(250, prev.zoom + zoomDelta)),
      }));
    } else {
      setPan((prev) => ({
        x: Math.round(prev.x - (e.shiftKey ? e.deltaY : e.deltaX) * 0.8),
        y: Math.round(prev.y - (e.shiftKey ? 0 : e.deltaY) * 0.8),
      }));
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('input, textarea, [contenteditable="true"]');

      // Mode Toggle: Ctrl+E
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsEditMode((prev) => {
          const next = !prev;
          if (!next) setSelectedId(null);
          toast.info(next ? '편집 모드로 진입했습니다.' : '보기 모드로 전환되었습니다.');
          return next;
        });
        return;
      }

      // Zoom Reset (Ctrl+0)
      if ((e.ctrlKey || e.metaKey) && (e.key === '0' || e.code === 'Digit0')) {
        e.preventDefault();
        handleResetView();
        return;
      }

      // Zoom In (Ctrl + = or +)
      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        handleZoomIn();
        return;
      }

      // Zoom Out (Ctrl + -)
      if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        handleZoomOut();
        return;
      }

      // Spacebar for Pan
      if (e.code === 'Space' && !e.repeat && !isInput) {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }

      // Tool Toggle
      if (!isInput) {
        if (e.key === 'h' || e.key === 'H') {
          setActiveTool((prev) => (prev === 'hand' ? 'pointer' : 'hand'));
          return;
        }
        if (e.key === 'v' || e.key === 'V') {
          setActiveTool('pointer');
          return;
        }
      }

      // View Mode ignores editing hotkeys
      if (!isEditMode) return;
      if (isInput) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault();
          handleDeleteElement(selectedId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedId) {
          e.preventDefault();
          handleDuplicateElement(selectedId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isEditMode,
    selectedId,
    handleUndo,
    handleRedo,
    handleResetView,
    handleZoomIn,
    handleZoomOut,
    toast,
  ]);

  // Update a single element
  const handleUpdateElement = (id: string, updates: Partial<CanvasElement>) => {
    const nextElements = canvasData.elements.map((el) =>
      el.id === id ? { ...el, ...updates } : el
    );
    pushState({ ...canvasData, elements: nextElements });
  };

  // Delete element
  const handleDeleteElement = (id: string) => {
    const nextElements = canvasData.elements.filter((el) => el.id !== id);
    if (selectedId === id) setSelectedId(null);
    pushState({ ...canvasData, elements: nextElements });
    toast.info('구성 요소가 삭제되었습니다.');
  };

  // Duplicate element
  const handleDuplicateElement = (id: string) => {
    const target = canvasData.elements.find((el) => el.id === id);
    if (!target) return;

    const newElement: CanvasElement = {
      ...JSON.parse(JSON.stringify(target)),
      id: `el-${Date.now()}`,
      x: Math.min(target.x + 24, canvasData.canvasWidth - target.width - 20),
      y: Math.min(target.y + 24, canvasData.canvasHeight - target.height - 20),
      zIndex: canvasData.elements.length + 1,
    };

    pushState({
      ...canvasData,
      elements: [...canvasData.elements, newElement],
    });
    setSelectedId(newElement.id);
    toast.success('구성 요소가 복제되었습니다.');
  };

  // Bring to Front / Send to Back
  const handleBringToFront = (id: string) => {
    const maxZ = Math.max(...canvasData.elements.map((el) => el.zIndex), 1);
    handleUpdateElement(id, { zIndex: maxZ + 1 });
  };

  const handleSendToBack = (id: string) => {
    const minZ = Math.min(...canvasData.elements.map((el) => el.zIndex), 1);
    handleUpdateElement(id, { zIndex: Math.max(1, minZ - 1) });
  };

  // Update whole canvas settings
  const handleUpdateCanvas = (updates: Partial<CanvasDocumentData>) => {
    pushState({ ...canvasData, ...updates });
  };

  // Canvas Drag-to-Resize Handles
  const handleCanvasResizeStart = (
    direction: 'e' | 's' | 'se',
    e: React.MouseEvent
  ) => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialWidth = canvasData.canvasWidth;
    const initialHeight = canvasData.canvasHeight;
    const scale = canvasData.zoom / 100;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;

      let nextWidth = initialWidth;
      let nextHeight = initialHeight;

      if (direction === 'e' || direction === 'se') {
        nextWidth = Math.max(800, Math.min(3000, Math.round(initialWidth + deltaX)));
      }
      if (direction === 's' || direction === 'se') {
        nextHeight = Math.max(600, Math.min(4000, Math.round(initialHeight + deltaY)));
      }

      setCanvasData((prev) => ({
        ...prev,
        canvasWidth: nextWidth,
        canvasHeight: nextHeight,
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      pushState({ ...canvasData });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Add Element from Library with Preset
  const handleAddElement = (type: CanvasElementType, defaultPreset?: Partial<CanvasElement>) => {
    const nextZ = canvasData.elements.length + 1;
    let elWidth = defaultPreset?.width || 420;
    let elHeight = defaultPreset?.height || 200;

    const count = canvasData.elements.length;
    const offset = (count % 6) * 32;
    const targetX = Math.max(30, Math.min(canvasData.canvasWidth - elWidth - 30, 40 + offset));
    const targetY = Math.max(30, Math.min(canvasData.canvasHeight - elHeight - 30, 50 + offset));

    const nextCanvasWidth = Math.max(canvasData.canvasWidth, targetX + elWidth + 50);
    const nextCanvasHeight = Math.max(canvasData.canvasHeight, targetY + elHeight + 80);

    const newElement: CanvasElement = {
      id: `el-${Date.now()}`,
      type,
      x: targetX,
      y: targetY,
      width: elWidth,
      height: elHeight,
      zIndex: nextZ,
      style: {
        backgroundColor: type === 'spacer' ? 'transparent' : '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: type === 'spacer' ? 0 : 1,
        borderRadius: 18,
        padding: type === 'character-image' || type === 'image' || type === 'image-card' || type === 'spacer' ? 0 : 16,
        boxShadow: type === 'spacer' ? 'none' : '0 2px 8px rgba(0,0,0,0.03)',
        ...defaultPreset?.style,
      },
      content: {
        title: defaultPreset?.content?.title || '새 카드',
        ...defaultPreset?.content,
      },
    };

    const nextElements = [...canvasData.elements, newElement];
    pushState({
      ...canvasData,
      canvasWidth: nextCanvasWidth,
      canvasHeight: nextCanvasHeight,
      elements: nextElements,
    });
    setSelectedId(newElement.id);
    toast.success('새 컴포넌트가 추가되었습니다.');
  };

  // Export as Image
  const handleExportImage = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      const prevSelected = selectedId;
      setSelectedId(null);
      await new Promise((r) => setTimeout(r, 60));
      await exportElementAsPng(printRef.current, {
        fileName: `${activeDocument?.title || '세계관시트'}`,
        backgroundColor: getCanvasSurfaceColor(canvasData.backgroundColor, isDark),
      });
      toast.success('세계관 시트 이미지가 저장되었습니다.');
      setSelectedId(prevSelected);
    } catch {
      toast.error('이미지 저장 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedElement =
    canvasData.elements.find((el) => el.id === selectedId) || null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#17171D] text-slate-800 dark:text-[#E8E7EF] relative select-none transition-colors">
      {/* 1. Main Sub Header: Navigation, Document Title, View/Edit Mode, Actions */}
      <header className="h-14 px-6 border-b border-slate-200 dark:border-[#3A3948] flex items-center justify-between shrink-0 bg-white dark:bg-[#1E1E27] shadow-2xs z-30 transition-colors">
        {/* Left: Back button + Title input + Template Badge */}
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setActiveDocument(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-xs font-medium text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-50 dark:hover:bg-[#292936] transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400 dark:text-[#A5A3B5]" />
            <span>목록으로</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] shrink-0" />

          {/* Document Title: 보기 모드일 때는 순수 텍스트(수정 차단), 편집 모드일 때만 input */}
          {isEditMode ? (
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              onBlur={handleTitleBlurOrEnter}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleBlurOrEnter();
              }}
              placeholder="세계관 제목을 입력하세요"
              className="text-[15px] font-bold text-slate-800 dark:text-[#E8E7EF] px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#292936] focus:bg-white dark:focus:bg-[#292936] border border-transparent focus:border-lavender-500 transition-colors outline-hidden max-w-md truncate"
            />
          ) : (
            <span className="text-[15px] font-bold text-slate-800 dark:text-[#E8E7EF] px-1 py-0.5 truncate max-w-md bg-transparent border-0 select-text cursor-default">
              {docTitle || '제목 없는 세계관'}
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-lavender-50 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] border border-lavender-200/60 dark:border-[#554884] text-[11px] font-semibold rounded-full shrink-0">
            <Globe className="w-3 h-3" />
            세계관 시트
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-[#262634] p-1 rounded-xl border border-slate-200/80 dark:border-[#3A3948]">
            <button
              type="button"
              onClick={() => {
                setIsEditMode(false);
                setSelectedId(null);
                toast.info('보기 모드로 전환되었습니다.');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                !isEditMode
                  ? 'bg-white dark:bg-[#1E1E27] text-slate-800 dark:text-[#E8E7EF] shadow-2xs'
                  : 'text-slate-500 dark:text-[#8E8B9E] hover:text-slate-700 dark:hover:text-[#E8E7EF]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>보기</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditMode(true);
                toast.info('편집 모드로 진입했습니다.');
              }}
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

          {/* Autosave Badge */}
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

          {/* Export PNG */}
          <button
            onClick={handleExportImage}
            disabled={isExporting}
            title="세계관 시트 이미지로 저장 (PNG)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#E8E7EF] hover:text-lavender-700 dark:hover:text-[#B7A5FF] hover:bg-lavender-50 dark:hover:bg-[#292936] hover:border-lavender-200 transition-colors text-xs font-medium"
          >
            <Download
              className={`w-3.5 h-3.5 ${
                isExporting ? 'animate-bounce text-lavender-600' : 'text-slate-400 dark:text-[#A5A3B5]'
              }`}
            />
            <span>{isExporting ? '저장 중...' : '이미지 저장'}</span>
          </button>

          {/* Favorite Toggle */}
          {activeDocument && (
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
          )}

          {/* Help Modal */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            title="세계관 시트 사용법 및 도움말"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#3A3948] hover:bg-lavender-50 dark:hover:bg-[#292936] text-slate-500 hover:text-lavender-600 dark:text-[#A5A3B5] transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Sub Toolbar: Undo/Redo, Zoom Controls, Panel Toggles */}
      <div className="h-11 bg-white dark:bg-[#1E1E27] border-b border-slate-200 dark:border-[#3A3948] px-4 flex items-center justify-between shrink-0 shadow-2xs z-20 transition-colors">
        {/* Left: Undo, Redo, Element count, Panel toggles in Edit Mode */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="실행 취소 (Ctrl+Z)"
            disabled={!isEditMode || historyIdx <= 0}
            onClick={handleUndo}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-lg transition-colors disabled:opacity-25"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="다시 실행 (Ctrl+Y)"
            disabled={!isEditMode || historyIdx >= history.length - 1}
            onClick={handleRedo}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-lg transition-colors disabled:opacity-25"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-3.5 w-px bg-slate-200 dark:bg-[#3A3948] mx-1" />

          {/* Panel Toggles (Visible only in edit mode) */}
          {isEditMode && (
            <>
              <button
                type="button"
                onClick={() => setShowLibrary((prev) => !prev)}
                title={showLibrary ? '컴포넌트 라이브러리 숨기기' : '컴포넌트 라이브러리 열기'}
                className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  showLibrary
                    ? 'border-lavender-200 dark:border-[#554884] bg-lavender-50 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF]'
                    : 'border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-50 dark:hover:bg-[#292936]'
                }`}
              >
                {showLibrary ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">컴포넌트</span>
              </button>

              <button
                type="button"
                onClick={() => setShowInspector((prev) => !prev)}
                title={showInspector ? '속성 편집창 숨기기' : '속성 편집창 열기'}
                className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  showInspector
                    ? 'border-lavender-200 dark:border-[#554884] bg-lavender-50 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF]'
                    : 'border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-50 dark:hover:bg-[#292936]'
                }`}
              >
                {showInspector ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">속성 편집</span>
              </button>
            </>
          )}

          <span className="text-[11px] text-slate-400 dark:text-[#8E8B9E] ml-2">
            요소 <strong className="text-slate-700 dark:text-[#E8E7EF]">{canvasData.elements.length}</strong>개
          </span>
        </div>

        {/* Center: Pointer vs Hand Pan Tool */}
        <div className="flex items-center bg-slate-100 dark:bg-[#262634] p-0.5 rounded-xl border border-slate-200/80 dark:border-[#3A3948]">
          <button
            type="button"
            onClick={() => setActiveTool('pointer')}
            title="선택 도구 (V)"
            className={`p-1 rounded-lg transition-colors ${
              activeTool === 'pointer'
                ? 'bg-white dark:bg-[#1E1E27] text-lavender-600 shadow-2xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E7EF]'
            }`}
          >
            <MousePointer2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTool('hand')}
            title="화면 이동 도구 (H 또는 스페이스바+드래그)"
            className={`p-1 rounded-lg transition-colors ${
              activeTool === 'hand'
                ? 'bg-white dark:bg-[#1E1E27] text-lavender-600 shadow-2xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-[#E8E7EF]'
            }`}
          >
            <Hand className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Zoom controls, Reset, Fit-to-screen */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-[#A5A3B5]">
          <button
            type="button"
            onClick={handleZoomOut}
            title="축소 (Ctrl + -)"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#292936] rounded-lg transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            title="100% 배율로 초기화"
            className="w-12 text-center font-mono font-medium hover:text-lavender-600 transition-colors text-slate-700 dark:text-[#E8E7EF]"
          >
            {canvasData.zoom}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            title="확대 (Ctrl + +)"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#292936] rounded-lg transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-slate-200 dark:bg-[#3A3948] mx-0.5" />

          <button
            type="button"
            onClick={handleResetView}
            title="화면 위치 및 배율 초기화 (Ctrl+0)"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#292936] rounded-lg transition-colors text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-[#E8E7EF]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleFitToScreen}
            title="캔버스 화면에 맞춤"
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#292936] rounded-lg transition-colors text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-[#E8E7EF]"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Library Panel (Visible ONLY in Edit Mode when open) */}
        {isEditMode && showLibrary && (
          <CanvasLibrary mode="world" onAddElement={handleAddElement} />
        )}

        {/* Center Freeform Canvas Workspace */}
        <div
          ref={workspaceRef}
          onMouseDown={handleWorkspaceMouseDown}
          onWheel={handleWheel}
          className={`canvas-workspace-bg flex-1 bg-[#EEF2F6] dark:bg-[#121217] overflow-hidden relative select-none ${
            isSpacePressed || activeTool === 'hand'
              ? isPanning
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : 'cursor-default'
          }`}
        >
          {/* View Mode Watermark / Notice */}
          {!isEditMode && (
            <div className="absolute top-3 left-4 z-20 pointer-events-none bg-white/80 dark:bg-[#1E1E27]/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-[#3A3948] shadow-2xs text-xs font-semibold text-slate-600 dark:text-[#A5A3B5] flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-lavender-600" />
              <span>보기 모드 (읽기 전용) — 상단의 '편집' 버튼이나 Ctrl+E로 수정할 수 있습니다.</span>
            </div>
          )}

          {/* Pan & Zoom Container */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-75 origin-center pointer-events-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px)`,
            }}
          >
            {/* The Actual Scaled Canvas */}
            <div
              ref={printRef}
              className="blankspace-sheet-canvas relative rounded-xl shadow-sm transition-all duration-75 pointer-events-auto shrink-0"
              style={{
                width: `${canvasData.canvasWidth}px`,
                height: `${canvasData.canvasHeight}px`,
                transform: `scale(${canvasData.zoom / 100})`,
                transformOrigin: 'center center',
                backgroundColor: getCanvasSurfaceColor(canvasData.backgroundColor, isDark),
              }}
            >
              {/* Elements Renderer */}
              {canvasData.elements.map((el) => (
                <CanvasElementRenderer
                  key={el.id}
                  element={el}
                  isSelected={isEditMode && selectedId === el.id}
                  zoom={canvasData.zoom}
                  isViewMode={!isEditMode}
                  onSelect={(id, e) => {
                    if (!isEditMode) return;
                    e.stopPropagation();
                    setSelectedId(id);
                  }}
                  onUpdate={handleUpdateElement}
                  onDelete={handleDeleteElement}
                />
              ))}

              {/* Canvas Resize Handles (Available only in Edit Mode) */}
              {isEditMode && (
                <>
                  <div
                    onMouseDown={(e) => handleCanvasResizeStart('e', e)}
                    className="absolute -right-2 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-lavender-500/20 group flex items-center justify-center"
                    title="캔버스 가로 크기 조절"
                  >
                    <div className="w-1.5 h-8 bg-slate-400 group-hover:bg-lavender-600 rounded-full shadow-xs" />
                  </div>
                  <div
                    onMouseDown={(e) => handleCanvasResizeStart('s', e)}
                    className="absolute left-0 -bottom-2 right-0 h-4 cursor-ns-resize hover:bg-lavender-500/20 group flex items-center justify-center"
                    title="캔버스 세로 크기 조절"
                  >
                    <div className="h-1.5 w-8 bg-slate-400 group-hover:bg-lavender-600 rounded-full shadow-xs" />
                  </div>
                  <div
                    onMouseDown={(e) => handleCanvasResizeStart('se', e)}
                    className="absolute -right-2.5 -bottom-2.5 w-5 h-5 cursor-nwse-resize hover:bg-lavender-500/20 group flex items-center justify-center z-30"
                    title="캔버스 전체 크기 조절"
                  >
                    <div className="w-3 h-3 bg-white border-2 border-slate-400 group-hover:border-lavender-600 rounded-xs shadow-xs" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Inspector Panel (Visible ONLY in Edit Mode when open) */}
        {isEditMode && showInspector && (
          <CanvasInspector
            selectedElement={selectedElement}
            canvasData={canvasData}
            templateStorageKey={WORLD_TEMPLATE_STORAGE_KEY}
            builtinTemplates={WORLD_BUILTIN_TEMPLATES}
            defaultTemplateName="내 세계관 시트 템플릿"
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleDuplicateElement}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
            onUpdateCanvas={handleUpdateCanvas}
            onLoadCanvasData={(data) => {
              pushState(data);
              toast.success('세계관 템플릿이 적용되었습니다.');
            }}
          />
        )}
      </div>

      {/* 4. Help Modal */}
      <WorldSheetHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
