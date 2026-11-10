import React, { useState, useEffect } from 'react';
import { X, Search, FileText, Link2, ChevronRight, Type } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { TEMPLATES } from '../../templates/templateList';

interface InsertInternalLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertLink: (linkUrl: string, linkText: string) => void;
  selectedText?: string;
}

export const InsertInternalLinkModal: React.FC<InsertInternalLinkModalProps> = ({
  isOpen,
  onClose,
  onInsertLink,
  selectedText = '',
}) => {
  const { documents, pages, activeProject } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState('');
  const [customText, setCustomText] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomText(selectedText || '');
      setSearchQuery('');
      setSelectedDocId(null);
      setSelectedPageId(null);
    }
  }, [isOpen, selectedText]);

  if (!isOpen) return null;

  const projectDocs = documents.filter((d) => d.projectId === activeProject?.id);
  const filteredDocs = projectDocs.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedDoc = documents.find((d) => d.id === selectedDocId);
  const docPages = selectedDoc ? pages.filter((p) => p.documentId === selectedDoc.id) : [];

  const handleConfirm = () => {
    if (!selectedDocId) return;

    const targetDoc = documents.find((d) => d.id === selectedDocId);
    if (!targetDoc) return;

    let url = `#blankspace-doc:${selectedDocId}`;
    let textToUse = customText.trim();

    if (selectedPageId) {
      url += `:${selectedPageId}`;
      const targetPage = docPages.find((p) => p.id === selectedPageId);
      if (!textToUse) {
        textToUse = `${targetDoc.title} > ${targetPage?.title || '페이지'}`;
      }
    } else {
      if (!textToUse) {
        textToUse = targetDoc.title;
      }
    }

    onInsertLink(url, textToUse);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 select-none">
      <div className="bg-white dark:bg-[#292936] border border-[#ECEEF3] dark:border-[#3A3948] rounded-2xl shadow-modal w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#3A3948]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-lavender-100 dark:bg-lavender-950/60 text-lavender-600 dark:text-lavender-400 flex items-center justify-center">
              <Link2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-[#E8E7EF] text-sm">
                {selectedText ? '내부 링크 대상 변경' : '내부 문서 링크 삽입'}
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-[#A5A3B5]">참조할 다른 문서나 페이지를 선택하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 dark:text-[#A5A3B5] hover:text-slate-600 dark:hover:text-[#E8E7EF] hover:bg-slate-100 dark:hover:bg-[#1E1E27] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-3.5">
          {/* Display Text Input (Preserves or allows editing existing text) */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-[#E8E7EF] mb-1 flex items-center gap-1">
              <Type className="w-3 h-3 text-slate-400 dark:text-[#A5A3B5]" />
              <span>본문에 표시할 텍스트</span>
            </label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={selectedDoc ? selectedDoc.title : '선택한 문서 제목이 기본 표시됩니다'}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#3A3948] focus:outline-none focus:border-lavender-500 text-slate-800 dark:text-[#E8E7EF] placeholder-slate-400 dark:placeholder-[#A5A3B5]/50 bg-white dark:bg-[#1E1E27]"
            />
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#A5A3B5] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="문서 제목으로 검색..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#3A3948] focus:outline-none focus:border-lavender-500 text-slate-700 dark:text-[#E8E7EF] placeholder-slate-400 dark:placeholder-[#A5A3B5]/50 bg-white dark:bg-[#1E1E27]"
            />
          </div>

          {/* Document & Page Selection Area */}
          <div className="grid grid-cols-2 gap-3 h-52">
            {/* Left: Document List */}
            <div className="border border-slate-200 dark:border-[#3A3948] rounded-xl overflow-y-auto p-1.5 flex flex-col gap-1 bg-slate-50/50 dark:bg-[#1E1E27]">
              <span className="text-[10.5px] font-semibold text-slate-400 dark:text-[#A5A3B5] px-2 py-1">문서 선택</span>
              {filteredDocs.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-[#A5A3B5]">검색 결과가 없습니다</div>
              ) : (
                filteredDocs.map((doc) => {
                  const isSelected = selectedDocId === doc.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setSelectedPageId(null);
                        if (!customText) {
                          setCustomText(doc.title);
                        }
                      }}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-all ${
                        isSelected
                          ? 'bg-lavender-100 dark:bg-lavender-950/70 text-lavender-800 dark:text-lavender-300 font-semibold shadow-xs'
                          : 'text-slate-700 dark:text-[#E8E7EF] hover:bg-white dark:hover:bg-[#292936] hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-lavender-600 dark:text-lavender-400' : 'text-slate-400 dark:text-[#A5A3B5]'}`} />
                        <span className="truncate">{doc.title}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-300 dark:text-[#525068] shrink-0" />
                    </button>
                  );
                })
              )}
            </div>

            {/* Right: Page List for selected Document */}
            <div className="border border-slate-200 dark:border-[#3A3948] rounded-xl overflow-y-auto p-1.5 flex flex-col gap-1 bg-white dark:bg-[#1E1E27]">
              <span className="text-[10.5px] font-semibold text-slate-400 dark:text-[#A5A3B5] px-2 py-1">
                상세 페이지 (선택 사항)
              </span>
              {!selectedDoc ? (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-[#A5A3B5] leading-relaxed px-3">
                  왼쪽에서 먼저 문서를 선택해 주세요.
                </div>
              ) : docPages.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 dark:text-[#A5A3B5]">페이지가 없습니다</div>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedPageId(null)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors font-medium ${
                      selectedPageId === null
                        ? 'bg-slate-100 dark:bg-[#292936] text-slate-800 dark:text-[#E8E7EF] font-semibold'
                        : 'text-slate-500 dark:text-[#A5A3B5] hover:bg-slate-50 dark:hover:bg-[#292936]/50'
                    }`}
                  >
                    문서 첫 페이지 (기본)
                  </button>
                  {docPages.map((page) => {
                    const isSelected = selectedPageId === page.id;
                    return (
                      <button
                        key={page.id}
                        onClick={() => setSelectedPageId(page.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs text-left truncate transition-colors ${
                          isSelected
                            ? 'bg-lavender-100 dark:bg-lavender-950/70 text-lavender-800 dark:text-lavender-300 font-semibold'
                            : 'text-slate-700 dark:text-[#E8E7EF] hover:bg-slate-50 dark:hover:bg-[#292936]/50'
                        }`}
                      >
                        {page.title}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-[#3A3948] bg-slate-50/50 dark:bg-[#1E1E27]/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-[#A5A3B5] truncate max-w-xs">
            {selectedDoc ? `대상: ${selectedDoc.title}` : '문서를 선택하세요'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-200/60 dark:hover:bg-[#292936] transition-colors"
            >
              취소
            </button>
            <button
              disabled={!selectedDocId}
              onClick={handleConfirm}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-lavender-600 hover:bg-lavender-700 disabled:opacity-40 transition-all shadow-sm"
            >
              {selectedText ? '링크 대상 변경' : '링크 삽입'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
