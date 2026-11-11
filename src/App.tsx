import React from 'react';
import { ThemeProvider } from './store/ThemeContext';
import { ToastProvider } from './components/toast/ToastContext';
import { AuthProvider } from './store/AuthContext';
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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F9FAFD] dark:bg-[#17171D] text-slate-500 dark:text-[#A5A3B5] gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-lavender-500 border-t-transparent animate-spin" />
        <span className="text-xs font-medium">Blankspace 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F9FAFD] dark:bg-[#17171D] text-slate-800 dark:text-[#E8E7EF] transition-colors duration-200">
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
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <AppContent />
          </WorkspaceProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;

