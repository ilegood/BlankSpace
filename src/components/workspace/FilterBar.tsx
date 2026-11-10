import React from 'react';
import { LayoutGrid, List, ChevronDown } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { FilterType, ViewMode, SortOption } from '../../types';

export const FilterBar: React.FC = () => {
  const {
    filterType,
    setFilterType,
    viewMode,
    setViewMode,
    sortOption,
    setSortOption,
  } = useWorkspace();

  const tabs: { id: FilterType; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'folder', label: '폴더' },
    { id: 'document', label: '문서' },
  ];

  return (
    <div className="flex items-center justify-between border-b border-[#ECEEF3] pb-2 text-xs">
      {/* Left Filter Tabs */}
      <div className="flex items-center gap-6">
        {tabs.map((tab) => {
          const isActive = filterType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`pb-2.5 -mb-2 transition-all relative font-medium ${
                isActive
                  ? 'text-lavender-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-lavender-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100/70 p-0.5 rounded-lg border border-slate-200/60">
          <button
            onClick={() => setViewMode('grid')}
            title="그리드 뷰"
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="리스트 뷰"
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'list'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sort Select */}
        <div className="relative">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="appearance-none pl-3 pr-7 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs focus:outline-none focus:border-lavender-500 cursor-pointer font-medium !bg-white shadow-2xs"
          >
            <option value="custom">사용자 지정 순서 (드래그 정렬)</option>
            <option value="updated-desc">수정일 최신순</option>
            <option value="created-desc">생성일 최신순</option>
            <option value="name-asc">이름순</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

