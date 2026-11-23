import React, { useRef, useEffect, useState } from 'react';
import { useWorkspace } from '../../store/WorkspaceContext';

export const TopBar: React.FC = () => {
  const {
    globalSearchQuery,
    setGlobalSearchQuery,
    navSection,
    setNavSection,
    viewMode,
    setViewMode,
  } = useWorkspace();

  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  // Ctrl+K / Cmd+K focuses global search (§9)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSearchChange = (val: string) => {
    setGlobalSearchQuery(val);
    if (val.trim().length > 0 && navSection !== 'search') {
      setNavSection('search');
    } else if (val.trim().length === 0 && navSection === 'search') {
      setNavSection('main');
    }
  };

  return (
    <header className="h-[68px] px-8 flex items-center justify-between gap-4 shrink-0 bg-white dark:bg-[#15151C]">
      <div
        className="transition-all duration-200"
        style={{ width: focused ? '490px' : '420px', maxWidth: '100%' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={globalSearchQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && globalSearchQuery.trim()) {
              setNavSection('search');
            } else if (e.key === 'Escape' && globalSearchQuery) {
              handleSearchChange('');
              inputRef.current?.blur();
            }
          }}
          placeholder="전체 검색 (프로젝트 · 폴더 · 문서 · 태그)"
          className="w-full h-10 px-4 rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] text-[13px] text-[#1B1B1F] dark:text-[#F1F0F6] placeholder-[#9E9CAF] dark:placeholder-[#6F6D80] focus:outline-none focus:border-[#6A5ACD] transition-colors"
        />
      </div>

      <div className="inline-flex items-center rounded-xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] p-0.5 shrink-0">
        <button
          type="button"
          onClick={() => setViewMode('grid')}
          className={`px-3.5 py-1.5 rounded-[10px] text-xs font-semibold transition-all duration-200 ${
            viewMode === 'grid'
              ? 'bg-[#1B1B1F] text-white dark:bg-[#F1F0F6] dark:text-[#15151C]'
              : 'text-[#6E6D7A] dark:text-[#9E9CAF] hover:text-[#1B1B1F] dark:hover:text-[#F1F0F6]'
          }`}
        >
          카드
        </button>
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`px-3.5 py-1.5 rounded-[10px] text-xs font-semibold transition-all duration-200 ${
            viewMode === 'list'
              ? 'bg-[#1B1B1F] text-white dark:bg-[#F1F0F6] dark:text-[#15151C]'
              : 'text-[#6E6D7A] dark:text-[#9E9CAF] hover:text-[#1B1B1F] dark:hover:text-[#F1F0F6]'
          }`}
        >
          목록
        </button>
      </div>
    </header>
  );
};
