import React, { useState } from 'react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { ProjectBanner } from './ProjectBanner';
import { FilterBar } from './FilterBar';
import { FolderCard } from './FolderCard';
import { DocumentCard } from './DocumentCard';
import { EmptyState } from './EmptyState';
import { FabButton } from './FabButton';
import { CommonDocumentEditor } from '../editor/CommonDocumentEditor';
import { CharacterRelationsEditor } from '../editor/special/CharacterRelationsEditor';
import { WorldMapEditor } from '../editor/special/WorldMapEditor';
import { GameFlowEditor } from '../editor/special/GameFlowEditor';
import { ItemDataEditor } from '../editor/special/ItemDataEditor';
import { AnimationEditor } from '../editor/special/AnimationEditor';
import { SoundBoardEditor } from '../editor/special/SoundBoardEditor';
import { Folder as FolderIcon, FileText, Star, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '../../utils/time';
import { TEMPLATES } from '../../templates/templateList';
import { HomeView } from '../home/HomeView';
import { UtilityView } from '../home/UtilityView';

export const WorkspaceView: React.FC = () => {
  const {
    mainView,
    activeProject,
    activeFolder,
    activeDocument,
    currentFolders,
    currentDocuments,
    filterType,
    viewMode,
    setActiveFolder,
    setActiveDocument,
    toggleFavoriteDocument,
    deleteFolder,
    deleteDocument,
    moveItem,
  } = useWorkspace();

  const [isUpDropActive, setIsUpDropActive] = useState(false);

  if (mainView !== 'projects') {
    return <UtilityView />;
  }

  if (!activeProject) {
    return <HomeView />;
  }

  if (activeDocument) {
    switch (activeDocument.templateType) {
      case 'character-relations':
        return <CharacterRelationsEditor />;
      case 'world-map-factions':
        return <WorldMapEditor />;
      case 'game-flow':
        return <GameFlowEditor />;
      case 'game-items-equip':
        return <ItemDataEditor />;
      case 'design-animation-sheet':
        return <AnimationEditor />;
      case 'design-sound-board':
        return <SoundBoardEditor />;
      default:
        return <CommonDocumentEditor />;
    }
  }

  const showFolders = filterType === 'all' || filterType === 'folder';
  const showDocuments = filterType === 'all' || filterType === 'document';
  const hasItems = (showFolders && currentFolders.length > 0) || (showDocuments && currentDocuments.length > 0);

  const handleDropToParent = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsUpDropActive(false);
    if (!activeFolder) return;

    const dataStr = e.dataTransfer.getData('application/json');
    if (!dataStr) return;

    try {
      const data = JSON.parse(dataStr) as { type: 'folder' | 'document'; id: string };
      if (data.id) {
        await moveItem(data.type, data.id, activeFolder.parentFolderId);
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F9FAFD] relative">
      <div className="p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
        {/* Banner or Folder Header */}
        {!activeFolder ? (
          <ProjectBanner project={activeProject} />
        ) : (
          <div className="bg-white border border-[#ECEEF3] rounded-2xl p-6 shadow-soft flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-lavender-100 text-lavender-600 flex items-center justify-center">
                <FolderIcon className="w-6 h-6 fill-lavender-300 text-lavender-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">{activeFolder.name}</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  폴더 내 총 {currentFolders.length + currentDocuments.length}개 항목
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveFolder(activeFolder.parentFolderId)}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setIsUpDropActive(true);
              }}
              onDragLeave={() => setIsUpDropActive(false)}
              onDrop={handleDropToParent}
              title="상위 폴더로 이동 (항목을 끌어다 놓아 상위로 이동할 수 있습니다)"
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                isUpDropActive
                  ? 'bg-lavender-100 text-lavender-800 border-lavender-400 ring-2 ring-lavender-300 scale-105'
                  : 'text-lavender-700 hover:bg-lavender-50 border-transparent hover:border-lavender-200'
              }`}
            >
              ↑ 상위 경로로 이동
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <FilterBar />

        {/* Content Area */}
        {!hasItems ? (
          <EmptyState type="empty-workspace" />
        ) : viewMode === 'grid' ? (
          /* Grid View Mode */
          <div className="flex flex-col gap-6">
            {/* Folders Section */}
            {showFolders && currentFolders.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentFolders.map((folder) => (
                  <FolderCard key={folder.id} folder={folder} />
                ))}
              </div>
            )}

            {/* Documents Section */}
            {showDocuments && currentDocuments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentDocuments.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* List View Mode */
          <div className="bg-white border border-[#ECEEF3] rounded-2xl overflow-hidden shadow-soft divide-y divide-slate-100">
            {showFolders &&
              currentFolders.map((folder) => (
                <div
                  key={folder.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: folder.id }));
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const dataStr = e.dataTransfer.getData('application/json');
                    if (!dataStr) return;
                    try {
                      const data = JSON.parse(dataStr);
                      if (data.id && data.id !== folder.id) {
                        await moveItem(data.type, data.id, folder.id);
                      }
                    } catch {}
                  }}
                  onClick={() => setActiveFolder(folder.id)}
                  className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-lavender-100 text-lavender-600 flex items-center justify-center">
                      <FolderIcon className="w-4 h-4 fill-lavender-300 text-lavender-600" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{folder.name}</span>
                    <span className="text-[11px] text-slate-400">폴더</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      {formatRelativeTime(folder.updatedAt)}
                    </span>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm(`'${folder.name}' 폴더를 삭제하시겠습니까? 하위 항목도 모두 삭제됩니다.`)) {
                          await deleteFolder(folder.id);
                        }
                      }}
                      className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors"
                      title="폴더 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

            {showDocuments &&
              currentDocuments.map((doc) => {
                const t = TEMPLATES.find((temp) => temp.id === doc.templateType);
                return (
                  <div
                    key={doc.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'document', id: doc.id }));
                    }}
                    onClick={() => setActiveDocument(doc.id)}
                    className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-800">{doc.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-lavender-100 text-lavender-700 font-medium">
                        {t?.name || '문서'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        {formatRelativeTime(doc.updatedAt)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteDocument(doc.id);
                        }}
                        className={`p-1 ${doc.isFavorite ? 'text-lavender-600 fill-lavender-600' : 'text-slate-300'}`}
                        title="즐겨찾기 토글"
                      >
                        <Star className={`w-3.5 h-3.5 ${doc.isFavorite ? 'fill-lavender-600' : ''}`} />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm(`'${doc.title}' 문서를 삭제하시겠습니까?`)) {
                            await deleteDocument(doc.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition-colors"
                        title="문서 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <FabButton />
    </div>
  );
};
