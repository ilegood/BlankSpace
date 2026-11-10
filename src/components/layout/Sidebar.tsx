import React from 'react';
import { Sparkles, Folder, Clock, Star, Trash2, Plus, Settings } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';

export const Sidebar: React.FC = () => {
  const {
    projects,
    activeProjectId,
    mainView,
    setMainView,
    setActiveProject,
    openCreateProjectModal,
  } = useWorkspace();

  return (
    <aside className="w-64 h-screen bg-[#F8F9FD] dark:bg-[#1E1E27] border-r border-[#ECEEF3] dark:border-[#3A3948] flex flex-col justify-between shrink-0 select-none transition-colors duration-200">
      {/* Upper Area */}
      <div className="p-4 flex flex-col gap-6">
        {/* Brand Logo (Click to go Home) */}
        <div
          onClick={() => setMainView('projects')}
          className="flex items-center gap-2.5 px-2 py-1 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-lavender-600 to-lavender-400 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4 fill-white" />
          </div>
          <span className="font-bold text-lg text-slate-800 dark:text-[#E8E7EF] tracking-tight">Blankspace</span>
        </div>

        {/* Global Nav Links */}
        <nav className="flex flex-col gap-1 text-[14px]">
          <button
            onClick={() => setMainView('projects')}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-colors ${
              mainView === 'projects' && activeProjectId === null
                ? 'bg-lavender-100/80 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] font-semibold shadow-xs'
                : 'text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-100/70 dark:hover:bg-[#292936] font-normal'
            }`}
          >
            <Folder className={`w-4 h-4 ${activeProjectId === null ? 'text-lavender-600 dark:text-[#A995F5]' : 'text-slate-400 dark:text-[#A5A3B5]'}`} />
            <span>프로젝트</span>
          </button>
          <button
            onClick={() => setMainView('recent')}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
              mainView === 'recent'
                ? 'bg-lavender-100/80 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] font-semibold'
                : 'font-normal text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-100/70 dark:hover:bg-[#292936]'
            }`}
          >
            <Clock className="w-4 h-4 text-slate-400 dark:text-[#A5A3B5]" />
            <span>최근 열람</span>
          </button>
          <button
            onClick={() => setMainView('favorites')}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
              mainView === 'favorites'
                ? 'bg-lavender-100/80 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] font-semibold'
                : 'font-normal text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-100/70 dark:hover:bg-[#292936]'
            }`}
          >
            <Star className="w-4 h-4 text-slate-400 dark:text-[#A5A3B5]" />
            <span>즐겨찾기</span>
          </button>
          <button
            onClick={() => setMainView('trash')}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
              mainView === 'trash'
                ? 'bg-lavender-100/80 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] font-semibold'
                : 'font-normal text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-100/70 dark:hover:bg-[#292936]'
            }`}
          >
            <Trash2 className="w-4 h-4 text-slate-400 dark:text-[#A5A3B5]" />
            <span>휴지통</span>
          </button>
        </nav>

        {/* My Projects Section */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex items-center justify-between px-3 text-xs font-semibold text-slate-400 dark:text-[#A5A3B5]">
            <span>내 프로젝트</span>
            <button
              onClick={openCreateProjectModal}
              title="새 프로젝트 생성"
              className="p-1 rounded-md text-slate-400 dark:text-[#A5A3B5] hover:text-lavender-600 dark:hover:text-[#A995F5] hover:bg-lavender-50 dark:hover:bg-[#292936] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
            {projects.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-[11px] text-slate-400 dark:text-[#A5A3B5]">등록된 프로젝트가 없습니다.</p>
                <button
                  onClick={openCreateProjectModal}
                  className="mt-2 text-xs font-semibold text-lavender-600 dark:text-[#A995F5] hover:underline"
                >
                  + 새 프로젝트 생성
                </button>
              </div>
            ) : (
              projects.map((proj) => {
                const isActive = proj.id === activeProjectId;
                return (
                  <button
                    key={proj.id}
                    onClick={() => setActiveProject(proj.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] transition-all text-left ${
                      isActive
                        ? 'bg-white dark:bg-[#292936] text-slate-800 dark:text-[#E8E7EF] shadow-soft font-semibold border border-[#E9EBF0] dark:border-[#3A3948]'
                        : 'text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-100/60 dark:hover:bg-[#292936]/60 font-normal'
                    }`}
                  >
                    <img
                      src={proj.avatarImage || proj.coverImage}
                      alt={proj.name}
                      className="w-5 h-5 rounded-md object-cover border border-slate-200 dark:border-[#3A3948] shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="truncate flex-1">{proj.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Area: Settings */}
      <div className="p-4 border-t border-[#ECEEF3] dark:border-[#3A3948]">
        <button
          onClick={() => setMainView('settings')}
          className={`flex items-center gap-3 px-3 py-2 w-full rounded-xl text-[14px] transition-colors ${
            mainView === 'settings'
              ? 'bg-lavender-100/80 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] font-semibold'
              : 'text-slate-600 dark:text-[#A5A3B5] hover:bg-slate-100/70 dark:hover:bg-[#292936]'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400 dark:text-[#A5A3B5]" />
          <span>설정</span>
        </button>
      </div>
    </aside>
  );
};

