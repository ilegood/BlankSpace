import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWorkspace } from '../../../../store/WorkspaceContext';
import { useToast } from '../../../toast/ToastContext';
import { useTheme } from '../../../../store/ThemeContext';
import {
  QAItem,
  QAPreset,
  CharacterQADocData,
} from '../../../../types/characterQA';
import {
  DEFAULT_QA_PRESETS,
  INITIAL_QA_DOC_DATA,
} from './qaPresets';
import { QAPresetModal } from './QAPresetModal';
import {
  Eye,
  Edit3,
  BookmarkPlus,
  FolderDown,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Save,
  Download,
  Star,
  Sparkles,
  HelpCircle,
  FileQuestion,
  RotateCcw,
} from 'lucide-react';
import { exportElementAsPng } from '../../../../utils/exportImage';

const PRESETS_STORAGE_KEY = 'blankspace_qa_presets_v1';

export const CharacterQAEditor: React.FC = () => {
  const {
    activeDocument,
    activePage,
    updateDocumentTitle,
    toggleFavoriteDocument,
    updatePageContent,
  } = useWorkspace();
  const { toast, customConfirm } = useToast();
  const { isDark } = useTheme();
  const printRef = useRef<HTMLDivElement>(null);

  // Document Title
  const [docTitle, setDocTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isExporting, setIsExporting] = useState(false);

  // View Mode: 기본은 보기 모드 (Requirement: Blankspace 공통 규칙)
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // QA Document Data
  const [docData, setDocData] = useState<CharacterQADocData>(INITIAL_QA_DOC_DATA);

  // Global Presets State (재사용 가능한 프리셋 목록)
  const [presets, setPresets] = useState<QAPreset[]>(() => {
    try {
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored QA presets:', e);
    }
    return DEFAULT_QA_PRESETS;
  });

  // Modal State
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);

  // Sync Doc Title
  useEffect(() => {
    if (activeDocument) {
      setDocTitle(activeDocument.title);
    }
  }, [activeDocument]);

  // Load QA Data from Page Content
  useEffect(() => {
    if (!activePage) return;
    try {
      if (activePage.content && activePage.content.startsWith('{')) {
        const parsed = JSON.parse(activePage.content);
        if (parsed.questions && Array.isArray(parsed.questions)) {
          setDocData(parsed);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to parse QA page content:', err);
    }

    setDocData(INITIAL_QA_DOC_DATA);
  }, [activePage?.id]);

  // Autosave QA Data to Page Content
  useEffect(() => {
    if (!activePage) return;
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        const json = JSON.stringify(docData);
        updatePageContent(activePage.id, json);
        setSaveStatus('saved');
      } catch (e) {
        console.error('Failed to autosave QA doc:', e);
        setSaveStatus('saved');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [docData, activePage?.id]);

  // Save presets to localStorage when updated
  const savePresets = (newPresets: QAPreset[]) => {
    setPresets(newPresets);
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(newPresets));
    } catch (e) {
      console.error('Failed to save QA presets:', e);
    }
  };

  const handleTitleBlurOrEnter = () => {
    if (docTitle.trim() && activeDocument && docTitle !== activeDocument.title) {
      updateDocumentTitle(activeDocument.id, docTitle.trim());
      toast.success('제목 변경 완료', `'${docTitle.trim()}'으로 저장되었습니다.`);
    }
  };

  // ------------------------------------------------------------------
  // QA Item Actions
  // ------------------------------------------------------------------
  const handleAddQuestion = () => {
    if (!isEditMode) return;
    const newItem: QAItem = {
      id: `qa-${Date.now()}`,
      question: '',
      answer: '',
      order: docData.questions.length,
    };
    setDocData((prev) => ({
      ...prev,
      questions: [...prev.questions, newItem],
    }));
    toast.info('새 질문이 추가되었습니다.');
  };

  const handleUpdateQuestion = (id: string, text: string) => {
    if (!isEditMode) return;
    setDocData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, question: text } : q
      ),
    }));
  };

  const handleUpdateAnswer = (id: string, text: string) => {
    if (!isEditMode) return;
    setDocData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, answer: text } : q
      ),
    }));
  };

  const handleDeleteQuestion = async (id: string, index: number) => {
    if (!isEditMode) return;
    const confirmed = await customConfirm({
      title: '질문 삭제',
      message: `Q${index + 1} 질문과 작성된 답변을 모두 삭제하시겠습니까?`,
      confirmText: '삭제',
      isDanger: true,
    });
    if (!confirmed) return;

    setDocData((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((q) => q.id !== id)
        .map((q, idx) => ({ ...q, order: idx })),
    }));
    toast.info('질문이 삭제되었습니다.');
  };

  const handleDuplicateQuestion = (item: QAItem, index: number) => {
    if (!isEditMode) return;
    const duplicated: QAItem = {
      id: `qa-${Date.now()}`,
      question: item.question,
      answer: item.answer,
      order: index + 1,
    };

    const nextQuestions = [...docData.questions];
    nextQuestions.splice(index + 1, 0, duplicated);

    setDocData((prev) => ({
      ...prev,
      questions: nextQuestions.map((q, idx) => ({ ...q, order: idx })),
    }));
    toast.success('질문이 복제되었습니다.');
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (!isEditMode) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= docData.questions.length) return;

    const nextQuestions = [...docData.questions];
    const temp = nextQuestions[index];
    nextQuestions[index] = nextQuestions[targetIndex];
    nextQuestions[targetIndex] = temp;

    setDocData((prev) => ({
      ...prev,
      questions: nextQuestions.map((q, idx) => ({ ...q, order: idx })),
    }));
  };

  const handleClearAllQuestions = async () => {
    if (!isEditMode || docData.questions.length === 0) return;
    const confirmed = await customConfirm({
      title: '질문 목록 전체 비우기',
      message: '문서에 작성된 모든 질문과 답변이 삭제됩니다. 계속하시겠습니까?',
      confirmText: '전체 삭제',
      isDanger: true,
    });
    if (!confirmed) return;

    setDocData((prev) => ({
      ...prev,
      questions: [],
    }));
    toast.info('모든 질문이 비워졌습니다.');
  };

  // ------------------------------------------------------------------
  // Preset Actions
  // ------------------------------------------------------------------
  const handleApplyPreset = (preset: QAPreset, mode: 'replace' | 'append') => {
    const newItems: QAItem[] = preset.questions.map((qText, idx) => ({
      id: `qa-${Date.now()}-${idx}`,
      question: qText,
      answer: '', // 프리셋 적용 시 답변은 항상 빈 상태로 초기화
      order: mode === 'replace' ? idx : docData.questions.length + idx,
    }));

    if (mode === 'replace') {
      setDocData((prev) => ({
        ...prev,
        questions: newItems,
      }));
    } else {
      setDocData((prev) => ({
        ...prev,
        questions: [...prev.questions, ...newItems].map((q, idx) => ({ ...q, order: idx })),
      }));
    }
  };

  const handleSavePreset = (name: string, questions: string[]) => {
    const newPreset: QAPreset = {
      id: `preset-${Date.now()}`,
      name,
      questions,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    savePresets([newPreset, ...presets]);
  };

  const handleRenamePreset = (id: string, newName: string) => {
    savePresets(
      presets.map((p) => (p.id === id ? { ...p, name: newName, updatedAt: Date.now() } : p))
    );
  };

  const handleDuplicatePreset = (id: string) => {
    const target = presets.find((p) => p.id === id);
    if (!target) return;
    const duplicated: QAPreset = {
      ...target,
      id: `preset-${Date.now()}`,
      name: `${target.name} (복사본)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    savePresets([duplicated, ...presets]);
  };

  const handleDeletePreset = (id: string) => {
    savePresets(presets.filter((p) => p.id !== id));
  };

  // Export as Image
  const handleExportImage = async () => {
    if (!printRef.current || !activeDocument) return;
    try {
      setIsExporting(true);
      await exportElementAsPng(printRef.current, {
        fileName: `${activeDocument.title || '캐릭터_문답'}.png`,
      });
      toast.success('이미지 저장 완료', '문답 문서가 PNG 이미지로 저장되었습니다.');
    } catch (e) {
      console.error(e);
      toast.error('이미지 저장 실패', '이미지 저장 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F9FAFD] dark:bg-[#121217] text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-colors">
      {/* ================================================================= */}
      {/* 1. SECONDARY TOOLBAR: Title, View/Edit Mode, Presets, Save Status */}
      {/* ================================================================= */}
      <div className="h-13 bg-white dark:bg-[#1E1E27] border-b border-slate-200/90 dark:border-[#3A3948] px-6 flex items-center justify-between shrink-0 shadow-2xs z-20 transition-colors">
        {/* Left: Document Title (보기 모드일 땐 순수 텍스트, 편집 모드일 땐 입력창) */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="p-1.5 rounded-xl bg-lavender-50 dark:bg-[#352E58] text-lavender-600 dark:text-[#B7A5FF] shrink-0">
            <FileQuestion className="w-4 h-4" />
          </span>

          {isEditMode ? (
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              onBlur={handleTitleBlurOrEnter}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
              placeholder="캐릭터 문답 제목"
              className="text-sm font-bold text-slate-800 dark:text-[#F3F2F8] bg-slate-100/70 dark:bg-[#2A2938] border border-slate-200 dark:border-[#3A3948] px-2.5 py-1 rounded-lg focus:border-lavender-500 focus:outline-none cursor-text truncate max-w-xs md:max-w-md transition-all"
            />
          ) : (
            <span
              className="text-sm font-bold text-slate-800 dark:text-[#F3F2F8] bg-transparent border-0 px-1 py-1 truncate max-w-xs md:max-w-md select-text cursor-default"
            >
              {docTitle || '캐릭터 문답'}
            </span>
          )}

          <span className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8B9E] hidden sm:inline">
            총 {docData.questions.length}문항
          </span>
        </div>

        {/* Right: Presets, View/Edit Mode Toggle, Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Question Presets Button */}
          <button
            type="button"
            onClick={() => setIsPresetModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lavender-50 dark:bg-[#352E58] hover:bg-lavender-100 dark:hover:bg-[#433B6E] text-lavender-700 dark:text-[#B7A5FF] border border-lavender-200/80 dark:border-[#524580] text-xs font-bold transition-all shadow-2xs"
            title="질문 프리셋 불러오기 및 저장"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>질문 프리셋</span>
          </button>

          <span className="text-slate-200 dark:text-[#3A3948]">|</span>

          {/* View Mode vs Edit Mode Toggle */}
          <div className="flex bg-slate-100 dark:bg-[#262634] p-0.5 rounded-xl border border-slate-200 dark:border-[#3A3948]">
            <button
              type="button"
              onClick={() => {
                setIsEditMode(false);
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

          {/* Save Status */}
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

          {/* Export Image Button */}
          <button
            type="button"
            onClick={handleExportImage}
            disabled={isExporting}
            title="문답 문서 이미지로 저장 (PNG)"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-[#A5A3B5] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#292936] transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Favorite Button */}
          {activeDocument && (
            <button
              type="button"
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
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. MAIN CONTENT AREA: Clean, Comfortable Q&A Document Layout      */}
      {/* ================================================================= */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar flex justify-center">
        <div
          ref={printRef}
          className="w-full max-w-3xl space-y-6 pb-20 bg-transparent"
        >
          {/* Header Banner */}
          <div className="pb-6 border-b border-slate-200/80 dark:border-[#2C2C38] flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {docTitle || '캐릭터 문답'}
              </h1>
              <p className="text-xs text-slate-400 dark:text-[#8E8B9E] mt-1">
                캐릭터에게 질문을 제시하고, 캐릭터의 성격과 생각에 어울리는 답변을 기록합니다.
              </p>
            </div>

            {/* Edit Mode Top Quick Action */}
            {isEditMode && docData.questions.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllQuestions}
                className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                title="모든 질문 비우기"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>목록 비우기</span>
              </button>
            )}
          </div>

          {/* Q&A List */}
          {docData.questions.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-lavender-50 dark:bg-[#26243A] text-lavender-600 dark:text-[#B7A5FF] flex items-center justify-center mx-auto shadow-xs">
                <FileQuestion className="w-7 h-7 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">
                  등록된 질문이 없습니다
                </h3>
                <p className="text-xs text-slate-400 dark:text-[#8E8B9E] mt-1 max-w-sm mx-auto leading-relaxed">
                  직접 질문을 추가하거나 상단의 <strong>[질문 프리셋]</strong> 버튼을 눌러 준비된 질문 모음을 불러와보세요.
                </p>
              </div>

              {isEditMode && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-4 py-2 bg-lavender-600 hover:bg-lavender-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>질문 직접 추가하기</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPresetModalOpen(true)}
                    className="px-4 py-2 bg-white dark:bg-[#1E1E27] hover:bg-slate-50 dark:hover:bg-[#2A2938] border border-slate-200 dark:border-[#3A3948] text-slate-700 dark:text-[#E8E7EF] rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <BookmarkPlus className="w-4 h-4 text-lavender-600" />
                    <span>프리셋 불러오기</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {docData.questions.map((item, index) => {
                const questionNumber = index + 1;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all ${
                      isEditMode
                        ? 'p-5 bg-white dark:bg-[#1E1E27] border-slate-200/90 dark:border-[#3A3948] shadow-2xs hover:shadow-xs group'
                        : 'p-5 bg-white/70 dark:bg-[#1E1E27]/70 border-slate-200/60 dark:border-[#2C2C38]'
                    }`}
                  >
                    {/* Q Section (질문 영역) */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#2A2938]">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* Question Number Badge */}
                        <span className="font-black text-sm text-lavender-600 dark:text-[#B7A5FF] shrink-0 pt-0.5 select-none tracking-tight">
                          Q{questionNumber}.
                        </span>

                        {isEditMode ? (
                          <input
                            type="text"
                            value={item.question}
                            onChange={(e) => handleUpdateQuestion(item.id, e.target.value)}
                            placeholder="질문 내용을 입력하세요 (예: 가장 좋아하는 음식은?)"
                            className="w-full text-sm font-bold text-slate-800 dark:text-white bg-transparent border-none outline-none focus:ring-0 p-0 placeholder-slate-400 dark:placeholder-slate-500"
                          />
                        ) : (
                          <span className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed select-text">
                            {item.question || '(내용 없는 질문)'}
                          </span>
                        )}
                      </div>

                      {/* Edit Mode Question Actions (순서 이동, 복제, 삭제) */}
                      {isEditMode && (
                        <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(index, 'up')}
                            disabled={index === 0}
                            title="위로 이동"
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 rounded"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(index, 'down')}
                            disabled={index === docData.questions.length - 1}
                            title="아래로 이동"
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 rounded"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateQuestion(item, index)}
                            title="질문 복제"
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(item.id, index)}
                            title="질문 삭제"
                            className="p-1 text-slate-400 hover:text-rose-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* A Section (답변 영역) */}
                    <div className="pt-3.5 flex items-start gap-2.5">
                      <span className="font-black text-sm text-slate-400 dark:text-[#8E8B9E] shrink-0 pt-0.5 select-none">
                        A.
                      </span>

                      {isEditMode ? (
                        <textarea
                          rows={2}
                          value={item.answer}
                          onChange={(e) => handleUpdateAnswer(item.id, e.target.value)}
                          placeholder="캐릭터의 답변을 자유롭게 입력하세요..."
                          className="w-full text-xs leading-relaxed text-slate-700 dark:text-[#E8E7EF] bg-transparent border-none outline-none focus:ring-0 p-0 placeholder-slate-400 dark:placeholder-slate-500 resize-y min-h-[50px]"
                        />
                      ) : (
                        <div className="text-xs leading-relaxed text-slate-700 dark:text-[#D1D0DD] whitespace-pre-wrap select-text min-h-[24px]">
                          {item.answer ? (
                            item.answer
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 italic">
                              (작성된 답변이 없습니다)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Edit Mode Bottom Add Button */}
              {isEditMode && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-[#3A3948] hover:border-lavender-400 dark:hover:border-lavender-500 hover:bg-lavender-50/50 dark:hover:bg-[#2A2645]/40 text-xs font-bold text-slate-500 dark:text-[#A5A3B5] hover:text-lavender-600 dark:hover:text-[#B7A5FF] flex items-center justify-center gap-2 transition-all shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>새 질문 추가하기 (Q{docData.questions.length + 1})</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preset Modal */}
      <QAPresetModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        presets={presets}
        currentQuestions={docData.questions}
        onApplyPreset={handleApplyPreset}
        onSavePreset={handleSavePreset}
        onRenamePreset={handleRenamePreset}
        onDuplicatePreset={handleDuplicatePreset}
        onDeletePreset={handleDeletePreset}
      />
    </div>
  );
};

