import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Image as ImageIcon,
  Type,
  FileText,
  List,
  Shield,
  Square,
  Minus,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Palette,
  Sparkles,
  Download,
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

export const CharacterSheetEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
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
      // Ignore if user is typing inside input or textarea
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
      x: target.x + 24,
      y: target.y + 24,
      zIndex: canvasData.elements.length + 1,
    };
    setSelectedId(newEl.id);
    pushState({
      ...canvasData,
      elements: [...canvasData.elements, newEl],
    });
  };

  // Bring Forward / Send Backward
  const handleBringToFront = (id: string) => {
    const maxZ = Math.max(...canvasData.elements.map((e) => e.zIndex), 1);
    handleUpdateElement(id, { zIndex: maxZ + 1 });
  };

  const handleSendToBack = (id: string) => {
    const minZ = Math.min(...canvasData.elements.map((e) => e.zIndex), 1);
    handleUpdateElement(id, { zIndex: Math.max(0, minZ - 1) });
  };

  // Add new element from library
  const handleAddElement = (type: CanvasElementType) => {
    const newId = `el-${Date.now()}`;
    const baseZ = canvasData.elements.length + 1;
    let newEl: CanvasElement;

    const centerX = 340;
    const centerY = 180;

    switch (type) {
      case 'image':
        newEl = {
          id: newId,
          type: 'image',
          x: centerX,
          y: centerY,
          width: 240,
          height: 320,
          zIndex: baseZ,
          style: { borderRadius: 16, borderWidth: 1, borderColor: '#ECEEF3' },
          content: {
            imageUrl:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
            alt: '새 이미지',
            aspectRatio: true,
          },
        };
        break;

      case 'heading':
        newEl = {
          id: newId,
          type: 'heading',
          x: centerX,
          y: centerY,
          width: 320,
          height: 40,
          zIndex: baseZ,
          style: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },
          content: { text: '새 제목을 입력하세요' },
        };
        break;

      case 'text':
        newEl = {
          id: newId,
          type: 'text',
          x: centerX,
          y: centerY,
          width: 340,
          height: 80,
          zIndex: baseZ,
          style: { fontSize: 13, color: '#475569' },
          content: { text: '이곳에 내용을 자유롭게 작성하세요.' },
        };
        break;

      case 'info-field':
        newEl = {
          id: newId,
          type: 'info-field',
          x: centerX,
          y: centerY,
          width: 360,
          height: 120,
          zIndex: baseZ,
          style: {
            backgroundColor: '#FFFFFF',
            borderColor: '#ECEEF3',
            borderWidth: 1,
            borderRadius: 16,
            padding: 12,
          },
          content: {
            infoItems: [
              { id: '1', label: '항목 1', value: '내용 입력' },
              { id: '2', label: '항목 2', value: '내용 입력' },
            ],
          },
        };
        break;

      case 'status-chart':
        newEl = {
          id: newId,
          type: 'status-chart',
          x: centerX,
          y: centerY,
          width: 360,
          height: 140,
          zIndex: baseZ,
          style: {
            backgroundColor: '#FFFFFF',
            borderColor: '#ECEEF3',
            borderWidth: 1,
            borderRadius: 16,
            padding: 12,
          },
          content: {
            statDisplayType: 'card',
            stats: [
              { id: '1', label: '공격력', value: 'A' },
              { id: '2', label: '방어력', value: 'B' },
              { id: '3', label: '스피드', value: 'S' },
            ],
          },
        };
        break;

      case 'container':
        newEl = {
          id: newId,
          type: 'container',
          x: centerX,
          y: centerY,
          width: 380,
          height: 180,
          zIndex: 1, // send to bottom by default
          style: {
            backgroundColor: '#F8FAFC',
            borderColor: '#E2E8F0',
            borderWidth: 1,
            borderRadius: 16,
          },
          content: {},
        };
        break;

      case 'divider':
        newEl = {
          id: newId,
          type: 'divider',
          x: centerX,
          y: centerY,
          width: 300,
          height: 16,
          zIndex: baseZ,
          content: { orientation: 'horizontal' },
        };
        break;
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
    await exportElementAsPng(printRef.current, {
      fileName: `${activeDocument.title || '캐릭터시트'}-자유배치`,
    });
  };

  const selectedElement = canvasData.elements.find((el) => el.id === selectedId);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAFBFD] relative overflow-hidden select-none">
      {/* Top Header */}
      <SpecialEditorHeader
        saveStatus={saveStatus}
        onExportImage={handleExportImage}
      />

      {/* Sub Toolbar: Undo/Redo + Zoom Controls + Quick Export */}
      <div className="h-11 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-2xs">
        {/* Left Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="실행 취소 (Ctrl+Z)"
            onClick={handleUndo}
            disabled={historyIdx <= 0}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="다시 실행 (Ctrl+Y)"
            onClick={handleRedo}
            disabled={historyIdx >= history.length - 1}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1.5" />

          <span className="text-[11px] font-medium text-slate-400">
            총 {canvasData.elements.length}개 요소
          </span>
        </div>

        {/* Selected Element Quick Action Floating Bar (Center) */}
        {selectedElement && (
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-xl shadow-2xs text-xs animate-in fade-in duration-100">
            <span className="text-[11px] font-bold text-lavender-700 px-1 truncate max-w-[100px]">
              {selectedElement.type}
            </span>
            <div className="h-3 w-px bg-slate-200 mx-0.5" />
            <button
              type="button"
              title="복제 (Ctrl+D)"
              onClick={() => handleDuplicateElement(selectedElement.id)}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="맨 앞으로 가져오기"
              onClick={() => handleBringToFront(selectedElement.id)}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="맨 뒤로 보내기"
              onClick={() => handleSendToBack(selectedElement.id)}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="삭제 (Del)"
              onClick={() => handleDeleteElement(selectedElement.id)}
              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right Zoom Controls & Image Save */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs">
            <button
              type="button"
              title="축소"
              onClick={() =>
                pushState({
                  ...canvasData,
                  zoom: Math.max(50, canvasData.zoom - 10),
                })
              }
              className="p-1 text-slate-400 hover:text-slate-700 rounded"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-slate-600 font-medium px-1">
              {canvasData.zoom}%
            </span>
            <button
              type="button"
              title="확대"
              onClick={() =>
                pushState({
                  ...canvasData,
                  zoom: Math.min(150, canvasData.zoom + 10),
                })
              }
              className="p-1 text-slate-400 hover:text-slate-700 rounded"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportImage}
            className="flex items-center gap-1.5 px-3 py-1 bg-lavender-500 hover:bg-lavender-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>이미지로 저장</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column: Left Element Library + Center Freeform Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Element Library & Properties */}
        <div className="w-56 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="flex flex-col gap-5">
            {/* 1. Element Library Panel */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                요소 라이브러리
              </span>
              <div className="flex flex-col gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleAddElement('image')}
                  className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-medium transition-colors border border-slate-200/60"
                >
                  <ImageIcon className="w-4 h-4 text-lavender-600" />
                  <span>이미지 추가</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddElement('heading')}
                  className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-medium transition-colors border border-slate-200/60"
                >
                  <Type className="w-4 h-4 text-lavender-600" />
                  <span>제목 추가</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddElement('text')}
                  className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-medium transition-colors border border-slate-200/60"
                >
                  <FileText className="w-4 h-4 text-lavender-600" />
                  <span>본문 텍스트</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddElement('info-field')}
                  className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-medium transition-colors border border-slate-200/60"
                >
                  <List className="w-4 h-4 text-lavender-600" />
                  <span>기본 정보 카드</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddElement('status-chart')}
                  className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-medium transition-colors border border-slate-200/60"
                >
                  <Shield className="w-4 h-4 text-lavender-600" />
                  <span>스테이터스 표</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddElement('container')}
                  className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-medium transition-colors border border-slate-200/60"
                >
                  <Square className="w-4 h-4 text-lavender-600" />
                  <span>배경 박스 / 카드</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddElement('divider')}
                  className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-medium transition-colors border border-slate-200/60"
                >
                  <Minus className="w-4 h-4 text-lavender-600" />
                  <span>구분선</span>
                </button>
              </div>
            </div>

            {/* 2. Inspector Properties for Selected Element */}
            {selectedElement && (
              <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider">
                  선택 요소 속성
                </span>

                {/* Image URL Input if Image */}
                {selectedElement.type === 'image' && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-500 font-medium">
                      이미지 URL
                    </span>
                    <input
                      type="text"
                      value={selectedElement.content.imageUrl || ''}
                      onChange={(e) =>
                        handleUpdateElement(selectedElement.id, {
                          content: {
                            ...selectedElement.content,
                            imageUrl: e.target.value,
                          },
                        })
                      }
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs !bg-white"
                      placeholder="https://..."
                    />
                  </div>
                )}

                {/* Font Size for Heading / Text */}
                {(selectedElement.type === 'heading' ||
                  selectedElement.type === 'text') && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      글꼴 크기
                    </span>
                    <input
                      type="number"
                      min={10}
                      max={48}
                      value={selectedElement.style?.fontSize || 14}
                      onChange={(e) =>
                        handleUpdateElement(selectedElement.id, {
                          style: {
                            ...selectedElement.style,
                            fontSize: Number(e.target.value),
                          },
                        })
                      }
                      className="w-16 px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-xs font-mono !bg-white"
                    />
                  </div>
                )}

                {/* Background Color Quick Chips */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">
                    배경색
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[
                      'transparent',
                      '#FFFFFF',
                      '#FAFBFD',
                      '#F8FAFC',
                      '#EDE9FE',
                      '#FCE7F3',
                    ].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() =>
                          handleUpdateElement(selectedElement.id, {
                            style: {
                              ...selectedElement.style,
                              backgroundColor: col,
                            },
                          })
                        }
                        title={col}
                        style={{ backgroundColor: col === 'transparent' ? '#F1F5F9' : col }}
                        className={`w-6 h-6 rounded-lg border transition-transform ${
                          selectedElement.style?.backgroundColor === col
                            ? 'ring-2 ring-lavender-500 scale-110'
                            : 'border-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Border Radius */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    둥근 모서리
                  </span>
                  <select
                    value={selectedElement.style?.borderRadius || 0}
                    onChange={(e) =>
                      handleUpdateElement(selectedElement.id, {
                        style: {
                          ...selectedElement.style,
                          borderRadius: Number(e.target.value),
                        },
                      })
                    }
                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs !bg-white"
                  >
                    <option value={0}>각지게 (0px)</option>
                    <option value={8}>약간 둥글게 (8px)</option>
                    <option value={16}>부드럽게 (16px)</option>
                    <option value={24}>많이 둥글게 (24px)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Quick Help Guide */}
          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 leading-relaxed">
            💡 요소 드래그로 위치 변경, 8개 핸들로 크기 조절, 텍스트 더블클릭으로 바로 수정할 수 있습니다.
          </div>
        </div>

        {/* Center Freeform Canvas Workspace */}
        <div
          onClick={() => setSelectedId(null)}
          className="flex-1 bg-[#F5F6FA] overflow-auto p-10 flex items-center justify-center relative select-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
            backgroundSize: '20px 20px',
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
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-3xl shadow-sm border border-slate-200/90 transition-transform duration-75 overflow-hidden"
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
      </div>
    </div>
  );
};
