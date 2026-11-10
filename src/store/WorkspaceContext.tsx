import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { Project, Folder, Document, DocumentPage, FilterType, ViewMode, SortOption, TemplateCategoryType } from '../types';
import { StorageService } from '../storage';
import { generateId } from '../utils/id';
import { TEMPLATES } from '../templates/templateList';

export type MainView = 'projects' | 'recent' | 'favorites' | 'trash' | 'settings';

interface WorkspaceContextType {
  // State
  projects: Project[];
  folders: Folder[];
  documents: Document[];
  pages: DocumentPage[];
  activeProjectId: string | null;
  activeFolderId: string | null;
  activeDocumentId: string | null;
  activePageId: string | null;
  filterType: FilterType;
  viewMode: ViewMode;
  sortOption: SortOption;
  searchQuery: string;
  isLoaded: boolean;
  mainView: MainView;
  setMainView: (view: MainView) => void;
  recentDocumentIds: string[];

  // Active getters & Breadcrumbs (Phase 3)
  activeProject: Project | null;
  activeFolder: Folder | null;
  activeDocument: Document | null;
  activePage: DocumentPage | null;
  folderBreadcrumbs: Folder[];
  currentDocumentPages: DocumentPage[];
  currentFolders: Folder[];
  currentDocuments: Document[];

  // Modals
  isCreateProjectOpen: boolean;
  isCreateFolderOpen: boolean;
  isCreateDocumentOpen: boolean;
  isFabOpen: boolean;

  // Actions
  setActiveProject: (id: string | null) => void;
  setActiveFolder: (id: string | null) => void;
  setActiveDocument: (id: string | null) => void;
  setActivePageId: (id: string | null) => void;
  setFilterType: (filter: FilterType) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortOption: (option: SortOption) => void;
  setSearchQuery: (query: string) => void;

  openCreateProjectModal: () => void;
  closeCreateProjectModal: () => void;
  openCreateFolderModal: () => void;
  closeCreateFolderModal: () => void;
  openCreateDocumentModal: () => void;
  closeCreateDocumentModal: () => void;
  toggleFab: () => void;
  closeFab: () => void;

  // Project Mutations
  createProject: (name: string, description?: string, coverImage?: string) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  renameProject: (id: string, name: string) => Promise<void>;

  // Folder Mutations (Phase 3)
  createFolder: (name: string) => Promise<Folder>;
  deleteFolder: (folderId: string) => Promise<void>;
  renameFolder: (folderId: string, newName: string) => Promise<void>;

  // Document Mutations
  createDocument: (title: string, templateType: string, category: TemplateCategoryType) => Promise<Document>;
  deleteDocument: (documentId: string) => Promise<void>;
  toggleFavoriteDocument: (id: string) => void;
  updateDocumentTitle: (id: string, newTitle: string) => void;

  // Page Mutations (Phase 2)
  createPage: (title?: string) => Promise<DocumentPage>;
  renamePage: (pageId: string, newTitle: string) => Promise<void>;
  deletePage: (pageId: string) => Promise<{ success: boolean; message?: string }>;
  updatePageContent: (pageId: string, content: string) => void;

  // Drag and Drop & Hierarchy Management (Phase 3)
  moveItem: (type: 'folder' | 'document', itemId: string, targetFolderId: string | null) => Promise<{ success: boolean; message?: string }>;
  reorderItems: (type: 'folder' | 'document', activeId: string, overId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

// Helper: check if candidate is a descendant of parent
const isFolderDescendant = (allFolders: Folder[], parentId: string, candidateChildId: string): boolean => {
  if (parentId === candidateChildId) return true;
  let curr = allFolders.find((f) => f.id === candidateChildId);
  while (curr && curr.parentFolderId) {
    if (curr.parentFolderId === parentId) return true;
    curr = allFolders.find((f) => f.id === curr!.parentFolderId);
  }
  return false;
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentIdState] = useState<string | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOptionState] = useState<SortOption>(() => {
    return (localStorage.getItem('blankspace_sort_option') as SortOption) || 'updated-desc';
  });

  const setSortOption = (opt: SortOption) => {
    setSortOptionState(opt);
    try {
      localStorage.setItem('blankspace_sort_option', opt);
    } catch {}
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [mainView, setMainViewState] = useState<MainView>('projects');
  const [recentDocumentIds, setRecentDocumentIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('blankspace_recent_documents');
      return stored ? JSON.parse(stored) as string[] : [];
    } catch {
      return [];
    }
  });

  const setMainView = (view: MainView) => {
    setMainViewState(view);
    setActiveProjectIdState(null);
    setActiveFolderId(null);
    setActiveDocumentIdState(null);
    setActivePageId(null);
    StorageService.saveActiveProjectId(null);
  };

  // Modals
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateDocumentOpen, setIsCreateDocumentOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Load from Storage
  useEffect(() => {
    StorageService.init().then((data) => {
      setProjects(data.projects);
      setFolders(data.folders);
      setDocuments(data.documents);
      setPages(data.pages);
      setActiveProjectIdState(data.activeProjectId);
      setIsLoaded(true);
    });
  }, []);

  const setActiveProject = (id: string | null) => {
    setMainViewState('projects');
    setActiveProjectIdState(id);
    setActiveFolderId(null);
    setActiveDocumentIdState(null);
    setActivePageId(null);
    StorageService.saveActiveProjectId(id);
  };

  const setActiveFolder = (id: string | null) => {
    setActiveFolderId(id);
    setActiveDocumentIdState(null);
    setActivePageId(null);
  };

  const setActiveDocument = (id: string | null) => {
    setActiveDocumentIdState(id);
    if (id) {
      setRecentDocumentIds((previous) => {
        const next = [id, ...previous.filter((recentId) => recentId !== id)].slice(0, 30);
        try { localStorage.setItem('blankspace_recent_documents', JSON.stringify(next)); } catch {}
        return next;
      });
      const docPages = pages.filter((p) => p.documentId === id).sort((a, b) => a.order - b.order);
      if (docPages.length > 0) {
        setActivePageId(docPages[0].id);
      } else {
        const fallbackPage: DocumentPage = {
          id: generateId('page'),
          documentId: id,
          title: '페이지 1',
          content: '',
          order: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        const updatedPages = [...pages, fallbackPage];
        setPages(updatedPages);
        StorageService.savePages(updatedPages);
        setActivePageId(fallbackPage.id);
      }
    } else {
      setActivePageId(null);
    }
  };

  // Active objects
  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);

  const activeFolder = useMemo(() => {
    return folders.find((f) => f.id === activeFolderId) || null;
  }, [folders, activeFolderId]);

  const activeDocument = useMemo(() => {
    return documents.find((d) => d.id === activeDocumentId) || null;
  }, [documents, activeDocumentId]);

  // Phase 3: Breadcrumbs for nested folders
  const folderBreadcrumbs = useMemo(() => {
    if (!activeFolderId) return [];
    const crumbs: Folder[] = [];
    let curr = folders.find((f) => f.id === activeFolderId);
    while (curr) {
      crumbs.unshift(curr);
      curr = curr.parentFolderId ? folders.find((f) => f.id === curr!.parentFolderId) : undefined;
    }
    return crumbs;
  }, [folders, activeFolderId]);

  // Current document pages
  const currentDocumentPages = useMemo(() => {
    if (!activeDocumentId) return [];
    return pages.filter((p) => p.documentId === activeDocumentId).sort((a, b) => a.order - b.order);
  }, [pages, activeDocumentId]);

  // Active page
  const activePage = useMemo(() => {
    if (!activePageId) {
      return currentDocumentPages[0] || null;
    }
    return pages.find((p) => p.id === activePageId) || currentDocumentPages[0] || null;
  }, [pages, activePageId, currentDocumentPages]);

  // Current folder's children
  const currentFolders = useMemo(() => {
    if (!activeProjectId) return [];
    let list = folders.filter((f) => {
      const matchProject = f.projectId === activeProjectId;
      const matchParent = f.parentFolderId === activeFolderId;
      const matchSearch = searchQuery.trim() === '' || f.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchProject && matchParent && matchSearch;
    });

    return [...list].sort((a, b) => {
      if (sortOption === 'updated-desc') return b.updatedAt - a.updatedAt;
      if (sortOption === 'created-desc') return b.createdAt - a.createdAt;
      if (sortOption === 'name-asc') return a.name.localeCompare(b.name, 'ko');
      return a.order - b.order;
    });
  }, [folders, activeProjectId, activeFolderId, searchQuery, sortOption]);

  const currentDocuments = useMemo(() => {
    if (!activeProjectId) return [];
    let docs = documents.filter((d) => {
      const matchProject = d.projectId === activeProjectId;
      const matchFolder = d.folderId === activeFolderId;
      const matchSearch = searchQuery.trim() === '' || d.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchProject && matchFolder && matchSearch;
    });

    return [...docs].sort((a, b) => {
      if (sortOption === 'updated-desc') return b.updatedAt - a.updatedAt;
      if (sortOption === 'created-desc') return b.createdAt - a.createdAt;
      if (sortOption === 'name-asc') return a.title.localeCompare(b.title, 'ko');
      return a.order - b.order;
    });
  }, [documents, activeProjectId, activeFolderId, searchQuery, sortOption]);

  // Project Actions
  const createProject = async (name: string, description: string = '', coverImage?: string): Promise<Project> => {
    const newProject: Project = {
      id: generateId('proj'),
      name,
      description,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
      avatarImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300&auto=format&fit=crop',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [newProject, ...projects];
    setProjects(updated);
    await StorageService.saveProjects(updated);
    setActiveProject(newProject.id);
    return newProject;
  };

  const deleteProject = async (id: string) => {
    const updatedProjects = projects.filter((p) => p.id !== id);
    const updatedFolders = folders.filter((f) => f.projectId !== id);
    const updatedDocs = documents.filter((d) => d.projectId !== id);
    const docIdsToRemove = new Set(documents.filter((d) => d.projectId === id).map((d) => d.id));
    const updatedPages = pages.filter((p) => !docIdsToRemove.has(p.documentId));

    setProjects(updatedProjects);
    setFolders(updatedFolders);
    setDocuments(updatedDocs);
    setPages(updatedPages);

    await StorageService.saveProjects(updatedProjects);
    await StorageService.saveFolders(updatedFolders);
    await StorageService.saveDocuments(updatedDocs);
    await StorageService.savePages(updatedPages);

    if (activeProjectId === id) {
      setActiveProject(updatedProjects.length > 0 ? updatedProjects[0].id : null);
    }
  };

  const renameProject = async (id: string, name: string) => {
    if (!name.trim()) return;
    const updated = projects.map((p) =>
      p.id === id ? { ...p, name: name.trim(), updatedAt: Date.now() } : p
    );
    setProjects(updated);
    await StorageService.saveProjects(updated);
  };

  // Folder Actions (Phase 3)
  const createFolder = async (name: string): Promise<Folder> => {
    if (!activeProjectId) throw new Error('No active project');

    const newFolder: Folder = {
      id: generateId('folder'),
      projectId: activeProjectId,
      parentFolderId: activeFolderId,
      name,
      order: currentFolders.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [...folders, newFolder];
    setFolders(updated);
    await StorageService.saveFolders(updated);
    return newFolder;
  };

  const deleteFolder = async (folderId: string) => {
    // Collect all descendant folder IDs to cascade delete
    const folderIdsToDelete = new Set<string>([folderId]);
    let added = true;
    while (added) {
      added = false;
      for (const f of folders) {
        if (f.parentFolderId && folderIdsToDelete.has(f.parentFolderId) && !folderIdsToDelete.has(f.id)) {
          folderIdsToDelete.add(f.id);
          added = true;
        }
      }
    }

    const updatedFolders = folders.filter((f) => !folderIdsToDelete.has(f.id));
    const docsToDelete = documents.filter((d) => d.folderId && folderIdsToDelete.has(d.folderId));
    const docIdsToDelete = new Set(docsToDelete.map((d) => d.id));
    const updatedDocs = documents.filter((d) => !docIdsToDelete.has(d.id));
    const updatedPages = pages.filter((p) => !docIdsToDelete.has(p.documentId));

    setFolders(updatedFolders);
    setDocuments(updatedDocs);
    setPages(updatedPages);

    await StorageService.saveFolders(updatedFolders);
    await StorageService.saveDocuments(updatedDocs);
    await StorageService.savePages(updatedPages);

    // If currently inside deleted folder, navigate to parent or root
    if (activeFolderId && folderIdsToDelete.has(activeFolderId)) {
      const currentFolderObj = folders.find((f) => f.id === folderId);
      setActiveFolder(currentFolderObj?.parentFolderId || null);
    }
  };

  const renameFolder = async (folderId: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = folders.map((f) =>
      f.id === folderId ? { ...f, name: newName.trim(), updatedAt: Date.now() } : f
    );
    setFolders(updated);
    await StorageService.saveFolders(updated);
  };

  // Document Actions
  const createDocument = async (
    title: string,
    templateType: string,
    category: TemplateCategoryType
  ): Promise<Document> => {
    if (!activeProjectId) throw new Error('No active project');

    const template = TEMPLATES.find((t) => t.id === templateType);
    const finalTitle = title.trim() || template?.defaultTitle || '새 문서';

    const defaultCovers: Record<string, string> = {
      character: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
      world: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop',
      planning: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=600&auto=format&fit=crop',
      design: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=600&auto=format&fit=crop',
      general: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=600&auto=format&fit=crop',
    };

    const newDoc: Document = {
      id: generateId('doc'),
      projectId: activeProjectId,
      folderId: activeFolderId,
      title: finalTitle,
      templateType,
      category,
      coverImage: defaultCovers[category] || defaultCovers.general,
      isFavorite: false,
      order: currentDocuments.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const initialContent = template?.defaultContent
      ? `<h2>${template.name}</h2><p>${template.description}</p><hr/><p>${template.defaultContent.replace(/\n/g, '<br/>')}</p>`
      : '<p></p>';

    const newPage: DocumentPage = {
      id: generateId('page'),
      documentId: newDoc.id,
      title: '페이지 1',
      content: initialContent,
      order: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedDocs = [newDoc, ...documents];
    const updatedPages = [...pages, newPage];

    setDocuments(updatedDocs);
    setPages(updatedPages);

    await StorageService.saveDocuments(updatedDocs);
    await StorageService.savePages(updatedPages);

    return newDoc;
  };

  const deleteDocument = async (documentId: string) => {
    const updatedDocs = documents.filter((d) => d.id !== documentId);
    const updatedPages = pages.filter((p) => p.documentId !== documentId);

    setDocuments(updatedDocs);
    setPages(updatedPages);

    await StorageService.saveDocuments(updatedDocs);
    await StorageService.savePages(updatedPages);

    if (activeDocumentId === documentId) {
      setActiveDocument(null);
    }
  };

  const toggleFavoriteDocument = async (id: string) => {
    const updated = documents.map((d) => (d.id === id ? { ...d, isFavorite: !d.isFavorite } : d));
    setDocuments(updated);
    await StorageService.saveDocuments(updated);
  };

  const updateDocumentTitle = async (id: string, newTitle: string) => {
    const updated = documents.map((d) =>
      d.id === id ? { ...d, title: newTitle, updatedAt: Date.now() } : d
    );
    setDocuments(updated);
    await StorageService.saveDocuments(updated);
  };

  // Page Actions (Phase 2)
  const createPage = async (title?: string): Promise<DocumentPage> => {
    if (!activeDocumentId) throw new Error('No active document');

    const nextOrder = currentDocumentPages.length;
    const pageTitle = title?.trim() || `페이지 ${nextOrder + 1}`;

    const newPage: DocumentPage = {
      id: generateId('page'),
      documentId: activeDocumentId,
      title: pageTitle,
      content: '<p></p>',
      order: nextOrder,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedPages = [...pages, newPage];
    setPages(updatedPages);
    setActivePageId(newPage.id);
    await StorageService.savePages(updatedPages);

    updateDocumentTitle(activeDocumentId, activeDocument?.title || '');
    return newPage;
  };

  const renamePage = async (pageId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const updatedPages = pages.map((p) =>
      p.id === pageId ? { ...p, title: newTitle.trim(), updatedAt: Date.now() } : p
    );
    setPages(updatedPages);
    await StorageService.savePages(updatedPages);
  };

  const deletePage = async (pageId: string): Promise<{ success: boolean; message?: string }> => {
    if (!activeDocumentId) return { success: false, message: '활성 문서가 없습니다.' };

    if (currentDocumentPages.length <= 1) {
      return { success: false, message: '문서에는 최소 1개의 페이지가 유지되어야 합니다.' };
    }

    const remainingPages = currentDocumentPages.filter((p) => p.id !== pageId);
    const updatedAllPages = pages.filter((p) => p.id !== pageId);

    setPages(updatedAllPages);
    await StorageService.savePages(updatedAllPages);

    if (activePageId === pageId) {
      setActivePageId(remainingPages[0].id);
    }

    return { success: true };
  };

  const updatePageContent = async (pageId: string, content: string) => {
    const targetPage = pages.find((p) => p.id === pageId);
    if (!targetPage) return;

    const updatedPages = pages.map((p) =>
      p.id === pageId ? { ...p, content, updatedAt: Date.now() } : p
    );
    setPages(updatedPages);
    await StorageService.savePages(updatedPages);

    const updatedDocs = documents.map((d) =>
      d.id === targetPage.documentId ? { ...d, updatedAt: Date.now() } : d
    );
    setDocuments(updatedDocs);
    await StorageService.saveDocuments(updatedDocs);
  };

  // Phase 3: Drag and Drop & Hierarchy Management
  const moveItem = async (
    type: 'folder' | 'document',
    itemId: string,
    targetFolderId: string | null
  ): Promise<{ success: boolean; message?: string }> => {
    if (type === 'document') {
      const updatedDocs = documents.map((d) =>
        d.id === itemId ? { ...d, folderId: targetFolderId, updatedAt: Date.now() } : d
      );
      setDocuments(updatedDocs);
      await StorageService.saveDocuments(updatedDocs);
      return { success: true };
    }

    // If moving a folder
    if (itemId === targetFolderId) {
      return { success: false, message: '폴더를 자기 자신 안으로 이동할 수 없습니다.' };
    }

    if (targetFolderId && isFolderDescendant(folders, itemId, targetFolderId)) {
      return { success: false, message: '폴더를 자신의 하위 폴더 안으로 이동할 수 없습니다.' };
    }

    const updatedFolders = folders.map((f) =>
      f.id === itemId ? { ...f, parentFolderId: targetFolderId, updatedAt: Date.now() } : f
    );
    setFolders(updatedFolders);
    await StorageService.saveFolders(updatedFolders);
    return { success: true };
  };

  const reorderItems = async (
    type: 'folder' | 'document',
    activeId: string,
    overId: string
  ) => {
    if (activeId === overId) return;

    if (type === 'folder') {
      const currentList = [...currentFolders];
      const fromIdx = currentList.findIndex((f) => f.id === activeId);
      const toIdx = currentList.findIndex((f) => f.id === overId);
      if (fromIdx < 0 || toIdx < 0) return;

      const [moved] = currentList.splice(fromIdx, 1);
      currentList.splice(toIdx, 0, moved);

      // Reassign order
      const orderMap = new Map(currentList.map((item, idx) => [item.id, idx]));
      const updatedFolders = folders.map((f) =>
        orderMap.has(f.id) ? { ...f, order: orderMap.get(f.id)! } : f
      );

      setFolders(updatedFolders);
      await StorageService.saveFolders(updatedFolders);
    } else {
      const currentList = [...currentDocuments];
      const fromIdx = currentList.findIndex((d) => d.id === activeId);
      const toIdx = currentList.findIndex((d) => d.id === overId);
      if (fromIdx < 0 || toIdx < 0) return;

      const [moved] = currentList.splice(fromIdx, 1);
      currentList.splice(toIdx, 0, moved);

      const orderMap = new Map(currentList.map((item, idx) => [item.id, idx]));
      const updatedDocs = documents.map((d) =>
        orderMap.has(d.id) ? { ...d, order: orderMap.get(d.id)! } : d
      );

      setDocuments(updatedDocs);
      await StorageService.saveDocuments(updatedDocs);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        projects,
        folders,
        documents,
        pages,
        activeProjectId,
        activeFolderId,
        activeDocumentId,
        activePageId,
        filterType,
        viewMode,
        sortOption,
        searchQuery,
        isLoaded,
        mainView,
        setMainView,
        recentDocumentIds,

        activeProject,
        activeFolder,
        activeDocument,
        activePage,
        folderBreadcrumbs,
        currentDocumentPages,
        currentFolders,
        currentDocuments,

        isCreateProjectOpen,
        isCreateFolderOpen,
        isCreateDocumentOpen,
        isFabOpen,

        setActiveProject,
        setActiveFolder,
        setActiveDocument,
        setActivePageId,
        setFilterType,
        setViewMode,
        setSortOption,
        setSearchQuery,

        openCreateProjectModal: () => setIsCreateProjectOpen(true),
        closeCreateProjectModal: () => setIsCreateProjectOpen(false),
        openCreateFolderModal: () => {
          setIsFabOpen(false);
          setIsCreateFolderOpen(true);
        },
        closeCreateFolderModal: () => setIsCreateFolderOpen(false),
        openCreateDocumentModal: () => {
          setIsFabOpen(false);
          setIsCreateDocumentOpen(true);
        },
        closeCreateDocumentModal: () => setIsCreateDocumentOpen(false),
        toggleFab: () => setIsFabOpen((prev) => !prev),
        closeFab: () => setIsFabOpen(false),

        createProject,
        deleteProject,
        renameProject,

        createFolder,
        deleteFolder,
        renameFolder,

        createDocument,
        deleteDocument,
        toggleFavoriteDocument,
        updateDocumentTitle,

        createPage,
        renamePage,
        deletePage,
        updatePageContent,

        moveItem,
        reorderItems,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
