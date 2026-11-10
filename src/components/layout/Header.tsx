import React, { useState } from 'react';
import { Home, ChevronRight, Search, Bell } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { GlobalSearchModal } from '../modals/GlobalSearchModal';

export const Header: React.FC = () => {
  const {
    activeProject,
    activeFolder,
    folderBreadcrumbs,
    setActiveProject,
    setActiveFolder,
    setActiveDocument,
    searchQuery,
    setSearchQuery,
    moveItem,
  } = useWorkspace();

  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDropOnTarget = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverTarget(null);
    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;

    try {
      const data = JSON.parse(dataStr) as { type: 'folder' | 'document'; id: string };
      if (!data.id) return;
      await moveItem(data.type, data.id, targetFolderId);
    } catch (err) {
      console.error('Breadcrumb drop error:', err);
    }
  };

  return (
    <header className="h-14 px-6 border-b border-[#ECEEF3] bg-white flex items-center justify-between shrink-0 select-none">
      {/* Breadcrumbs with Drag and Drop Support */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <button
          onClick={() => {
            setActiveProject(null);
            setActiveFolder(null);
            setActiveDocument(null);
          }}
          title="홈 (프로젝트 목록으로 이동)"
          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
            !activeProject
              ? 'text-lavender-700 font-semibold bg-lavender-50'
              : 'hover:text-lavender-600 hover:bg-lavender-50'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>홈</span>
        </button>

        {!activeProject ? (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 font-semibold">프로젝트 목록</span>
          </>
        ) : (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <button
              onClick={() => {
                setActiveFolder(null);
                setActiveDocument(null);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverTarget('root');
              }}
              onDragLeave={() => setDragOverTarget(null)}
              onDrop={(e) => handleDropOnTarget(e, null)}
              title="프로젝트 루트로 이동 (드롭하여 최상위로 이동 가능)"
              className={`px-2 py-1 rounded-lg transition-all ${
                dragOverTarget === 'root'
                  ? 'bg-lavender-100 text-lavender-700 ring-2 ring-lavender-400 font-bold scale-105'
                  : !activeFolder
                  ? 'text-slate-800 font-semibold'
                  : 'hover:text-lavender-600 hover:bg-slate-50'
              }`}
            >
              {activeProject.name}
            </button>
          </>
        )}

        {/* Nested Folders Breadcrumb */}
        {activeProject &&
          folderBreadcrumbs.map((crumb, idx) => {
            const isLast = idx === folderBreadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.id}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                {isLast ? (
                  <span className="text-slate-800 font-semibold truncate max-w-[160px] px-1 py-0.5">
                    {crumb.name}
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setActiveFolder(crumb.id);
                      setActiveDocument(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDragOverTarget(crumb.id);
                    }}
                    onDragLeave={() => setDragOverTarget(null)}
                    onDrop={(e) => handleDropOnTarget(e, crumb.id)}
                    title={`'${crumb.name}' 폴더로 이동 (드롭 가능)`}
                    className={`px-2 py-1 rounded-lg transition-all truncate max-w-[140px] ${
                      dragOverTarget === crumb.id
                        ? 'bg-lavender-100 text-lavender-700 ring-2 ring-lavender-400 font-bold scale-105'
                        : 'hover:text-lavender-600 hover:bg-slate-50'
                    }`}
                  >
                    {crumb.name}
                  </button>
                )}
              </React.Fragment>
            );
          })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Search Input Button */}
        <div
          onClick={() => setIsSearchModalOpen(true)}
          className="relative flex items-center cursor-pointer group"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none group-hover:text-lavender-600 transition-colors" />
          <input
            type="text"
            readOnly
            placeholder="빠른 검색..."
            className="w-60 pl-9 pr-14 py-1.5 text-xs rounded-xl border border-slate-200 group-hover:border-lavender-400 group-hover:ring-1 group-hover:ring-lavender-200 transition-all text-slate-700 placeholder-slate-400 !bg-white cursor-pointer select-none"
          />
          <kbd className="absolute right-2 px-1.5 py-0.5 text-[10px] font-sans font-medium text-slate-400 bg-slate-100 rounded border border-slate-200 group-hover:border-lavender-300 group-hover:text-lavender-600">
            Ctrl + K
          </kbd>
        </div>

        {/* Notification */}
        <div className="relative">
          <button
            type="button"
            title="알림"
            aria-label="알림"
            aria-expanded={isNotificationsOpen}
            onClick={() => setIsNotificationsOpen((open) => !open)}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100/70 hover:text-slate-700 transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>
          {isNotificationsOpen && (
            <div role="status" className="absolute right-0 top-12 z-40 w-72 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
              <h2 className="text-sm font-bold text-slate-800">알림</h2>
              <p className="mt-2 text-xs text-slate-500">새 알림이 없습니다.</p>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 cursor-pointer">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Phase 7: Global Search Modal (Ctrl + K) */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </header>
  );
};
