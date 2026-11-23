import React from 'react';
import { Star } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { TEMPLATES } from '../../templates/templateList';
import { formatRelativeTime } from '../../utils/time';

export const FavoritesRecentView: React.FC<{ mode: 'favorites' | 'recent' }> = ({ mode }) => {
  const {
    activeProjects,
    folders,
    documents,
    recentDocumentIds,
    viewMode,
    openProject,
    openFolder,
    openDocument,
    toggleFavoriteProject,
    toggleFavoriteFolder,
    toggleFavoriteDocument,
    getDocumentPath,
  } = useWorkspace();

  const favProjects = mode === 'favorites' ? activeProjects.filter((p) => p.isFavorite) : [];
  const favFolders =
    mode === 'favorites' ? folders.filter((f) => !f.deletedAt && f.isFavorite) : [];

  const items =
    mode === 'favorites'
      ? documents.filter((d) => !d.deletedAt && d.isFavorite).sort((a, b) => b.updatedAt - a.updatedAt)
      : recentDocumentIds
          .map((id) => documents.find((d) => d.id === id && !d.deletedAt))
          .filter((d): d is NonNullable<typeof d> => Boolean(d));

  const hasAnyFav = favProjects.length > 0 || favFolders.length > 0 || items.length > 0;

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-12 bg-white dark:bg-[#15151C] transition-colors">
      <div className="max-w-[1160px] mx-auto flex flex-col gap-6 pt-2">
        <div>
          <h1 className="text-[24px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
            {mode === 'favorites' ? '즐겨찾기' : '최근 작업'}
          </h1>
          <p className="mt-1 text-[13px] text-[#6E6D7A] dark:text-[#9E9CAF]">
            {mode === 'favorites'
              ? '자주 찾는 문서를 모아 빠르게 열 수 있습니다.'
              : '최근에 작업한 문서를 이어서 편집할 수 있습니다.'}
          </p>
        </div>

        {!hasAnyFav ? (
          <div className="rounded-2xl border border-dashed border-[#E6E3F0] dark:border-[#2E2D3D] py-16 text-center text-xs text-[#8A8998]">
            {mode === 'favorites'
              ? '즐겨찾기에 추가된 항목이 없습니다.'
              : '최근 작업한 문서가 없습니다.'}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {mode === 'favorites' && favProjects.length > 0 && (
              <section className="flex flex-col gap-2.5">
                <div className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                  프로젝트 ({favProjects.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {favProjects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => openProject(proj.id)}
                      className="rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] overflow-hidden cursor-pointer hover:border-[#B6ACEA] transition-all"
                    >
                      <div
                        className="h-24 w-full relative"
                        style={{ backgroundColor: proj.coverColor || '#D9D5F3' }}
                      >
                        {proj.coverImage && (
                          <img
                            src={proj.coverImage}
                            alt={proj.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteProject(proj.id);
                          }}
                          className="absolute top-2.5 left-2.5 p-1.5 rounded-lg bg-white/85 dark:bg-[#1E1E29]/85 text-[#6A5ACD]"
                        >
                          <Star className="w-3.5 h-3.5 fill-[#6A5ACD]" />
                        </button>
                      </div>
                      <div className="p-3.5">
                        <div className="text-sm font-bold truncate">{proj.name}</div>
                        {proj.description && (
                          <div className="text-xs text-[#8A8998] truncate mt-0.5">
                            {proj.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {mode === 'favorites' && favFolders.length > 0 && (
              <section className="flex flex-col gap-2.5">
                <div className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                  폴더 ({favFolders.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {favFolders.map((folder) => (
                    <div
                      key={folder.id}
                      onClick={() => openFolder(folder.id)}
                      className="rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] p-4 cursor-pointer hover:border-[#B6ACEA] transition-all flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start justify-between">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F5E6C4] dark:bg-[#3A3022] text-[#8E6A26] dark:text-[#E5C17B]">
                          폴더
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteFolder(folder.id);
                          }}
                          className="text-[#6A5ACD]"
                        >
                          <Star className="w-3.5 h-3.5 fill-[#6A5ACD]" />
                        </button>
                      </div>
                      <div>
                        <div className="text-[14px] font-bold truncate">{folder.name}</div>
                        {folder.description && (
                          <div className="text-[11.5px] text-[#8A8998] mt-0.5 truncate">
                            {folder.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {items.length > 0 &&
              (viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {items.map((doc) => {
              const tpl = TEMPLATES.find((t) => t.id === doc.templateType);
              return (
                <div
                  key={doc.id}
                  onClick={() => openDocument(doc.id)}
                  className="rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] p-4 cursor-pointer hover:border-[#B6ACEA] transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6]">
                      문서
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteDocument(doc.id);
                      }}
                      className="text-[#6A5ACD] dark:text-[#9A8FE6]"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          doc.isFavorite ? 'fill-[#6A5ACD] dark:fill-[#9A8FE6]' : 'text-[#C5C2D4]'
                        }`}
                      />
                    </button>
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
                      {doc.title}
                    </div>
                    <div className="text-[11.5px] text-[#8A8998] mt-0.5 truncate">
                      {tpl?.name || '문서'} · {getDocumentPath(doc)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] divide-y divide-[#F0EEF7] dark:divide-[#2A2938]">
            {items.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => openDocument(doc.id)}
                className="w-full px-4 py-3 flex items-center justify-between gap-4 hover:bg-[#FAF9FE] dark:hover:bg-[#242334] text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD] dark:text-[#9A8FE6]">
                    문서
                  </span>
                  <span className="text-[13.5px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6] truncate">
                    {doc.title}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#8A8998] shrink-0">
                  <span>{getDocumentPath(doc)}</span>
                  <span>{formatRelativeTime(doc.updatedAt)}</span>
                </div>
              </button>
            ))}
          </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
