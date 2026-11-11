import React, { useState } from 'react';
import { useWorkspace } from '../../store/WorkspaceContext';
import { ProjectBanner } from './ProjectBanner';
import { FilterBar } from './FilterBar';
import { FolderCard } from './FolderCard';
import { DocumentCard } from './DocumentCard';
import { EmptyState } from './EmptyState';
import { FabButton } from './FabButton';
import { CommonDocumentEditor } from '../editor/CommonDocumentEditor';
import { CharacterSheetEditor } from '../editor/special/CharacterSheetEditor';
import { CharacterRelationsEditor } from '../editor/special/CharacterRelationsEditor';
import { CharacterDialogueEditor } from '../editor/special/CharacterDialogueEditor';
import { WorldSheetEditor } from '../editor/special/WorldSheetEditor';
import { WorldMapEditor } from '../editor/special/WorldMapEditor';
import { WorldChronicleEditor } from '../editor/special/WorldChronicleEditor';
import { WorldGlossaryEditor } from '../editor/special/WorldGlossaryEditor';
import { GameDesignSystemEditor } from '../editor/special/GameDesignSystemEditor';
import { GameFlowEditor } from '../editor/special/GameFlowEditor';
import { GameUiUxEditor } from '../editor/special/GameUiUxEditor';
import { ItemDataEditor } from '../editor/special/ItemDataEditor';
import { ReferenceBoardEditor } from '../editor/special/ReferenceBoardEditor';
import { ModelingSheetEditor } from '../editor/special/ModelingSheetEditor';
import { AnimationEditor } from '../editor/special/AnimationEditor';
import { SoundBoardEditor } from '../editor/special/SoundBoardEditor';
import { Folder as FolderIcon, FileText, Star, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '../../utils/time';
import { TEMPLATES } from '../../templates/templateList';
import { HomeView } from '../home/HomeView';
import { UtilityView } from '../home/UtilityView';
import { toast, customConfirm } from '../toast/ToastContext';

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
      // 1. 캐릭터 카테고리
      case 'character-sheet':
        return <CharacterSheetEditor />;
      case 'character-relations':
        return <CharacterRelationsEditor />;

      // 2. 세계관 카테고리
      case 'world-sheet':
        return <WorldSheetEditor />;
      case 'world-map-factions':
      case 'world-region-factions':
        return <WorldMapEditor />;
      case 'world-chronicle':
        return <WorldChronicleEditor />;
      case 'world-glossary':
        return <WorldGlossaryEditor />;

      // 3. 게임 기획 카테고리
      case 'character-dialogue':
        return <CharacterDialogueEditor />;
      case 'game-design-system':
        return <GameDesignSystemEditor />;
      case 'game-flow':
        return <GameFlowEditor />;
      case 'game-ui-ux':
        return <GameUiUxEditor />;
      case 'game-items-equip':
        return <ItemDataEditor />;

      // 4. 디자인 및 자료 카테고리
      case 'design-reference-board':
        return <ReferenceBoardEditor />;
      case 'design-modeling-sheet':
        return <ModelingSheetEditor />;
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
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F9FAFD] dark:bg-[#17171D] relative transition-colors duration-200">
      <div className="p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
        {/* Banner or Folder Header */}
        {!activeFolder ? (
          <ProjectBanner project={activeProject} />
        ) : (
          <div className="bg-white dark:bg-[#292936] border border-[#ECEEF3] dark:border-[#3A3948] rounded-2xl p-6 shadow-soft flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-lavender-100 dark:bg-[#352E58] text-lavender-600 dark:text-[#B7A5FF] flex items-center justify-center">
                <FolderIcon className="w-6 h-6 fill-lavender-300 dark:fill-[#554884] text-lavender-600 dark:text-[#B7A5FF]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-[#E8E7EF]">{activeFolder.name}</h1>
                <p className="text-xs text-slate-400 dark:text-[#A5A3B5] mt-0.5">
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
          <div className="bg-white dark:bg-[#292936] border border-[#ECEEF3] dark:border-[#3A3948] rounded-2xl overflow-hidden shadow-soft divide-y divide-slate-100 dark:divide-[#3A3948]">
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
                  className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#1E1E27] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-lavender-100 dark:bg-[#352E58] text-lavender-600 dark:text-[#B7A5FF] flex items-center justify-center">
                      <FolderIcon className="w-4 h-4 fill-lavender-300 dark:fill-[#554884] text-lavender-600 dark:text-[#B7A5FF]" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-[#E8E7EF]">{folder.name}</span>
                    <span className="text-[11px] text-slate-400 dark:text-[#A5A3B5]">폴더</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 dark:text-[#A5A3B5]">
                      {formatRelativeTime(folder.updatedAt)}
                    </span>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const ok = await customConfirm({
                          title: '폴더 삭제',
                          message: `'${folder.name}' 폴더를 삭제하시겠습니까? 하위 항목도 함께 삭제됩니다.`,
                          confirmText: '삭제',
                          isDanger: true,
                        });
                        if (ok) {
                          await deleteFolder(folder.id);
                          toast.success('폴더 삭제 완료', `'${folder.name}' 폴더가 삭제되었습니다.`);
                        }
                      }}
                      className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-300 dark:text-[#A5A3B5] hover:text-rose-500 transition-colors"
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
                    className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#1E1E27] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-slate-400 dark:text-[#A5A3B5]" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-[#E8E7EF]">{doc.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-lavender-100 dark:bg-[#352E58] text-lavender-700 dark:text-[#B7A5FF] font-medium">
                        {t?.name || '문서'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 dark:text-[#A5A3B5]">
                        {formatRelativeTime(doc.updatedAt)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteDocument(doc.id);
                        }}
                        className={`p-1 ${doc.isFavorite ? 'text-lavender-600 dark:text-[#A995F5] fill-lavender-600' : 'text-slate-300 dark:text-[#A5A3B5]'}`}
                        title="즐겨찾기 토글"
                      >
                        <Star className={`w-3.5 h-3.5 ${doc.isFavorite ? 'fill-lavender-600 dark:fill-[#A995F5]' : ''}`} />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = await customConfirm({
                            title: '문서 삭제',
                            message: `'${doc.title}' 문서를 삭제하시겠습니까?`,
                            confirmText: '삭제',
                            isDanger: true,
                          });
                          if (ok) {
                            await deleteDocument(doc.id);
                            toast.success('문서 삭제 완료', `'${doc.title}' 문서가 삭제되었습니다.`);
                          }
                        }}
                        className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-300 dark:text-[#A5A3B5] hover:text-rose-500 transition-colors"
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
