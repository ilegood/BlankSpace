import React, { useState, useRef, useEffect } from 'react';
import { Home, ChevronRight, Search, Bell, Sun, Moon, Laptop, LogOut, User as UserIcon } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
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

  const { theme, isDark, setTheme, toggleTheme } = useTheme();
  const { user, signInWithGoogle, signOut, isConfigured } = useAuth();

  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className="h-14 px-6 border-b border-[#ECEEF3] dark:border-[#3A3948] bg-white dark:bg-[#1E1E27] flex items-center justify-between shrink-0 select-none transition-colors duration-200">
      {/* Breadcrumbs with Drag and Drop Support */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#A5A3B5] font-medium">
        <button
          onClick={() => {
            setActiveProject(null);
            setActiveFolder(null);
            setActiveDocument(null);
          }}
          title="홈 (프로젝트 목록으로 이동)"
          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
            !activeProject
              ? 'text-lavender-700 dark:text-[#B7A5FF] font-semibold bg-lavender-50 dark:bg-[#352E58]'
              : 'hover:text-lavender-600 dark:hover:text-[#A995F5] hover:bg-lavender-50 dark:hover:bg-[#292936]'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>홈</span>
        </button>

        {!activeProject ? (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-[#3A3948]" />
            <span className="text-slate-800 dark:text-[#E8E7EF] font-semibold">프로젝트 목록</span>
          </>
        ) : (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-[#3A3948]" />
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
                  ? 'bg-lavender-100 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] ring-2 ring-lavender-400 font-bold scale-105'
                  : !activeFolder
                  ? 'text-slate-800 dark:text-[#E8E7EF] font-semibold'
                  : 'hover:text-lavender-600 dark:hover:text-[#A995F5] hover:bg-slate-50 dark:hover:bg-[#292936]'
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
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-[#3A3948]" />
                {isLast ? (
                  <span className="text-slate-800 dark:text-[#E8E7EF] font-semibold truncate max-w-[160px] px-1 py-0.5">
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
                        ? 'bg-lavender-100 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] ring-2 ring-lavender-400 font-bold scale-105'
                        : 'hover:text-lavender-600 dark:hover:text-[#A995F5] hover:bg-slate-50 dark:hover:bg-[#292936]'
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
          <Search className="w-4 h-4 text-slate-400 dark:text-[#A5A3B5] absolute left-3 pointer-events-none group-hover:text-lavender-600 dark:group-hover:text-[#A995F5] transition-colors" />
          <input
            type="text"
            readOnly
            placeholder="빠른 검색..."
            className="w-56 pl-9 pr-14 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#3A3948] group-hover:border-lavender-400 dark:group-hover:border-[#A995F5] group-hover:ring-1 group-hover:ring-lavender-200 transition-all text-slate-700 dark:text-[#E8E7EF] placeholder-slate-400 dark:placeholder-[#A5A3B5] bg-white dark:bg-[#292936] cursor-pointer select-none"
          />
          <kbd className="absolute right-2 px-1.5 py-0.5 text-[10px] font-sans font-medium text-slate-400 dark:text-[#A5A3B5] bg-slate-100 dark:bg-[#1E1E27] rounded border border-slate-200 dark:border-[#3A3948] group-hover:border-lavender-300 group-hover:text-lavender-600">
            Ctrl + K
          </kbd>
        </div>

        {/* Quick Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          title={`현재 테마: ${theme === 'system' ? '시스템 설정 따르기' : isDark ? '다크 모드' : '라이트 모드'} (클릭 시 전환)`}
          className="p-2 rounded-xl text-slate-500 dark:text-[#A5A3B5] hover:bg-slate-100/70 dark:hover:bg-[#292936] hover:text-lavender-600 dark:hover:text-[#A995F5] transition-colors"
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-[#A995F5]" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500" />
          )}
        </button>

        {/* Notification */}
        <div className="relative">
          <button
            type="button"
            title="알림"
            aria-label="알림"
            aria-expanded={isNotificationsOpen}
            onClick={() => setIsNotificationsOpen((open) => !open)}
            className="p-2 rounded-xl text-slate-500 dark:text-[#A5A3B5] hover:bg-slate-100/70 dark:hover:bg-[#292936] hover:text-slate-700 dark:hover:text-[#E8E7EF] transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>
          {isNotificationsOpen && (
            <div role="status" className="absolute right-0 top-12 z-40 w-72 rounded-2xl border border-slate-200 dark:border-[#3A3948] bg-white dark:bg-[#292936] p-5 shadow-xl">
              <h2 className="text-sm font-bold text-slate-800 dark:text-[#E8E7EF]">알림</h2>
              <p className="mt-2 text-xs text-slate-500 dark:text-[#A5A3B5]">새 알림이 없습니다.</p>
            </div>
          )}
        </div>

        {/* User Profile or Google Sign In */}
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="w-8 h-8 rounded-full overflow-hidden border-2 border-lavender-500/70 hover:border-lavender-600 transition-all cursor-pointer shadow-2xs"
            >
              <img
                src={
                  user.user_metadata?.avatar_url ||
                  user.user_metadata?.picture ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop'
                }
                alt={user.user_metadata?.full_name || 'User Avatar'}
                className="w-full h-full object-cover"
              />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-slate-200 dark:border-[#3A3948] bg-white dark:bg-[#1E1E27] p-3 shadow-xl animate-in fade-in select-none">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-[#2C2C38] px-1">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 dark:border-[#3A3948] shrink-0">
                    <img
                      src={
                        user.user_metadata?.avatar_url ||
                        user.user_metadata?.picture ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop'
                      }
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-[#E8E7EF] truncate">
                      {user.user_metadata?.full_name || user.email?.split('@')[0] || '사용자'}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-[#8E8B9E] truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>로그아웃</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={signInWithGoogle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#262634] hover:bg-slate-50 dark:hover:bg-[#2F2F3F] border border-slate-200 dark:border-[#3A3948] text-xs font-bold text-slate-700 dark:text-[#E8E7EF] shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            title="Google 계정으로 로그인"
          >
            {/* Google Colorful Logo SVG */}
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google로 로그인</span>
          </button>
        )}
      </div>

      {/* Phase 7: Global Search Modal (Ctrl + K) */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </header>
  );
};
