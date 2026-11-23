import React, { useState, useMemo } from 'react';
import { useWorkspace } from '../../store/WorkspaceContext';

type SearchTab = 'all' | 'project' | 'folder' | 'document' | 'tag';

const HighlightText: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-[#FFF099] dark:bg-[#5E521C] text-[#1B1B1F] dark:text-white px-0.5 rounded">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
};

export const SearchResultsView: React.FC = () => {
  const {
    globalSearchQuery,
    activeProjects,
    folders,
    documents,
    pages,
    openProject,
    openFolder,
    openDocument,
    getDocumentPath,
  } = useWorkspace();

  const [tab, setTab] = useState<SearchTab>('all');
  const q = globalSearchQuery.trim().toLowerCase();

  const matchedProjects = useMemo(
    () =>
      activeProjects.filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      ),
    [activeProjects, q]
  );

  const matchedFolders = useMemo(
    () =>
      folders.filter(
        (f) =>
          !f.deletedAt &&
          (!q || f.name.toLowerCase().includes(q) || (f.description && f.description.toLowerCase().includes(q)))
      ),
    [folders, q]
  );

  const matchedDocuments = useMemo(() => {
    const results: {
      doc: (typeof documents)[number];
      matchType: '제목' | '설명' | '내용' | '연결된 자료';
      snippet?: string;
    }[] = [];

    for (const doc of documents) {
      if (doc.deletedAt) continue;
      if (!q || doc.title.toLowerCase().includes(q)) {
        results.push({ doc, matchType: '제목' });
        continue;
      }
      if (doc.description && doc.description.toLowerCase().includes(q)) {
        results.push({ doc, matchType: '설명', snippet: doc.description });
        continue;
      }
      const docPages = pages.filter((p) => p.documentId === doc.id);
      const matchedPage = docPages.find((p) =>
        p.content.replace(/<[^>]+>/g, ' ').toLowerCase().includes(q)
      );
      if (matchedPage) {
        const plain = matchedPage.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        results.push({ doc, matchType: '내용', snippet: plain.slice(0, 90) });
      }
    }
    return results;
  }, [documents, pages, q]);

  const matchedTags = useMemo(() => {
    const set = new Set<string>();
    documents
      .filter((d) => !d.deletedAt)
      .forEach((d) => d.tags?.forEach((t) => set.add(t)));
    return Array.from(set).filter((t) => !q || t.toLowerCase().includes(q));
  }, [documents, q]);

  const hasAnyResult =
    matchedProjects.length > 0 ||
    matchedFolders.length > 0 ||
    matchedDocuments.length > 0 ||
    matchedTags.length > 0;

  const tabs: { id: SearchTab; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'project', label: '프로젝트' },
    { id: 'folder', label: '폴더' },
    { id: 'document', label: '문서' },
    { id: 'tag', label: '태그' },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-8 pb-12 bg-white dark:bg-[#15151C] bs-animate-fade">
      <div className="max-w-[1160px] mx-auto flex flex-col gap-6 pt-2">
        <div>
          <h1 className="text-[22px] font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
            {globalSearchQuery ? (
              <>
                <span className="bg-[#FFF099] dark:bg-[#5E521C] px-1 rounded">
                  {globalSearchQuery}
                </span>{' '}
                검색 결과
              </>
            ) : (
              '전체 검색'
            )}
          </h1>

          <div className="mt-3 flex items-center gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  tab === t.id
                    ? 'bg-[#1B1B1F] text-white dark:bg-[#F1F0F6] dark:text-[#15151C]'
                    : 'border border-[#E6E3F0] dark:border-[#2E2D3D] text-[#6E6D7A] dark:text-[#9E9CAF]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {!hasAnyResult && (
          <div className="rounded-2xl border border-dashed border-[#E6E3F0] dark:border-[#2E2D3D] py-16 text-center text-xs text-[#8A8998]">
            검색어에 맞는 결과가 없습니다
          </div>
        )}

        {(tab === 'all' || tab === 'project') && matchedProjects.length > 0 && (
          <section className="flex flex-col gap-2">
            <div className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
              프로젝트 <span className="text-[#8A8998] font-normal">{matchedProjects.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {matchedProjects.map((proj) => (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => openProject(proj.id)}
                  className="w-full p-4 rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] flex items-center gap-3 text-left hover:border-[#B6ACEA] transition-colors"
                >
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD]">
                    프로
                  </span>
                  <span className="text-sm font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                    <HighlightText text={proj.name} query={globalSearchQuery} />
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F3F1FB] dark:bg-[#262436] text-[#6E6D7A]">
                    이름
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {(tab === 'all' || tab === 'folder') && matchedFolders.length > 0 && (
          <section className="flex flex-col gap-2">
            <div className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
              폴더 <span className="text-[#8A8998] font-normal">{matchedFolders.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {matchedFolders.map((folder) => {
                const proj = activeProjects.find((p) => p.id === folder.projectId);
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => openFolder(folder.id)}
                    className="w-full p-4 rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] flex flex-col gap-1 text-left hover:border-[#B6ACEA] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F5E6C4] dark:bg-[#3A3022] text-[#8E6A26]">
                        폴더
                      </span>
                      <span className="text-sm font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                        <HighlightText text={folder.name} query={globalSearchQuery} />
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F3F1FB] dark:bg-[#262436] text-[#6E6D7A]">
                        이름
                      </span>
                    </div>
                    <span className="pl-11 text-[11.5px] text-[#8A8998]">{proj?.name}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {(tab === 'all' || tab === 'document') && matchedDocuments.length > 0 && (
          <section className="flex flex-col gap-2">
            <div className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
              문서 <span className="text-[#8A8998] font-normal">{matchedDocuments.length}</span>
            </div>
            <div className="rounded-2xl border border-[#E6E3F0] dark:border-[#2E2D3D] bg-white dark:bg-[#1E1E29] divide-y divide-[#F0EEF7] dark:divide-[#2A2938]">
              {matchedDocuments.map(({ doc, matchType, snippet }) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => openDocument(doc.id)}
                  className="w-full p-4 flex flex-col gap-1 text-left hover:bg-[#FAF9FE] dark:hover:bg-[#242334] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EBE8F5] dark:bg-[#2C2845] text-[#6A5ACD]">
                      문서
                    </span>
                    <span className="text-sm font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
                      <HighlightText text={doc.title} query={globalSearchQuery} />
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F3F1FB] dark:bg-[#262436] text-[#6E6D7A]">
                      {matchType}
                    </span>
                  </div>
                  <span className="pl-11 text-[11.5px] text-[#8A8998]">{getDocumentPath(doc)}</span>
                  {snippet && (
                    <span className="pl-11 text-xs text-[#555464] dark:text-[#B4B2C4] truncate">
                      <HighlightText text={snippet} query={globalSearchQuery} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {(tab === 'all' || tab === 'tag') && matchedTags.length > 0 && (
          <section className="flex flex-col gap-2">
            <div className="text-xs font-bold text-[#1B1B1F] dark:text-[#F1F0F6]">
              태그 <span className="text-[#8A8998] font-normal">{matchedTags.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {matchedTags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-lg bg-[#F3F1FB] dark:bg-[#262436] text-xs font-medium text-[#6A5ACD] dark:text-[#9A8FE6]"
                >
                  <HighlightText text={tag} query={globalSearchQuery} />
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
