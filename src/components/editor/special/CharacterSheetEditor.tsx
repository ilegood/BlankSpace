import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  RotateCcw,
} from 'lucide-react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
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
import { useToast } from '../../toast/ToastContext';

export const CharacterSheetEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const { toast } = useToast();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const printRef = useRef<HTMLDivElement>(null);

  // Canvas State
  const [canvasData, setCanvasData] = useState<CanvasDocumentData>(
    DEFAULT_CHARACTER_CANVAS
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Undo / Redo History
  const [history, setHistory] = useState<CanvasDocumentData[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const isUndoRedoAction = useRef(false);

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
  const handleUndo = () => {
    if (historyIdx > 0) {
      isUndoRedoAction.current = true;
      const prev = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      setCanvasData(prev);
      if (activePage) updatePageContent(activePage.id, JSON.stringify(prev));
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      isUndoRedoAction.current = true;
      const next = history[historyIdx + 1];
      setHistoryIdx(historyIdx + 1);
      setCanvasData(next);
      if (activePage) updatePageContent(activePage.id, JSON.stringify(next));
    }
  };

  // Keyboard Shortcuts: Delete, Duplicate, Undo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

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

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, canvasData, historyIdx, history]);

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
    setSelectedId(null);
    pushState({ ...canvasData, elements: nextElements });
  };

  // Duplicate element
  const handleDuplicateElement = (id: string) => {
    const target = canvasData.elements.find((el) => el.id === id);
    if (!target) return;

    const newEl: CanvasElement = {
      ...JSON.parse(JSON.stringify(target)),
      id: `el-${Date.now()}`,
      x: Math.min(target.x + 24, canvasData.canvasWidth - 100),
      y: Math.min(target.y + 24, canvasData.canvasHeight - 100),
      zIndex: canvasData.elements.length + 1,
    };
    setSelectedId(newEl.id);
    pushState({
      ...canvasData,
      elements: [...canvasData.elements, newEl],
    });
  };

  // Bring to Front / Send to Back
  const handleBringToFront = (id: string) => {
    const maxZ = Math.max(...canvasData.elements.map((e) => e.zIndex), 1);
    handleUpdateElement(id, { zIndex: maxZ + 1 });
  };

  const handleSendToBack = (id: string) => {
    const minZ = Math.min(...canvasData.elements.map((e) => e.zIndex), 1);
    handleUpdateElement(id, { zIndex: Math.max(0, minZ - 1) });
  };

  // Update canvas global properties
  const handleUpdateCanvas = (updates: Partial<CanvasDocumentData>) => {
    pushState({ ...canvasData, ...updates });
  };

  // Add meaningful element from library
  const handleAddElement = (type: CanvasElementType) => {
    const newId = `el-${Date.now()}`;
    const baseZ = canvasData.elements.length + 1;
    let newEl: CanvasElement;

    // Center of canvas view
    const spawnX = Math.round(canvasData.canvasWidth / 2 - 170);
    const spawnY = Math.round(180 + (canvasData.elements.length % 5) * 20);

    switch (type) {
      // 1. Character Image
      case 'character-image':
      case 'image':
        newEl = {
          id: newId,
          type: 'character-image',
          x: spawnX,
          y: spawnY,
          width: 320,
          height: 420,
          zIndex: baseZ,
          style: {
            borderRadius: 24,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            backgroundColor: '#F8FAFC',
            objectFit: 'cover',
          },
          content: {
            imageUrl:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
            alt: '캐릭터 이미지',
          },
        };
        break;

      // 2. Name Badge
      case 'name-badge':
      case 'heading':
        newEl = {
          id: newId,
          type: 'name-badge',
          x: spawnX,
          y: spawnY,
          width: 360,
          height: 100,
          zIndex: baseZ,
          style: {
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 16,
            padding: 16,
          },
          content: {
            nameFields: [
              {
                id: 'nf-1',
                label: '이름',
                value: '새 캐릭터',
                fontSize: 22,
                fontWeight: 'bold',
                color: '#1E293B',
                isPrimary: true,
              },
              {
                id: 'nf-2',
                label: '칭호',
                value: '방랑하는 모험가',
                fontSize: 13,
                fontWeight: 'medium',
                color: '#8B5CF6',
              },
            ],
          },
        };
        break;

      // 3. Info Card
      case 'info-card':
      case 'info-field':
        newEl = {
          id: newId,
          type: 'info-card',
          x: spawnX,
          y: spawnY,
          width: 380,
          height: 180,
          zIndex: baseZ,
          style: {
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 16,
            padding: 16,
          },
          content: {
            title: '기본 정보',
            infoDisplayMode: 'grid-2col',
            infoCardItems: [
              { id: 'it-1', label: '나이', value: '20세' },
              { id: 'it-2', label: '소속', value: '자유 기사단' },
              { id: 'it-3', label: '신장', value: '175cm' },
              { id: 'it-4', label: '주무기', value: '롱소드' },
            ],
          },
        };
        break;

      // 4. Narrative Card
      case 'narrative-card':
      case 'text':
        newEl = {
          id: newId,
          type: 'narrative-card',
          x: spawnX,
          y: spawnY,
          width: 380,
          height: 160,
          zIndex: baseZ,
          style: {
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 16,
            padding: 16,
            fontSize: 13,
            textAlign: 'left',
          },
          content: {
            title: '성격 및 배경',
            narrativeText:
              '캐릭터의 성격, 과거의 사건, 가치관 등 자유로운 서술을 작성하세요.',
          },
        };
        break;

      // 5. Keyword Card
      case 'keyword-card':
        newEl = {
          id: newId,
          type: 'keyword-card',
          x: spawnX,
          y: spawnY,
          width: 360,
          height: 120,
          zIndex: baseZ,
          style: {
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 16,
            padding: 14,
          },
          content: {
            title: '주요 키워드',
            tagDisplayMode: 'chips',
            tags: [
              { id: 'tag-1', text: '정의로움' },
              { id: 'tag-2', text: '과묵함' },
              { id: 'tag-3', text: '동료애' },
            ],
          },
        };
        break;

      // 6. Radar Chart
      case 'radar-chart':
      case 'status-chart':
        newEl = {
          id: newId,
          type: 'radar-chart',
          x: spawnX,
          y: spawnY,
          width: 340,
          height: 320,
          zIndex: baseZ,
          style: {
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 20,
            padding: 16,
          },
          content: {
            title: '종합 능력치',
            radarMaxValue: 100,
            radarColor: '#8B5CF6',
            radarFillOpacity: 0.25,
            radarAxes: [
              { id: 'ax-1', label: '공격력', value: 85 },
              { id: 'ax-2', label: '방어력', value: 70 },
              { id: 'ax-3', label: '민첩성', value: 90 },
              { id: 'ax-4', label: '지능', value: 65 },
              { id: 'ax-5', label: '마력', value: 80 },
            ],
          },
        };
        break;

      // 7. Relationship Card
      case 'relationship-card':
        newEl = {
          id: newId,
          type: 'relationship-card',
          x: spawnX,
          y: spawnY,
          width: 380,
          height: 180,
          zIndex: baseZ,
          style: {
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 16,
            padding: 16,
          },
          content: {
            title: '주요 관계 요약',
            relationships: [
              {
                id: 'rel-1',
                name: '루시안',
                relation: '동료이자 라이벌',
                description: '어릴 때부터 함께 검을 쥐어온 전우.',
              },
              {
                id: 'rel-2',
                name: '에레나',
                relation: '스승',
                description: '고대 정령검술을 전수해 준 조력자.',
              },
            ],
          },
        };
        break;

      // 8. Quote Card
      case 'quote-card':
        newEl = {
          id: newId,
          type: 'quote-card',
          x: spawnX,
          y: spawnY,
          width: 380,
          height: 110,
          zIndex: baseZ,
          style: {
            backgroundColor: '#FBFBFE',
            borderWidth: 1,
            borderColor: '#E0E7FF',
            borderRadius: 16,
            padding: 16,
          },
          content: {
            quoteText: '“검을 뽑았을 때, 이미 망설임은 버렸다.”',
            quoteSituation: '전투 돌입 대사',
          },
        };
        break;

      // 9. Memo Card
      case 'memo-card':
      case 'container':
        newEl = {
          id: newId,
          type: 'memo-card',
          x: spawnX,
          y: spawnY,
          width: 260,
          height: 160,
          zIndex: baseZ,
          style: {
            backgroundColor: '#FEF9C3',
            borderWidth: 1,
            borderColor: '#FEF08A',
            borderRadius: 16,
            padding: 14,
          },
          content: {
            title: '기획 노트',
            memoContent:
              '숨겨진 특성이나 차후 에피소드에서 밝혀질 비밀 설정 메모.',
          },
        };
        break;

      default:
        return;
    }

    setSelectedId(newId);
    pushState({
      ...canvasData,
      elements: [...canvasData.elements, newEl],
    });
  };

  // Export Canvas as PNG
  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    try {
      await exportElementAsPng(printRef.current, {
        fileName: `${activeDocument.title || '캐릭터시트'}-시트`,
      });
      toast.success('시트 이미지가 저장되었습니다.');
    } catch {
      toast.error('이미지 내보내기에 실패했습니다.');
    }
  };

  const selectedElement = canvasData.elements.find((el) => el.id === selectedId) || null;

  // Background pattern calculation for sheet
  const getCanvasPatternStyle = () => {
    const pattern = canvasData.pattern;
    if (!pattern || pattern.type === 'none') return {};

    if (pattern.type === 'dots') {
      return {
        backgroundImage: `radial-gradient(circle, ${pattern.color} ${pattern.size}px, transparent ${pattern.size}px)`,
        backgroundSize: `${pattern.gap}px ${pattern.gap}px`,
      };
    }

    if (pattern.type === 'grid') {
      return {
        backgroundImage: `linear-gradient(to right, ${pattern.color} 1px, transparent 1px), linear-gradient(to bottom, ${pattern.color} 1px, transparent 1px)`,
        backgroundSize: `${pattern.gap}px ${pattern.gap}px`,
      };
    }

    return {};
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] dark:bg-dark-bg relative overflow-hidden select-none">
      {/* Top Header */}
      <SpecialEditorHeader
        saveStatus={saveStatus}
        onExportImage={handleExportImage}
      />

      {/* Sub Toolbar */}
      <div className="h-11 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border px-4 flex items-center justify-between shrink-0 shadow-2xs z-10">
        {/* Left: Undo / Redo + Element Count */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="실행 취소 (Ctrl+Z)"
            onClick={handleUndo}
            disabled={historyIdx <= 0}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-dark-textSecondary dark:hover:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-elevated rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="다시 실행 (Ctrl+Y)"
            onClick={handleRedo}
            disabled={historyIdx >= history.length - 1}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-dark-textSecondary dark:hover:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-elevated rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-dark-border mx-1" />

          <span className="text-[11px] font-medium text-slate-400 dark:text-dark-textSecondary">
            총 {canvasData.elements.length}개 카드 요소
          </span>
        </div>

        {/* Right: Zoom Controls & PNG Export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-dark-elevated px-1.5 py-0.5 rounded-lg text-xs">
            <button
              type="button"
              title="축소"
              onClick={() =>
                pushState({
                  ...canvasData,
                  zoom: Math.max(50, canvasData.zoom - 10),
                })
              }
              className="p-1 text-slate-500 hover:text-slate-800 dark:text-dark-textSecondary dark:hover:text-dark-text rounded"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="100% 리셋"
              onClick={() => pushState({ ...canvasData, zoom: 100 })}
              className="font-mono text-slate-700 dark:text-dark-text font-semibold px-1 text-[11px] hover:text-lavender-600"
            >
              {canvasData.zoom}%
            </button>
            <button
              type="button"
              title="확대"
              onClick={() =>
                pushState({
                  ...canvasData,
                  zoom: Math.min(150, canvasData.zoom + 10),
                })
              }
              className="p-1 text-slate-500 hover:text-slate-800 dark:text-dark-textSecondary dark:hover:text-dark-text rounded"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportImage}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-lavender-600 hover:bg-lavender-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>이미지 저장</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout: Left Library + Center Canvas + Right Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. Left Library Panel */}
        <CanvasLibrary onAddElement={handleAddElement} />

        {/* 2. Center Freeform Canvas Workspace */}
        <div
          onClick={() => setSelectedId(null)}
          className="flex-1 bg-[#EEF2F6] dark:bg-[#121217] overflow-auto p-12 flex items-center justify-center relative select-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Canvas Sheet Paper (Captured for PNG export) */}
          <div
            ref={printRef}
            style={{
              width: `${canvasData.canvasWidth}px`,
              minHeight: `${canvasData.canvasHeight}px`,
              transform: `scale(${canvasData.zoom / 100})`,
              transformOrigin: 'top center',
              backgroundColor: canvasData.backgroundColor || '#FFFFFF',
              ...getCanvasPatternStyle(),
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative rounded-3xl shadow-lg border border-slate-200/90 dark:border-dark-border transition-transform duration-75 overflow-hidden"
          >
            {/* Render Canvas Elements */}
            {canvasData.elements.map((el) => (
              <CanvasElementRenderer
                key={el.id}
                element={el}
                isSelected={selectedId === el.id}
                zoom={canvasData.zoom}
                onSelect={(id) => setSelectedId(id)}
                onUpdate={handleUpdateElement}
                onDelete={handleDeleteElement}
              />
            ))}
          </div>
        </div>

        {/* 3. Right Inspector & Template Panel */}
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
      </div>
    </div>
  );
};
