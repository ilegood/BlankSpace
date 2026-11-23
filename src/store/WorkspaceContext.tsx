import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Project,
  Folder,
  Document,
  DocumentPage,
  UserTemplate,
  DesignPresetItem,
  ViewMode,
  SortOption,
  NavSection,
  TemplateCategoryType,
} from '../types';
import { StorageService } from '../storage';
import { TEMPLATES } from '../templates/templateList';
import { generateId } from '../utils/id';

export type SaveStatus = 'saved' | 'saving' | 'error';

export interface BacklinkInfo {
  sourceDoc: Document;
  sourcePage?: DocumentPage;
  status: 'active' | 'trashed';
}

interface WorkspaceContextType {
  isLoaded: boolean;
  projects: Project[];
  folders: Folder[];
  documents: Document[];
  pages: DocumentPage[];
  userTemplates: UserTemplate[];
  designPresets: DesignPresetItem[];
  defaultTemplateOverrides: Record<string, string>;

  navSection: NavSection;
  activeProjectId: string | null;
  activeFolderId: string | null;
  activeDocumentId: string | null;
  activePageId: string | null;
  editingTemplateId: string | null;

  viewMode: ViewMode;
  sortOption: SortOption;
  globalSearchQuery: string;
  recentDocumentIds: string[];
  isSidebarCollapsed: boolean;
  expandedProjectIds: string[];
  canGoBackDoc: boolean;

  autoSaveEnabled: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  retryLastSave: () => Promise<void>;

  activeProjects: Project[];
  trashedProjects: Project[];
  trashedFolders: Folder[];
  trashedDocuments: Document[];
  activeProject: Project | null;
  activeFolder: Folder | null;
  activeDocument: Document | null;
  activePage: DocumentPage | null;
  folderBreadcrumbs: Folder[];
  currentFolders: Folder[];
  currentDocuments: Document[];
  currentDocumentPages: DocumentPage[];

  isCreateProjectOpen: boolean;
  isCreateFolderOpen: boolean;
  isCreateDocumentOpen: boolean;
  setIsCreateProjectOpen: (open: boolean) => void;
  setIsCreateFolderOpen: (open: boolean) => void;
  setIsCreateDocumentOpen: (open: boolean) => void;

  setNavSection: (section: NavSection) => void;
  openProject: (projectId: string | null) => void;
  openFolder: (folderId: string | null) => void;
  openDocument: (docId: string | null, pageId?: string | null) => void;
  goBackDocument: () => void;
  openTemplateEditor: (templateId: string | null) => void;
  setActivePageId: (pageId: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setSortOption: (opt: SortOption) => void;
  setGlobalSearchQuery: (q: string) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleProjectExpanded: (projectId: string) => void;
  setAutoSaveEnabled: (v: boolean) => void;

  createProject: (name: string, description?: string, coverColor?: string) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  toggleFavoriteProject: (id: string) => void;
  duplicateProject: (id: string) => Project | null;
  moveProjectToTrash: (id: string) => void;
  reorderProjects: (fromId: string, toId: string) => void;

  createFolder: (name: string, description?: string) => Folder;
  updateFolder: (id: string, patch: Partial<Folder>) => void;
  duplicateFolder: (id: string) => Folder | null;
  moveFolderToTrash: (id: string) => { descendantCount: number };
  reorderItems: (kind: 'folder' | 'document', fromId: string, toId: string) => void;

  createDocument: (
    title: string,
    templateType: string,
    category: TemplateCategoryType,
    initialContent?: string
  ) => Document;
  updateDocument: (id: string, patch: Partial<Document>) => void;
  duplicateDocument: (id: string) => Document | null;
  toggleFavoriteDocument: (id: string) => void;
  moveDocumentToTrash: (id: string) => void;
  moveDocumentToFolder: (docId: string, targetFolderId: string | null) => void;
  createPage: (docId: string, title?: string, content?: string) => DocumentPage;
  updatePage: (pageId: string, patch: Partial<DocumentPage>) => void;
  deletePage: (pageId: string) => void;

  restoreItems: (
    items: { type: 'project' | 'folder' | 'document'; id: string }[],
    fallbackTarget?: { projectId: string; folderId: string | null }
  ) => void;
  permanentlyDeleteItems: (items: { type: 'project' | 'folder' | 'document'; id: string }[]) => void;
  emptyTrash: () => void;
  needsRestoreTarget: (type: 'folder' | 'document', id: string) => boolean;

  saveDefaultTemplateOverride: (templateId: string, content: string) => void;
  resetDefaultTemplateOverride: (templateId: string) => void;
  createUserTemplate: (
    name: string,
    description: string,
    category: TemplateCategoryType,
    baseTemplateType: string,
    content: string
  ) => UserTemplate;
  deleteUserTemplate: (id: string) => void;
  saveDesignPreset: (preset: Omit<DesignPresetItem, 'id'>) => DesignPresetItem;
  renameDesignPreset: (id: string, name: string) => void;
  duplicateDesignPreset: (id: string) => DesignPresetItem | null;
  deleteDesignPreset: (id: string) => void;

  getDocumentPath: (doc: Document) => string;
  getDocumentStatus: (docId: string) => 'active' | 'trashed' | 'deleted';
  getBacklinksForDocument: (docId: string) => BacklinkInfo[];
  isFileReferenced: (fileNameOrId: string) => boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [designPresets, setDesignPresets] = useState<DesignPresetItem[]>([]);
  const [defaultTemplateOverrides, setDefaultTemplateOverrides] = useState<Record<string, string>>({});

  const [navSection, setNavSectionState] = useState<NavSection>('main');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [docHistory, setDocHistory] = useState<string[]>([]);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOption, setSortOption] = useState<SortOption>('custom');
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedProjectIds, setExpandedProjectIds] = useState<string[]>(['proj-game-dev']);

  const [recentDocumentIds, setRecentDocumentIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('blankspace_recent_documents');
      return raw ? JSON.parse(raw) : ['doc-char-a', 'doc-world-sheet'];
    } catch {
      return ['doc-char-a', 'doc-world-sheet'];
    }
  });

  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(Date.now());
  const pendingSaveRef = useRef<(() => Promise<{ success: boolean }>) | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateDocumentOpen, setIsCreateDocumentOpen] = useState(false);

  const projectsRef = useRef(projects);
  projectsRef.current = projects;
  const foldersRef = useRef(folders);
  foldersRef.current = folders;
  const documentsRef = useRef(documents);
  documentsRef.current = documents;
  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  useEffect(() => {
    StorageService.init().then((data) => {
      setProjects(data.projects);
      setFolders(data.folders);
      setDocuments(data.documents);
      setPages(data.pages);
      setUserTemplates(data.userTemplates);
      setDesignPresets(data.designPresets);
      setDefaultTemplateOverrides(data.defaultTemplateOverrides);
      setIsLoaded(true);
    });
  }, []);

  const persistWithStatus = useCallback(async (fn: () => Promise<{ success: boolean }>) => {
    pendingSaveRef.current = fn;
    setSaveStatus('saving');
    const res = await fn();
    if (res.success) {
      setSaveStatus('saved');
      setLastSavedAt(Date.now());
      pendingSaveRef.current = null;
    } else {
      setSaveStatus('error');
    }
  }, []);

  const persistDebounced = useCallback(
    (fn: () => Promise<{ success: boolean }>) => {
      pendingSaveRef.current = fn;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        persistWithStatus(fn);
      }, 800);
    },
    [persistWithStatus]
  );

  const retryLastSave = useCallback(async () => {
    if (pendingSaveRef.current) {
      await persistWithStatus(pendingSaveRef.current);
    } else {
      await persistWithStatus(async () => {
        await StorageService.saveProjects(projectsRef.current);
        await StorageService.saveFolders(foldersRef.current);
        await StorageService.saveDocuments(documentsRef.current);
        return StorageService.savePages(pagesRef.current);
      });
    }
  }, [persistWithStatus]);

  const activeProjects = useMemo(
    () =>
      projects
        .filter((p) => !p.deletedAt)
        .sort((a, b) => {
          if (sortOption === 'custom') return (a.order ?? 0) - (b.order ?? 0);
          if (sortOption === 'name-asc') return a.name.localeCompare(b.name, 'ko');
          if (sortOption === 'created-desc') return b.createdAt - a.createdAt;
          return b.updatedAt - a.updatedAt;
        }),
    [projects, sortOption]
  );

  const trashedProjects = useMemo(() => projects.filter((p) => Boolean(p.deletedAt)), [projects]);
  const trashedFolders = useMemo(() => folders.filter((f) => Boolean(f.deletedAt)), [folders]);
  const trashedDocuments = useMemo(() => documents.filter((d) => Boolean(d.deletedAt)), [documents]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId && !p.deletedAt) || null,
    [projects, activeProjectId]
  );

  const activeFolder = useMemo(
    () => folders.find((f) => f.id === activeFolderId && !f.deletedAt) || null,
    [folders, activeFolderId]
  );

  const activeDocument = useMemo(
    () => documents.find((d) => d.id === activeDocumentId && !d.deletedAt) || null,
    [documents, activeDocumentId]
  );

  const folderBreadcrumbs = useMemo(() => {
    if (!activeFolderId) return [];
    const list: Folder[] = [];
    let cur = folders.find((f) => f.id === activeFolderId && !f.deletedAt);
    while (cur) {
      list.unshift(cur);
      cur = cur.parentFolderId
        ? folders.find((f) => f.id === cur!.parentFolderId && !f.deletedAt)
        : undefined;
    }
    return list;
  }, [folders, activeFolderId]);

  const currentFolders = useMemo(() => {
    if (!activeProjectId) return [];
    return folders
      .filter((f) => !f.deletedAt && f.projectId === activeProjectId && f.parentFolderId === activeFolderId)
      .sort((a, b) => a.order - b.order);
  }, [folders, activeProjectId, activeFolderId]);

  const currentDocuments = useMemo(() => {
    if (!activeProjectId) return [];
    return documents
      .filter((d) => !d.deletedAt && d.projectId === activeProjectId && d.folderId === activeFolderId)
      .sort((a, b) => a.order - b.order);
  }, [documents, activeProjectId, activeFolderId]);

  const currentDocumentPages = useMemo(() => {
    if (!activeDocumentId) return [];
    return pages.filter((p) => p.documentId === activeDocumentId).sort((a, b) => a.order - b.order);
  }, [pages, activeDocumentId]);

  const activePage = useMemo(() => {
    if (!activeDocumentId) return null;
    if (activePageId) {
      const found = currentDocumentPages.find((p) => p.id === activePageId);
      if (found) return found;
    }
    return currentDocumentPages[0] || null;
  }, [activeDocumentId, activePageId, currentDocumentPages]);

  const setNavSection = (section: NavSection) => {
    setNavSectionState(section);
    setActiveDocumentId(null);
    setActivePageId(null);
    setEditingTemplateId(null);
    setDocHistory([]);
    if (section === 'main') {
      setActiveProjectId(null);
      setActiveFolderId(null);
    }
  };

  const openProject = (projectId: string | null) => {
    setNavSectionState('main');
    setActiveProjectId(projectId);
    setActiveFolderId(null);
    setActiveDocumentId(null);
    setActivePageId(null);
    setEditingTemplateId(null);
    setDocHistory([]);
    if (projectId) {
      setExpandedProjectIds((prev) => (prev.includes(projectId) ? prev : [...prev, projectId]));
    }
  };

  const openFolder = (folderId: string | null) => {
    if (folderId) {
      const folder = foldersRef.current.find((f) => f.id === folderId && !f.deletedAt);
      if (folder) {
        setActiveProjectId(folder.projectId);
        setExpandedProjectIds((prev) =>
          prev.includes(folder.projectId) ? prev : [...prev, folder.projectId]
        );
      }
    }
    setNavSectionState('main');
    setActiveFolderId(folderId);
    setActiveDocumentId(null);
    setActivePageId(null);
    setEditingTemplateId(null);
    setDocHistory([]);
  };

  const openDocument = (docId: string | null, pageId: string | null = null) => {
    if (!docId) {
      setActiveDocumentId(null);
      setActivePageId(null);
      setEditingTemplateId(null);
      setDocHistory([]);
      return;
    }
    const doc = documentsRef.current.find((d) => d.id === docId && !d.deletedAt);
    if (!doc) return;

    if (activeDocumentId && activeDocumentId !== docId) {
      setDocHistory((prev) => [...prev, activeDocumentId]);
    }

    setNavSectionState('main');
    setActiveProjectId(doc.projectId);
    setActiveFolderId(doc.folderId);
    setActiveDocumentId(docId);
    setEditingTemplateId(null);

    const docPages = pagesRef.current
      .filter((p) => p.documentId === docId)
      .sort((a, b) => a.order - b.order);

    if (pageId && docPages.some((p) => p.id === pageId)) {
      setActivePageId(pageId);
    } else if (docPages.length > 0) {
      setActivePageId(docPages[0].id);
    } else {
      const p: DocumentPage = {
        id: generateId('page'),
        documentId: docId,
        title: doc.title,
        content: '',
        order: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const nextPages = [...pagesRef.current, p];
      setPages(nextPages);
      StorageService.savePages(nextPages);
      setActivePageId(p.id);
    }

    setRecentDocumentIds((prev) => {
      const next = [docId, ...prev.filter((id) => id !== docId)].slice(0, 20);
      try {
        localStorage.setItem('blankspace_recent_documents', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const goBackDocument = () => {
    if (docHistory.length === 0) {
      openDocument(null);
      return;
    }
    const prevId = docHistory[docHistory.length - 1];
    setDocHistory((prev) => prev.slice(0, -1));
    setActiveDocumentId(prevId);
  };

  const openTemplateEditor = (templateId: string | null) => {
    setActiveDocumentId(null);
    setActivePageId(null);
    setEditingTemplateId(templateId);
  };

  const toggleSidebarCollapsed = () => setIsSidebarCollapsed((prev) => !prev);
  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  // Project Mutations
  const createProject = (name: string, description = '프로젝트 설명', coverColor = '#D9D5F3') => {
    const newProj: Project = {
      id: generateId('proj'),
      name: name.trim() || '새 프로젝트',
      description: description.trim() || '프로젝트 설명',
      coverColor,
      order: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const next = [newProj, ...projectsRef.current.map((p, idx) => ({ ...p, order: idx + 1 }))];
    setProjects(next);
    persistWithStatus(() => StorageService.saveProjects(next));
    openProject(newProj.id);
    return newProj;
  };

  const updateProject = (id: string, patch: Partial<Project>) => {
    const next = projectsRef.current.map((p) =>
      p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
    );
    setProjects(next);
    persistWithStatus(() => StorageService.saveProjects(next));
  };

  const toggleFavoriteProject = (id: string) => {
    const proj = projectsRef.current.find((p) => p.id === id);
    if (!proj) return;
    updateProject(id, { isFavorite: !proj.isFavorite });
  };

  const duplicateProject = (id: string) => {
    const src = projectsRef.current.find((p) => p.id === id);
    if (!src) return null;
    const now = Date.now();
    const newProjId = generateId('proj');
    const newProj: Project = {
      ...src,
      id: newProjId,
      name: `${src.name} 복사본`,
      createdAt: now,
      updatedAt: now,
      order: projectsRef.current.length,
    };

    const folderMap = new Map<string, string>();
    const srcFolders = foldersRef.current.filter((f) => f.projectId === id && !f.deletedAt);
    srcFolders.forEach((f) => folderMap.set(f.id, generateId('folder')));

    const clonedFolders: Folder[] = srcFolders.map((f) => ({
      ...f,
      id: folderMap.get(f.id)!,
      projectId: newProjId,
      parentFolderId: f.parentFolderId ? folderMap.get(f.parentFolderId) || null : null,
      createdAt: now,
      updatedAt: now,
    }));

    const docMap = new Map<string, string>();
    const srcDocs = documentsRef.current.filter((d) => d.projectId === id && !d.deletedAt);
    srcDocs.forEach((d) => docMap.set(d.id, generateId('doc')));

    const clonedDocs: Document[] = srcDocs.map((d) => ({
      ...d,
      id: docMap.get(d.id)!,
      projectId: newProjId,
      folderId: d.folderId ? folderMap.get(d.folderId) || null : null,
      createdAt: now,
      updatedAt: now,
    }));

    const clonedPages: DocumentPage[] = [];
    srcDocs.forEach((d) => {
      pagesRef.current
        .filter((p) => p.documentId === d.id)
        .forEach((pg) => {
          let content = pg.content;
          docMap.forEach((newId, oldId) => {
            content = content.split(oldId).join(newId);
          });
          clonedPages.push({
            ...pg,
            id: generateId('page'),
            documentId: docMap.get(d.id)!,
            content,
            createdAt: now,
            updatedAt: now,
          });
        });
    });

    const nextProjs = [...projectsRef.current, newProj];
    const nextFolders = [...foldersRef.current, ...clonedFolders];
    const nextDocs = [...documentsRef.current, ...clonedDocs];
    const nextPages = [...pagesRef.current, ...clonedPages];

    setProjects(nextProjs);
    setFolders(nextFolders);
    setDocuments(nextDocs);
    setPages(nextPages);
    persistWithStatus(async () => {
      await StorageService.saveProjects(nextProjs);
      await StorageService.saveFolders(nextFolders);
      await StorageService.saveDocuments(nextDocs);
      return StorageService.savePages(nextPages);
    });
    return newProj;
  };

  const reorderProjects = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const list = [...activeProjects];
    const fromIdx = list.findIndex((p) => p.id === fromId);
    const toIdx = list.findIndex((p) => p.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    const orderMap = new Map(list.map((p, i) => [p.id, i]));
    const next = projectsRef.current.map((p) =>
      orderMap.has(p.id) ? { ...p, order: orderMap.get(p.id)! } : p
    );
    setSortOption('custom');
    setProjects(next);
    persistWithStatus(() => StorageService.saveProjects(next));
  };

  const moveProjectToTrash = (id: string) => {
    const deletedAt = Date.now();
    const nextProjs = projectsRef.current.map((p) => (p.id === id ? { ...p, deletedAt } : p));
    const nextFolders = foldersRef.current.map((f) =>
      f.projectId === id && !f.deletedAt ? { ...f, deletedAt } : f
    );
    const nextDocs = documentsRef.current.map((d) =>
      d.projectId === id && !d.deletedAt ? { ...d, deletedAt } : d
    );
    setProjects(nextProjs);
    setFolders(nextFolders);
    setDocuments(nextDocs);
    persistWithStatus(async () => {
      await StorageService.saveProjects(nextProjs);
      await StorageService.saveFolders(nextFolders);
      return StorageService.saveDocuments(nextDocs);
    });
    if (activeProjectId === id) {
      openProject(null);
    }
  };

  // Folder Mutations
  const createFolder = (name: string, description = '폴더 설명') => {
    if (!activeProjectId) throw new Error('No active project');
    const newFolder: Folder = {
      id: generateId('folder'),
      projectId: activeProjectId,
      parentFolderId: activeFolderId,
      name: name.trim() || '새 폴더',
      description: description.trim() || '폴더 설명',
      order: currentFolders.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const next = [...foldersRef.current, newFolder];
    setFolders(next);
    persistWithStatus(() => StorageService.saveFolders(next));
    return newFolder;
  };

  const updateFolder = (id: string, patch: Partial<Folder>) => {
    const next = foldersRef.current.map((f) =>
      f.id === id ? { ...f, ...patch, updatedAt: Date.now() } : f
    );
    setFolders(next);
    persistWithStatus(() => StorageService.saveFolders(next));
  };

  const collectDescendantFolderIds = (rootId: string): Set<string> => {
    const ids = new Set<string>([rootId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const f of foldersRef.current) {
        if (f.parentFolderId && ids.has(f.parentFolderId) && !ids.has(f.id)) {
          ids.add(f.id);
          changed = true;
        }
      }
    }
    return ids;
  };

  const duplicateFolder = (id: string) => {
    const src = foldersRef.current.find((f) => f.id === id);
    if (!src) return null;
    const now = Date.now();
    const descendantIds = collectDescendantFolderIds(id);
    const folderMap = new Map<string, string>();
    descendantIds.forEach((fid) => folderMap.set(fid, generateId('folder')));

    const srcFolders = foldersRef.current.filter((f) => descendantIds.has(f.id) && !f.deletedAt);
    const clonedFolders: Folder[] = srcFolders.map((f) => ({
      ...f,
      id: folderMap.get(f.id)!,
      name: f.id === id ? `${f.name} 복사본` : f.name,
      parentFolderId: f.id === id ? src.parentFolderId : folderMap.get(f.parentFolderId!) || null,
      createdAt: now,
      updatedAt: now,
    }));

    const srcDocs = documentsRef.current.filter(
      (d) => d.folderId && descendantIds.has(d.folderId) && !d.deletedAt
    );
    const docMap = new Map<string, string>();
    srcDocs.forEach((d) => docMap.set(d.id, generateId('doc')));

    const clonedDocs: Document[] = srcDocs.map((d) => ({
      ...d,
      id: docMap.get(d.id)!,
      folderId: folderMap.get(d.folderId!) || null,
      createdAt: now,
      updatedAt: now,
    }));

    const clonedPages: DocumentPage[] = [];
    srcDocs.forEach((d) => {
      pagesRef.current
        .filter((p) => p.documentId === d.id)
        .forEach((pg) => {
          let content = pg.content;
          docMap.forEach((newId, oldId) => {
            content = content.split(oldId).join(newId);
          });
          clonedPages.push({
            ...pg,
            id: generateId('page'),
            documentId: docMap.get(d.id)!,
            content,
            createdAt: now,
            updatedAt: now,
          });
        });
    });

    const nextFolders = [...foldersRef.current, ...clonedFolders];
    const nextDocs = [...documentsRef.current, ...clonedDocs];
    const nextPages = [...pagesRef.current, ...clonedPages];
    setFolders(nextFolders);
    setDocuments(nextDocs);
    setPages(nextPages);
    persistWithStatus(async () => {
      await StorageService.saveFolders(nextFolders);
      await StorageService.saveDocuments(nextDocs);
      return StorageService.savePages(nextPages);
    });
    return clonedFolders.find((f) => f.id === folderMap.get(id)) || null;
  };

  const moveFolderToTrash = (id: string) => {
    const deletedAt = Date.now();
    const folderIds = collectDescendantFolderIds(id);
    const descendantDocs = documentsRef.current.filter(
      (d) => d.folderId && folderIds.has(d.folderId) && !d.deletedAt
    );
    const descendantCount = folderIds.size - 1 + descendantDocs.length;

    const nextFolders = foldersRef.current.map((f) =>
      folderIds.has(f.id) && !f.deletedAt ? { ...f, deletedAt } : f
    );
    const nextDocs = documentsRef.current.map((d) =>
      d.folderId && folderIds.has(d.folderId) && !d.deletedAt ? { ...d, deletedAt } : d
    );
    setFolders(nextFolders);
    setDocuments(nextDocs);
    persistWithStatus(async () => {
      await StorageService.saveFolders(nextFolders);
      return StorageService.saveDocuments(nextDocs);
    });
    if (activeFolderId && folderIds.has(activeFolderId)) {
      const f = foldersRef.current.find((item) => item.id === id);
      openFolder(f?.parentFolderId || null);
    }
    return { descendantCount };
  };

  const reorderItems = (kind: 'folder' | 'document', fromId: string, toId: string) => {
    if (fromId === toId) return;
    if (kind === 'folder') {
      const list = [...currentFolders];
      const fi = list.findIndex((f) => f.id === fromId);
      const ti = list.findIndex((f) => f.id === toId);
      if (fi < 0 || ti < 0) return;
      const [moved] = list.splice(fi, 1);
      list.splice(ti, 0, moved);
      const map = new Map(list.map((f, i) => [f.id, i]));
      const next = foldersRef.current.map((f) => (map.has(f.id) ? { ...f, order: map.get(f.id)! } : f));
      setFolders(next);
      persistWithStatus(() => StorageService.saveFolders(next));
    } else {
      const list = [...currentDocuments];
      const fi = list.findIndex((d) => d.id === fromId);
      const ti = list.findIndex((d) => d.id === toId);
      if (fi < 0 || ti < 0) return;
      const [moved] = list.splice(fi, 1);
      list.splice(ti, 0, moved);
      const map = new Map(list.map((d, i) => [d.id, i]));
      const next = documentsRef.current.map((d) => (map.has(d.id) ? { ...d, order: map.get(d.id)! } : d));
      setDocuments(next);
      persistWithStatus(() => StorageService.saveDocuments(next));
    }
  };

  // Document & Page Mutations
  const createDocument = (
    title: string,
    templateType: string,
    category: TemplateCategoryType,
    initialContent?: string
  ) => {
    if (!activeProjectId) throw new Error('No active project');
    const tpl = TEMPLATES.find((t) => t.id === templateType);
    const docId = generateId('doc');
    const newDoc: Document = {
      id: docId,
      projectId: activeProjectId,
      folderId: activeFolderId,
      title: title.trim() || tpl?.defaultTitle || '새 문서',
      description: tpl?.description || '',
      tags: [],
      templateType,
      category,
      docKind: tpl?.docKind || 'template',
      isFavorite: false,
      order: currentDocuments.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const overrideContent = defaultTemplateOverrides[templateType];
    const resolvedContent = initialContent ?? overrideContent ?? tpl?.defaultContent ?? '';
    const newPage: DocumentPage = {
      id: generateId('page'),
      documentId: docId,
      title: newDoc.title,
      content: resolvedContent,
      order: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const nextDocs = [...documentsRef.current, newDoc];
    const nextPages = [...pagesRef.current, newPage];
    setDocuments(nextDocs);
    setPages(nextPages);
    persistWithStatus(async () => {
      await StorageService.saveDocuments(nextDocs);
      return StorageService.savePages(nextPages);
    });
    return newDoc;
  };

  const updateDocument = (id: string, patch: Partial<Document>) => {
    const next = documentsRef.current.map((d) =>
      d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d
    );
    setDocuments(next);
    persistWithStatus(() => StorageService.saveDocuments(next));
  };

  const duplicateDocument = (id: string) => {
    const src = documentsRef.current.find((d) => d.id === id);
    if (!src) return null;
    const now = Date.now();
    const newDocId = generateId('doc');
    const clonedDoc: Document = {
      ...src,
      id: newDocId,
      title: `${src.title} 복사본`,
      createdAt: now,
      updatedAt: now,
      order: currentDocuments.length,
    };
    const clonedPages = pagesRef.current
      .filter((p) => p.documentId === id)
      .map((pg) => ({
        ...pg,
        id: generateId('page'),
        documentId: newDocId,
        createdAt: now,
        updatedAt: now,
      }));
    const nextDocs = [...documentsRef.current, clonedDoc];
    const nextPages = [...pagesRef.current, ...clonedPages];
    setDocuments(nextDocs);
    setPages(nextPages);
    persistWithStatus(async () => {
      await StorageService.saveDocuments(nextDocs);
      return StorageService.savePages(nextPages);
    });
    return clonedDoc;
  };

  const toggleFavoriteDocument = (id: string) => {
    const doc = documentsRef.current.find((d) => d.id === id);
    if (!doc) return;
    updateDocument(id, { isFavorite: !doc.isFavorite });
  };

  const moveDocumentToTrash = (id: string) => {
    const deletedAt = Date.now();
    const next = documentsRef.current.map((d) => (d.id === id ? { ...d, deletedAt } : d));
    setDocuments(next);
    persistWithStatus(() => StorageService.saveDocuments(next));
    if (activeDocumentId === id) {
      setActiveDocumentId(null);
      setActivePageId(null);
    }
  };

  const moveDocumentToFolder = (docId: string, targetFolderId: string | null) => {
    updateDocument(docId, { folderId: targetFolderId });
  };

  const createPage = (docId: string, title = '새 페이지', content = '') => {
    const existing = pagesRef.current.filter((p) => p.documentId === docId);
    const newPage: DocumentPage = {
      id: generateId('page'),
      documentId: docId,
      title,
      content,
      order: existing.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const next = [...pagesRef.current, newPage];
    setPages(next);
    persistWithStatus(() => StorageService.savePages(next));
    setActivePageId(newPage.id);
    return newPage;
  };

  const updatePage = (pageId: string, patch: Partial<DocumentPage>) => {
    const nextPages = pagesRef.current.map((p) =>
      p.id === pageId ? { ...p, ...patch, updatedAt: Date.now() } : p
    );
    setPages(nextPages);

    const targetPage = nextPages.find((p) => p.id === pageId);
    if (targetPage) {
      const nextDocs = documentsRef.current.map((d) =>
        d.id === targetPage.documentId ? { ...d, updatedAt: Date.now() } : d
      );
      setDocuments(nextDocs);
      if (autoSaveEnabled) {
        persistDebounced(async () => {
          await StorageService.saveDocuments(nextDocs);
          return StorageService.savePages(nextPages);
        });
      }
    }
  };

  const deletePage = (pageId: string) => {
    const next = pagesRef.current.filter((p) => p.id !== pageId);
    setPages(next);
    persistWithStatus(() => StorageService.savePages(next));
    if (activePageId === pageId) {
      setActivePageId(null);
    }
  };

  // Trash Operations
  const needsRestoreTarget = (type: 'folder' | 'document', id: string): boolean => {
    if (type === 'folder') {
      const folder = foldersRef.current.find((f) => f.id === id);
      if (!folder) return true;
      const proj = projectsRef.current.find((p) => p.id === folder.projectId && !p.deletedAt);
      if (!proj) return true;
      if (folder.parentFolderId) {
        const parent = foldersRef.current.find((f) => f.id === folder.parentFolderId && !f.deletedAt);
        if (!parent) return true;
      }
      return false;
    }
    const doc = documentsRef.current.find((d) => d.id === id);
    if (!doc) return true;
    const proj = projectsRef.current.find((p) => p.id === doc.projectId && !p.deletedAt);
    if (!proj) return true;
    if (doc.folderId) {
      const folder = foldersRef.current.find((f) => f.id === doc.folderId && !f.deletedAt);
      if (!folder) return true;
    }
    return false;
  };

  const restoreItems = (
    items: { type: 'project' | 'folder' | 'document'; id: string }[],
    fallbackTarget?: { projectId: string; folderId: string | null }
  ) => {
    const projRestore = new Set<string>();
    const folderRestore = new Set<string>();
    const docRestore = new Set<string>();

    for (const item of items) {
      if (item.type === 'project') {
        projRestore.add(item.id);
        foldersRef.current
          .filter((f) => f.projectId === item.id && f.deletedAt)
          .forEach((f) => folderRestore.add(f.id));
        documentsRef.current
          .filter((d) => d.projectId === item.id && d.deletedAt)
          .forEach((d) => docRestore.add(d.id));
      } else if (item.type === 'folder') {
        const descendants = collectDescendantFolderIds(item.id);
        descendants.forEach((fid) => folderRestore.add(fid));
        documentsRef.current
          .filter((d) => d.folderId && descendants.has(d.folderId) && d.deletedAt)
          .forEach((d) => docRestore.add(d.id));
      } else {
        docRestore.add(item.id);
      }
    }

    const nextProjs = projectsRef.current.map((p) =>
      projRestore.has(p.id) ? { ...p, deletedAt: null } : p
    );
    const nextFolders = foldersRef.current.map((f) => {
      if (!folderRestore.has(f.id)) return f;
      if (fallbackTarget && items.some((i) => i.type === 'folder' && i.id === f.id)) {
        return {
          ...f,
          deletedAt: null,
          projectId: fallbackTarget.projectId,
          parentFolderId: fallbackTarget.folderId,
        };
      }
      return { ...f, deletedAt: null };
    });
    const nextDocs = documentsRef.current.map((d) => {
      if (!docRestore.has(d.id)) return d;
      if (fallbackTarget && items.some((i) => i.type === 'document' && i.id === d.id)) {
        return {
          ...d,
          deletedAt: null,
          projectId: fallbackTarget.projectId,
          folderId: fallbackTarget.folderId,
        };
      }
      return { ...d, deletedAt: null };
    });

    setProjects(nextProjs);
    setFolders(nextFolders);
    setDocuments(nextDocs);
    persistWithStatus(async () => {
      await StorageService.saveProjects(nextProjs);
      await StorageService.saveFolders(nextFolders);
      return StorageService.saveDocuments(nextDocs);
    });
  };

  const permanentlyDeleteItems = (
    items: { type: 'project' | 'folder' | 'document'; id: string }[]
  ) => {
    const projDel = new Set(items.filter((i) => i.type === 'project').map((i) => i.id));
    const folderDel = new Set<string>();
    items
      .filter((i) => i.type === 'folder')
      .forEach((i) => collectDescendantFolderIds(i.id).forEach((fid) => folderDel.add(fid)));

    const docDel = new Set(items.filter((i) => i.type === 'document').map((i) => i.id));
    documentsRef.current.forEach((d) => {
      if (projDel.has(d.projectId) || (d.folderId && folderDel.has(d.folderId))) {
        docDel.add(d.id);
      }
    });

    const nextProjs = projectsRef.current.filter((p) => !projDel.has(p.id));
    const nextFolders = foldersRef.current.filter(
      (f) => !projDel.has(f.projectId) && !folderDel.has(f.id)
    );
    const nextDocs = documentsRef.current.filter((d) => !docDel.has(d.id));
    const nextPages = pagesRef.current.filter((p) => !docDel.has(p.documentId));

    setProjects(nextProjs);
    setFolders(nextFolders);
    setDocuments(nextDocs);
    setPages(nextPages);
    persistWithStatus(async () => {
      await StorageService.saveProjects(nextProjs);
      await StorageService.saveFolders(nextFolders);
      await StorageService.saveDocuments(nextDocs);
      return StorageService.savePages(nextPages);
    });
  };

  const emptyTrash = () => {
    const trashedDocIds = new Set(documentsRef.current.filter((d) => d.deletedAt).map((d) => d.id));
    const nextProjs = projectsRef.current.filter((p) => !p.deletedAt);
    const nextFolders = foldersRef.current.filter((f) => !f.deletedAt);
    const nextDocs = documentsRef.current.filter((d) => !d.deletedAt);
    const nextPages = pagesRef.current.filter((p) => !trashedDocIds.has(p.documentId));

    setProjects(nextProjs);
    setFolders(nextFolders);
    setDocuments(nextDocs);
    setPages(nextPages);
    persistWithStatus(async () => {
      await StorageService.saveProjects(nextProjs);
      await StorageService.saveFolders(nextFolders);
      await StorageService.saveDocuments(nextDocs);
      return StorageService.savePages(nextPages);
    });
  };

  const saveDefaultTemplateOverride = (templateId: string, content: string) => {
    const next = { ...defaultTemplateOverrides, [templateId]: content };
    setDefaultTemplateOverrides(next);
    persistWithStatus(() => StorageService.saveDefaultTemplateOverrides(next));
  };

  const resetDefaultTemplateOverride = (templateId: string) => {
    const next = { ...defaultTemplateOverrides };
    delete next[templateId];
    setDefaultTemplateOverrides(next);
    persistWithStatus(() => StorageService.saveDefaultTemplateOverrides(next));
  };

  const createUserTemplate = (
    name: string,
    description: string,
    category: TemplateCategoryType,
    baseTemplateType: string,
    content: string
  ) => {
    const tpl: UserTemplate = {
      id: generateId('utpl'),
      name: name.trim() || '사용자 템플릿',
      description: description.trim(),
      category,
      baseTemplateType,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const next = [...userTemplates, tpl];
    setUserTemplates(next);
    persistWithStatus(() => StorageService.saveUserTemplates(next));
    return tpl;
  };

  const deleteUserTemplate = (id: string) => {
    const next = userTemplates.filter((t) => t.id !== id);
    setUserTemplates(next);
    persistWithStatus(() => StorageService.saveUserTemplates(next));
  };

  const saveDesignPreset = (preset: Omit<DesignPresetItem, 'id'>) => {
    const item: DesignPresetItem = { ...preset, id: generateId('preset'), isBuiltin: false };
    const next = [...designPresets, item];
    setDesignPresets(next);
    persistWithStatus(() => StorageService.saveDesignPresets(next));
    return item;
  };

  const renameDesignPreset = (id: string, name: string) => {
    const next = designPresets.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p));
    setDesignPresets(next);
    persistWithStatus(() => StorageService.saveDesignPresets(next));
  };

  const duplicateDesignPreset = (id: string) => {
    const src = designPresets.find((p) => p.id === id);
    if (!src) return null;
    return saveDesignPreset({
      ...src,
      name: `${src.name} 복사본`,
      isBuiltin: false,
    });
  };

  const deleteDesignPreset = (id: string) => {
    const next = designPresets.filter((p) => p.id !== id);
    setDesignPresets(next);
    persistWithStatus(() => StorageService.saveDesignPresets(next));
  };

  const getDocumentPath = (doc: Document): string => {
    const proj = projectsRef.current.find((p) => p.id === doc.projectId);
    const parts: string[] = [proj?.name || '프로젝트'];
    if (doc.folderId) {
      const fChain: string[] = [];
      let cur = foldersRef.current.find((f) => f.id === doc.folderId);
      while (cur) {
        fChain.unshift(cur.name);
        cur = cur.parentFolderId
          ? foldersRef.current.find((f) => f.id === cur!.parentFolderId)
          : undefined;
      }
      parts.push(...fChain);
    }
    return parts.join(' / ');
  };

  const getDocumentStatus = (docId: string): 'active' | 'trashed' | 'deleted' => {
    const doc = documentsRef.current.find((d) => d.id === docId);
    if (!doc) return 'deleted';
    return doc.deletedAt ? 'trashed' : 'active';
  };

  const getBacklinksForDocument = (docId: string): BacklinkInfo[] => {
    const results: BacklinkInfo[] = [];
    const seen = new Set<string>();
    const token = `#blankspace-doc:${docId}`;

    for (const d of documentsRef.current) {
      if (d.id === docId) continue;
      const docPages = pagesRef.current.filter((p) => p.documentId === d.id);
      for (const p of docPages) {
        if (
          p.content &&
          (p.content.includes(token) || p.content.includes(`"${docId}"`)) &&
          !seen.has(d.id)
        ) {
          seen.add(d.id);
          results.push({
            sourceDoc: d,
            sourcePage: p,
            status: d.deletedAt ? 'trashed' : 'active',
          });
        }
      }
    }
    return results;
  };

  const isFileReferenced = (fileNameOrId: string): boolean => {
    if (!fileNameOrId) return false;
    return pagesRef.current.some(
      (p) => p.documentId !== activeDocumentId && p.content.includes(fileNameOrId)
    );
  };

  return (
    <WorkspaceContext.Provider
      value={{
        isLoaded,
        projects,
        folders,
        documents,
        pages,
        userTemplates,
        designPresets,
        defaultTemplateOverrides,
        navSection,
        activeProjectId,
        activeFolderId,
        activeDocumentId,
        activePageId,
        editingTemplateId,
        viewMode,
        sortOption,
        globalSearchQuery,
        recentDocumentIds,
        isSidebarCollapsed,
        expandedProjectIds,
        canGoBackDoc: docHistory.length > 0,
        autoSaveEnabled,
        saveStatus,
        lastSavedAt,
        retryLastSave,
        activeProjects,
        trashedProjects,
        trashedFolders,
        trashedDocuments,
        activeProject,
        activeFolder,
        activeDocument,
        activePage,
        folderBreadcrumbs,
        currentFolders,
        currentDocuments,
        currentDocumentPages,
        isCreateProjectOpen,
        isCreateFolderOpen,
        isCreateDocumentOpen,
        setIsCreateProjectOpen,
        setIsCreateFolderOpen,
        setIsCreateDocumentOpen,
        setNavSection,
        openProject,
        openFolder,
        openDocument,
        goBackDocument,
        openTemplateEditor,
        setActivePageId,
        setViewMode,
        setSortOption,
        setGlobalSearchQuery,
        toggleSidebarCollapsed,
        setSidebarCollapsed: setIsSidebarCollapsed,
        toggleProjectExpanded,
        setAutoSaveEnabled,
        createProject,
        updateProject,
        toggleFavoriteProject,
        duplicateProject,
        moveProjectToTrash,
        reorderProjects,
        createFolder,
        updateFolder,
        duplicateFolder,
        moveFolderToTrash,
        reorderItems,
        createDocument,
        updateDocument,
        duplicateDocument,
        toggleFavoriteDocument,
        moveDocumentToTrash,
        moveDocumentToFolder,
        createPage,
        updatePage,
        deletePage,
        restoreItems,
        permanentlyDeleteItems,
        emptyTrash,
        needsRestoreTarget,
        saveDefaultTemplateOverride,
        resetDefaultTemplateOverride,
        createUserTemplate,
        deleteUserTemplate,
        saveDesignPreset,
        renameDesignPreset,
        duplicateDesignPreset,
        deleteDesignPreset,
        getDocumentPath,
        getDocumentStatus,
        getBacklinksForDocument,
        isFileReferenced,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
};
