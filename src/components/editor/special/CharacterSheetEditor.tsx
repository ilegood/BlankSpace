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
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { useTheme } from '../../../store/ThemeContext';
import { exportElementAsPng } from '../../../utils/exportImage';
import {
  CanvasDocumentData,
  CanvasElement,
  CanvasElementType,
} from '../../../types/canvas';
import {
  DEFAULT_CHARACTER_CANVAS,
  convertOldDataToCanvas,
} from '../canvas/defaultPresets';
import { CanvasElementRenderer } from '../canvas/CanvasElementRenderer';
import { CanvasLibrary } from '../canvas/CanvasLibrary';
import { CanvasInspector } from '../canvas/CanvasInspector';
import { CharacterSheetHelpModal } from './CharacterSheetHelpModal';
import { useToast } from '../../toast/ToastContext';

export const CharacterSheetEditor: React.FC = () => {
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

  // View Mode vs Edit Mode (Requirement 3: Default is VIEW mode)
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [docTitle, setDocTitle] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Side panels toggle in edit mode
  const [showLibrary, setShowLibrary] = useState<boolean>(true);
  const [showInspector, setShowInspector] = useState<boolean>(true);

  // Canvas Pan & Navigation State
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

  // Canvas State
  const [canvasData, setCanvasData] = useState<CanvasDocumentData>(
    DEFAULT_CHARACTER_CANVAS
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Undo / Redo History
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
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        const converted = convertOldDataToCanvas(parsed);
        setCanvasData(converted);
        setHistory([converted]);
        setHistoryIdx(0);
        return;
      }
    } catch {}
    setCanvasData(DEFAULT_CHARACTER_CANVAS);
    setHistory([DEFAULT_CHARACTER_CANVAS]);
    setHistoryIdx(0);
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
      if (e.button === 0 || e.button === 1) {
        e.preventDefault();
        if (isBgClick && isEditMode) {
          setSelectedId(null);
        }
        handlePanStart(e.clientX, e.clientY);
      }
    }
  };

  // Native non-passive Wheel listener for Zoom (Ctrl+Wheel) & Pan (Trackpad/Wheel)
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // 1. Zoom with Ctrl or trackpad pinch
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 5 : -5;
        setCanvasData((prev) => {
          const nextZoom = Math.max(25, Math.min(250, prev.zoom + zoomDelta));
          return { ...prev, zoom: nextZoom };
        });
        return;
      }

      // 2. Pan with normal wheel or 2-finger scroll
      e.preventDefault();
      setPan((prev) => ({
        x: Math.round(prev.x - (e.shiftKey ? e.deltaY : e.deltaX)),
        y: Math.round(prev.y - (e.shiftKey ? 0 : e.deltaY)),
      }));
    };

    ws.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      ws.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  // Keyboard Shortcuts: Delete, Duplicate, Undo/Redo, Mode Toggle (Ctrl+E), Space Pan, H, V, Zoom shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('input, textarea, [contenteditable="true"]');

      // Mode Toggle Shortcut: Ctrl+E (or Cmd+E)
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

      // Spacebar for Pan (when not typing in an input)
      if (e.code === 'Space' && !e.repeat && !isInput) {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }

      // Tool toggle shortcuts (when not typing in an input)
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

    const handleWindowBlur = () => {
      setIsSpacePressed(false);
      setIsPanning(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [
    isEditMode,
    selectedId,
    canvasData,
    historyIdx,
    history,
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

  // 1. Interactive Canvas Drag-to-Resize Handles with Position Anchor Compensation
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
    const initialPanX = pan.x;
    const initialPanY = pan.y;
    const scale = canvasData.zoom / 100;

    let currentW = initialWidth;
    let currentH = initialHeight;
    let currentPanX = initialPanX;
    let currentPanY = initialPanY;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      if (direction === 'e' || direction === 'se') {
        currentW = Math.max(600, Math.min(3000, Math.round((initialWidth + dx) / 10) * 10));
        currentPanX = initialPanX + ((currentW - initialWidth) / 2) * scale;
      }
      if (direction === 's' || direction === 'se') {
        currentH = Math.max(400, Math.min(4000, Math.round((initialHeight + dy) / 10) * 10));
        currentPanY = initialPanY + ((currentH - initialHeight) / 2) * scale;
      }

      setCanvasData((prev) => ({
        ...prev,
        canvasWidth: currentW,
        canvasHeight: currentH,
      }));
      setPan({ x: Math.round(currentPanX), y: Math.round(currentPanY) });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      pushState({
        ...canvasData,
        canvasWidth: currentW,
        canvasHeight: currentH,
      });
      setPan({ x: Math.round(currentPanX), y: Math.round(currentPanY) });
      toast.success(`캔버스 크기: ${currentW} × ${currentH} px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // 2. Add Element from Library with Safe Positioning and Canvas Auto-Expansion
  const handleAddElement = (type: CanvasElementType) => {
    const nextZ = canvasData.elements.length + 1;
    let elWidth = 400;
    let elHeight = 160;

    switch (type) {
      case 'character-image': elWidth = 280; elHeight = 380; break;
      case 'name-badge': elWidth = 540; elHeight = 80; break;
      case 'info-card': elWidth = 540; elHeight = 180; break;
      case 'narrative-card': elWidth = 420; elHeight = 200; break;
      case 'keyword-card': elWidth = 540; elHeight = 90; break;
      case 'radar-chart': elWidth = 410; elHeight = 260; break;
      case 'relationship-card': elWidth = 410; elHeight = 180; break;
      case 'quote-card': elWidth = 540; elHeight = 80; break;
      case 'memo-card': elWidth = 380; elHeight = 160; break;
      default: elWidth = 240; elHeight = 120;
    }

    // Smart visible positioning inside the canvas
    const count = canvasData.elements.length;
    const offset = (count % 6) * 32;
    const targetX = Math.max(30, Math.min(canvasData.canvasWidth - elWidth - 30, 40 + offset));
    const targetY = Math.max(30, Math.min(canvasData.canvasHeight - elHeight - 30, 50 + offset));

    // Guarantee that canvas expands if the new element would exceed current canvas bounds
    const nextCanvasWidth = Math.max(canvasData.canvasWidth, targetX + elWidth + 50);
    const nextCanvasHeight = Math.max(canvasData.canvasHeight, targetY + elHeight + 80);

    let newElement: CanvasElement;

    switch (type) {
      case 'character-image':
        newElement = {
          id: `img-${Date.now()}`,
          type: 'character-image',
          x: targetX,
          y: targetY,
          width: elWidth,
          height: elHeight,
          zIndex: nextZ,
          style: {
            borderRadius: 18,
            borderColor: '#E2E8F0',
            borderWidth: 1,
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            objectFit: 'cover',
          },
          content: {
            imageUrl:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
            alt: '캐릭터 이미지',
          },
        };
        break;

      case 'name-badge':
        newElement = {
          id: `name-${Date.now()}`,
          type: 'name-badge',
          x: targetX,
          y: targetY,
          width: elWidth,
          height: elHeight,
          zIndex: nextZ,
          style: {
            backgroundColor: '#FAFBFD',
            borderColor: '#ECEEF3',
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
          },
          content: {
            nameFields: [
              {
                id: 'nf-1',
                label: '이름',
                value: '새 캐릭터',
                fontSize: 24,
                fontWeight: 'bold',
                color: '#1E293B',
                isPrimary: true,
              },
              {
                id: 'nf-2',
                label: '호칭',
                value: '이명이나 별명을 입력하세요',
                fontSize: 13,
                fontWeight: '500',
                color: '#64748B',
              },
            ],
          },
        };
        break;

      case 'info-card':
        newElement = {
          id: `info-${Date.now()}`,
          type: 'info-card',
          x: targetX,
          y: targetY,
          width: elWidth,
          height: elHeight,
          zIndex: nextZ,
          style: {
            backgroundColor: '#FFFFFF',
            borderColor: '#ECEEF3',
            borderWidth: 1,
            borderRadius: 18,
            padding: 16,
          },
          content: {
            title: '기본 인적사항',
            infoDisplayMode: 'grid-2col',
            infoCardItems: [
              { id: '1', label: '성별', value: '미상' },
              { id: '2', label: '나이', value: '20세' },
              { id: '3', label: '종족', value: '인간' },
              { id: '4', label: '소속', value: '자유 모험가' },
            ],
          },
        };
        break;

      case 'narrative-card':
        newElement = {
          id: `nar-${Date.now()}`,
          type: 'narrative-card',
          x: targetX,
          y: targetY,
          width: elWidth,
          height: elHeight,
          zIndex: nextZ,
          style: {
            backgroundColor: '#FFFFFF',
            borderColor: '#ECEEF3',
            borderWidth: 1,
            borderRadius: 18,
            padding: 16,
          },
          content: {
            title: '성격 및 배경 설정',
            narrativeText:
              '캐릭터의 성격, 신념, 그리고 잊을 수 없는 과거의 사건들을 자유롭게 기록하세요.',
          },
        };
        break;

      case 'keyword-card':
        newElement = {
          id: `key-${Date.now()}`,
          type: 'keyword-card',
          x: targetX,
          y: targetY,
          width: elWidth,
          height: elHeight,
          zIndex: nextZ,
          style: {
            backgroundColor: '#FAFBFD',
            borderColor: '#ECEEF3',
            borderWidth: 1,
            borderRadius: 16,
            padding: 14,
          },
          content: {
            title: '성향 키워드',
            tags: [
              { id: '1', text: '의리', color: '#6366F1' },
              { id: '2', text: '냉정', color: '#06B6D4' },
              { id: '3', text: '자유로움', color: '#10B981' },
            ],
          },
        };
        break;

      case 'radar-chart':
        newElement = {
          id: `radar-${Date.now()}`,
          type: 'radar-chart',
          x: targetX,
          y: targetY,
          width: elWidth,
          height: elHeight,
          zIndex: nextZ,
          style: {
            backgroundColor: '#FFFFFF',
            borderColor: '#ECEEF3',
            borderWidth: 1,
            borderRadius: 18,
            padding: 14,
          },
          content: {
            title: '전투 능력치',
            radarMaxValue: 100,
            radarColor: '#8B5CF6',
            radarFillOpacity: 0.35,
            radarAxes: [
              { id: '1', label: '공격', value: 80 },
              { id: '2', label: '방어', value: 65 },
              { id: '3', label: '속도', value: 90 },
              { id: '4', label: '지능', value: 75 },
              { id: '5', label: '마력', value: 70 },
            ],
          },
        };
        break;

      case 'relationship-card':
        newElement = {
          id: `rel-${Date.now()}`,
          type: 'relationship-card',
          x: targetX,
          y: targetY,
          width: elWidth,
          height: elHeight,
          zIndex: nextZ,
          style: {
            backgroundColor: '#FFFFFF',
            borderColor: '#ECEEF3',
            borderWidth: 1,
            borderRadius: 18,
            padding: 16,
          },
          content: {
            title: '주요 인물 관계',
            relationships: [
              {
                id: '1',
                name: '동료 이름',
                relation: '동료 / 라이벌',
                description: '신뢰하지만 경쟁 의식을 느끼는 동료',
                color: '#8B5CF6',
              },
            ],
          },
        };
        break;

      case 'quote-card':
        newElement = {
          id: `quote-${Date.now()}`,
          type: 'quote-card',
          x: targetX,
          y: targetY,
          width: elWidth,
          height: elHeight,
          zIndex: nextZ,
          style: {
            backgroundColor: '#FAF5FF',
            borderColor: '#F3E8FF',
            borderWidth: 1,
            borderRadius: 16,
            padding: 14,
          },
          content: {
            title: '대표 대사',
            quoteText: '내 길은 내가 스스로 선택해.',
            quoteSituation: '결전을 앞두고 남긴 말',
          },
        };
        break;

      case 'memo-card':
        newElement = {
          id: `memo-${Date.now()}`,
          type: 'memo-card',
          x: targetX,
          y: targetY,
          width: elWidth,
          height: elHeight,
          zIndex: nextZ,
          style: {
            backgroundColor: '#FEF9C3',
            borderColor: '#FDE047',
            borderWidth: 1,
            borderRadius: 16,
            padding: 14,
          },
          content: {
            title: '비밀 설정 & 메모',
            memoContent: '창작 과정에서 기억해둘 핵심 설정과 떡밥을 메모하세요.',
          },
        };
        break;

      default:
        newElement = {
          id: `el-${Date.now()}`,
          type,
          x: targetX,
          y: targetY,
          width: elWidth,
          height: elHeight,
          zIndex: nextZ,
          style: {
            backgroundColor: '#FFFFFF',
            borderColor: '#E2E8F0',
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
          },
          content: { title: '새 요소', text: '내용' },
        };
    }

    pushState({
      ...canvasData,
      canvasWidth: nextCanvasWidth,
      canvasHeight: nextCanvasHeight,
      elements: [...canvasData.elements, newElement],
    });
    setSelectedId(newElement.id);
    toast.success('구성 요소가 캔버스에 추가되었습니다.');
  };

  // Export Image
  const handleExportImage = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    try {
      toast.info('이미지를 생성 중입니다...');
      await exportElementAsPng(printRef.current, {
        fileName: `${docTitle || '캐릭터_시트'}_${new Date().toISOString().slice(0, 10)}`,
        backgroundColor: canvasData.backgroundColor || '#FFFFFF',
      });
      toast.success('이미지 저장이 완료되었습니다.');
    } catch {
      toast.error('이미지 저장 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedElement = canvasData.elements.find((el) => el.id === selectedId) || null;

  // Background pattern CSS
  const getCanvasPatternStyle = () => {
    const p = canvasData.pattern;
    if (!p || p.type === 'none') return {};

    if (p.type === 'dots') {
      return {
        backgroundImage: `radial-gradient(circle, ${p.color} ${p.size}px, transparent ${p.size}px)`,
        backgroundSize: `${p.gap}px ${p.gap}px`,
      };
    }
    if (p.type === 'grid') {
      return {
        backgroundImage: `linear-gradient(to right, ${p.color} ${p.size}px, transparent ${p.size}px), linear-gradient(to bottom, ${p.color} ${p.size}px, transparent ${p.size}px)`,
        backgroundSize: `${p.gap}px ${p.gap}px`,
      };
    }
    return {};
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#17171D] text-[#E8E7EF] relative overflow-hidden select-none">
      {/* 1. Global Navigation & Action Header (빈 문서와 동일한 헤더 규격, 다크모드 버튼 제거) */}
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

          {/* Document Title: 보기 모드일 때는 순수 텍스트, 편집 모드일 때는 입력창 */}
          {isEditMode ? (
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              onBlur={handleTitleBlurOrEnter}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              placeholder="제목 없는 캐릭터 시트"
              className="text-sm font-bold text-slate-800 dark:text-[#F3F2F8] bg-slate-100/70 dark:bg-[#2A2938] border border-slate-200 dark:border-[#3A3948] px-2.5 py-1 rounded-lg focus:border-lavender-500 focus:outline-none cursor-text truncate max-w-xs md:max-w-md transition-all"
            />
          ) : (
            <span
              className="text-sm font-bold text-slate-800 dark:text-[#F3F2F8] bg-transparent border-0 px-1 py-1 truncate max-w-xs md:max-w-md select-text cursor-default"
            >
              {docTitle || '제목 없는 캐릭터 시트'}
            </span>
          )}

          <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] shrink-0" />

          {/* Template Badge (파일 형식) */}
          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-lavender-100 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] border border-lavender-200/60 dark:border-[#524580] shrink-0">
            캐릭터 시트
          </span>
        </div>

        {/* Right: 보기/편집 | 자동 저장됨 | 이미지 저장 | 즐겨찾기 | 도움말 */}
        <div className="flex items-center gap-2.5 text-xs text-slate-400 dark:text-[#A5A3B5] shrink-0">
          {/* 1. 보기 / 편집 스위치 */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#292936] border border-slate-200/80 dark:border-[#3A3948]">
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                setIsEditMode(false);
                toast.success('보기 모드로 전환되었습니다.');
              }}
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

          {/* 3. 이미지 저장 버튼 */}
          <button
            onClick={handleExportImage}
            disabled={isExporting}
            title="캐릭터 시트 이미지로 저장 (PNG)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#E8E7EF] hover:text-lavender-700 dark:hover:text-[#B7A5FF] hover:bg-lavender-50 dark:hover:bg-[#292936] hover:border-lavender-200 transition-colors text-xs font-medium"
          >
            <Download
              className={`w-3.5 h-3.5 ${
                isExporting ? 'animate-bounce text-lavender-600' : 'text-slate-400 dark:text-[#A5A3B5]'
              }`}
            />
            <span>{isExporting ? '저장 중...' : '이미지 저장'}</span>
          </button>

          {/* 4. 즐겨찾기 버튼 */}
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

          {/* 5. 도움말 버튼 */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            title="캐릭터 시트 사용법 및 도움말"
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

          <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] mx-1" />

          <span className="text-[11px] font-medium text-slate-500 dark:text-[#8E8B9E]">
            총 {canvasData.elements.length}개 카드 요소
          </span>

          {/* In Edit Mode: Panel Toggles */}
          {isEditMode && (
            <>
              <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] mx-1" />
              <button
                type="button"
                onClick={() => setShowLibrary(!showLibrary)}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  showLibrary
                    ? 'bg-lavender-50 dark:bg-[#292936] text-lavender-600 dark:text-lavender-400'
                    : 'text-slate-400 hover:text-slate-700 dark:text-[#8E8B9E]'
                }`}
                title={showLibrary ? '구성 요소 패널 접기' : '구성 요소 패널 열기'}
              >
                {showLibrary ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
                <span className="text-[11px] hidden md:inline">라이브러리</span>
              </button>

              <button
                type="button"
                onClick={() => setShowInspector(!showInspector)}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                  showInspector
                    ? 'bg-lavender-50 dark:bg-[#292936] text-lavender-600 dark:text-lavender-400'
                    : 'text-slate-400 hover:text-slate-700 dark:text-[#8E8B9E]'
                }`}
                title={showInspector ? '속성 패널 접기' : '속성 패널 열기'}
              >
                {showInspector ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
                <span className="text-[11px] hidden md:inline">속성 편집</span>
              </button>
            </>
          )}
        </div>

        {/* Right: Tools & Zoom Controls */}
        <div className="flex items-center gap-2">
          {/* Tool Selector: Pointer vs Hand */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-[#292936] border border-slate-200/80 dark:border-[#3A3948]">
            <button
              type="button"
              onClick={() => setActiveTool('pointer')}
              title="선택/편집 도구 (V)"
              className={`p-1.5 rounded-md transition-all ${
                activeTool === 'pointer'
                  ? 'bg-white dark:bg-[#1E1E27] text-lavender-600 dark:text-[#B7A5FF] shadow-xs'
                  : 'text-slate-500 dark:text-[#8E8B9E] hover:text-slate-700 dark:hover:text-[#E8E7EF]'
              }`}
            >
              <MousePointer2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('hand')}
              title="손 도구 / 화면 이동 (H / Space+드래그)"
              className={`p-1.5 rounded-md transition-all ${
                activeTool === 'hand'
                  ? 'bg-white dark:bg-[#1E1E27] text-lavender-600 dark:text-[#B7A5FF] shadow-xs'
                  : 'text-slate-500 dark:text-[#8E8B9E] hover:text-slate-700 dark:hover:text-[#E8E7EF]'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] mx-0.5" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#292936] px-1.5 py-0.5 rounded-lg text-xs">
            <button
              type="button"
              title="축소 (Ctrl + -)"
              onClick={handleZoomOut}
              className="p-1 text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-[#E8E7EF] rounded"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="100% 리셋"
              onClick={handleResetZoom}
              className="font-mono text-slate-700 dark:text-[#E8E7EF] font-semibold px-1 text-[11px] hover:text-lavender-600"
            >
              {canvasData.zoom}%
            </button>
            <button
              type="button"
              title="확대 (Ctrl + +)"
              onClick={handleZoomIn}
              className="p-1 text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-[#E8E7EF] rounded"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fit / Center button */}
          <button
            type="button"
            onClick={handleFitToScreen}
            title="화면 맞춤 및 중앙 정렬"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-lg transition-colors border border-slate-200/80 dark:border-[#3A3948]"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Main Workspace Area: Left Library + Center Canvas + Right Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* A. Left Library Panel (Visible ONLY in Edit Mode when open) */}
        {isEditMode && showLibrary && (
          <CanvasLibrary onAddElement={handleAddElement} />
        )}

        {/* B. Center Freeform Canvas Workspace with Infinite Pan & Zoom */}
        <div
          ref={workspaceRef}
          onMouseDown={handleWorkspaceMouseDown}
          className={`canvas-workspace-bg flex-1 bg-[#EEF2F6] dark:bg-[#121217] overflow-hidden relative select-none ${
            isSpacePressed || activeTool === 'hand'
              ? isPanning
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : 'cursor-default'
          }`}
          style={{
            backgroundImage: isDark
              ? 'radial-gradient(circle, #38384A 1.3px, transparent 1.3px)'
              : 'radial-gradient(circle, #8A96A6 1.3px, transparent 1.3px)',
            backgroundSize: `${24 * (canvasData.zoom / 100)}px ${24 * (canvasData.zoom / 100)}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        >
          {/* Canvas Wrapper with Interactive Resize Handles and Transform Center Positioning */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${canvasData.canvasWidth}px`,
              height: `${canvasData.canvasHeight}px`,
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${canvasData.zoom / 100})`,
              transformOrigin: 'center center',
            }}
            className="relative transition-transform duration-75"
          >
            {/* Transparent Drag Overlay when in Hand Tool or Space Pan mode */}
            {(isSpacePressed || activeTool === 'hand') && (
              <div
                className="absolute inset-0 z-50 cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => {
                  if (e.button === 0 || e.button === 1) {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePanStart(e.clientX, e.clientY);
                  }
                }}
              />
            )}

            {/* Canvas Sheet Paper (Captured for PNG export) */}
            <div
              ref={printRef}
              style={{
                width: '100%',
                height: '100%',
                minHeight: `${canvasData.canvasHeight}px`,
                backgroundColor: canvasData.backgroundColor || '#FFFFFF',
                ...getCanvasPatternStyle(),
              }}
              onClick={(e) => {
                if (!isEditMode) return;
                e.stopPropagation();
                setSelectedId(null); // Click paper selects canvas
              }}
              className={`relative rounded-3xl shadow-lg border transition-all overflow-hidden ${
                isEditMode && selectedId === null
                  ? 'border-lavender-500 ring-4 ring-lavender-500/20 shadow-xl'
                  : 'border-slate-200/90 dark:border-[#3A3948]'
              }`}
            >
              {/* Render Canvas Elements */}
              {canvasData.elements.map((el) => (
                <CanvasElementRenderer
                  key={el.id}
                  element={el}
                  isSelected={isEditMode && selectedId === el.id}
                  isViewMode={!isEditMode}
                  zoom={canvasData.zoom}
                  onSelect={(id) => {
                    if (isEditMode) setSelectedId(id);
                  }}
                  onUpdate={handleUpdateElement}
                  onDelete={handleDeleteElement}
                />
              ))}

              {/* Floating Canvas Size Badge when canvas is selected */}
              {isEditMode && selectedId === null && (
                <div
                  data-export-ignore="true"
                  className="absolute bottom-3 right-4 px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-mono pointer-events-none z-30 flex items-center gap-1.5 shadow-lg border border-white/10 animate-in fade-in"
                >
                  <span className="text-slate-400">캔버스:</span>
                  <span className="font-bold text-lavender-300">
                    {canvasData.canvasWidth} × {canvasData.canvasHeight} px
                  </span>
                  <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-1.5 ml-0.5 font-sans">
                    테두리 드래그로 크기 조절
                  </span>
                </div>
              )}
            </div>

            {/* Interactive Canvas Drag-to-Resize Handles (Edit Mode only) */}
            {isEditMode && (
              <>
                {/* 1. Right Edge Resize Bar */}
                <div
                  data-export-ignore="true"
                  onMouseDown={(e) => handleCanvasResizeStart('e', e)}
                  title="드래그하여 캔버스 너비 조절"
                  className="absolute -right-3 top-0 bottom-0 w-6 cursor-ew-resize flex items-center justify-center group z-40 select-none"
                >
                  <div className="w-2 h-14 rounded-full bg-lavender-400/80 group-hover:bg-lavender-600 group-hover:w-2.5 transition-all shadow-md" />
                </div>

                {/* 2. Bottom Edge Resize Bar */}
                <div
                  data-export-ignore="true"
                  onMouseDown={(e) => handleCanvasResizeStart('s', e)}
                  title="드래그하여 캔버스 높이 조절"
                  className="absolute -bottom-3 left-0 right-0 h-6 cursor-ns-resize flex items-center justify-center group z-40 select-none"
                >
                  <div className="h-2 w-14 rounded-full bg-lavender-400/80 group-hover:bg-lavender-600 group-hover:h-2.5 transition-all shadow-md" />
                </div>

                {/* 3. Bottom-Right Corner Resize Knob */}
                <div
                  data-export-ignore="true"
                  onMouseDown={(e) => handleCanvasResizeStart('se', e)}
                  title="드래그하여 캔버스 전체 크기 조절"
                  className="absolute -right-3.5 -bottom-3.5 w-7 h-7 cursor-nwse-resize flex items-center justify-center z-50 group select-none"
                >
                  <div className="w-4 h-4 rounded-full bg-lavender-600 border-2 border-white shadow-lg group-hover:scale-125 transition-transform" />
                </div>
              </>
            )}
          </div>

          {/* Floating Canvas Navigation HUD (Bottom-Right) */}
          <div
            data-export-ignore="true"
            className="absolute bottom-5 right-5 z-30 flex items-center gap-1.5 bg-white/95 dark:bg-[#22222C]/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 dark:border-[#3A3948] shadow-lg text-xs transition-all"
          >
            {/* Tool toggle */}
            <button
              type="button"
              onClick={() => setActiveTool((t) => (t === 'pointer' ? 'hand' : 'pointer'))}
              className={`p-1.5 rounded-xl transition-colors ${
                activeTool === 'hand'
                  ? 'bg-lavender-100 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF]'
                  : 'text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936]'
              }`}
              title={activeTool === 'hand' ? '선택 도구로 전환 (V)' : '손 도구로 전환 (H)'}
            >
              {activeTool === 'hand' ? <Hand className="w-4 h-4" /> : <MousePointer2 className="w-4 h-4" />}
            </button>

            <div className="h-3.5 w-px bg-slate-200 dark:bg-[#3A3948]" />

            {/* Zoom Controls */}
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-xl transition-colors"
              title="축소 (Ctrl + -)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-0.5 text-[11px] font-mono font-bold text-slate-700 dark:text-[#E8E7EF] hover:text-lavender-600 dark:hover:text-lavender-400"
              title="100% 리셋"
            >
              {canvasData.zoom}%
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-xl transition-colors"
              title="확대 (Ctrl + +)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <div className="h-3.5 w-px bg-slate-200 dark:bg-[#3A3948]" />

            {/* Center / Fit */}
            <button
              type="button"
              onClick={handleFitToScreen}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-xl transition-colors"
              title="화면에 맞춤"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Reset pan button if panned */}
            {(pan.x !== 0 || pan.y !== 0) && (
              <button
                type="button"
                onClick={handleResetView}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-xl transition-colors"
                title="원점(중앙) 복귀 (Ctrl + 0)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mini Shortcut Indicator badge (Bottom-Left) */}
          <div
            data-export-ignore="true"
            className="absolute bottom-5 left-5 z-20 hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-[#1E1E27]/80 backdrop-blur-xs border border-slate-200/80 dark:border-[#3A3948] text-[11px] text-slate-500 dark:text-[#A5A3B5] shadow-xs pointer-events-none select-none"
          >
            <span className="flex items-center gap-1 font-medium">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#292936] border border-slate-200 dark:border-[#434255] font-mono text-[10px]">Space</kbd>
              <span>+ 드래그: 이동</span>
            </span>
            <span className="text-slate-300 dark:text-[#3A3948]">•</span>
            <span className="flex items-center gap-1 font-medium">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#292936] border border-slate-200 dark:border-[#434255] font-mono text-[10px]">Ctrl</kbd>
              <span>+ 휠: 확대/축소</span>
            </span>
          </div>
        </div>

        {/* C. Right Inspector & Template Panel (Visible ONLY in Edit Mode when open) */}
        {isEditMode && showInspector && (
          <CanvasInspector
            selectedElement={selectedElement}
            canvasData={canvasData}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleDuplicateElement}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
            onUpdateCanvas={handleUpdateCanvas}
            onLoadCanvasData={(data) => {
              setSelectedId(null);
              pushState(data);
            }}
          />
        )}
      </div>

      {/* 4. Help Modal */}
      <CharacterSheetHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};
