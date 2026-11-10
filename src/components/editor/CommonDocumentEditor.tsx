import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Save, Star, Download, Image as ImageIcon } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { TEMPLATES } from '../../templates/templateList';
import { PageSidebar } from './PageSidebar';
import { RichTextEditor } from './RichTextEditor';
import { BacklinkPanel } from './BacklinkPanel';
import { exportElementAsPng } from '../../utils/exportImage';

export const CommonDocumentEditor: React.FC = () => {
  const {
    activeDocument,
    activePage,
    setActiveDocument,
    setActivePageId,
    updateDocumentTitle,
    updatePageContent,
    toggleFavoriteDocument,
  } = useWorkspace();

  const [docTitle, setDocTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [isExporting, setIsExporting] = useState(false);
  const documentPrintRef = useRef<HTMLDivElement>(null);

  // Ref to hold pending unsaved content for flush
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
      setSaveStatus('saved');
    }
  }, [updatePageContent]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      flushPendingSave();
    };
  }, [flushPendingSave]);

  if (!activeDocument) return null;

  const template = TEMPLATES.find((t) => t.id === activeDocument.templateType);

  const handleTitleBlurOrEnter = () => {
    if (docTitle.trim() && docTitle !== activeDocument.title) {
      setSaveStatus('saving');
      updateDocumentTitle(activeDocument.id, docTitle.trim());
      setTimeout(() => setSaveStatus('saved'), 400);
    }
  };

  const handleContentChange = (newHtml: string) => {
    if (!activePage) return;

    // Cache to pending ref
    pendingSaveRef.current = { pageId: activePage.id, content: newHtml };
    setSaveStatus('saving');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (pendingSaveRef.current && pendingSaveRef.current.pageId === activePage.id) {
        updatePageContent(activePage.id, pendingSaveRef.current.content);
        pendingSaveRef.current = null;
      }
      setSaveStatus('saved');
    }, 500);
  };

  const handleBlur = (html: string) => {
    if (activePage) {
      pendingSaveRef.current = { pageId: activePage.id, content: html };
      flushPendingSave();
    }
  };

  const handleBackToList = () => {
    flushPendingSave();
    setActiveDocument(null);
  };

  // Phase 4: Handle internal navigation
  const handleNavigateInternalLink = (targetDocId: string, targetPageId?: string) => {
    flushPendingSave();
    setActiveDocument(targetDocId);
    if (targetPageId) {
      setActivePageId(targetPageId);
    }
  };

  // Phase 6: Export Document as Image
  const handleExportImage = async () => {
    if (!documentPrintRef.current || !activeDocument) return;
    try {
      setIsExporting(true);
      await exportElementAsPng(documentPrintRef.current, {
        fileName: `${activeDocument.title}-${activePage?.title || 'page'}`,
      });
    } catch (err) {
      alert('이미지 내보내기 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F9FAFD] overflow-hidden animate-in fade-in duration-150">
      {/* Top Document Header Bar */}
      <div className="h-14 px-6 border-b border-[#ECEEF3] flex items-center justify-between shrink-0 bg-white shadow-xs">
        {/* Left: Back button + Title input + Template Badge */}
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400" />
            <span>목록으로</span>
          </button>

          <div className="h-4 w-px bg-slate-200 shrink-0" />

          {/* Document Title (Editable) */}
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
            placeholder="제목 없는 문서"
            className="text-[15px] font-bold text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-lavender-500 focus:outline-none transition-colors px-1 py-0.5 truncate max-w-md !bg-white"
          />

          <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-lavender-100 text-lavender-700 shrink-0">
            {template?.name || '문서'}
          </span>
        </div>

        {/* Right: Autosave status & Favorite */}
        <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 text-[11.5px]">
            <Save
              className={`w-3.5 h-3.5 ${
                saveStatus === 'saving' ? 'text-amber-500 animate-pulse' : 'text-slate-400'
              }`}
            />
            <span className={saveStatus === 'saving' ? 'text-amber-600 font-medium' : 'text-slate-400'}>
              {saveStatus === 'saving' ? '저장 중...' : '자동 저장됨'}
            </span>
          </div>

          <span className="text-slate-200">|</span>

          {/* Phase 6: Image Export Button */}
          <button
            onClick={handleExportImage}
            disabled={isExporting}
            title="문서 내용 이미지로 저장 (PNG)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-lavender-700 hover:bg-lavender-50 hover:border-lavender-200 transition-colors text-xs font-medium"
          >
            <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce text-lavender-600' : 'text-slate-400'}`} />
            <span>{isExporting ? '내보내는 중...' : '이미지 저장'}</span>
          </button>

          <span className="text-slate-200">|</span>

          <button
            onClick={() => toggleFavoriteDocument(activeDocument.id)}
            title="즐겨찾기 토글"
            className={`p-1.5 rounded-lg border transition-colors ${
              activeDocument.isFavorite
                ? 'border-lavender-200 bg-lavender-50 text-lavender-600'
                : 'border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${activeDocument.isFavorite ? 'fill-lavender-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Editor Body: PageSidebar + RichTextEditor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Pages Sidebar (passes flush function before page switch) */}
        <PageSidebar onBeforePageChange={flushPendingSave} />

        {/* Main: Rich Text Canvas */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col max-w-5xl mx-auto w-full">
          {activePage ? (
            <div ref={documentPrintRef} className="flex-1 flex flex-col gap-3 pb-12 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-soft">
              {/* Active Page Header info */}
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  현재 페이지: <span className="text-slate-700 font-bold">{activePage.title}</span>
                </h2>
              </div>

              {/* Tiptap Rich Text Editor */}
              <RichTextEditor
                key={activePage.id}
                content={activePage.content}
                onChange={handleContentChange}
                onBlur={handleBlur}
                onNavigateInternalLink={handleNavigateInternalLink}
                placeholder="본문을 자유롭게 작성하세요. 상단 툴바에서 [내부 링크]를 눌러 다른 기획/캐릭터 문서를 연결할 수 있습니다."
              />

              {/* Phase 4: Backlinks Panel */}
              <BacklinkPanel onNavigateToDocument={handleNavigateInternalLink} />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              선택된 페이지가 없습니다.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
