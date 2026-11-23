import React from 'react';
import { Star } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { TEMPLATES } from '../../templates/templateList';
import { formatRelativeTime } from '../../utils/time';

export const FavoritesRecentView: React.FC<{ mode: 'favorites' | 'recent' }> = ({ mode }) => {
  const {
    documents,
    recentDocumentIds,
    viewMode,
    openDocument,
    toggleFavoriteDocument,
    getDocumentPath,
  } = useWorkspace();

  const items =
    mode === 'favorites'
      ? documents.filter((d) => !d.deletedAt && d.isFavorite).sort((a, b) => b.updatedAt - a.updatedAt)
      : recentDocumentIds
          .map((id) => documents.find((d) => d.id === id && !d.deletedAt))
          .filter((d): d is NonNullable<typeof d> => Boolean(d));

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

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E6E3F0] dark:border-[#2E2D3D] py-16 text-center text-xs text-[#8A8998]">
            {mode === 'favorites'
              ? '즐겨찾기에 추가된 문서가 없습니다.'
              : '최근 작업한 문서가 없습니다.'}
          </div>
        ) : viewMode === 'grid' ? (
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
        )}
      </div>
    </div>
  );
};
