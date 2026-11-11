import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { exportElementAsPng } from '../../../utils/exportImage';
import {
  CharacterRelationsDocData,
  RelationCharacter,
  RelationItem,
  RelationLegendItem,
  AnchorPosition,
  DEFAULT_RELATION_LEGENDS,
} from '../../../types/relations';
import {
  INITIAL_RELATIONS_DATA,
  convertLegacyToRelations,
} from './relations/relationsPresets';
import { RelationCanvas } from './relations/RelationCanvas';
import { RelationSidebar } from './relations/RelationSidebar';
import { RelationInspector } from './relations/RelationInspector';
import { RelationListView } from './relations/RelationListView';
import { AddRelationCharacterModal } from './relations/AddRelationCharacterModal';
import { CharacterRelationsHelpModal } from './relations/CharacterRelationsHelpModal';
import { useToast } from '../../toast/ToastContext';
import { useTheme } from '../../../store/ThemeContext';
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
  Share2,
  List,
  UserPlus,
  MousePointer2,
  Hand,
  Sparkles,
} from 'lucide-react';

export const CharacterRelationsEditor: React.FC = () => {
  const {
    activeDocument,
    activePage,
    setActiveDocument,
    updateDocumentTitle,
    toggleFavoriteDocument,
    updatePageContent,
  } = useWorkspace();
  const { toast } = useToast();
  const { isDark } = useTheme();
  const printRef = useRef<HTMLDivElement>(null);

  // Document Title & Autosave Status
  const [docTitle, setDocTitle] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Main Relations Document State
  const [docData, setDocData] = useState<CharacterRelationsDocData>(
    INITIAL_RELATIONS_DATA
  );

  // View / Mode States (Requirement 15: Default is VIEW mode)
  const [viewTab, setViewTab] = useState<'graph' | 'list'>('graph');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<'pointer' | 'connect' | 'hand'>('pointer');

  // Selection States
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(null);

  // Legend Highlight Filter State
  const [highlightedLegendId, setHighlightedLegendId] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Undo / Redo History
  const [history, setHistory] = useState<CharacterRelationsDocData[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const isUndoRedoAction = useRef(false);

  // Sync title
  useEffect(() => {
    if (activeDocument) {
      setDocTitle(activeDocument.title);
    }
  }, [activeDocument]);

  // Load from Page Content or Initial
  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        const converted = convertLegacyToRelations(parsed);
        setDocData(converted);
        setHistory([converted]);
        setHistoryIdx(0);
        return;
      }
    } catch (err) {
      console.warn('Failed to parse relations page content:', err);
    }

    setDocData(INITIAL_RELATIONS_DATA);
    setHistory([INITIAL_RELATIONS_DATA]);
    setHistoryIdx(0);
  }, [activePage?.id]);

  // Push new state to undo/redo history
  const pushState = useCallback(
    (nextData: CharacterRelationsDocData) => {
      setDocData(nextData);

      if (isUndoRedoAction.current) {
        isUndoRedoAction.current = false;
        return;
      }

      setHistory((prev) => {
        const sliced = prev.slice(0, historyIdx + 1);
        return [...sliced, nextData];
      });
      setHistoryIdx((prev) => prev + 1);
    },
    [historyIdx]
  );

  // Autosave to Page content
  useEffect(() => {
    if (!activePage) return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        const json = JSON.stringify(docData);
        updatePageContent(activePage.id, json);
        setSaveStatus('saved');
      } catch (e) {
        console.error('Failed to autosave relations:', e);
        setSaveStatus('saved');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [docData, activePage?.id]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIdx > 0) {
      isUndoRedoAction.current = true;
      const nextIdx = historyIdx - 1;
      setHistoryIdx(nextIdx);
      setDocData(history[nextIdx]);
      toast.info('실행 취소되었습니다.');
    }
  }, [historyIdx, history, toast]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      isUndoRedoAction.current = true;
      const nextIdx = historyIdx + 1;
      setHistoryIdx(nextIdx);
      setDocData(history[nextIdx]);
      toast.info('다시 실행되었습니다.');
    }
  }, [historyIdx, history, toast]);

  // Title Save
  const handleTitleBlurOrEnter = () => {
    if (activeDocument && docTitle.trim() && docTitle !== activeDocument.title) {
      updateDocumentTitle(activeDocument.id, docTitle.trim());
      toast.success('제목이 변경되었습니다.');
    }
  };

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+E, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('input, textarea, [contenteditable="true"]');

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsEditMode((prev) => {
          const next = !prev;
          if (!next) {
            setSelectedCharacterId(null);
            setSelectedRelationId(null);
          }
          toast.info(next ? '편집 모드로 진입했습니다.' : '보기 모드로 전환되었습니다.');
          return next;
        });
        return;
      }

      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isEditMode) return;
        if (selectedRelationId) {
          e.preventDefault();
          handleDeleteRelation(selectedRelationId);
        } else if (selectedCharacterId) {
          e.preventDefault();
          handleDeleteCharacter(selectedCharacterId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isEditMode,
    selectedRelationId,
    selectedCharacterId,
    handleUndo,
    handleRedo,
    toast,
  ]);

  // ------------------------------------------------------------------
  // Character Actions
  // ------------------------------------------------------------------
  const handleAddCharacter = (charData: Omit<RelationCharacter, 'id'>) => {
    const newChar: RelationCharacter = {
      ...charData,
      id: `char-${Date.now()}`,
      shape: 'circle',
      size: 88,
      borderWidth: 4,
      borderColor: charData.color || '#EF4444',
      showName: charData.showName !== false,
    };

    const nextChars = [...docData.characters, newChar];
    pushState({
      ...docData,
      characters: nextChars,
    });
    setSelectedCharacterId(newChar.id);
    setSelectedRelationId(null);
    toast.success(`'${newChar.name}' 캐릭터가 관계도에 추가되었습니다.`);
  };

  const handleDeleteCharacter = (id: string) => {
    const nextChars = docData.characters.filter((c) => c.id !== id);
    const nextRels = docData.relations.filter(
      (r) => r.sourceId !== id && r.targetId !== id
    );

    pushState({
      ...docData,
      characters: nextChars,
      relations: nextRels,
    });

    if (selectedCharacterId === id) setSelectedCharacterId(null);
    toast.info('캐릭터 및 연결된 관계선이 삭제되었습니다.');
  };

  const handleUpdateCharacter = (id: string, updates: Partial<RelationCharacter>) => {
    const nextChars = docData.characters.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    pushState({
      ...docData,
      characters: nextChars,
    });
  };

  // ------------------------------------------------------------------
  // Relation Actions
  // ------------------------------------------------------------------
  const handleCreateRelation = (
    sourceId: string,
    targetId: string,
    sourceAnchor?: AnchorPosition,
    targetAnchor?: AnchorPosition
  ) => {
    if (sourceId === targetId) {
      toast.warning('동일한 캐릭터끼리는 관계선을 연결할 수 없습니다.');
      return;
    }

    // 이미 두 캐릭터 사이에 관계선이 존재하는지 확인 (오직 1개의 관계선만 허용)
    const existingRel = docData.relations.find(
      (r) =>
        (r.sourceId === sourceId && r.targetId === targetId) ||
        (r.sourceId === targetId && r.targetId === sourceId)
    );

    if (existingRel) {
      setSelectedRelationId(existingRel.id);
      setSelectedCharacterId(null);
      toast.info('이미 두 캐릭터 사이에 연결된 관계선이 존재합니다.');
      return;
    }

    const defaultLegend = (docData.legends || DEFAULT_RELATION_LEGENDS)[1] || (docData.legends || DEFAULT_RELATION_LEGENDS)[0];

    const newRel: RelationItem = {
      id: `rel-${Date.now()}`,
      sourceId,
      targetId,
      relationType: defaultLegend?.name || '우호적',
      label: defaultLegend?.name || '우호적',
      color: defaultLegend?.color || '#3B82F6',
      style: defaultLegend?.style || 'solid',
      strokeWidth: 3.5,
      direction: 'bidirectional',
      sourceAnchor,
      targetAnchor,
      legendId: defaultLegend?.id,
      legendIdAtoB: defaultLegend?.id,
      emotionAtoB: defaultLegend?.name || '우호적',
      colorAtoB: defaultLegend?.color || '#3B82F6',
      legendIdBtoA: defaultLegend?.id,
      emotionBtoA: defaultLegend?.name || '우호적',
      colorBtoA: defaultLegend?.color || '#3B82F6',
      curvature: 15,
      showLabel: false,
    };

    const nextRels = [...docData.relations, newRel];
    pushState({
      ...docData,
      relations: nextRels,
    });
    setSelectedRelationId(newRel.id);
    setSelectedCharacterId(null);
    toast.success('두 캐릭터 사이에 관계선이 연결되었습니다.');
  };

  const handleUpdateRelation = (id: string, updates: Partial<RelationItem>) => {
    const nextRels = docData.relations.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    pushState({
      ...docData,
      relations: nextRels,
    });
  };

  const handleDeleteRelation = (id: string) => {
    const nextRels = docData.relations.filter((r) => r.id !== id);
    pushState({
      ...docData,
      relations: nextRels,
    });
    if (selectedRelationId === id) setSelectedRelationId(null);
    toast.info('관계선이 삭제되었습니다.');
  };

  // ------------------------------------------------------------------
  // Legend Actions
  // ------------------------------------------------------------------
  const handleToggleLegendHighlight = (legendId: string | null) => {
    setHighlightedLegendId(legendId);
    if (legendId) {
      toast.info('선택한 범례의 관계선이 강조 표시됩니다.');
    }
  };

  const handleUpdateLegendSettings = (
    settings: Partial<NonNullable<CharacterRelationsDocData['legendSettings']>>
  ) => {
    const current = docData.legendSettings || {
      visible: true,
      x: 28,
      y: 28,
      orientation: 'vertical',
    };
    pushState({
      ...docData,
      legendSettings: { ...current, ...settings },
    });
  };

  const handleUpdateLegend = (id: string, updates: Partial<RelationLegendItem>) => {
    const currentLegends = docData.legends || DEFAULT_RELATION_LEGENDS;
    const nextLegends = currentLegends.map((l) =>
      l.id === id ? { ...l, ...updates } : l
    );

    const nextRelations = docData.relations.map((r) => {
      if (r.legendId === id) {
        return {
          ...r,
          ...(updates.color ? { color: updates.color } : {}),
          ...(updates.style ? { style: updates.style } : {}),
          ...(updates.name ? { relationType: updates.name } : {}),
        };
      }
      return r;
    });

    pushState({
      ...docData,
      legends: nextLegends,
      relations: nextRelations,
    });
  };

  const handleAddLegend = (newLegend: RelationLegendItem) => {
    const currentLegends = docData.legends || DEFAULT_RELATION_LEGENDS;
    pushState({
      ...docData,
      legends: [...currentLegends, newLegend],
    });
  };

  const handleDeleteLegend = (id: string) => {
    const currentLegends = docData.legends || DEFAULT_RELATION_LEGENDS;
    const nextLegends = currentLegends.filter((l) => l.id !== id);
    pushState({
      ...docData,
      legends: nextLegends,
    });
    if (highlightedLegendId === id) setHighlightedLegendId(null);
    toast.info('범례 항목이 삭제되었습니다.');
  };

  // Export as Image
  const handleExportImage = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    toast.info('관계도 이미지를 생성하는 중입니다...');
    try {
      await exportElementAsPng(printRef.current, {
        fileName: `${docTitle.trim() || '캐릭터_관계도'}_${new Date().toISOString().slice(0, 10)}`,
        backgroundColor: isDark ? '#17171D' : '#FAFAFD',
      });
      toast.success('관계도가 고해상도 PNG 이미지로 저장되었습니다.');
    } catch (e) {
      console.error(e);
      toast.error('이미지 저장 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  // Find Selected Items
  const selectedCharacter =
    docData.characters.find((c) => c.id === selectedCharacterId) || null;
  const selectedRelation =
    docData.relations.find((r) => r.id === selectedRelationId) || null;

  return (
    <div className="w-full h-full flex flex-col bg-[#FAFAFD] dark:bg-[#121217] text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-colors">
      {/* ================================================================= */}
      {/* 1. TOP HEADER (h-14, 빈 문서/캐릭터 시트와 정확히 일치하는 표준 상단바) */}
      {/* ================================================================= */}
      <header className="h-14 bg-white dark:bg-[#1E1E27] border-b border-slate-200 dark:border-[#3A3948] px-4 flex items-center justify-between shrink-0 shadow-2xs z-30 transition-colors">
        {/* Left: Back Button & Editable Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={() => setActiveDocument(null)}
            title="문서 목록으로 돌아가기"
            className="p-1.5 -ml-1 text-slate-400 dark:text-[#A5A3B5] hover:text-slate-700 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Document Title: 보기 모드일 때는 순수 텍스트(배경/수정 불가), 편집 모드일 때만 입력창 */}
          {isEditMode ? (
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              onBlur={handleTitleBlurOrEnter}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              placeholder="캐릭터 관계도 제목"
              className="text-sm md:text-base font-bold text-slate-800 dark:text-[#F3F2F8] bg-slate-100/70 dark:bg-[#2A2938] border border-slate-200 dark:border-[#3A3948] px-2.5 py-1 rounded-lg focus:border-lavender-500 focus:outline-none cursor-text truncate max-w-xs md:max-w-md transition-all"
            />
          ) : (
            <span
              className="text-sm md:text-base font-bold text-slate-800 dark:text-[#F3F2F8] bg-transparent border-0 px-1 py-1 truncate max-w-xs md:max-w-md select-text cursor-default"
            >
              {docTitle || '캐릭터 관계도'}
            </span>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* 1. 보기 / 편집 모드 토글 (Ctrl+E) */}
          <div className="flex bg-slate-100 dark:bg-[#262634] p-0.5 rounded-xl border border-slate-200 dark:border-[#3A3948]">
            <button
              type="button"
              onClick={() => {
                setIsEditMode(false);
                setSelectedCharacterId(null);
                setSelectedRelationId(null);
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
            title="관계도 이미지로 저장 (PNG)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#E8E7EF] hover:text-lavender-700 dark:hover:text-[#B7A5FF] hover:bg-lavender-50 dark:hover:bg-[#292936] hover:border-lavender-200 transition-colors text-xs font-medium"
          >
            <Download
              className={`w-3.5 h-3.5 ${
                isExporting
                  ? 'animate-bounce text-lavender-600'
                  : 'text-slate-400 dark:text-[#A5A3B5]'
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
            title="캐릭터 관계도 가이드 및 도움말"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#3A3948] hover:bg-lavender-50 dark:hover:bg-[#292936] text-slate-500 hover:text-lavender-600 dark:text-[#A5A3B5] transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ================================================================= */}
      {/* 2. SUB TOOLBAR: View Switcher, Add Character, Undo/Redo            */}
      {/* ================================================================= */}
      <div className="h-11 bg-white dark:bg-[#1E1E27] border-b border-slate-200 dark:border-[#3A3948] px-4 flex items-center justify-between shrink-0 shadow-2xs z-20 transition-colors">
        {/* Left: View Tabs, Add Actions, Undo/Redo */}
        <div className="flex items-center gap-1.5">
          {/* View Tab Toggle */}
          <div className="flex bg-slate-100 dark:bg-[#262634] p-0.5 rounded-xl border border-slate-200 dark:border-[#3A3948]">
            <button
              type="button"
              onClick={() => setViewTab('graph')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewTab === 'graph'
                  ? 'bg-white dark:bg-[#1E1E27] text-lavender-600 dark:text-[#B7A5FF] shadow-2xs'
                  : 'text-slate-500 dark:text-[#8E8B9E] hover:text-slate-800 dark:hover:text-[#E8E7EF]'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>관계도</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewTab === 'list'
                  ? 'bg-white dark:bg-[#1E1E27] text-lavender-600 dark:text-[#B7A5FF] shadow-2xs'
                  : 'text-slate-500 dark:text-[#8E8B9E] hover:text-slate-800 dark:hover:text-[#E8E7EF]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>관계 목록</span>
            </button>
          </div>

          {/* Undo / Redo */}
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
        </div>

        {/* Right: Legend Quick Toggle & Tool Selector */}
        <div className="flex items-center gap-2">
          {/* Quick Legend Box Visibility Toggle */}
          <button
            type="button"
            onClick={() => {
              const currentVisible = docData.legendSettings?.visible !== false;
              handleUpdateLegendSettings({ visible: !currentVisible });
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
              docData.legendSettings?.visible !== false
                ? 'bg-lavender-50 dark:bg-lavender-900/30 text-lavender-700 dark:text-lavender-300 border-lavender-300 dark:border-lavender-700'
                : 'bg-slate-100 dark:bg-[#262634] text-slate-400 dark:text-[#7D7B90] border-slate-200 dark:border-[#3A3948]'
            }`}
            title="캔버스 관계 범례 보이기/숨기기"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>범례 {docData.legendSettings?.visible !== false ? 'ON' : 'OFF'}</span>
          </button>

          {/* Tool selector */}
          {isEditMode && (
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
          )}

          <span className="text-[11px] font-medium text-slate-400 dark:text-[#8E8B9E] hidden md:inline">
            인물 {docData.characters.length}명 • 관계 {docData.relations.length}개
          </span>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. MAIN WORKSPACE: Sidebar + Canvas + Inspector (보기 모드 숨김)  */}
      {/* ================================================================= */}
      <div ref={printRef} className="flex-1 flex overflow-hidden">
        {/* 1. Left Character List Panel */}
        <RelationSidebar
          characters={docData.characters}
          selectedCharacterId={selectedCharacterId}
          isEditMode={isEditMode}
          onSelectCharacter={(id) => {
            setSelectedCharacterId(id);
            if (id) {
              setSelectedRelationId(null);
            }
          }}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onDeleteCharacter={handleDeleteCharacter}
        />

        {/* 2. Center: Graph Canvas View OR List View */}
        {viewTab === 'graph' ? (
          <RelationCanvas
            characters={docData.characters}
            relations={docData.relations}
            legends={docData.legends || DEFAULT_RELATION_LEGENDS}
            legendSettings={
              docData.legendSettings || {
                visible: true,
                x: 28,
                y: 28,
                orientation: 'vertical',
              }
            }
            selectedCharacterId={selectedCharacterId}
            selectedRelationId={selectedRelationId}
            highlightedLegendId={highlightedLegendId}
            isEditMode={isEditMode}
            activeTool={activeTool}
            onSelectCharacter={(id) => {
              setSelectedCharacterId(id);
              if (id) {
                setSelectedRelationId(null);
              }
            }}
            onSelectRelation={(id) => {
              setSelectedRelationId(id);
              if (id) {
                setSelectedCharacterId(null);
              }
            }}
            onToggleLegendHighlight={handleToggleLegendHighlight}
            onUpdateLegendSettings={handleUpdateLegendSettings}
            onCreateRelation={handleCreateRelation}
          />
        ) : (
          <RelationListView
            characters={docData.characters}
            relations={docData.relations}
            selectedRelationId={selectedRelationId}
            isEditMode={isEditMode}
            onSelectRelation={(id) => {
              setSelectedRelationId(id);
              setSelectedCharacterId(null);
            }}
            onDeleteRelation={handleDeleteRelation}
          />
        )}

        {/* 3. Right Inspector Panel (보기 모드에서는 완전히 숨김!) */}
        {isEditMode && (
          <RelationInspector
            selectedRelation={selectedRelation}
            selectedCharacter={selectedCharacter}
            characters={docData.characters}
            relations={docData.relations}
            legends={docData.legends || DEFAULT_RELATION_LEGENDS}
            legendSettings={
              docData.legendSettings || {
                visible: true,
                x: 28,
                y: 28,
                orientation: 'vertical',
              }
            }
            isEditMode={isEditMode}
            onUpdateRelation={handleUpdateRelation}
            onDeleteRelation={handleDeleteRelation}
            onUpdateCharacter={handleUpdateCharacter}
            onDeleteCharacter={handleDeleteCharacter}
            onUpdateLegend={handleUpdateLegend}
            onAddLegend={handleAddLegend}
            onDeleteLegend={handleDeleteLegend}
            onUpdateLegendSettings={handleUpdateLegendSettings}
            onSelectRelation={(id) => {
              setSelectedRelationId(id);
              if (id) {
                setSelectedCharacterId(null);
              }
            }}
            onSelectCharacter={(id) => {
              setSelectedCharacterId(id);
              if (id) {
                setSelectedRelationId(null);
              }
            }}
          />
        )}
      </div>

      {/* 4. Add Character Modal */}
      <AddRelationCharacterModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        existingCharacters={docData.characters}
        onAddCharacter={handleAddCharacter}
      />

      {/* 5. Help Modal */}
      <CharacterRelationsHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};
