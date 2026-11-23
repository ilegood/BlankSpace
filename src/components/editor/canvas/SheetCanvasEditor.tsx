import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Undo2, Redo2, ZoomIn, ZoomOut } from 'lucide-react';
import { CanvasCardItem, DesignPresetItem } from '../../../types';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { EditorHeader } from '../EditorHeader';
import {
  BUILTIN_DESIGN_PRESETS,
  CatalogComponentDef,
  COMMON_CATALOG,
  SPECIAL_CATALOG,
  createCardFromDef,
  getInitialCardsForTemplate,
} from './canvasCatalog';
import { CanvasCardView } from './CanvasCardView';
import { CanvasRightPanel } from './CanvasRightPanel';
import { TEMPLATES } from '../../../templates/templateList';
import { generateId } from '../../../utils/id';
import { useToast } from '../../toast/ToastContext';

interface SheetCanvasEditorProps {
  templateOverrideId?: string | null;
}

export const SheetCanvasEditor: React.FC<SheetCanvasEditorProps> = ({ templateOverrideId }) => {
  const {
    activeDocument,
    activePage,
    openDocument,
    openTemplateEditor,
    updateDocument,
    updatePage,
    userTemplates,
    defaultTemplateOverrides,
    saveDefaultTemplateOverride,
    resetDefaultTemplateOverride,
    saveDesignPreset,
    getBacklinksForDocument,
    pendingSearchHighlight,
    setPendingSearchHighlight,
  } = useWorkspace();
  const { showToast } = useToast();

  const isTemplateMode = Boolean(templateOverrideId);
  const editingUserTpl = templateOverrideId
    ? userTemplates.find((u) => u.id === templateOverrideId) || null
    : null;
  const templateType =
    editingUserTpl?.baseTemplateType ||
    templateOverrideId ||
    activeDocument?.templateType ||
    'character-sheet';
  const tpl = TEMPLATES.find((t) => t.id === templateType);

  const [isEditMode, setIsEditMode] = useState(isTemplateMode);
  const [cards, setCards] = useState<CanvasCardItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string>('default');
  const [fontStyle, setFontStyle] = useState<'sans' | 'serif' | 'mono'>('sans');

  // Zoom, Pan, Snap Guides, Undo/Redo, Formula link flash
  const [zoom, setZoom] = useState(1);
  const [spacePressed, setSpacePressed] = useState(false);
  const [snapGuides, setSnapGuides] = useState<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [flashCardIds, setFlashCardIds] = useState<string[]>([]);

  const historyRef = useRef<{ undo: CanvasCardItem[][]; redo: CanvasCardItem[][] }>({
    undo: [],
    redo: [],
  });
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    historyRef.current = { undo: [], redo: [] };
    setZoom(1);

    if (isTemplateMode && templateOverrideId) {
      const userTpl = userTemplates.find((u) => u.id === templateOverrideId);
      const overrideRaw = userTpl ? userTpl.content : defaultTemplateOverrides[templateOverrideId];
      if (overrideRaw) {
        try {
          const parsed = JSON.parse(overrideRaw);
          setCards(parsed.cards || getInitialCardsForTemplate(templateType));
          return;
        } catch {
          // ignore
        }
      }
      setCards(userTpl ? [] : getInitialCardsForTemplate(templateType));
      return;
    }

    if (activePage?.content) {
      try {
        const parsed = JSON.parse(activePage.content);
        if (Array.isArray(parsed.cards)) {
          setCards(parsed.cards);
          return;
        }
      } catch {
        // ignore
      }
    }
    const baseOverride = defaultTemplateOverrides[templateType];
    if (baseOverride) {
      try {
        const parsed = JSON.parse(baseOverride);
        if (Array.isArray(parsed.cards)) {
          setCards(parsed.cards);
          return;
        }
      } catch {
        // ignore
      }
    }
    setCards(getInitialCardsForTemplate(templateType));
  }, [activePage?.id, templateOverrideId, templateType]);

  // §3-6: When opened from SearchResultsView, scroll to the matching card and pulse highlight for 1.2s
  useEffect(() => {
    if (!pendingSearchHighlight || cards.length === 0) return;
    const q = pendingSearchHighlight.toLowerCase();
    const matched = cards.find(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        JSON.stringify(c.data || {})
          .toLowerCase()
          .includes(q)
    );
    if (matched) {
      setFlashCardIds([matched.id]);
      window.setTimeout(() => {
        const cardEl = scrollContainerRef.current?.querySelector(
          `[data-card-id="${matched.id}"]`
        ) as HTMLElement | null;
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }, 90);
      window.setTimeout(() => setFlashCardIds([]), 1250);
    }
    setPendingSearchHighlight(null);
  }, [cards, pendingSearchHighlight, setPendingSearchHighlight]);

  const commitCardsRaw = useCallback(
    (next: CanvasCardItem[], recordHistory = true) => {
      setCards((prev) => {
        if (recordHistory) {
          historyRef.current.undo.push(JSON.parse(JSON.stringify(prev)));
          if (historyRef.current.undo.length > 40) historyRef.current.undo.shift();
          historyRef.current.redo = [];
        }
        return next;
      });
      const serialized = JSON.stringify({ cards: next });
      if (isTemplateMode && templateOverrideId) {
        saveDefaultTemplateOverride(templateOverrideId, serialized);
      } else if (activePage) {
        updatePage(activePage.id, { content: serialized });
      }
    },
    [activePage, isTemplateMode, saveDefaultTemplateOverride, templateOverrideId, updatePage]
  );

  const handleUndo = useCallback(() => {
    const prev = historyRef.current.undo.pop();
    if (!prev) return;
    historyRef.current.redo.push(JSON.parse(JSON.stringify(cards)));
    commitCardsRaw(prev, false);
  }, [cards, commitCardsRaw]);

  const handleRedo = useCallback(() => {
    const next = historyRef.current.redo.pop();
    if (!next) return;
    historyRef.current.undo.push(JSON.parse(JSON.stringify(cards)));
    commitCardsRaw(next, false);
  }, [cards, commitCardsRaw]);

  const handleAddComponent = (def: CatalogComponentDef, x?: number, y?: number) => {
    const el = scrollContainerRef.current;
    const offset = (cards.length % 5) * 24;
    const defaultX = el
      ? Math.max(24, Math.round(el.scrollLeft / zoom + 48 + offset))
      : 36 + offset;
    const defaultY = el
      ? Math.max(24, Math.round(el.scrollTop / zoom + 48 + offset))
      : 36 + offset;
    const card = createCardFromDef(def, x ?? defaultX, y ?? defaultY);
    commitCardsRaw([...cards, card]);
    setSelectedId(card.id);
  };

  const handleUpdateCard = useCallback(
    (id: string, patch: Partial<CanvasCardItem>) => {
      const next = cards.map((c) => (c.id === id ? { ...c, ...patch } : c));
      commitCardsRaw(next);

      // Flash linked difficulty-curve cards when a formula card changes (§5-5)
      const updated = cards.find((c) => c.id === id);
      if (updated?.type === 'formula-card' && patch.data) {
        const linkedCurveIds = next
          .filter(
            (c) =>
              c.type === 'difficulty-curve-card' &&
              c.data?.actualSource !== 'manual' &&
              c.data?.linkedFormulaId === id
          )
          .map((c) => c.id);
        if (linkedCurveIds.length > 0) {
          setFlashCardIds(linkedCurveIds);
          window.setTimeout(() => setFlashCardIds([]), 750);
        }
      }
    },
    [cards, commitCardsRaw]
  );

  const handleDuplicateCard = useCallback(
    (id: string) => {
      const src = cards.find((c) => c.id === id);
      if (!src) return;
      const copy: CanvasCardItem = {
        ...JSON.parse(JSON.stringify(src)),
        id: generateId('card'),
        x: src.x + 20,
        y: src.y + 20,
      };
      commitCardsRaw([...cards, copy]);
      setSelectedId(copy.id);
      showToast(`'${src.title}' 카드를 복제했습니다`);
    },
    [cards, commitCardsRaw, showToast]
  );

  const handleDeleteCard = useCallback(
    (id: string) => {
      const target = cards.find((c) => c.id === id);
      const snapshot = JSON.parse(JSON.stringify(cards));
      commitCardsRaw(cards.filter((c) => c.id !== id));
      if (selectedId === id) setSelectedId(null);
      if (target) {
        showToast(`'${target.title}' 카드를 삭제했습니다`, {
          onUndo: () => commitCardsRaw(snapshot, false),
        });
      }
    },
    [cards, commitCardsRaw, selectedId, showToast]
  );

  // Canvas keyboard shortcuts (§4-2, §9): Undo/Redo, Duplicate, Delete, Arrow nudge, Zoom, Space-pan
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (e.target as HTMLElement)?.isContentEditable;

      if (e.code === 'Space' && !isTyping) {
        setSpacePressed(true);
      }

      if (isTyping) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && isEditMode) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y' && isEditMode) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && isEditMode && selectedId) {
        e.preventDefault();
        handleDuplicateCard(selectedId);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && isEditMode && selectedId) {
        e.preventDefault();
        handleDeleteCard(selectedId);
        return;
      }
      if ((e.key === '+' || e.key === '=') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setZoom((z) => Math.min(2, Number((z + 0.1).toFixed(2))));
        return;
      }
      if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))));
        return;
      }
      if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setZoom(1);
        return;
      }

      if (isEditMode && selectedId) {
        const step = e.shiftKey ? 10 : 1;
        const selected = cards.find((c) => c.id === selectedId);
        if (!selected) return;
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handleUpdateCard(selectedId, { x: Math.max(8, selected.x - step) });
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleUpdateCard(selectedId, { x: selected.x + step });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          handleUpdateCard(selectedId, { y: Math.max(8, selected.y - step) });
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          handleUpdateCard(selectedId, { y: selected.y + step });
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePressed(false);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [
    cards,
    handleDeleteCard,
    handleDuplicateCard,
    handleRedo,
    handleUndo,
    handleUpdateCard,
    isEditMode,
    selectedId,
  ]);

  const startCanvasPan = (e: React.MouseEvent) => {
    if (!spacePressed && e.button !== 1) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startSL = el.scrollLeft;
    const startST = el.scrollTop;

    const onMove = (ev: MouseEvent) => {
      el.scrollLeft = startSL - (ev.clientX - startX);
      el.scrollTop = startST - (ev.clientY - startY);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const builtinPresets = BUILTIN_DESIGN_PRESETS[templateType] || [];

  const handleApplyPreset = (preset: DesignPresetItem) => {
    setActivePresetId(preset.id);
    setFontStyle(preset.fontFamily || 'sans');
    if (preset.layoutMap) {
      const next = cards.map((c) =>
        preset.layoutMap?.[c.id] ? { ...c, ...preset.layoutMap[c.id] } : c
      );
      commitCardsRaw(next);
    }
  };

  const handleSavePreset = (name: string) => {
    const layoutMap: Record<string, { x: number; y: number; w: number; h: number }> = {};
    cards.forEach((c) => {
      layoutMap[c.id] = { x: c.x, y: c.y, w: c.w, h: c.h };
    });
    const created = saveDesignPreset({
      templateType,
      name,
      description: '사용자 저장 프리셋',
      swatches: ['#FFFFFF', '#6A5ACD', '#EBE8F5'],
      fontLabel: `글꼴: ${fontStyle}`,
      fontFamily: fontStyle,
      layoutMap,
    });
    setActivePresetId(created.id);
  };

  const selectedCard = cards.find((c) => c.id === selectedId) || null;
  const backlinks = activeDocument ? getBacklinksForDocument(activeDocument.id) : [];

  const maxCardBottom = Math.max(
    420,
    ...cards.map((c) => c.y + (c.collapsed ? 44 : Math.max(c.h, 110)))
  );
  const maxCardRight = Math.max(820, ...cards.map((c) => c.x + c.w));

  const fontClass =
    fontStyle === 'serif' ? 'font-serif' : fontStyle === 'mono' ? 'font-mono' : 'font-sans';

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-white dark:bg-[#15151C]">
      <EditorHeader
        title={
          isTemplateMode
            ? `${editingUserTpl?.name || tpl?.name || '사용자 템플릿'} (템플릿)`
            : activeDocument?.title || '문서'
        }
        onTitleChange={(t) => activeDocument && updateDocument(activeDocument.id, { title: t })}
        templateType={templateType}
        isEditMode={isEditMode}
        onChangeMode={(edit) => {
          setIsEditMode(edit);
          if (!edit) setSelectedId(null);
        }}
        onExit={() => {
          if (isTemplateMode) openTemplateEditor(null);
          else openDocument(null);
        }}
        isTemplateMode={isTemplateMode}
        onResetTemplate={() => {
          if (templateOverrideId) {
            resetDefaultTemplateOverride(templateOverrideId);
            setCards(getInitialCardsForTemplate(templateType));
            showToast('기본 템플릿을 원래 상태로 복원했습니다');
          }
        }}
        supportsDesignPreset={Boolean(tpl?.supportsDesignPreset)}
        builtinPresets={builtinPresets}
        activePresetId={activePresetId}
        onApplyPreset={handleApplyPreset}
        onSavePreset={handleSavePreset}
        onResetPreset={() => {
          setActivePresetId('default');
          setFontStyle('sans');
        }}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Main Canvas Area */}
        <div
          ref={scrollContainerRef}
          onMouseDown={startCanvasPan}
          onClick={() => setSelectedId(null)}
          onWheel={(e) => {
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              setZoom((z) =>
                Math.min(2, Math.max(0.5, Number((z + (e.deltaY < 0 ? 0.1 : -0.1)).toFixed(2))))
              );
            }
          }}
          onDragOver={(e) => {
            if (!isEditMode) return;
            if (e.dataTransfer.types.includes('application/x-blankspace-component')) {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
            }
          }}
          onDrop={(e) => {
            if (!isEditMode) return;
            const compType = e.dataTransfer.getData('application/x-blankspace-component');
            if (!compType) return;
            e.preventDefault();
            const allSpecial = Object.values(SPECIAL_CATALOG).flat();
            const allDefs = [...COMMON_CATALOG, ...allSpecial];
            const def = allDefs.find((x) => x.type === compType);
            if (!def || !scrollContainerRef.current) return;
            const rect = scrollContainerRef.current.getBoundingClientRect();
            const x = Math.max(
              12,
              Math.round((e.clientX - rect.left + scrollContainerRef.current.scrollLeft) / zoom - def.defaultW / 2)
            );
            const y = Math.max(
              12,
              Math.round((e.clientY - rect.top + scrollContainerRef.current.scrollTop) / zoom - 24)
            );
            handleAddComponent(def, x, y);
          }}
          className={`flex-1 relative overflow-auto ${
            spacePressed ? 'cursor-grab' : ''
          } ${isEditMode ? 'canvas-dot-grid' : 'bg-[#FAF9FE] dark:bg-[#15151C]'}`}
        >
          <div
            data-export-root="true"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
              minWidth: Math.max(1120, maxCardRight + 64),
              minHeight: Math.max(820, maxCardBottom + 180),
            }}
            className="relative"
          >
            {/* Document Banner if set on document (수정사항.md: 문서도 배너 설정 가능, 폴더와 디자인 통일) */}
            {!isTemplateMode && activeDocument?.coverImage && (
              <div
                style={{ left: 24, top: 16, width: Math.max(780, maxCardRight - 24) }}
                className="h-28 rounded-2xl overflow-hidden border border-[#E6E3F0] dark:border-[#2E2D3D] mb-4"
              >
                <img
                  src={activeDocument.coverImage}
                  alt={activeDocument.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Magnetic Snap Alignment Guidelines */}
            {isEditMode &&
              snapGuides.x.map((gx, i) => (
                <div
                  key={`sx-${i}`}
                  style={{ left: gx }}
                  className="absolute top-0 bottom-0 w-px border-l border-dashed border-[#6A5ACD]/80 pointer-events-none z-40"
                />
              ))}
            {isEditMode &&
              snapGuides.y.map((gy, i) => (
                <div
                  key={`sy-${i}`}
                  style={{ top: gy }}
                  className="absolute left-0 right-0 h-px border-t border-dashed border-[#6A5ACD]/80 pointer-events-none z-40"
                />
              ))}

            {cards.map((card) => (
              <CanvasCardView
                key={card.id}
                card={card}
                allCards={cards}
                isEditMode={isEditMode}
                isSelected={selectedId === card.id}
                zoom={zoom}
                isFlashing={flashCardIds.includes(card.id)}
                onSelect={() => setSelectedId(card.id)}
                onUpdate={(patch) => handleUpdateCard(card.id, patch)}
                onOpenDoc={(docId) => openDocument(docId)}
                onSnapGuides={setSnapGuides}
                fontClass={fontClass}
              />
            ))}

            {/* Wide Horizontal Backlinks Panel placed BELOW all components so it is never covered (수정사항.md 컴포넌트 5) */}
            {!isEditMode && !isTemplateMode && (
              <div
                style={{
                  left: 24,
                  top: maxCardBottom + 36,
                  width: Math.max(780, maxCardRight - 24),
                }}
                className="absolute rounded-2xl bg-white dark:bg-[#1E1E29] border border-[#E6E3F0] dark:border-[#2E2D3D] p-4 shadow-2xs flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                    역링크 ({backlinks.length})
                  </div>
                  <span className="text-[10.5px] text-[#8A8998]">
                    이 문서를 참조하고 있는 연결 문서 목록입니다
                  </span>
                </div>
                {backlinks.length === 0 ? (
                  <p className="text-[11px] text-[#8A8998]">참조 중인 문서가 없습니다.</p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {backlinks.map((bl) => (
                      <button
                        key={bl.sourceDoc.id}
                        type="button"
                        onClick={() => bl.status === 'active' && openDocument(bl.sourceDoc.id)}
                        className="px-3 py-1.5 rounded-xl border border-[#E6E3F0] dark:border-[#323244] bg-[#FAF9FE] dark:bg-[#232231] flex items-center gap-2 text-left text-xs hover:border-[#6A5ACD] transition-colors"
                      >
                        <span className="px-1.5 py-0.5 rounded bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] text-[10px] font-semibold">
                          문서
                        </span>
                        <span
                          className={`truncate max-w-[220px] ${
                            bl.status === 'trashed'
                              ? 'line-through text-[#8A8998]'
                              : 'text-[#1B1B1F] dark:text-[#F1F0F6] font-medium'
                          }`}
                        >
                          {bl.sourceDoc.title}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Floating Bottom-Left Zoom & Undo/Redo Pill */}
          <div
            data-export-ignore="true"
            onClick={(e) => e.stopPropagation()}
            className="fixed bottom-4 left-[280px] z-30 flex items-center gap-1 rounded-full bg-white/95 dark:bg-[#1E1E29]/95 border border-[#E6E3F0] dark:border-[#2E2D3D] shadow-md px-2 py-1 text-xs"
          >
            {isEditMode && (
              <>
                <button
                  type="button"
                  title="실행 취소 (Ctrl+Z)"
                  disabled={historyRef.current.undo.length === 0}
                  onClick={handleUndo}
                  className="p-1 rounded-full text-[#4E4D59] dark:text-[#B4B2C4] disabled:opacity-30 hover:bg-black/5"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="다시 실행 (Ctrl+Shift+Z)"
                  disabled={historyRef.current.redo.length === 0}
                  onClick={handleRedo}
                  className="p-1 rounded-full text-[#4E4D59] dark:text-[#B4B2C4] disabled:opacity-30 hover:bg-black/5"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
                <span className="w-px h-3.5 bg-[#E6E3F0] dark:bg-[#2E2D3D] mx-0.5" />
              </>
            )}
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
              className="p-1 rounded-full text-[#4E4D59] dark:text-[#B4B2C4] hover:bg-black/5"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="px-1.5 text-[11px] font-semibold tabular-nums text-[#1B1B1F] dark:text-[#F1F0F6]"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, Number((z + 0.1).toFixed(2))))}
              className="p-1 rounded-full text-[#4E4D59] dark:text-[#B4B2C4] hover:bg-black/5"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Panel only in Edit Mode */}
        {isEditMode && (
          <CanvasRightPanel
            templateType={templateType}
            selectedCard={selectedCard}
            allCards={cards}
            onClearSelection={() => setSelectedId(null)}
            onAddComponent={handleAddComponent}
            onUpdateCard={handleUpdateCard}
            onDuplicateCard={handleDuplicateCard}
            onDeleteCard={handleDeleteCard}
          />
        )}
      </div>
    </div>
  );
};
