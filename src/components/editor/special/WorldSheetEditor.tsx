import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { useToast } from '../../toast/ToastContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { exportElementAsPng } from '../../../utils/exportImage';
import {
  WorldSheetDocData,
  WorldSheetItem,
  WorldSheetItemType,
} from '../../../types/worldSheet';
import {
  INITIAL_WORLD_SHEET_DATA,
  convertLegacyToWorldSheet,
} from './worldSheet/worldSheetPresets';
import { WorldSheetCardRenderer } from './worldSheet/WorldSheetCardRenderer';
import { AddWorldItemMenu } from './worldSheet/AddWorldItemMenu';
import {
  Plus,
  Undo2,
  Redo2,
  Edit3,
  Check,
  Download,
  Maximize,
  Minimize,
  Globe,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

export const WorldSheetEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const { toast, customPrompt } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // 1. Core World Sheet Document State
  const [docData, setDocData] = useState<WorldSheetDocData>(INITIAL_WORLD_SHEET_DATA);

  // 2. View Mode & UI States
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);

  // 3. Undo / Redo History
  const [history, setHistory] = useState<WorldSheetDocData[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const isUndoRedoAction = useRef(false);

  // Load from activePage.content
  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && (activePage.content.startsWith('{') || activePage.content.startsWith('['))) {
        const parsed = JSON.parse(activePage.content);
        const converted = convertLegacyToWorldSheet(parsed);
        setDocData(converted);
        setHistory([converted]);
        setHistoryIdx(0);
        return;
      }
    } catch (e) {
      console.warn('Failed to parse world sheet data, falling back to initial:', e);
    }

    setDocData(INITIAL_WORLD_SHEET_DATA);
    setHistory([INITIAL_WORLD_SHEET_DATA]);
    setHistoryIdx(0);
  }, [activePage?.id]);

  // Push State & Autosave
  const pushState = useCallback(
    (nextData: WorldSheetDocData) => {
      setDocData(nextData);

      if (!isUndoRedoAction.current) {
        setHistory((prev) => {
          const sliced = prev.slice(0, historyIdx + 1);
          return [...sliced, nextData];
        });
        setHistoryIdx((prev) => prev + 1);
      }
      isUndoRedoAction.current = false;

      if (!activePage) return;
      updatePageContent(activePage.id, JSON.stringify(nextData));
    },
    [activePage, historyIdx, updatePageContent]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIdx > 0) {
      isUndoRedoAction.current = true;
      const prev = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      setDocData(prev);
      if (activePage) updatePageContent(activePage.id, JSON.stringify(prev));
    }
  }, [history, historyIdx, activePage, updatePageContent]);

  const handleRedo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      isUndoRedoAction.current = true;
      const next = history[historyIdx + 1];
      setHistoryIdx(historyIdx + 1);
      setDocData(next);
      if (activePage) updatePageContent(activePage.id, JSON.stringify(next));
    }
  }, [history, historyIdx, activePage, updatePageContent]);

  // Keyboard Shortcuts (Undo, Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // ------------------------------------------------------------------
  // World Sheet Mutation Handlers
  // ------------------------------------------------------------------
  const handleUpdateWorldInfo = (updates: Partial<WorldSheetDocData>) => {
    pushState({
      ...docData,
      ...updates,
      updatedAt: Date.now(),
    });
  };

  const handleChangeCoverImage = async () => {
    const url = await customPrompt({
      title: '커버 이미지 변경',
      message: '새로운 커버 이미지 URL을 입력하세요:',
      placeholder: 'https://...',
      defaultValue: docData.coverImageUrl || '',
      confirmText: '변경',
    });
    if (url !== null && url.trim()) {
      handleUpdateWorldInfo({ coverImageUrl: url.trim() });
      toast.success('커버 이미지가 변경되었습니다.');
    }
  };

  // ------------------------------------------------------------------
  // Item Management (Add, Update, Delete, Reorder)
  // ------------------------------------------------------------------
  const handleAddItem = (type: WorldSheetItemType) => {
    const maxOrder = docData.items.length > 0 ? Math.max(...docData.items.map((i) => i.order)) : 0;
    const nextOrder = maxOrder + 1;
    const newId = `item-${type}-${Date.now()}`;

    let newItem: WorldSheetItem;

    switch (type) {
      case 'detail-card':
        newItem = {
          id: newId,
          type,
          title: '새 세부사항 정보',
          order: nextOrder,
          detailItems: [
            { id: `dt-${Date.now()}-1`, label: '항목명', value: '속성값을 입력하세요' },
          ],
        };
        break;
      case 'category-card':
        newItem = {
          id: newId,
          type,
          title: '새 카테고리 태그',
          order: nextOrder,
          categoryTags: [
            { id: `tag-${Date.now()}-1`, text: '새 키워드', color: '#8B5CF6' },
          ],
        };
        break;
      case 'narrative-card':
        newItem = {
          id: newId,
          type,
          title: '새 서술형 설정',
          order: nextOrder,
          narrativeText: '세계관에 대한 상세 설정을 자유롭게 서술하세요...',
        };
        break;
      case 'memo-card':
        newItem = {
          id: newId,
          type,
          title: '아이디어 메모',
          order: nextOrder,
          memoContent: '기획 아이디어 또는 미확정 설정을 메모하세요.',
          memoTheme: 'yellow',
        };
        break;
      case 'location-intro':
        newItem = {
          id: newId,
          type,
          title: '대표 지역 소개',
          order: nextOrder,
          locations: [
            {
              id: `loc-${Date.now()}-1`,
              name: '새 지역 명칭',
              imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop',
              summary: '해당 지역의 간략한 한 줄 소개',
              features: '지형 및 주요 거점 특징',
            },
          ],
        };
        break;
      case 'image-gallery':
        newItem = {
          id: newId,
          type,
          title: '시각적 레퍼런스',
          order: nextOrder,
          images: [
            {
              id: `img-${Date.now()}-1`,
              imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
              caption: '대표 레퍼런스 풍경',
              tag: '풍경 & 무드',
            },
          ],
        };
        break;
      case 'linked-documents':
        newItem = {
          id: newId,
          type,
          title: '관련 설정 문서',
          order: nextOrder,
          linkedDocIds: [],
        };
        break;
    }

    pushState({
      ...docData,
      items: [...docData.items, newItem],
      updatedAt: Date.now(),
    });
    toast.success(`'${newItem.title}' 항목이 추가되었습니다.`);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<WorldSheetItem>) => {
    const nextItems = docData.items.map((it) =>
      it.id === itemId ? { ...it, ...updates } : it
    );
    pushState({
      ...docData,
      items: nextItems,
      updatedAt: Date.now(),
    });
  };

  const handleDeleteItem = (itemId: string) => {
    const nextItems = docData.items.filter((it) => it.id !== itemId);
    pushState({
      ...docData,
      items: nextItems,
      updatedAt: Date.now(),
    });
  };

  const handleMoveItemOrder = (itemId: string, direction: 'up' | 'down') => {
    const sorted = [...docData.items].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((it) => it.id === itemId);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const prev = sorted[index - 1];
      const cur = sorted[index];
      const temp = prev.order;
      prev.order = cur.order;
      cur.order = temp;
      pushState({
        ...docData,
        items: [...sorted],
        updatedAt: Date.now(),
      });
    } else if (direction === 'down' && index < sorted.length - 1) {
      const next = sorted[index + 1];
      const cur = sorted[index];
      const temp = next.order;
      next.order = cur.order;
      cur.order = temp;
      pushState({
        ...docData,
        items: [...sorted],
        updatedAt: Date.now(),
      });
    }
  };

  // Export Image
  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    try {
      await exportElementAsPng(printRef.current, {
        fileName: `${activeDocument.title || '세계관-시트'}_${docData.worldName}`,
      });
      toast.success('세계관 시트 이미지가 저장되었습니다.');
    } catch (e) {
      toast.error('이미지 저장 중 오류가 발생했습니다.');
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const sortedItems = [...docData.items].sort((a, b) => a.order - b.order);

  return (
    <div
      className={`h-full flex flex-col bg-[#F9FAFD] dark:bg-[#17171D] text-slate-800 dark:text-[#E8E7EF] font-sans antialiased overflow-hidden select-none transition-colors duration-200 ${
        isFullscreen ? 'fixed inset-0 z-50' : 'relative'
      }`}
    >
      {/* 1. Global Header */}
      <SpecialEditorHeader
        onExportImage={handleExportImage}
      />

      {/* 2. Secondary Control Toolbar */}
      <div className="h-12 px-6 border-b border-[#ECEEF3] dark:border-[#3A3948] flex items-center justify-between shrink-0 bg-white/95 dark:bg-[#1E1E27]/95 backdrop-blur-xs transition-colors duration-200 z-20 shadow-2xs">
        {/* Left: Add Item Button + Undo/Redo */}
        <div className="flex items-center gap-2">
          {isEditMode && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAddMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-lavender-600 hover:bg-lavender-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>항목 추가</span>
              </button>

              <AddWorldItemMenu
                isOpen={isAddMenuOpen}
                onClose={() => setIsAddMenuOpen(false)}
                onSelectItemType={handleAddItem}
              />
            </div>
          )}

          {isEditMode && <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] mx-1" />}

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="실행 취소 (Ctrl+Z)"
              disabled={historyIdx <= 0}
              onClick={handleUndo}
              className="p-1.5 text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-lg transition-colors disabled:opacity-25"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="다시 실행 (Ctrl+Y)"
              disabled={historyIdx >= history.length - 1}
              onClick={handleRedo}
              className="p-1.5 text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-lg transition-colors disabled:opacity-25"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Mode Indicator & Toggle */}
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/40 px-3 py-1 rounded-full text-xs animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span className="font-bold text-emerald-700 dark:text-emerald-300">편집 모드 활성</span>
              <button
                type="button"
                onClick={() => {
                  setIsEditMode(false);
                  toast.success('보기 모드로 전환되었습니다.');
                }}
                className="ml-1.5 px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] shadow-2xs flex items-center gap-1 transition-colors"
              >
                <Check className="w-3 h-3" />
                <span>완료</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 dark:text-[#A5A3B5] font-medium hidden sm:inline">
                읽기 전용 상태
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsEditMode(true);
                  toast.info('편집 모드로 진입했습니다. 항목 추가 및 편집이 가능합니다.');
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-lavender-600 hover:bg-lavender-500 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>편집 모드</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Export Image & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportImage}
            title="세계관 시트 PNG 이미지 저장"
            className="p-1.5 text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? '전체화면 종료' : '전체화면 전환'}
            className="p-1.5 text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3. Main Stage Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div ref={printRef} className="max-w-6xl mx-auto flex flex-col gap-6">
          {/* Hero Banner: World Overview */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-[#3A3948] bg-white dark:bg-[#1E1E27] shadow-sm">
            {/* Cover Image Background */}
            <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-gradient-to-r from-lavender-900 to-indigo-950">
              {docData.coverImageUrl ? (
                <img
                  src={docData.coverImageUrl}
                  alt={docData.worldName}
                  className="w-full h-full object-cover opacity-75"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Cover Image Change Button */}
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleChangeCoverImage}
                  className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 transition-colors border border-white/20"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>커버 이미지 변경</span>
                </button>
              )}

              {/* World Title & One-Line Intro Inside Banner */}
              <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between gap-4">
                <div className="flex-1 min-w-0 text-white">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-lavender-500/80 text-white backdrop-blur-xs border border-lavender-400/40">
                      세계관 중심 시트
                    </span>
                  </div>

                  {isEditMode ? (
                    <input
                      type="text"
                      value={docData.worldName}
                      onChange={(e) => handleUpdateWorldInfo({ worldName: e.target.value })}
                      placeholder="세계관 명칭 입력"
                      className="text-2xl sm:text-3xl font-extrabold text-white bg-transparent border-b border-dashed border-white/50 focus:border-white focus:outline-hidden w-full px-1"
                    />
                  ) : (
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white truncate drop-shadow-sm">
                      {docData.worldName}
                    </h1>
                  )}

                  {isEditMode ? (
                    <input
                      type="text"
                      value={docData.oneLineIntro}
                      onChange={(e) => handleUpdateWorldInfo({ oneLineIntro: e.target.value })}
                      placeholder="세계관 한 줄 소개를 입력하세요..."
                      className="text-xs sm:text-sm text-slate-200 bg-transparent border-b border-dashed border-white/40 focus:border-white focus:outline-hidden w-full px-1 mt-1.5"
                    />
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-200 mt-1 line-clamp-2 drop-shadow-xs">
                      {docData.oneLineIntro}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card Items List */}
          <div className="flex flex-col gap-5">
            {sortedItems.map((item, index) => (
              <WorldSheetCardRenderer
                key={item.id}
                item={item}
                isEditMode={isEditMode}
                canMoveUp={index > 0}
                canMoveDown={index < sortedItems.length - 1}
                onMoveUp={() => handleMoveItemOrder(item.id, 'up')}
                onMoveDown={() => handleMoveItemOrder(item.id, 'down')}
                onDelete={() => handleDeleteItem(item.id)}
                onUpdate={(updates) => handleUpdateItem(item.id, updates)}
              />
            ))}

            {sortedItems.length === 0 && (
              <div className="py-16 text-center bg-white dark:bg-[#1E1E27] rounded-2xl border border-dashed border-slate-300 dark:border-[#3A3948]">
                <Globe className="w-10 h-10 mx-auto text-slate-300 dark:text-[#4E4D61] mb-2" />
                <h4 className="text-sm font-bold text-slate-600 dark:text-[#E8E7EF]">
                  추가된 항목이 없습니다.
                </h4>
                <p className="text-xs text-slate-400 dark:text-[#A5A3B5] mt-1 mb-4">
                  편집 모드에서 상단의 '항목 추가'를 눌러 세계관 카드를 구성해보세요.
                </p>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => handleAddItem('detail-card')}
                    className="px-4 py-2 bg-lavender-600 hover:bg-lavender-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    + 기본 정보 카드 추가하기
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
