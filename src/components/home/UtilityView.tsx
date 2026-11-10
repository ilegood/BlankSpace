import React from 'react';
import { Clock, FileText, Star, Trash2, Settings2 } from 'lucide-react';
import { useWorkspace } from '../../store/WorkspaceContext';
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

  const isRecent = mainView === 'recent';
  const isFavorites = mainView === 'favorites';
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

  return (
    <main className="flex-1 overflow-y-auto bg-[#F9FAFD]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-8">
        <header className="flex items-center justify-between border-b border-[#ECEEF3] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lavender-100 text-lavender-700"><Icon className="h-5 w-5" /></div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{title}</h1>
              {(isRecent || isFavorites) && <p className="mt-1 text-xs text-slate-500">{isRecent ? '최근에 열었던 문서를 다시 열 수 있습니다.' : '즐겨찾기에 추가한 문서를 모아 봅니다.'}</p>}
            </div>
          </div>
          {mainView === 'settings' && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>작업공간 기본 보기</span>
              <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 hover:border-lavender-300">
                {viewMode === 'grid' ? '카드 보기' : '목록 보기'} · 변경
              </button>
            </div>
          )}
        </header>

        {(isRecent || isFavorites) && (docs.length ? (
          <div className="overflow-hidden rounded-2xl border border-[#ECEEF3] bg-white divide-y divide-slate-100">
            {docs.map((document) => {
              const projectName = projects.find((project) => project.id === document.projectId)?.name || '프로젝트';
              return (
                <button key={document.id} onClick={() => openDocument(document.id, document.projectId, document.folderId)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50">
                  <span className="flex min-w-0 items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-lavender-600" />
                    <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{document.title}</span><span className="mt-1 block truncate text-xs text-slate-400">{projectName}</span></span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">{formatRelativeTime(document.updatedAt)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
            {isRecent ? '아직 열어 본 문서가 없습니다.' : '즐겨찾기에 추가한 문서가 없습니다.'}
          </div>
        ))}

        {mainView === 'trash' && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-500">
            휴지통과 삭제 항목 복구 기능은 아직 제공되지 않습니다. 현재 삭제한 문서와 폴더는 복구할 수 없습니다.
          </div>
        )}

        {mainView === 'settings' && (
          <section className="max-w-2xl rounded-2xl border border-[#ECEEF3] bg-white p-6">
            <h2 className="text-sm font-bold text-slate-800">저장 공간</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">프로젝트와 문서는 현재 사용 중인 브라우저의 로컬 저장소에 저장됩니다.</p>
          </section>
        )}
      </div>
    </main>
  );
};
