import React, { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Project, Folder, Document, DocumentPage, FilterType, ViewMode, SortOption, TemplateCategoryType } from '../types';
import { StorageService, BackupService, CURRENT_SCHEMA_VERSION } from '../storage';
import { generateId } from '../utils/id';
import { TEMPLATES } from '../templates/templateList';

export type MainView = 'projects' | 'recent' | 'favorites' | 'trash' | 'settings';
export type SaveStatus = 'saved' | 'saving' | 'error';

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

  // Save State & Reliability
  saveStatus: SaveStatus;
  lastSaveError: string | null;
  retryLastSave: () => Promise<void>;

  // Backup & Schema Version (Phase 2)
  schemaVersion: number;
  exportBackup: (customFileName?: string) => void;
  importBackup: (jsonString: string) => Promise<{ success: boolean; error?: string }>;

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
  updatePageContent: (pageId: string, content: string) => Promise<{ success: boolean; error?: string }>;

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

  // Sync refs to guarantee always-latest data access and eliminate stale closure bugs
  const projectsRef = useRef<Project[]>([]);
  const foldersRef = useRef<Folder[]>([]);
  const documentsRef = useRef<Document[]>([]);
  const pagesRef = useRef<DocumentPage[]>([]);

  // Reliable Save Status Management
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSaveError, setLastSaveError] = useState<string | null>(null);

  // Serialized persistence queues to prevent race conditions & out-of-order writes
  const isSavingPagesRef = useRef(false);
  const hasPendingPagesSaveRef = useRef(false);

  const isSavingDocsRef = useRef(false);
  const hasPendingDocsSaveRef = useRef(false);

  const isSavingFoldersRef = useRef(false);
  const hasPendingFoldersSaveRef = useRef(false);

  const isSavingProjectsRef = useRef(false);
  const hasPendingProjectsSaveRef = useRef(false);

  // Process Pages Queue
  const processPagesQueue = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (isSavingPagesRef.current) {
      hasPendingPagesSaveRef.current = true;
      return { success: true };
    }

    isSavingPagesRef.current = true;
    setSaveStatus('saving');

    let finalError: string | null = null;
    try {
      do {
        hasPendingPagesSaveRef.current = false;
        const currentPages = [...pagesRef.current];
        const res = await StorageService.savePages(currentPages);
        if (!res.success) {
          throw new Error(res.error || '페이지 저장에 실패했습니다.');
        }
      } while (hasPendingPagesSaveRef.current);

      setSaveStatus('saved');
      setLastSaveError(null);
      return { success: true };
    } catch (err: any) {
      finalError = err?.message || '저장 중 오류가 발생했습니다.';
      console.error('Save pages error:', err);
      setSaveStatus('error');
      setLastSaveError(finalError);
      return { success: false, error: finalError || undefined };
    } finally {
      isSavingPagesRef.current = false;
    }
  }, []);

  // Process Docs Queue
  const processDocsQueue = useCallback(async () => {
    if (isSavingDocsRef.current) {
      hasPendingDocsSaveRef.current = true;
      return;
    }

    isSavingDocsRef.current = true;
    try {
      do {
        hasPendingDocsSaveRef.current = false;
        const currentDocs = [...documentsRef.current];
        const res = await StorageService.saveDocuments(currentDocs);
        if (!res.success) {
          throw new Error(res.error || '문서 목록 저장에 실패했습니다.');
        }
      } while (hasPendingDocsSaveRef.current);
    } catch (err: any) {
      console.error('Save docs error:', err);
      setSaveStatus('error');
      setLastSaveError(err?.message || '문서 저장에 실패했습니다.');
    } finally {
      isSavingDocsRef.current = false;
    }
  }, []);

  // Process Folders Queue
  const processFoldersQueue = useCallback(async () => {
    if (isSavingFoldersRef.current) {
      hasPendingFoldersSaveRef.current = true;
      return;
    }
    isSavingFoldersRef.current = true;
    try {
      do {
        hasPendingFoldersSaveRef.current = false;
        const currentFolders = [...foldersRef.current];
        const res = await StorageService.saveFolders(currentFolders);
        if (!res.success) {
          throw new Error(res.error || '폴더 목록 저장에 실패했습니다.');
        }
      } while (hasPendingFoldersSaveRef.current);
    } catch (err: any) {
      console.error('Save folders error:', err);
      setSaveStatus('error');
      setLastSaveError(err?.message || '폴더 저장에 실패했습니다.');
    } finally {
      isSavingFoldersRef.current = false;
    }
  }, []);

  // Process Projects Queue
  const processProjectsQueue = useCallback(async () => {
    if (isSavingProjectsRef.current) {
      hasPendingProjectsSaveRef.current = true;
      return;
    }
    isSavingProjectsRef.current = true;
    try {
      do {
        hasPendingProjectsSaveRef.current = false;
        const currentProjects = [...projectsRef.current];
        const res = await StorageService.saveProjects(currentProjects);
        if (!res.success) {
          throw new Error(res.error || '프로젝트 저장에 실패했습니다.');
        }
      } while (hasPendingProjectsSaveRef.current);
    } catch (err: any) {
      console.error('Save projects error:', err);
      setSaveStatus('error');
      setLastSaveError(err?.message || '프로젝트 저장에 실패했습니다.');
    } finally {
      isSavingProjectsRef.current = false;
    }
  }, []);

  // Retry failed saves manually
  const retryLastSave = useCallback(async () => {
    setSaveStatus('saving');
    setLastSaveError(null);
    try {
      const pRes = await StorageService.savePages(pagesRef.current);
      const dRes = await StorageService.saveDocuments(documentsRef.current);
      const fRes = await StorageService.saveFolders(foldersRef.current);
      const prRes = await StorageService.saveProjects(projectsRef.current);

      if (pRes.success && dRes.success && fRes.success && prRes.success) {
        setSaveStatus('saved');
      } else {
        const errorMsg = pRes.error || dRes.error || fRes.error || prRes.error || '저장 재시도 실패';
        setSaveStatus('error');
        setLastSaveError(errorMsg);
      }
    } catch (err: any) {
      setSaveStatus('error');
      setLastSaveError(err?.message || '저장 재시도 중 오류가 발생했습니다.');
    }
  }, []);

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

  // Backup & Schema Version State (Phase 2)
  const [schemaVersion, setSchemaVersion] = useState<number>(CURRENT_SCHEMA_VERSION);

  // Load from Storage
  useEffect(() => {
    StorageService.init().then((data) => {
      projectsRef.current = data.projects;
      foldersRef.current = data.folders;
      documentsRef.current = data.documents;
      pagesRef.current = data.pages;

      setProjects(data.projects);
      setFolders(data.folders);
      setDocuments(data.documents);
      setPages(data.pages);
      setActiveProjectIdState(data.activeProjectId);
      setSchemaVersion(data.schemaVersion || CURRENT_SCHEMA_VERSION);
      setIsLoaded(true);
    });
  }, []);

  // Export workspace backup as JSON
  const exportBackup = useCallback((customFileName?: string) => {
    const snapshot = BackupService.createSnapshot(
      projectsRef.current,
      foldersRef.current,
      documentsRef.current,
      pagesRef.current,
      activeProjectId,
      schemaVersion
    );
    BackupService.exportToFile(snapshot, customFileName);
  }, [activeProjectId, schemaVersion]);

  // Import and restore workspace from JSON
  const importBackup = useCallback(
    async (jsonString: string): Promise<{ success: boolean; error?: string }> => {
      const valResult = BackupService.validateBackupData(jsonString);
      if (!valResult.isValid || !valResult.snapshot) {
        return { success: false, error: valResult.error || '유효하지 않은 백업 데이터입니다.' };
      }

      const restoreRes = await BackupService.restoreFromSnapshot(
        valResult.snapshot,
        projectsRef.current,
        foldersRef.current,
        documentsRef.current,
        pagesRef.current
      );

      if (!restoreRes.success) {
        return restoreRes;
      }

      // Refresh memory & state
      projectsRef.current = valResult.snapshot.projects;
      foldersRef.current = valResult.snapshot.folders;
      documentsRef.current = valResult.snapshot.documents;
      pagesRef.current = valResult.snapshot.pages;

      setProjects(valResult.snapshot.projects);
      setFolders(valResult.snapshot.folders);
      setDocuments(valResult.snapshot.documents);
      setPages(valResult.snapshot.pages);
      setActiveProjectIdState(valResult.snapshot.activeProjectId);
      setSchemaVersion(valResult.snapshot.schemaVersion || CURRENT_SCHEMA_VERSION);

      return { success: true };
    },
    []
  );

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
      const docPages = pagesRef.current.filter((p) => p.documentId === id).sort((a, b) => a.order - b.order);
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
        const updatedPages = [...pagesRef.current, fallbackPage];
        pagesRef.current = updatedPages;
        setPages(updatedPages);
        processPagesQueue();
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

    const updated = [newProject, ...projectsRef.current];
    projectsRef.current = updated;
    setProjects(updated);
    processProjectsQueue();
    setActiveProject(newProject.id);
    return newProject;
  };

  const deleteProject = async (id: string) => {
    const updatedProjects = projectsRef.current.filter((p) => p.id !== id);
    const updatedFolders = foldersRef.current.filter((f) => f.projectId !== id);
    const updatedDocs = documentsRef.current.filter((d) => d.projectId !== id);
    const docIdsToRemove = new Set(documentsRef.current.filter((d) => d.projectId === id).map((d) => d.id));
    const updatedPages = pagesRef.current.filter((p) => !docIdsToRemove.has(p.documentId));

    projectsRef.current = updatedProjects;
    foldersRef.current = updatedFolders;
    documentsRef.current = updatedDocs;
    pagesRef.current = updatedPages;

    setProjects(updatedProjects);
    setFolders(updatedFolders);
    setDocuments(updatedDocs);
    setPages(updatedPages);

    processProjectsQueue();
    processFoldersQueue();
    processDocsQueue();
    processPagesQueue();

    if (activeProjectId === id) {
      setActiveProject(updatedProjects.length > 0 ? updatedProjects[0].id : null);
    }
  };

  const renameProject = async (id: string, name: string) => {
    if (!name.trim()) return;
    const updated = projectsRef.current.map((p) =>
      p.id === id ? { ...p, name: name.trim(), updatedAt: Date.now() } : p
    );
    projectsRef.current = updated;
    setProjects(updated);
    processProjectsQueue();
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

    const updated = [...foldersRef.current, newFolder];
    foldersRef.current = updated;
    setFolders(updated);
    processFoldersQueue();
    return newFolder;
  };

  const deleteFolder = async (folderId: string) => {
    // Collect all descendant folder IDs to cascade delete
    const folderIdsToDelete = new Set<string>([folderId]);
    let added = true;
    while (added) {
      added = false;
      for (const f of foldersRef.current) {
        if (f.parentFolderId && folderIdsToDelete.has(f.parentFolderId) && !folderIdsToDelete.has(f.id)) {
          folderIdsToDelete.add(f.id);
          added = true;
        }
      }
    }

    const updatedFolders = foldersRef.current.filter((f) => !folderIdsToDelete.has(f.id));
    const docsToDelete = documentsRef.current.filter((d) => d.folderId && folderIdsToDelete.has(d.folderId));
    const docIdsToDelete = new Set(docsToDelete.map((d) => d.id));
    const updatedDocs = documentsRef.current.filter((d) => !docIdsToDelete.has(d.id));
    const updatedPages = pagesRef.current.filter((p) => !docIdsToDelete.has(p.documentId));

    foldersRef.current = updatedFolders;
    documentsRef.current = updatedDocs;
    pagesRef.current = updatedPages;

    setFolders(updatedFolders);
    setDocuments(updatedDocs);
    setPages(updatedPages);

    processFoldersQueue();
    processDocsQueue();
    processPagesQueue();

    // If currently inside deleted folder, navigate to parent or root
    if (activeFolderId && folderIdsToDelete.has(activeFolderId)) {
      const currentFolderObj = foldersRef.current.find((f) => f.id === folderId);
      setActiveFolder(currentFolderObj?.parentFolderId || null);
    }
  };

  const renameFolder = async (folderId: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = foldersRef.current.map((f) =>
      f.id === folderId ? { ...f, name: newName.trim(), updatedAt: Date.now() } : f
    );
    foldersRef.current = updated;
    setFolders(updated);
    processFoldersQueue();
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

    const updatedDocs = [newDoc, ...documentsRef.current];
    const updatedPages = [...pagesRef.current, newPage];

    documentsRef.current = updatedDocs;
    pagesRef.current = updatedPages;

    setDocuments(updatedDocs);
    setPages(updatedPages);

    processDocsQueue();
    processPagesQueue();

    return newDoc;
  };

  const deleteDocument = async (documentId: string) => {
    const updatedDocs = documentsRef.current.filter((d) => d.id !== documentId);
    const updatedPages = pagesRef.current.filter((p) => p.documentId !== documentId);

    documentsRef.current = updatedDocs;
    pagesRef.current = updatedPages;

    setDocuments(updatedDocs);
    setPages(updatedPages);

    processDocsQueue();
    processPagesQueue();

    if (activeDocumentId === documentId) {
      setActiveDocument(null);
    }
  };

  const toggleFavoriteDocument = async (id: string) => {
    const updated = documentsRef.current.map((d) => (d.id === id ? { ...d, isFavorite: !d.isFavorite } : d));
    documentsRef.current = updated;
    setDocuments(updated);
    processDocsQueue();
  };

  const updateDocumentTitle = async (id: string, newTitle: string) => {
    const updated = documentsRef.current.map((d) =>
      d.id === id ? { ...d, title: newTitle, updatedAt: Date.now() } : d
    );
    documentsRef.current = updated;
    setDocuments(updated);
    processDocsQueue();
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

    const updatedPages = [...pagesRef.current, newPage];
    pagesRef.current = updatedPages;
    setPages(updatedPages);
    setActivePageId(newPage.id);
    processPagesQueue();

    updateDocumentTitle(activeDocumentId, activeDocument?.title || '');
    return newPage;
  };

  const renamePage = async (pageId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const updatedPages = pagesRef.current.map((p) =>
      p.id === pageId ? { ...p, title: newTitle.trim(), updatedAt: Date.now() } : p
    );
    pagesRef.current = updatedPages;
    setPages(updatedPages);
    processPagesQueue();
  };

  const deletePage = async (pageId: string): Promise<{ success: boolean; message?: string }> => {
    if (!activeDocumentId) return { success: false, message: '활성 문서가 없습니다.' };

    if (currentDocumentPages.length <= 1) {
      return { success: false, message: '문서에는 최소 1개의 페이지가 유지되어야 합니다.' };
    }

    const remainingPages = currentDocumentPages.filter((p) => p.id !== pageId);
    const updatedAllPages = pagesRef.current.filter((p) => p.id !== pageId);

    pagesRef.current = updatedAllPages;
    setPages(updatedAllPages);
    processPagesQueue();

    if (activePageId === pageId) {
      setActivePageId(remainingPages[0].id);
    }

    return { success: true };
  };

  const updatePageContent = async (pageId: string, content: string): Promise<{ success: boolean; error?: string }> => {
    const targetIdx = pagesRef.current.findIndex((p) => p.id === pageId);
    if (targetIdx === -1) {
      return { success: false, error: '페이지를 찾을 수 없습니다.' };
    }

    const targetDocId = pagesRef.current[targetIdx].documentId;
    const now = Date.now();

    // 1. Pages Ref & State 동기 갱신 (Stale closure 원천 방지)
    const nextPages = pagesRef.current.map((p, idx) =>
      idx === targetIdx ? { ...p, content, updatedAt: now } : p
    );
    pagesRef.current = nextPages;
    setPages(nextPages);

    // 2. Documents Ref & State 동기 갱신
    const nextDocs = documentsRef.current.map((d) =>
      d.id === targetDocId ? { ...d, updatedAt: now } : d
    );
    documentsRef.current = nextDocs;
    setDocuments(nextDocs);

    // 3. 비동기 영속화 큐 처리
    processDocsQueue();
    return await processPagesQueue();
  };

  // Phase 3: Drag and Drop & Hierarchy Management
  const moveItem = async (
    type: 'folder' | 'document',
    itemId: string,
    targetFolderId: string | null
  ): Promise<{ success: boolean; message?: string }> => {
    if (type === 'document') {
      const updatedDocs = documentsRef.current.map((d) =>
        d.id === itemId ? { ...d, folderId: targetFolderId, updatedAt: Date.now() } : d
      );
      documentsRef.current = updatedDocs;
      setDocuments(updatedDocs);
      processDocsQueue();
      return { success: true };
    }

    // If moving a folder
    if (itemId === targetFolderId) {
      return { success: false, message: '폴더를 자기 자신 안으로 이동할 수 없습니다.' };
    }

    if (targetFolderId && isFolderDescendant(foldersRef.current, itemId, targetFolderId)) {
      return { success: false, message: '폴더를 자신의 하위 폴더 안으로 이동할 수 없습니다.' };
    }

    const updatedFolders = foldersRef.current.map((f) =>
      f.id === itemId ? { ...f, parentFolderId: targetFolderId, updatedAt: Date.now() } : f
    );
    foldersRef.current = updatedFolders;
    setFolders(updatedFolders);
    processFoldersQueue();
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
      const updatedFolders = foldersRef.current.map((f) =>
        orderMap.has(f.id) ? { ...f, order: orderMap.get(f.id)! } : f
      );

      foldersRef.current = updatedFolders;
      setFolders(updatedFolders);
      processFoldersQueue();
    } else {
      const currentList = [...currentDocuments];
      const fromIdx = currentList.findIndex((d) => d.id === activeId);
      const toIdx = currentList.findIndex((d) => d.id === overId);
      if (fromIdx < 0 || toIdx < 0) return;

      const [moved] = currentList.splice(fromIdx, 1);
      currentList.splice(toIdx, 0, moved);

      const orderMap = new Map(currentList.map((item, idx) => [item.id, idx]));
      const updatedDocs = documentsRef.current.map((d) =>
        orderMap.has(d.id) ? { ...d, order: orderMap.get(d.id)! } : d
      );

      documentsRef.current = updatedDocs;
      setDocuments(updatedDocs);
      processDocsQueue();
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

        // Save State & Reliability
        saveStatus,
        lastSaveError,
        retryLastSave,

        // Backup & Schema Version (Phase 2)
        schemaVersion,
        exportBackup,
        importBackup,

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
