import React from 'react';
import { WorkspaceProvider, useWorkspace } from './store/WorkspaceContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { WorkspaceView } from './components/workspace/WorkspaceView';
import { CreateProjectModal } from './components/modals/CreateProjectModal';
import { CreateFolderModal } from './components/modals/CreateFolderModal';
import { CreateDocumentModal } from './components/modals/CreateDocumentModal';

const AppContent: React.FC = () => {
  const { isLoaded } = useWorkspace();

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F9FAFD] text-slate-500 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-lavender-500 border-t-transparent animate-spin" />
        <span className="text-xs font-medium">Blankspace 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F9FAFD]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header />
        <WorkspaceView />
      </div>

      {/* Modals */}
      <CreateProjectModal />
      <CreateFolderModal />
      <CreateDocumentModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WorkspaceProvider>
      <AppContent />
    </WorkspaceProvider>
  );
};

export default App;

