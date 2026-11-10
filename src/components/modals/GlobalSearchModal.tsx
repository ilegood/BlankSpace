import React, { useState, useEffect, useRef } from 'react';
import { Search, Folder as FolderIcon, FileText, ArrowRight, CornerDownLeft, X, Sparkles } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { TEMPLATES } from '../../templates/templateList';
import { Document, Folder } from '../../types';

interface SearchResultItem {
  id: string;
  type: 'document' | 'folder';
  title: string;
  subtitle: string;
  templateType?: string;
  folderId?: string | null;
  projectId: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const {
    projects,
    folders,
    documents,
    pages,
    activeProjectId,
    setActiveProject,
    setActiveFolder,
    setActiveDocument,
    setActivePageId,
  } = useWorkspace();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K and Escape listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute search results across documents and folders
  const results: SearchResultItem[] = React.useMemo(() => {
    const trimmed = query.trim().toLowerCase();

    // Active project context prioritized, or all if none
    const targetDocs = activeProjectId
      ? documents.filter((d) => d.projectId === activeProjectId)
      : documents;
    const targetFolders = activeProjectId
      ? folders.filter((f) => f.projectId === activeProjectId)
      : folders;

    const list: SearchResultItem[] = [];

    // 1. Folders matching query
    targetFolders.forEach((f) => {
      if (!trimmed || f.name.toLowerCase().includes(trimmed)) {
        const proj = projects.find((p) => p.id === f.projectId);
        list.push({
          id: f.id,
          type: 'folder',
          title: f.name,
          subtitle: `폴더 • ${proj?.name || '프로젝트'}`,
          projectId: f.projectId,
        });
      }
    });

    // 2. Documents matching title or template
    targetDocs.forEach((d) => {
      const template = TEMPLATES.find((t) => t.id === d.templateType);
      const proj = projects.find((p) => p.id === d.projectId);
      const parentFolder = folders.find((f) => f.id === d.folderId);
      const pathStr = `${proj?.name || '프로젝트'}${parentFolder ? ` > ${parentFolder.name}` : ''}`;

      // Check document pages for content match
      const docPages = pages.filter((p) => p.documentId === d.id);
      const matchInPages = trimmed && docPages.some((p) => p.title.toLowerCase().includes(trimmed) || p.content.toLowerCase().includes(trimmed));

      if (
        !trimmed ||
        d.title.toLowerCase().includes(trimmed) ||
        (template && template.name.toLowerCase().includes(trimmed)) ||
        matchInPages
      ) {
        list.push({
          id: d.id,
          type: 'document',
          title: d.title,
          subtitle: `${template?.name || '문서'} • ${pathStr}`,
          templateType: d.templateType,
          folderId: d.folderId,
          projectId: d.projectId,
        });
      }
    });

    return list.slice(0, 20); // Limit to top 20 items for snappy performance
  }, [query, documents, folders, projects, pages, activeProjectId]);

  // Handle Keyboard navigation
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0 && results[selectedIndex]) {
        handleSelectItem(results[selectedIndex]);
      }
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    setActiveProject(item.projectId);

    if (item.type === 'folder') {
      setActiveFolder(item.id);
      setActiveDocument(null);
    } else {
      setActiveFolder(item.folderId || null);
      setActiveDocument(item.id);
      const firstPage = pages.find((p) => p.documentId === item.id);
      if (firstPage) {
        setActivePageId(firstPage.id);
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-lavender-600 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="문서 제목, 폴더, 기획 내용 빠른 검색..."
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 focus:outline-none !bg-white"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-md">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
          {results.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center text-slate-400 gap-2">
              <Search className="w-8 h-8 stroke-1 text-slate-300" />
              <p className="text-xs">일치하는 문서나 폴더를 찾을 수 없습니다.</p>
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = selectedIndex === index;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3.5 py-2.5 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-lavender-50 text-lavender-900 ring-1 ring-lavender-200'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        item.type === 'folder'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-lavender-100 text-lavender-600'
                      }`}
                    >
                      {item.type === 'folder' ? (
                        <FolderIcon className="w-4 h-4" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs truncate text-slate-800">{item.title}</h4>
                      <p className="text-[10.5px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.templateType && (
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-slate-200 text-slate-600 shadow-2xs">
                        {TEMPLATES.find((t) => t.id === item.templateType)?.name || '문서'}
                      </span>
                    )}
                    {isSelected && (
                      <CornerDownLeft className="w-3.5 h-3.5 text-lavender-600" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Tips */}
        <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">↓</kbd>
              <span>이동</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">Enter</kbd>
              <span>선택</span>
            </span>
          </div>
          <span>총 {results.length}개 결과</span>
        </div>
      </div>
    </div>
  );
};

