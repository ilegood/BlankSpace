import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  Save,
  Star,
  Download,
  Eye,
  Edit3,
  HelpCircle,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeft,
  Palette,
  FileText,
  Clock,
  Hash,
} from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { useTheme } from '../../store/ThemeContext';
import { useToast } from '../toast/ToastContext';
import { TEMPLATES } from '../../templates/templateList';
import { PageSidebar } from './PageSidebar';
import { RichTextEditor } from './RichTextEditor';
import { EditorToolbar } from './EditorToolbar';
import { Editor } from '@tiptap/react';
import { BacklinkPanel } from './BacklinkPanel';
import { DocumentHelpModal } from './DocumentHelpModal';
import { exportElementAsPng } from '../../utils/exportImage';

export type DocumentStylePreset = 'modern' | 'minimal' | 'novel' | 'compact';

export const CommonDocumentEditor: React.FC = () => {
  const {
    activeDocument,
    activePage,
    setActiveDocument,
    setActivePageId,
    updateDocumentTitle,
    updatePageContent,
    toggleFavoriteDocument,
    saveStatus,
    lastSaveError,
    retryLastSave,
  } = useWorkspace();
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();

  const [docTitle, setDocTitle] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Phase 1 Rules: View Mode / Edit Mode Separation (Default: View Mode for reading)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);

  // Help Modal State
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Collapsible Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Design Presets with LocalStorage Persistence
  const [preset, setPresetState] = useState<DocumentStylePreset>(() => {
    try {
      return (localStorage.getItem('blankspace_doc_preset') as DocumentStylePreset) || 'modern';
    } catch {
      return 'modern';
    }
  });

  const setPreset = (p: DocumentStylePreset) => {
    setPresetState(p);
    try {
      localStorage.setItem('blankspace_doc_preset', p);
    } catch {}
  };

  // Shortcut key listener: Ctrl+E / Cmd+E for View/Edit mode toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        setIsEditMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const documentPrintRef = useRef<HTMLDivElement>(null);
  const pendingSaveRef = useRef<{ pageId: string; content: string } | null>(null);
  const debounceTimerRef = useRef<any>(null);
  const activePageIdRef = useRef<string | null>(null);

  // Keep activePageIdRef in sync
  useEffect(() => {
    activePageIdRef.current = activePage?.id || null;
  }, [activePage?.id]);

  useEffect(() => {
    if (activeDocument) {
      setDocTitle(activeDocument.title);
    }
  }, [activeDocument]);

  // Flush any pending unsaved changes immediately
  const flushPendingSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (pendingSaveRef.current) {
      const { pageId, content } = pendingSaveRef.current;
      updatePageContent(pageId, content);
      pendingSaveRef.current = null;
    }
  }, [updatePageContent]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      flushPendingSave();
    };
  }, [flushPendingSave]);

  // Calculate live statistics
  const stats = useMemo(() => {
    if (!activePage?.content) return { chars: 0, words: 0, readTime: 0 };
    const textWithSpaces = activePage.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const totalChars = textWithSpaces.length;
    const words = totalChars > 0 ? textWithSpaces.split(' ').length : 0;
    const readTime = Math.max(1, Math.ceil(words / 200));
    return { chars: totalChars, words, readTime };
  }, [activePage?.content]);

  if (!activeDocument) return null;

  const template = TEMPLATES.find((t) => t.id === activeDocument.templateType);

  const handleTitleBlurOrEnter = () => {
    if (docTitle.trim() && docTitle !== activeDocument.title) {
      updateDocumentTitle(activeDocument.id, docTitle.trim());
      toast.success('제목 저장됨', `'${docTitle.trim()}'으로 변경되었습니다.`);
    }
  };

  const handleContentChange = (newHtml: string) => {
    if (!activePage) return;

    // Cache to pending ref
    pendingSaveRef.current = { pageId: activePage.id, content: newHtml };

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (pendingSaveRef.current && pendingSaveRef.current.pageId === activePage.id) {
        updatePageContent(activePage.id, pendingSaveRef.current.content);
        pendingSaveRef.current = null;
      }
    }, 500);
  };

  const handleBlur = (html: string) => {
    if (activePage) {
      pendingSaveRef.current = { pageId: activePage.id, content: html };
      flushPendingSave();
    }
  };

  const handleRetrySave = async () => {
    setIsRetrying(true);
    try {
      await retryLastSave();
      toast.success('저장 완료', '문서가 정상적으로 저장되었습니다.');
    } catch {
      toast.error('저장 실패', lastSaveError || '저장에 실패했습니다.');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleBackToList = () => {
    flushPendingSave();
    setActiveDocument(null);
  };

  const handleNavigateInternalLink = (targetDocId: string, targetPageId?: string) => {
    flushPendingSave();
    setActiveDocument(targetDocId);
    if (targetPageId) {
      setActivePageId(targetPageId);
    }
  };

  const handleExportImage = async () => {
    if (!documentPrintRef.current || !activeDocument) return;
    try {
      setIsExporting(true);
      await exportElementAsPng(documentPrintRef.current, {
        fileName: `${activeDocument.title}-${activePage?.title || 'page'}`,
      });
      toast.success('이미지 저장 완료', '문서 내용이 PNG 이미지로 저장되었습니다.');
    } catch {
      toast.error('내보내기 실패', '이미지 내보내기 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  // Preset Class Mapper
  const getPresetClasses = () => {
    switch (preset) {
      case 'minimal':
        return 'font-sans p-8 bg-white dark:bg-[#1E1E27] border-slate-100 dark:border-[#2C2C38] rounded-2xl';
      case 'novel':
        return 'font-serif p-10 bg-[#FCFBF8] dark:bg-[#20202A] text-slate-900 dark:text-[#EAE7DF] border-amber-100/60 dark:border-[#3E3948] rounded-3xl leading-loose';
      case 'compact':
        return 'font-sans p-5 bg-white dark:bg-[#22222C] border-slate-200 dark:border-[#3A3948] rounded-xl text-[13px]';
      case 'modern':
      default:
        return 'font-sans p-8 bg-white dark:bg-[#22222C] border-slate-200/90 dark:border-[#3A3948] rounded-3xl shadow-soft';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F9FAFD] dark:bg-[#17171D] overflow-hidden select-none animate-in fade-in duration-150 transition-colors">
      {/* 1. Global Navigation & Action Header */}
      <header className="h-14 px-6 border-b border-[#ECEEF3] dark:border-[#3A3948] flex items-center justify-between shrink-0 bg-white dark:bg-[#1E1E27] shadow-xs z-20">
        {/* Left: Back button + Title input + Template Badge */}
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-xs font-medium text-slate-600 dark:text-[#E8E7EF] hover:bg-slate-50 dark:hover:bg-[#292936] transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400 dark:text-[#A5A3B5]" />
            <span>목록으로</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-[#3A3948] shrink-0" />

          {/* Document Title (Editable on Edit Mode / Click) */}
          <input
            type="text"
            value={docTitle}
            disabled={!isEditMode}
            onChange={(e) => setDocTitle(e.target.value)}
            onBlur={handleTitleBlurOrEnter}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="제목 없는 문서"
            className={`text-[15px] font-bold text-slate-800 dark:text-[#E8E7EF] border-b border-transparent transition-colors px-1 py-0.5 truncate max-w-md bg-transparent ${
              isEditMode
                ? 'hover:border-slate-300 dark:hover:border-[#3A3948] focus:border-lavender-500 focus:outline-none cursor-text'
                : 'cursor-default'
            }`}
          />

          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-lavender-100 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] shrink-0">
            {template?.name || '빈 문서'}
          </span>
        </div>

        {/* Center / Right: Mode Toggle + Preset + Save Status + Actions */}
        <div className="flex items-center gap-2.5 text-xs text-slate-400 dark:text-[#A5A3B5] shrink-0">
          {/* Phase 1 Core Rule: Mode Toggle Switch (View Mode vs Edit Mode) */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#292936] border border-slate-200/80 dark:border-[#3A3948]">
            <button
              type="button"
              onClick={() => setIsEditMode(false)}
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
              onClick={() => setIsEditMode(true)}
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

          {/* Design Preset Selector */}
          <div className="flex items-center gap-1">
            <Palette className="w-3.5 h-3.5 text-slate-400 dark:text-[#8E8B9E]" />
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value as DocumentStylePreset)}
              className="text-xs bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-lg px-2 py-1 text-slate-700 dark:text-[#E8E7EF] focus:outline-none focus:border-lavender-500 cursor-pointer"
              title="문서 디자인 프리셋"
            >
              <option value="modern">모던 라벤더</option>
              <option value="minimal">미니멀 클린</option>
              <option value="novel">소설 세리프</option>
              <option value="compact">컴팩트 노트</option>
            </select>
          </div>

          <span className="text-slate-200 dark:text-[#3A3948]">|</span>

          {/* Autosave status indicator */}
          <div className="flex items-center gap-1.5 text-[11.5px]">
            {saveStatus === 'error' ? (
              <button
                onClick={handleRetrySave}
                disabled={isRetrying}
                title={`저장 오류: ${lastSaveError || '클릭하여 재시도'}`}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
              >
                <span>{isRetrying ? '재시도 중...' : '저장 실패 (재시도)'}</span>
              </button>
            ) : (
              <>
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
              </>
            )}
          </div>

          <span className="text-slate-200 dark:text-[#3A3948]">|</span>

          {/* Theme Quick Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={`테마 전환 (현재: ${isDark ? '다크' : '라이트'})`}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#3A3948] hover:bg-slate-50 dark:hover:bg-[#292936] text-slate-500 dark:text-[#A5A3B5] transition-colors"
          >
            {isDark ? (
              <Moon className="w-3.5 h-3.5 text-[#A995F5]" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            )}
          </button>

          {/* Image Export Button */}
          <button
            onClick={handleExportImage}
            disabled={isExporting}
            title="문서 내용 이미지로 저장 (PNG)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#3A3948] text-slate-600 dark:text-[#E8E7EF] hover:text-lavender-700 dark:hover:text-[#B7A5FF] hover:bg-lavender-50 dark:hover:bg-[#292936] hover:border-lavender-200 transition-colors text-xs font-medium"
          >
            <Download
              className={`w-3.5 h-3.5 ${
                isExporting ? 'animate-bounce text-lavender-600' : 'text-slate-400 dark:text-[#A5A3B5]'
              }`}
            />
            <span>{isExporting ? '내보내는 중...' : '이미지 저장'}</span>
          </button>

          {/* Favorite Toggle */}
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

          {/* Help Button */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            title="빈 문서 사용법 및 도움말"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#3A3948] hover:bg-lavender-50 dark:hover:bg-[#292936] text-slate-500 hover:text-lavender-600 dark:text-[#A5A3B5] transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Sub-Header: Sidebar Toggle & Document Stats Bar */}
      <div className="h-9 px-6 bg-slate-50/80 dark:bg-[#1A1A22] border-b border-[#ECEEF3] dark:border-[#3A3948] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#8E8B9E] shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            title={isSidebarOpen ? '사이드바 접기' : '사이드바 펼치기'}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-slate-200/60 dark:hover:bg-[#292936] text-slate-600 dark:text-[#A5A3B5] font-medium transition-colors"
          >
            {isSidebarOpen ? (
              <>
                <PanelLeftClose className="w-3.5 h-3.5 text-slate-400" />
                <span>사이드바 숨기기</span>
              </>
            ) : (
              <>
                <PanelLeft className="w-3.5 h-3.5 text-lavender-600 dark:text-[#B7A5FF]" />
                <span className="text-lavender-600 dark:text-[#B7A5FF] font-semibold">사이드바 열기</span>
              </>
            )}
          </button>

          <span className="text-slate-300 dark:text-[#3A3948]">|</span>

          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3 text-slate-400" />
            <span>
              현재 페이지:{' '}
              <strong className="text-slate-700 dark:text-[#E8E7EF]">
                {activePage?.title || '페이지 없음'}
              </strong>
            </span>
          </span>
        </div>

        {/* Live Document Statistics */}
        <div className="flex items-center gap-3.5">
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3 text-slate-400" />
            <span>{stats.chars.toLocaleString()} 자</span>
          </span>
          <span className="text-slate-300 dark:text-[#3A3948]">·</span>
          <span>{stats.words.toLocaleString()} 단어</span>
          <span className="text-slate-300 dark:text-[#3A3948]">·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>예상 읽기 {stats.readTime}분</span>
          </span>
          <span className="text-slate-300 dark:text-[#3A3948]">|</span>
          <span className={`px-2 py-0.5 rounded font-medium ${isEditMode ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' : 'bg-slate-200/60 dark:bg-[#292936] text-slate-600 dark:text-[#A5A3B5]'}`}>
            {isEditMode ? '편집 중' : '읽기 전용'}
          </span>
        </div>
      </div>

      {/* 2.5 Fixed Editor Toolbar: 서브헤더 ('편집 중' 바) 바로 아래에 고정되는 서식 툴바 */}
      {isEditMode && editorInstance && (
        <div className="shrink-0 z-20 shadow-2xs">
          <EditorToolbar editor={editorInstance} />
        </div>
      )}

      {/* 3. Editor Body: Collapsible PageSidebar + RichTextEditor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Collapsible Page Sidebar */}
        {isSidebarOpen && <PageSidebar onBeforePageChange={flushPendingSave} />}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col items-center w-full">
          {activePage ? (
            <div
              ref={documentPrintRef}
              className={`w-full max-w-4xl flex flex-col gap-4 pb-16 transition-all duration-200 ${getPresetClasses()}`}
            >
              {/* Active Page Title Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#3A3948]">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-[#F3F2F8] tracking-tight">
                  {activePage.title}
                </h1>
                <span className="text-[11px] font-medium text-slate-400 dark:text-[#8E8B9E]">
                  최종 수정: {new Date(activePage.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Tiptap Rich Text Canvas */}
              <RichTextEditor
                key={activePage.id}
                content={activePage.content}
                onChange={handleContentChange}
                onBlur={handleBlur}
                onNavigateInternalLink={handleNavigateInternalLink}
                onEditorReady={setEditorInstance}
                placeholder={
                  isEditMode
                    ? '본문을 자유롭게 작성하세요. 상단 서식 툴바나 단축키(# 제목, - 목록, [ ] 할 일)를 사용할 수 있습니다.'
                    : '내용이 없습니다. 편집 버튼을 눌러 작성을 시작하세요.'
                }
                isReadOnly={!isEditMode}
                preset={preset}
              />

              {/* Backlinks Panel (Visible in both modes) */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#3A3948]">
                <BacklinkPanel onNavigateToDocument={handleNavigateInternalLink} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-[#A5A3B5] text-xs gap-2">
              <FileText className="w-8 h-8 text-slate-300 dark:text-[#3A3948]" />
              <p>선택된 페이지가 없습니다. 사이드바에서 페이지를 선택하거나 추가하세요.</p>
            </div>
          )}
        </main>
      </div>

      {/* 4. Help Guide Modal */}
      <DocumentHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
