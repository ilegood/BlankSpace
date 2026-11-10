import React, { useState } from 'react';
import { Plus, Sparkles, Search, LayoutGrid, ChevronDown, FolderOpen } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { ProjectCard } from './ProjectCard';

export const HomeView: React.FC = () => {
  const { projects, openCreateProjectModal } = useWorkspace();
  const [searchFilter, setSearchFilter] = useState('');
  const [sortOption, setSortOption] = useState<'updated' | 'name'>('updated');

  const filteredProjects = projects
    .filter((p) => p.name.toLowerCase().includes(searchFilter.toLowerCase()) || (p.description && p.description.toLowerCase().includes(searchFilter.toLowerCase())))
    .sort((a, b) => {
      if (sortOption === 'updated') return b.updatedAt - a.updatedAt;
      return a.name.localeCompare(b.name, 'ko');
    });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F9FAFD]">
      <div className="p-8 max-w-7xl w-full mx-auto flex flex-col gap-8">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#ECEEF3]">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">프로젝트 목록</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-lavender-100 text-lavender-700">
                {projects.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              창작 중인 모든 게임 프로젝트를 한곳에서 관리하세요.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search within projects */}
            {projects.length > 0 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="프로젝트 검색..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-lavender-500 text-slate-700 !bg-white w-48"
                />
              </div>
            )}

            {/* Create Project Button */}
            <button
              onClick={openCreateProjectModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-lavender-600 to-lavender-500 hover:from-lavender-700 hover:to-lavender-600 active:scale-95 text-white font-semibold text-xs shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>새 프로젝트 만들기</span>
            </button>
          </div>
        </div>

        {/* Projects Content Area */}
        {projects.length === 0 ? (
          /* Empty Minimal White Space (기획서 3.1) */
          <div className="py-24 flex flex-col items-center justify-center text-center select-none">
            <div className="w-16 h-16 rounded-2xl bg-lavender-100/70 text-lavender-600 flex items-center justify-center mb-4 shadow-soft">
              <Sparkles className="w-8 h-8 fill-lavender-200 stroke-[1.5]" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              당신만의 첫 번째 게임 프로젝트를 시작해 보세요
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
              기획서, 캐릭터 설정, 세계관 지도, 레퍼런스 등을 하나의 프로젝트 공간 안에서 체계적으로 관리할 수 있습니다.
            </p>
            <button
              onClick={openCreateProjectModal}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lavender-600 hover:bg-lavender-700 active:bg-lavender-800 text-white font-semibold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>새 프로젝트 만들기</span>
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-xs text-center">
            <p>검색 조건에 일치하는 프로젝트가 없습니다.</p>
          </div>
        ) : (
          /* Project Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProjects.map((proj) => (
              <ProjectCard key={proj.id} project={proj} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

