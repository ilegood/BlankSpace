import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { exportElementAsPng } from '../../../utils/exportImage';
import {
  CharacterRelationsDocData,
  RelationCharacter,
  RelationItem,
  AnchorPosition,
} from '../../../types/relations';
import {
  INITIAL_RELATIONS_DATA,
  convertLegacyToRelations,
} from './relations/relationsPresets';
import { RelationCanvas } from './relations/RelationCanvas';
import { RelationSidebar } from './relations/RelationSidebar';
import { RelationInspector } from './relations/RelationInspector';
import { RelationListView } from './relations/RelationListView';
import { useToast } from '../../toast/ToastContext';
import {
  Share2,
  List,
  Edit3,
  Check,
  Undo2,
  Redo2,
  Download,
  Maximize,
  Minimize,
} from 'lucide-react';

export const CharacterRelationsEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // Main Relations Document State
  const [docData, setDocData] = useState<CharacterRelationsDocData>(
    INITIAL_RELATIONS_DATA
  );

  // View / Mode States
  const [viewTab, setViewTab] = useState<'graph' | 'list'>('graph');
  const [isEditMode, setIsEditMode] = useState<boolean>(false); // Requirement 3: default is VIEW mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Selection States
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedRelationId, setSelectedRelationId] = useState<string | null>(null);

  // Undo / Redo History
  const [history, setHistory] = useState<CharacterRelationsDocData[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const isUndoRedoAction = useRef(false);

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
    } catch {}
    setDocData(INITIAL_RELATIONS_DATA);
    setHistory([INITIAL_RELATIONS_DATA]);
    setHistoryIdx(0);
  }, [activePage?.id]);

  // Push State & Autosave
  const pushState = useCallback(
    (nextData: CharacterRelationsDocData) => {
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
  const handleUndo = () => {
    if (historyIdx > 0) {
      isUndoRedoAction.current = true;
      const prev = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      setDocData(prev);
      if (activePage) updatePageContent(activePage.id, JSON.stringify(prev));
    }
  };

  const handleRedo = () => {
    if (historyIdx < history.length - 1) {
      isUndoRedoAction.current = true;
      const next = history[historyIdx + 1];
      setHistoryIdx(historyIdx + 1);
      setDocData(next);
      if (activePage) updatePageContent(activePage.id, JSON.stringify(next));
    }
  };

  // Keyboard Shortcuts (Delete, Undo, Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isEditMode && selectedRelationId) {
          e.preventDefault();
          handleDeleteRelation(selectedRelationId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRelationId, isEditMode, historyIdx, history]);

  // ------------------------------------------------------------------
  // Character Actions
  // ------------------------------------------------------------------
  const handleAddCharacter = (charData: Omit<RelationCharacter, 'id'>) => {
    const newChar: RelationCharacter = {
      ...charData,
      id: `char-${Date.now()}`,
    };
    const nextChars = [...docData.characters, newChar];
    pushState({
      ...docData,
      characters: nextChars,
    });
    setSelectedCharacterId(newChar.id);
    setSelectedRelationId(null);
    toast.success(`'${newChar.name}' 캐릭터가 추가되었습니다.`);
  };

  const handleDeleteCharacter = (id: string) => {
    const nextChars = docData.characters.filter((c) => c.id !== id);
    // Also remove any relations connected to this character
    const nextRelations = docData.relations.filter(
      (r) => r.sourceId !== id && r.targetId !== id
    );
    if (selectedCharacterId === id) setSelectedCharacterId(null);
    pushState({
      ...docData,
      characters: nextChars,
      relations: nextRelations,
    });
    toast.info('캐릭터가 삭제되었습니다.');
  };

  const handleUpdateCharacter = (id: string, updates: Partial<RelationCharacter>) => {
    const nextChars = docData.characters.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    pushState({ ...docData, characters: nextChars });
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
      toast.warning('자기 자신과는 관계를 맺을 수 없습니다.');
      return;
    }

    // Check duplicate relation between these two
    const existing = docData.relations.find(
      (r) =>
        (r.sourceId === sourceId && r.targetId === targetId) ||
        (r.sourceId === targetId && r.targetId === sourceId)
    );

    if (existing) {
      toast.warning('이미 두 캐릭터 사이에 연결된 관계선이 존재합니다.');
      setSelectedRelationId(existing.id);
      setSelectedCharacterId(null);
      return;
    }

    const charA = docData.characters.find((c) => c.id === sourceId);
    const charB = docData.characters.find((c) => c.id === targetId);

    const newRel: RelationItem = {
      id: `rel-${Date.now()}`,
      sourceId,
      targetId,
      relationType: '신뢰 및 우호',
      color: '#8B5CF6',
      style: 'solid',
      strokeWidth: 2.5,
      emotionAtoB: `${charB?.name || '상대'}에 대한 신뢰`,
      emotionBtoA: `${charA?.name || '상대'}에 대한 우호적 감정`,
      memo: '',
      sourceAnchor,
      targetAnchor,
    };

    pushState({
      ...docData,
      relations: [...docData.relations, newRel],
    });

    setSelectedRelationId(newRel.id);
    setSelectedCharacterId(null);
    toast.success('새 관계선이 생성되었습니다.');
  };

  const handleDeleteRelation = (id: string) => {
    const nextRelations = docData.relations.filter((r) => r.id !== id);
    if (selectedRelationId === id) setSelectedRelationId(null);
    pushState({
      ...docData,
      relations: nextRelations,
    });
  };

  const handleUpdateRelation = (id: string, updates: Partial<RelationItem>) => {
    const nextRelations = docData.relations.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    pushState({ ...docData, relations: nextRelations });
  };

  // Export as PNG
  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    try {
      await exportElementAsPng(printRef.current, {
        fileName: `${activeDocument.title || '캐릭터관계도'}-관계도`,
      });
      toast.success('관계도 이미지가 저장되었습니다.');
    } catch {
      toast.error('이미지 저장에 실패했습니다.');
    }
  };

  const selectedRelation =
    docData.relations.find((r) => r.id === selectedRelationId) || null;
  const selectedCharacter =
    docData.characters.find((c) => c.id === selectedCharacterId) || null;

  return (
    <div
      ref={printRef}
      className={`flex-1 flex flex-col h-full bg-[#17171D] text-[#E8E7EF] relative overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Top Main Header */}
      <SpecialEditorHeader
        onExportImage={handleExportImage}
      />

      {/* Sub Toolbar: View Switcher, Edit Mode Toggle, Undo/Redo */}
      <div className="h-11 bg-[#1E1E27] border-b border-[#3A3948] px-4 flex items-center justify-between shrink-0 shadow-xs z-20">
        {/* Left: View Tabs (Graph vs List) */}
        <div className="flex items-center gap-1.5">
          <div className="flex bg-[#292936] p-0.5 rounded-xl border border-[#3A3948]">
            <button
              type="button"
              onClick={() => setViewTab('graph')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewTab === 'graph'
                  ? 'bg-lavender-600 text-white shadow-2xs'
                  : 'text-[#A5A3B5] hover:text-[#E8E7EF]'
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
                  ? 'bg-lavender-600 text-white shadow-2xs'
                  : 'text-[#A5A3B5] hover:text-[#E8E7EF]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>관계 목록</span>
            </button>
          </div>

          <div className="h-4 w-px bg-[#3A3948] mx-1" />

          {/* Undo / Redo */}
          <button
            type="button"
            title="실행 취소 (Ctrl+Z)"
            disabled={historyIdx <= 0}
            onClick={handleUndo}
            className="p-1.5 text-[#A5A3B5] hover:text-[#E8E7EF] hover:bg-[#292936] rounded-lg transition-colors disabled:opacity-25"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="다시 실행 (Ctrl+Y)"
            disabled={historyIdx >= history.length - 1}
            onClick={handleRedo}
            className="p-1.5 text-[#A5A3B5] hover:text-[#E8E7EF] hover:bg-[#292936] rounded-lg transition-colors disabled:opacity-25"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Mode Indicator & Toggle (Requirement 3: View Mode vs Edit Mode) */}
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/40 px-3 py-1 rounded-full text-xs animate-in fade-in">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-emerald-300">편집 모드 활성</span>
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
              <span className="text-[11px] text-[#A5A3B5] font-medium hidden sm:inline">
                읽기 전용 상태
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsEditMode(true);
                  toast.info('편집 모드로 진입했습니다. 캐릭터를 드래그하여 연결하세요.');
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
            className="flex items-center gap-1 px-2.5 py-1 bg-[#292936] hover:bg-[#323242] border border-[#3A3948] text-xs font-semibold rounded-xl text-[#E8E7EF] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">이미지 저장</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-[#A5A3B5] hover:text-[#E8E7EF] hover:bg-[#292936] rounded-xl transition-colors"
            title={isFullscreen ? '전체화면 종료' : '전체화면'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Workspace Body: 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. Left Character List Panel */}
        <RelationSidebar
          characters={docData.characters}
          selectedCharacterId={selectedCharacterId}
          isEditMode={isEditMode}
          onSelectCharacter={(id) => {
            setSelectedCharacterId(id);
            if (id) setSelectedRelationId(null);
          }}
          onAddCharacter={handleAddCharacter}
          onDeleteCharacter={handleDeleteCharacter}
        />

        {/* 2. Center: Graph View OR List View */}
        {viewTab === 'graph' ? (
          <RelationCanvas
            characters={docData.characters}
            relations={docData.relations}
            selectedCharacterId={selectedCharacterId}
            selectedRelationId={selectedRelationId}
            isEditMode={isEditMode}
            onSelectCharacter={(id) => {
              setSelectedCharacterId(id);
              if (id) setSelectedRelationId(null);
            }}
            onSelectRelation={(id) => {
              setSelectedRelationId(id);
              if (id) setSelectedCharacterId(null);
            }}
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

        {/* 3. Right Inspector Panel */}
        <RelationInspector
          selectedRelation={selectedRelation}
          selectedCharacter={selectedCharacter}
          characters={docData.characters}
          relations={docData.relations}
          isEditMode={isEditMode}
          onUpdateRelation={handleUpdateRelation}
          onDeleteRelation={handleDeleteRelation}
          onUpdateCharacter={handleUpdateCharacter}
          onDeleteCharacter={handleDeleteCharacter}
          onSelectRelation={(id) => {
            setSelectedRelationId(id);
            if (id) setSelectedCharacterId(null);
          }}
          onSelectCharacter={(id) => {
            setSelectedCharacterId(id);
            if (id) setSelectedRelationId(null);
          }}
        />
      </div>
    </div>
  );
};
