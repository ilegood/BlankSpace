import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useWorkspace } from '../../../store/WorkspaceContext';
import { useToast } from '../../toast/ToastContext';
import { SpecialEditorHeader } from './SpecialEditorHeader';
import { exportElementAsPng } from '../../../utils/exportImage';
import {
  CharacterDialogueDocData,
  DialogueScenario,
  DialogueLineNode,
  DialogueSpeaker,
  DialogueChoice,
} from '../../../types/dialogue';
import {
  INITIAL_DIALOGUE_DATA,
  DEFAULT_SPEAKERS,
  convertLegacyToDialogueData,
} from './dialogue/dialoguePresets';
import { DialogueSidebar } from './dialogue/DialogueSidebar';
import { DialogueListView } from './dialogue/DialogueListView';
import { DialogueGraphView } from './dialogue/DialogueGraphView';
import { DialogueInspector } from './dialogue/DialogueInspector';
import { DialoguePreviewModal } from './dialogue/DialoguePreviewModal';
import {
  List,
  GitGraph,
  Columns,
  Plus,
  Split,
  Undo2,
  Redo2,
  Check,
  Edit3,
  Play,
  Download,
  Maximize,
  Minimize,
} from 'lucide-react';

export const CharacterDialogueEditor: React.FC = () => {
  const { activeDocument, activePage, updatePageContent } = useWorkspace();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // 1. Core Document State
  const [docData, setDocData] = useState<CharacterDialogueDocData>(INITIAL_DIALOGUE_DATA);

  // 2. View Mode & Layout State
  // View mode is default (Requirement: "기본 상태는 보기 모드로 설정해줘")
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [viewTab, setViewTab] = useState<'list' | 'graph' | 'split'>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 3. Selection State
  const [selectedDialogueId, setSelectedDialogueId] = useState<string | null>('dlg-001');

  // 4. Undo / Redo History
  const [history, setHistory] = useState<CharacterDialogueDocData[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const isUndoRedoAction = useRef(false);

  // Load from Page Content or Default
  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && (activePage.content.startsWith('{') || activePage.content.startsWith('['))) {
        const parsed = JSON.parse(activePage.content);
        const converted = convertLegacyToDialogueData(parsed);
        setDocData(converted);
        setHistory([converted]);
        setHistoryIdx(0);

        const currentScn = converted.scenarios.find((s) => s.id === converted.activeScenarioId) || converted.scenarios[0];
        if (currentScn && currentScn.dialogues.length > 0) {
          setSelectedDialogueId(currentScn.dialogues[0].id);
        }
        return;
      }
    } catch (e) {
      console.warn('Failed to parse dialogue data, falling back to initial:', e);
    }

    setDocData(INITIAL_DIALOGUE_DATA);
    setHistory([INITIAL_DIALOGUE_DATA]);
    setHistoryIdx(0);
    setSelectedDialogueId(INITIAL_DIALOGUE_DATA.scenarios[0]?.dialogues[0]?.id || null);
  }, [activePage?.id]);

  // Push State & Autosave
  const pushState = useCallback(
    (nextData: CharacterDialogueDocData) => {
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

  // Active Scenario Helper
  const activeScenario = useMemo(() => {
    return (
      docData.scenarios.find((s) => s.id === docData.activeScenarioId) ||
      docData.scenarios[0] || {
        id: 'scn-default',
        title: '새 대화 시나리오',
        category: '기본',
        dialogues: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    );
  }, [docData.scenarios, docData.activeScenarioId]);

  const activeDialogues = activeScenario.dialogues;
  const currentSpeakers = docData.speakers || DEFAULT_SPEAKERS;

  const selectedDialogue = useMemo(() => {
    return activeDialogues.find((d) => d.id === selectedDialogueId) || null;
  }, [activeDialogues, selectedDialogueId]);

  // Update active scenario's dialogues helper
  const updateActiveDialogues = useCallback(
    (newDialogues: DialogueLineNode[]) => {
      const nextScenarios = docData.scenarios.map((scn) => {
        if (scn.id === activeScenario.id) {
          return {
            ...scn,
            dialogues: newDialogues,
            updatedAt: Date.now(),
          };
        }
        return scn;
      });

      pushState({
        ...docData,
        scenarios: nextScenarios,
      });
    },
    [docData, activeScenario.id, pushState]
  );

  // ------------------------------------------------------------------
  // Scenario Handlers
  // ------------------------------------------------------------------
  const handleSelectScenario = (id: string) => {
    pushState({
      ...docData,
      activeScenarioId: id,
    });
    const target = docData.scenarios.find((s) => s.id === id);
    if (target && target.dialogues.length > 0) {
      setSelectedDialogueId(target.dialogues[0].id);
    } else {
      setSelectedDialogueId(null);
    }
  };

  const handleAddScenario = (category: string, title?: string) => {
    const newId = `scn-${Date.now()}`;
    const newTitle = title?.trim() || `새 대화 시나리오 ${docData.scenarios.length + 1}`;
    const initialLine: DialogueLineNode = {
      id: `dlg-${Date.now()}-1`,
      order: 1,
      speakerName: currentSpeakers[0]?.name || '아르젠',
      speakerRole: currentSpeakers[0]?.role || '',
      speakerAvatarUrl: currentSpeakers[0]?.avatarUrl || '',
      text: '새로운 대화가 시작됩니다.',
      tags: ['기본'],
      choices: [],
      position: { x: 100, y: 150 },
    };

    const newScenario: DialogueScenario = {
      id: newId,
      title: newTitle,
      category: category || '기본',
      dialogues: [initialLine],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    pushState({
      ...docData,
      scenarios: [...docData.scenarios, newScenario],
      activeScenarioId: newId,
    });
    setSelectedDialogueId(initialLine.id);
    toast.success(`'${newTitle}' 시나리오가 추가되었습니다.`);
  };

  const handleDuplicateScenario = (id: string) => {
    const target = docData.scenarios.find((s) => s.id === id);
    if (!target) return;

    const newId = `scn-${Date.now()}`;
    const duplicated: DialogueScenario = {
      ...target,
      id: newId,
      title: `${target.title} (복사본)`,
      dialogues: target.dialogues.map((d) => ({
        ...d,
        choices: d.choices.map((c) => ({ ...c })),
        position: { ...d.position },
      })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    pushState({
      ...docData,
      scenarios: [...docData.scenarios, duplicated],
      activeScenarioId: newId,
    });
    setSelectedDialogueId(duplicated.dialogues[0]?.id || null);
    toast.success('시나리오가 복제되었습니다.');
  };

  const handleRenameScenario = (id: string, newTitle: string) => {
    const nextScenarios = docData.scenarios.map((s) => (s.id === id ? { ...s, title: newTitle } : s));
    pushState({ ...docData, scenarios: nextScenarios });
  };

  const handleUpdateCategory = (id: string, newCategory: string) => {
    const nextScenarios = docData.scenarios.map((s) => (s.id === id ? { ...s, category: newCategory } : s));
    pushState({ ...docData, scenarios: nextScenarios });
  };

  const handleDeleteScenario = (id: string) => {
    if (docData.scenarios.length <= 1) {
      toast.warning('최소 1개의 시나리오는 유지되어야 합니다.');
      return;
    }

    const nextScenarios = docData.scenarios.filter((s) => s.id !== id);
    const nextActiveId = docData.activeScenarioId === id ? nextScenarios[0].id : docData.activeScenarioId;

    pushState({
      ...docData,
      scenarios: nextScenarios,
      activeScenarioId: nextActiveId,
    });

    const nextTarget = nextScenarios.find((s) => s.id === nextActiveId);
    setSelectedDialogueId(nextTarget?.dialogues[0]?.id || null);
    toast.info('시나리오가 삭제되었습니다.');
  };

  // ------------------------------------------------------------------
  // Dialogue Line Handlers
  // ------------------------------------------------------------------
  const handleAddDialogue = (afterId?: string) => {
    const lastDlg = activeDialogues[activeDialogues.length - 1];
    let nextOrder = 1;
    let nextX = 100;
    let nextY = 150;

    if (afterId) {
      const target = activeDialogues.find((d) => d.id === afterId);
      if (target) {
        nextOrder = target.order + 1;
        nextX = target.position.x + 320;
        nextY = target.position.y;
      }
    } else if (lastDlg) {
      nextOrder = Math.max(...activeDialogues.map((d) => d.order)) + 1;
      nextX = lastDlg.position.x + 320;
      nextY = lastDlg.position.y;
    }

    // Default speaker is the opposite or last speaker
    const defaultSpeaker =
      currentSpeakers.find((s) => s.name !== lastDlg?.speakerName) ||
      currentSpeakers[0] || { name: '화자', role: '', avatarUrl: '' };

    const newDlg: DialogueLineNode = {
      id: `dlg-${Date.now().toString(36)}`,
      order: nextOrder,
      speakerName: defaultSpeaker.name,
      speakerRole: defaultSpeaker.role,
      speakerAvatarUrl: defaultSpeaker.avatarUrl,
      text: '',
      tags: ['기본'],
      choices: [],
      position: { x: nextX, y: nextY },
    };

    // If afterId was given, increment subsequent orders
    let newDialogues: DialogueLineNode[];
    if (afterId) {
      newDialogues = activeDialogues.map((d) => {
        if (d.order >= nextOrder) {
          return { ...d, order: d.order + 1 };
        }
        return d;
      });
      newDialogues.push(newDlg);
    } else {
      newDialogues = [...activeDialogues, newDlg];
    }

    updateActiveDialogues(newDialogues);
    setSelectedDialogueId(newDlg.id);
    toast.success('새 대사가 추가되었습니다.');
  };

  const handleDeleteDialogue = (id: string) => {
    // Also remove references from nextDialogueId and choices
    const nextDialogues = activeDialogues
      .filter((d) => d.id !== id)
      .map((d) => ({
        ...d,
        nextDialogueId: d.nextDialogueId === id ? undefined : d.nextDialogueId,
        choices: d.choices.map((c) => ({
          ...c,
          nextDialogueId: c.nextDialogueId === id ? undefined : c.nextDialogueId,
        })),
      }));

    if (selectedDialogueId === id) {
      const remaining = nextDialogues.sort((a, b) => a.order - b.order);
      setSelectedDialogueId(remaining[0]?.id || null);
    }

    updateActiveDialogues(nextDialogues);
    toast.info('대사가 삭제되었습니다.');
  };

  const handleDuplicateDialogue = (id: string) => {
    const target = activeDialogues.find((d) => d.id === id);
    if (!target) return;

    const newId = `dlg-${Date.now().toString(36)}`;
    const duplicated: DialogueLineNode = {
      ...target,
      id: newId,
      order: target.order + 1,
      choices: target.choices.map((c) => ({
        ...c,
        id: `choice-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      })),
      position: {
        x: target.position.x + 40,
        y: target.position.y + 40,
      },
    };

    const nextDialogues = activeDialogues.map((d) => {
      if (d.order > target.order) {
        return { ...d, order: d.order + 1 };
      }
      return d;
    });
    nextDialogues.push(duplicated);

    updateActiveDialogues(nextDialogues);
    setSelectedDialogueId(newId);
    toast.success('대사가 복제되었습니다.');
  };

  const handleMoveOrder = (id: string, direction: 'up' | 'down') => {
    const sorted = [...activeDialogues].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((d) => d.id === id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      const prev = sorted[index - 1];
      const cur = sorted[index];
      const tempOrder = prev.order;
      prev.order = cur.order;
      cur.order = tempOrder;
      updateActiveDialogues([...sorted]);
    } else if (direction === 'down' && index < sorted.length - 1) {
      const next = sorted[index + 1];
      const cur = sorted[index];
      const tempOrder = next.order;
      next.order = cur.order;
      cur.order = tempOrder;
      updateActiveDialogues([...sorted]);
    }
  };

  const handleUpdateDialogue = (id: string, updates: Partial<DialogueLineNode>) => {
    const nextDialogues = activeDialogues.map((d) => (d.id === id ? { ...d, ...updates } : d));
    updateActiveDialogues(nextDialogues);
  };

  // ------------------------------------------------------------------
  // Graph Connections & Positions
  // ------------------------------------------------------------------
  const handleConnectNext = (sourceId: string, targetId: string, choiceId?: string) => {
    if (sourceId === targetId) {
      toast.warning('자기 자신을 다음 대사로 연결할 수 없습니다.');
      return;
    }

    const nextDialogues = activeDialogues.map((d) => {
      if (d.id === sourceId) {
        if (choiceId) {
          const nextChoices = d.choices.map((c) =>
            c.id === choiceId ? { ...c, nextDialogueId: targetId } : c
          );
          return { ...d, choices: nextChoices };
        } else {
          return { ...d, nextDialogueId: targetId };
        }
      }
      return d;
    });

    updateActiveDialogues(nextDialogues);
    toast.success('대화 흐름이 연결되었습니다.');
  };

  const handleDisconnectNext = (sourceId: string, choiceId?: string) => {
    const nextDialogues = activeDialogues.map((d) => {
      if (d.id === sourceId) {
        if (choiceId) {
          const nextChoices = d.choices.map((c) =>
            c.id === choiceId ? { ...c, nextDialogueId: undefined } : c
          );
          return { ...d, choices: nextChoices };
        } else {
          return { ...d, nextDialogueId: undefined };
        }
      }
      return d;
    });

    updateActiveDialogues(nextDialogues);
    toast.info('연결이 해제되었습니다.');
  };

  const handleUpdatePosition = (id: string, pos: { x: number; y: number }) => {
    const nextDialogues = activeDialogues.map((d) => (d.id === id ? { ...d, position: pos } : d));
    updateActiveDialogues(nextDialogues);
  };

  // ------------------------------------------------------------------
  // Quick Add Choice from Toolbar
  // ------------------------------------------------------------------
  const handleQuickAddChoice = () => {
    if (!selectedDialogue) {
      toast.warning('선택지를 추가할 대사를 먼저 선택해주세요.');
      return;
    }

    const newChoice: DialogueChoice = {
      id: `choice-${Date.now().toString(36)}`,
      text: `선택지 ${selectedDialogue.choices.length + 1}`,
    };

    const nextChoices = [...selectedDialogue.choices, newChoice];
    handleUpdateDialogue(selectedDialogue.id, { choices: nextChoices });
    toast.success(`'${selectedDialogue.speakerName || '대사'}'에 선택지가 추가되었습니다.`);
  };

  // Add custom speaker
  const handleAddSpeaker = (speaker: DialogueSpeaker) => {
    const nextSpeakers = [...currentSpeakers, speaker];
    pushState({
      ...docData,
      speakers: nextSpeakers,
    });
    toast.success(`'${speaker.name}' 화자가 등록되었습니다.`);
  };

  // Export Image
  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    try {
      await exportElementAsPng(printRef.current, {
        fileName: `${activeDocument.title || '캐릭터-대사-스크립트'}_${activeScenario.title}`,
      });
      toast.success('대사 스크립트 이미지가 저장되었습니다.');
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

  return (
    <div
      ref={printRef}
      className={`h-full flex flex-col bg-slate-50 dark:bg-[#17171D] text-slate-800 dark:text-[#E8E7EF] font-sans antialiased overflow-hidden select-none transition-colors duration-200 ${
        isFullscreen ? 'fixed inset-0 z-50' : 'relative'
      }`}
    >
      {/* 1. Global Header */}
      <SpecialEditorHeader
        isEditMode={isEditMode}
        onExportImage={handleExportImage}
      />

      {/* 2. Specialized Secondary Control Toolbar */}
      <div className="h-12 px-6 border-b border-[#ECEEF3] dark:border-[#3A3948] flex items-center justify-between shrink-0 bg-white/95 dark:bg-[#1E1E27]/95 backdrop-blur-xs transition-colors duration-200 z-10 shadow-2xs">
        {/* Left: View Tabs + Dialogue / Choice Add Actions */}
        <div className="flex items-center gap-2">
          {/* Hybrid View Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-[#292936] p-0.5 rounded-xl border border-slate-200/60 dark:border-[#3A3948]">
            <button
              type="button"
              onClick={() => setViewTab('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewTab === 'list'
                  ? 'bg-lavender-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF]'
              }`}
              title="대사 목록 보기"
            >
              <List className="w-3.5 h-3.5" />
              <span>대사 목록</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('graph')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewTab === 'graph'
                  ? 'bg-lavender-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF]'
              }`}
              title="노드 그래프 보기"
            >
              <GitGraph className="w-3.5 h-3.5" />
              <span>노드 그래프</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('split')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewTab === 'split'
                  ? 'bg-lavender-600 text-white shadow-2xs'
                  : 'text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF]'
              }`}
              title="목록 및 그래프 분할 보기"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>분할 보기</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] mx-1" />

          {/* Quick Action: Add Dialogue */}
          {isEditMode && (
            <div className="flex items-center gap-1.5 animate-in fade-in">
              <button
                type="button"
                onClick={() => handleAddDialogue(selectedDialogueId || undefined)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-lavender-50 dark:bg-[#2C2842] hover:bg-lavender-100 dark:hover:bg-[#383354] text-lavender-700 dark:text-[#C7B8FF] border border-lavender-200 dark:border-[#4B4372] rounded-xl text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>대사 추가</span>
              </button>

              <button
                type="button"
                onClick={handleQuickAddChoice}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40 rounded-xl text-xs font-bold transition-colors"
                title="선택된 대사에 선택지 추가"
              >
                <Split className="w-3.5 h-3.5" />
                <span>선택지 추가</span>
              </button>
            </div>
          )}

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

        {/* Center: View Mode vs Edit Mode Toggle */}
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
                  toast.info('편집 모드로 진입했습니다. 대사 작성 및 노드 연결이 가능합니다.');
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-lavender-600 hover:bg-lavender-500 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>편집 모드</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: In-Game Preview & Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Preview Simulator Button */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-lavender-600 hover:bg-lavender-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            title="인게임 스타일 대화 미리보기 시뮬레이터 실행"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>대화 미리보기</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] mx-1" />

          {/* Export PNG */}
          <button
            type="button"
            onClick={handleExportImage}
            title="대사 스크립트 PNG 이미지 저장"
            className="p-1.5 text-slate-500 dark:text-[#A5A3B5] hover:text-slate-800 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#292936] rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
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

      {/* 3. Main Body: 3-Column / Hybrid Editor Layout */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Panel: Dialogue Scenario Sidebar (280px) */}
        <DialogueSidebar
          scenarios={docData.scenarios}
          activeScenarioId={docData.activeScenarioId}
          isEditMode={isEditMode}
          onSelectScenario={handleSelectScenario}
          onAddScenario={handleAddScenario}
          onDuplicateScenario={handleDuplicateScenario}
          onRenameScenario={handleRenameScenario}
          onDeleteScenario={handleDeleteScenario}
          onUpdateCategory={handleUpdateCategory}
        />

        {/* Center Panel: Dialogue Views (List, Graph, or Split) */}
        <div className="flex-1 min-w-0 flex overflow-hidden bg-slate-100/50 dark:bg-[#17171D]">
          {viewTab === 'list' && (
            <div className="flex-1 min-w-0 h-full flex flex-col">
              <DialogueListView
                dialogues={activeDialogues}
                selectedDialogueId={selectedDialogueId}
                speakers={currentSpeakers}
                isEditMode={isEditMode}
                onSelectDialogue={setSelectedDialogueId}
                onAddDialogue={handleAddDialogue}
                onDeleteDialogue={handleDeleteDialogue}
                onDuplicateDialogue={handleDuplicateDialogue}
                onMoveOrder={handleMoveOrder}
                onUpdateDialogue={handleUpdateDialogue}
              />
            </div>
          )}

          {viewTab === 'graph' && (
            <div className="flex-1 min-w-0 h-full flex flex-col relative">
              <DialogueGraphView
                dialogues={activeDialogues}
                selectedDialogueId={selectedDialogueId}
                isEditMode={isEditMode}
                onSelectDialogue={setSelectedDialogueId}
                onConnectNext={handleConnectNext}
                onDisconnectNext={handleDisconnectNext}
                onUpdatePosition={handleUpdatePosition}
              />
            </div>
          )}

          {viewTab === 'split' && (
            <div className="flex-1 min-w-0 h-full flex">
              {/* Left Side of Split: List View (45%) */}
              <div className="w-[45%] min-w-[340px] max-w-[500px] h-full flex flex-col border-r border-[#ECEEF3] dark:border-[#3A3948]">
                <DialogueListView
                  dialogues={activeDialogues}
                  selectedDialogueId={selectedDialogueId}
                  speakers={currentSpeakers}
                  isEditMode={isEditMode}
                  onSelectDialogue={setSelectedDialogueId}
                  onAddDialogue={handleAddDialogue}
                  onDeleteDialogue={handleDeleteDialogue}
                  onDuplicateDialogue={handleDuplicateDialogue}
                  onMoveOrder={handleMoveOrder}
                  onUpdateDialogue={handleUpdateDialogue}
                />
              </div>

              {/* Right Side of Split: Graph View (Remaining) */}
              <div className="flex-1 min-w-0 h-full flex flex-col relative">
                <DialogueGraphView
                  dialogues={activeDialogues}
                  selectedDialogueId={selectedDialogueId}
                  isEditMode={isEditMode}
                  onSelectDialogue={setSelectedDialogueId}
                  onConnectNext={handleConnectNext}
                  onDisconnectNext={handleDisconnectNext}
                  onUpdatePosition={handleUpdatePosition}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Dialogue Inspector (340px) */}
        <DialogueInspector
          selectedDialogue={selectedDialogue}
          allDialogues={activeDialogues}
          speakers={currentSpeakers}
          isEditMode={isEditMode}
          onUpdateDialogue={handleUpdateDialogue}
          onDeleteDialogue={handleDeleteDialogue}
          onDuplicateDialogue={handleDuplicateDialogue}
          onAddSpeaker={handleAddSpeaker}
        />
      </div>

      {/* 4. In-Game Style Dialogue Preview Simulator Modal */}
      <DialoguePreviewModal
        dialogues={activeDialogues}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
};
