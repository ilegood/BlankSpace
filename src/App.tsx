import React from 'react';
import { ThemeProvider } from './store/ThemeContext';
import { ToastProvider } from './components/toast/ToastContext';
import { AuthProvider } from './store/AuthContext';
import { WorkspaceProvider, useWorkspace } from './store/WorkspaceContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { HomeView } from './components/views/HomeView';
import { ProjectDetailView } from './components/views/ProjectDetailView';
import { FolderDetailView } from './components/views/FolderDetailView';
import { FavoritesRecentView } from './components/views/FavoritesRecentView';
import { TrashView } from './components/views/TrashView';
import { SearchResultsView } from './components/views/SearchResultsView';
import { SettingsView } from './components/views/SettingsView';
import { HelpView } from './components/views/HelpView';
import { CreateProjectModal } from './components/modals/CreateProjectModal';
import { CreateFolderModal } from './components/modals/CreateFolderModal';
import { CreateDocumentModal } from './components/modals/CreateDocumentModal';

import { SheetCanvasEditor } from './components/editor/canvas/SheetCanvasEditor';
import { BlankDocumentEditor } from './components/editor/BlankDocumentEditor';
import { CharacterRelationsEditor } from './components/editor/special/CharacterRelationsEditor';
import { CharacterQAEditor } from './components/editor/special/qa/CharacterQAEditor';
import { WorldMapEditor } from './components/editor/special/WorldMapEditor';
import { TimelineEditor } from './components/editor/special/TimelineEditor';
import { GlossaryEditor } from './components/editor/special/GlossaryEditor';
import { GameFlowEditor } from './components/editor/special/GameFlowEditor';
import { UiUxEditor } from './components/editor/special/UiUxEditor';
import { ItemEquipEditor } from './components/editor/special/ItemEquipEditor';
import { DialogueScriptEditor } from './components/editor/special/DialogueScriptEditor';
import { ReferenceBoardEditor } from './components/editor/special/ReferenceBoardEditor';
import { SoundBoardEditor } from './components/editor/special/SoundBoardEditor';
import { MemoBoardEditor } from './components/editor/special/MemoBoardEditor';
import { ScheduleEditor } from './components/editor/special/ScheduleEditor';
import { FileVaultEditor } from './components/editor/special/FileVaultEditor';

const renderEditorByType = (templateType: string, templateOverrideId?: string | null) => {
  switch (templateType) {
    case 'custom-blank-canvas':
    case 'character-sheet':
    case 'world-sheet':
    case 'game-design-system':
    case 'design-modeling-sheet':
    case 'design-animation-sheet':
      return <SheetCanvasEditor templateOverrideId={templateOverrideId} />;
    case 'character-relations':
      return <CharacterRelationsEditor templateOverrideId={templateOverrideId} />;
    case 'character-qa':
      return <CharacterQAEditor templateOverrideId={templateOverrideId} />;
    case 'world-map-factions':
    case 'world-region-factions':
      return <WorldMapEditor templateOverrideId={templateOverrideId} />;
    case 'world-chronicle':
      return <TimelineEditor templateOverrideId={templateOverrideId} />;
    case 'world-glossary':
      return <GlossaryEditor templateOverrideId={templateOverrideId} />;
    case 'game-flow':
      return <GameFlowEditor templateOverrideId={templateOverrideId} />;
    case 'game-ui-ux':
      return <UiUxEditor templateOverrideId={templateOverrideId} />;
    case 'game-items-equip':
      return <ItemEquipEditor templateOverrideId={templateOverrideId} />;
    case 'character-dialogue':
      return <DialogueScriptEditor templateOverrideId={templateOverrideId} />;
    case 'design-reference-board':
      return <ReferenceBoardEditor templateOverrideId={templateOverrideId} />;
    case 'design-sound-board':
      return <SoundBoardEditor templateOverrideId={templateOverrideId} />;
    case 'general-idea-board':
      return <MemoBoardEditor templateOverrideId={templateOverrideId} />;
    case 'general-timeline':
      return <ScheduleEditor templateOverrideId={templateOverrideId} />;
    case 'general-files':
      return <FileVaultEditor templateOverrideId={templateOverrideId} />;
    case 'general-blank':
    default:
      return <BlankDocumentEditor templateOverrideId={templateOverrideId} />;
  }
};

const AppShell: React.FC = () => {
  const {
    isLoaded,
    navSection,
    activeProject,
    activeFolder,
    activeDocument,
    editingTemplateId,
    userTemplates,
  } = useWorkspace();

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-[#15151C] text-xs text-[#8A8998]">
        Blankspace 불러오는 중...
      </div>
    );
  }

  const isInsideEditor = Boolean(activeDocument || editingTemplateId);

  const renderMainContent = () => {
    if (editingTemplateId) {
      const userTpl = userTemplates.find((u) => u.id === editingTemplateId);
      const targetType = userTpl ? userTpl.baseTemplateType : editingTemplateId;
      return renderEditorByType(targetType, editingTemplateId);
    }
    if (activeDocument) {
      return renderEditorByType(activeDocument.templateType, null);
    }

    switch (navSection) {
      case 'favorites':
        return <FavoritesRecentView mode="favorites" />;
      case 'recent':
        return <FavoritesRecentView mode="recent" />;
      case 'trash':
        return <TrashView />;
      case 'search':
        return <SearchResultsView />;
      case 'settings':
        return <SettingsView />;
      case 'help':
        return <HelpView />;
      case 'main':
      default:
        if (activeFolder) return <FolderDetailView />;
        if (activeProject) return <ProjectDetailView />;
        return <HomeView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#15151C] text-[#1B1B1F] dark:text-[#F1F0F6]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {!isInsideEditor && <TopBar />}
        {renderMainContent()}
      </div>

      <CreateProjectModal />
      <CreateFolderModal />
      <CreateDocumentModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <AppShell />
          </WorkspaceProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
