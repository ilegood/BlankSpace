import React from 'react';
import { PanelLeft, ChevronsRight } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';

export const Sidebar: React.FC<{ forceCollapsed?: boolean }> = ({ forceCollapsed = false }) => {
  const {
    navSection,
    setNavSection,
    activeProjects,
    activeProjectId,
    activeFolderId,
    folders,
    expandedProjectIds,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    setSidebarCollapsed,
    openProject,
    openFolder,
    openTemplateEditor,
    openDocument,
  } = useWorkspace();

  const collapsed = forceCollapsed || isSidebarCollapsed;

  if (collapsed) {
    return (
      <aside className="w-[52px] h-full shrink-0 bg-[#F7F7FB] dark:bg-[#1B1B24] border-r border-[#EAE7F2] dark:border-[#2C2B3B] flex flex-col items-center py-3.5 gap-3 select-none transition-all duration-200">
        <button
          type="button"
          onClick={() => {
            openDocument(null);
            openTemplateEditor(null);
            setNavSection('main');
          }}
          title="Blankspace 메인"
          className="text-sm font-extrabold text-[#6A5ACD] dark:text-[#9A8FE6] hover:opacity-80 transition-opacity"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => {
            if (forceCollapsed) {
              openDocument(null);
              openTemplateEditor(null);
              setSidebarCollapsed(false);
            } else {
              toggleSidebarCollapsed();
            }
          }}
          title="사이드바 펼치기"
          className="p-1.5 rounded-lg text-[#6E6D7A] dark:text-[#9E9CAF] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </aside>
    );
  }

  const navBtnClass = (active: boolean) =>
    `w-full text-left px-3 py-2 rounded-xl text-[13px] transition-all duration-150 ${
      active
        ? 'bg-white dark:bg-[#262436] text-[#1B1B1F] dark:text-[#F1F0F6] font-semibold border border-[#EAE7F2] dark:border-[#38344E] shadow-2xs'
        : 'text-[#4E4D59] dark:text-[#A4A2B5] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] font-medium border border-transparent'
    }`;

  return (
    <aside className="w-[236px] h-full shrink-0 bg-[#F7F7FB] dark:bg-[#1B1B24] border-r border-[#EAE7F2] dark:border-[#2C2B3B] flex flex-col justify-between py-4 px-3.5 select-none transition-all duration-200">
      <div className="flex flex-col gap-4 min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-0.5">
          <button
            type="button"
            onClick={() => setNavSection('main')}
            className="text-[16px] font-bold tracking-tight text-[#1B1B1F] dark:text-[#F1F0F6]"
          >
            Blankspace
          </button>
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            title="사이드바 접기"
            className="p-1.5 rounded-lg text-[#6E6D7A] dark:text-[#9E9CAF] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => setNavSection('main')}
            className={navBtnClass(navSection === 'main' && !activeProjectId)}
          >
            메인
          </button>
          <button
            type="button"
            onClick={() => setNavSection('favorites')}
            className={navBtnClass(navSection === 'favorites')}
          >
            즐겨찾기
          </button>
          <button
            type="button"
            onClick={() => setNavSection('recent')}
            className={navBtnClass(navSection === 'recent')}
          >
            최근 작업
          </button>
        </nav>

        <div className="flex flex-col gap-1 pt-2">
          <div className="px-3 pb-1 text-[11px] font-medium text-[#8A8998] dark:text-[#787689]">
            프로젝트
          </div>

          <div className="flex flex-col gap-0.5">
            {activeProjects.map((project) => {
              const isProjActive = navSection === 'main' && activeProjectId === project.id;
              const isExpanded = expandedProjectIds.includes(project.id) && isProjActive;
              const rootFolders = folders
                .filter((f) => !f.deletedAt && f.projectId === project.id && f.parentFolderId === null)
                .sort((a, b) => a.order - b.order);

              return (
                <div
                  key={project.id}
                  data-sidebar-project-id={project.id}
                  className="flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => openProject(project.id)}
                    className={navBtnClass(isProjActive && !activeFolderId)}
                  >
                    <span className="truncate block">{project.name}</span>
                  </button>

                  {isExpanded && rootFolders.length > 0 && (
                    <div className="flex flex-col gap-0.5 pl-4 mt-0.5 mb-1">
                      {rootFolders.map((folder) => {
                        const isFolderActive = isProjActive && activeFolderId === folder.id;
                        return (
                          <button
                            key={folder.id}
                            type="button"
                            onClick={() => openFolder(folder.id)}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-[12.5px] transition-colors truncate ${
                              isFolderActive
                                ? 'text-[#6A5ACD] dark:text-[#9A8FE6] font-semibold bg-[#EBE8F5]/60 dark:bg-[#2C2845]/60'
                                : 'text-[#6E6D7A] dark:text-[#9E9CAF] hover:text-[#1B1B1F] dark:hover:text-[#F1F0F6] hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                            }`}
                          >
                            {folder.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 pt-3 border-t border-[#EAE7F2]/70 dark:border-[#2C2B3B]/70">
        <button
          type="button"
          onClick={() => setNavSection('trash')}
          className={navBtnClass(navSection === 'trash')}
        >
          휴지통
        </button>
        <button
          type="button"
          onClick={() => setNavSection('settings')}
          className={navBtnClass(navSection === 'settings' || navSection === 'help')}
        >
          설정 · 도움말
        </button>
      </div>
    </aside>
  );
};
