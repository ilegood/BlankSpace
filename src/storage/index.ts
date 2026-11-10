import { get, set, clear } from 'idb-keyval';
import { Project, Folder, Document, DocumentPage } from '../types';
import { INITIAL_PROJECTS, INITIAL_FOLDERS, INITIAL_DOCUMENTS, INITIAL_PAGES } from './initialData';

// v2 storage keys (clean state without default sample items)
const KEYS = {
  PROJECTS: 'blankspace_v2_projects',
  FOLDERS: 'blankspace_v2_folders',
  DOCUMENTS: 'blankspace_v2_documents',
  PAGES: 'blankspace_v2_pages',
  ACTIVE_PROJECT: 'blankspace_v2_active_project_id',
  INITIALIZED: 'blankspace_v2_initialized',
};

// Fallback to localStorage
function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function safeLocalStorageSet(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
}

export const StorageService = {
  async init(): Promise<{
    projects: Project[];
    folders: Folder[];
    documents: Document[];
    pages: DocumentPage[];
    activeProjectId: string | null;
  }> {
    try {
      // Clear legacy sample keys if any exist
      const legacyInit = localStorage.getItem('blankspace_projects');
      if (legacyInit && legacyInit.includes('proj-aether')) {
        localStorage.removeItem('blankspace_projects');
        localStorage.removeItem('blankspace_folders');
        localStorage.removeItem('blankspace_documents');
        localStorage.removeItem('blankspace_pages');
        localStorage.removeItem('blankspace_active_project_id');
        try {
          await clear();
        } catch {
          // ignore
        }
      }

      const isInitialized = await get<boolean>(KEYS.INITIALIZED);

      let projects = await get<Project[]>(KEYS.PROJECTS);
      let folders = await get<Folder[]>(KEYS.FOLDERS);
      let documents = await get<Document[]>(KEYS.DOCUMENTS);
      let pages = await get<DocumentPage[]>(KEYS.PAGES);
      let activeProjectId = await get<string | null>(KEYS.ACTIVE_PROJECT);

      // If first run on v2, initialize with completely empty state
      if (!isInitialized) {
        projects = INITIAL_PROJECTS; // []
        folders = INITIAL_FOLDERS;   // []
        documents = INITIAL_DOCUMENTS; // []
        pages = INITIAL_PAGES;       // []
        activeProjectId = null;

        await set(KEYS.PROJECTS, projects);
        await set(KEYS.FOLDERS, folders);
        await set(KEYS.DOCUMENTS, documents);
        await set(KEYS.PAGES, pages);
        await set(KEYS.ACTIVE_PROJECT, null);
        await set(KEYS.INITIALIZED, true);

        safeLocalStorageSet(KEYS.PROJECTS, projects);
        safeLocalStorageSet(KEYS.INITIALIZED, true);
      }

      return {
        projects: projects || [],
        folders: folders || [],
        documents: documents || [],
        pages: pages || [],
        activeProjectId: null, // 최초 진입 시 항상 홈 화면(프로젝트 목록 화면)으로 진입
      };
    } catch (e) {
      console.warn('IndexedDB error, falling back to empty state', e);
      return {
        projects: safeLocalStorageGet(KEYS.PROJECTS, []),
        folders: safeLocalStorageGet(KEYS.FOLDERS, []),
        documents: safeLocalStorageGet(KEYS.DOCUMENTS, []),
        pages: safeLocalStorageGet(KEYS.PAGES, []),
        activeProjectId: null,
      };
    }
  },

  async saveProjects(projects: Project[]) {
    try {
      await set(KEYS.PROJECTS, projects);
    } catch {
      safeLocalStorageSet(KEYS.PROJECTS, projects);
    }
  },

  async saveFolders(folders: Folder[]) {
    try {
      await set(KEYS.FOLDERS, folders);
    } catch {
      safeLocalStorageSet(KEYS.FOLDERS, folders);
    }
  },

  async saveDocuments(documents: Document[]) {
    try {
      await set(KEYS.DOCUMENTS, documents);
    } catch {
      safeLocalStorageSet(KEYS.DOCUMENTS, documents);
    }
  },

  async savePages(pages: DocumentPage[]) {
    try {
      await set(KEYS.PAGES, pages);
    } catch {
      safeLocalStorageSet(KEYS.PAGES, pages);
    }
  },

  async saveActiveProjectId(id: string | null) {
    try {
      await set(KEYS.ACTIVE_PROJECT, id);
    } catch {
      safeLocalStorageSet(KEYS.ACTIVE_PROJECT, id);
    }
  },

  async clearAll() {
    try {
      await clear();
    } catch {
      // ignore
    }
    localStorage.clear();
  }
};
