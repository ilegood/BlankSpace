import React from 'react';
import {
  Clock,
  FileText,
  Star,
  Trash2,
  Settings2,
  Sun,
  Moon,
  Laptop,
  Check,
  HardDrive,
  Layout,
} from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { useTheme, ThemeMode } from '../../store/ThemeContext';
import { formatRelativeTime } from '../../utils/time';

export const UtilityView: React.FC = () => {
  const {
    mainView,
    documents,
    projects,
    recentDocumentIds,
    setActiveProject,
    setActiveFolder,
    setActiveDocument,
    viewMode,
    setViewMode,
  } = useWorkspace();

  const { theme, setTheme, isDark } = useTheme();

  const isRecent = mainView === 'recent';
  const isFavorites = mainView === 'favorites';
  const isSettings = mainView === 'settings';
  const title = isRecent ? '최근 열람' : isFavorites ? '즐겨찾기' : mainView === 'trash' ? '휴지통' : '설정';
  const docs = isRecent
    ? recentDocumentIds.map((id) => documents.find((document) => document.id === id)).filter((item) => item !== undefined)
    : isFavorites
      ? documents.filter((document) => document.isFavorite).sort((a, b) => b.updatedAt - a.updatedAt)
      : [];
  const Icon = isRecent ? Clock : isFavorites ? Star : mainView === 'trash' ? Trash2 : Settings2;

  const openDocument = (documentId: string, projectId: string, folderId: string | null) => {
    setActiveProject(projectId);
    setActiveFolder(folderId);
    setActiveDocument(documentId);
  };

  const themeOptions: { id: ThemeMode; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'light',
      label: '라이트 모드',
      desc: '깨끗하고 밝은 화이트 + 라벤더 테마',
      icon: <Sun className="w-5 h-5 text-amber-500" />,
    },
    {
      id: 'dark',
      label: '다크 모드',
      desc: '눈의 피로를 덜어주는 편안한 다크 테마',
      icon: <Moon className="w-5 h-5 text-[#A995F5]" />,
    },
    {
      id: 'system',
      label: '시스템 설정 따르기',
      desc: '운영체제의 화면 모드 설정에 맞춰 자동 전환',
      icon: <Laptop className="w-5 h-5 text-slate-500 dark:text-[#A5A3B5]" />,
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-[#F9FAFD] dark:bg-[#17171D] transition-colors duration-200">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-8">
        <header className="flex items-center justify-between border-b border-[#ECEEF3] dark:border-[#3A3948] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender-100 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF]">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-[#E8E7EF]">{title}</h1>
              {(isRecent || isFavorites) && (
                <p className="mt-1 text-xs text-slate-500 dark:text-[#A5A3B5]">
                  {isRecent ? '최근에 열었던 문서를 다시 열 수 있습니다.' : '즐겨찾기에 추가한 문서를 모아 봅니다.'}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Recent & Favorites Document Lists */}
        {(isRecent || isFavorites) && (docs.length ? (
          <div className="overflow-hidden rounded-2xl border border-[#ECEEF3] dark:border-[#3A3948] bg-white dark:bg-[#292936] divide-y divide-slate-100 dark:divide-[#3A3948]">
            {docs.map((document) => {
              const projectName = projects.find((project) => project.id === document.projectId)?.name || '프로젝트';
              return (
                <button
                  key={document.id}
                  onClick={() => openDocument(document.id, document.projectId, document.folderId)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-[#1E1E27] transition-colors"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-lavender-600 dark:text-[#A995F5]" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-800 dark:text-[#E8E7EF]">{document.title}</span>
                      <span className="mt-1 block truncate text-xs text-slate-400 dark:text-[#A5A3B5]">{projectName}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400 dark:text-[#A5A3B5]">{formatRelativeTime(document.updatedAt)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-[#3A3948] bg-white dark:bg-[#292936] py-16 text-center text-sm text-slate-500 dark:text-[#A5A3B5]">
            {isRecent ? '아직 열어 본 문서가 없습니다.' : '즐겨찾기에 추가한 문서가 없습니다.'}
          </div>
        ))}

        {/* Trash */}
        {mainView === 'trash' && (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-[#3A3948] bg-white dark:bg-[#292936] py-16 text-center text-sm text-slate-500 dark:text-[#A5A3B5]">
            휴지통과 삭제 항목 복구 기능은 아직 제공되지 않습니다. 현재 삭제한 문서와 폴더는 복구할 수 없습니다.
          </div>
        )}

        {/* Settings View with Theme Options */}
        {isSettings && (
          <div className="flex flex-col gap-6 max-w-3xl">
            {/* 1. Theme Selection Section */}
            <section className="rounded-2xl border border-[#ECEEF3] dark:border-[#3A3948] bg-white dark:bg-[#292936] p-6 shadow-2xs">
              <h2 className="text-sm font-bold text-slate-800 dark:text-[#E8E7EF]">테마 및 디스플레이</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-[#A5A3B5]">
                원하는 테마를 선택하여 작업 환경의 색상을 설정할 수 있습니다.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
                {themeOptions.map((opt) => {
                  const isSelected = theme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTheme(opt.id)}
                      className={`flex flex-col p-4 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'border-lavender-500 dark:border-[#A995F5] bg-lavender-50/50 dark:bg-[#352E58]/40 ring-2 ring-lavender-200 dark:ring-[#A995F5]/30'
                          : 'border-slate-200 dark:border-[#3A3948] bg-white dark:bg-[#1E1E27] hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        {opt.icon}
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-lavender-500 dark:bg-[#A995F5] text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-xs text-slate-800 dark:text-[#E8E7EF]">
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-[#A5A3B5] mt-1 leading-snug">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 2. Workspace View Mode Section */}
            <section className="rounded-2xl border border-[#ECEEF3] dark:border-[#3A3948] bg-white dark:bg-[#292936] p-6 shadow-2xs flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-[#E8E7EF]">작업공간 기본 보기</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-[#A5A3B5]">폴더 및 문서의 기본 정렬 보기 모드를 지정합니다.</p>
              </div>
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-[#3A3948] bg-slate-50 dark:bg-[#1E1E27] px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-[#E8E7EF] hover:border-lavender-300 transition-colors"
              >
                <Layout className="w-3.5 h-3.5 text-lavender-600 dark:text-[#A995F5]" />
                <span>{viewMode === 'grid' ? '카드 보기' : '목록 보기'}</span>
              </button>
            </section>

            {/* 3. Storage Info */}
            <section className="rounded-2xl border border-[#ECEEF3] dark:border-[#3A3948] bg-white dark:bg-[#292936] p-6 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-slate-400 dark:text-[#A5A3B5]" />
                <h2 className="text-sm font-bold text-slate-800 dark:text-[#E8E7EF]">데이터 저장 공간</h2>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-[#A5A3B5]">
                Blankspace의 모든 프로젝트, 폴더, 문서, 캐릭터 시트 및 특수 캔버스 데이터는 브라우저의 IndexedDB 로컬 저장소에 안전하게 보관됩니다.
              </p>
            </section>
          </div>
        )}
      </div>
    </main>
  );
};
