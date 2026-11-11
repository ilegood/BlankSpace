import { get, set, clear } from 'idb-keyval';
import { Project, Folder, Document, DocumentPage } from '../types';
import { INITIAL_PROJECTS, INITIAL_FOLDERS, INITIAL_DOCUMENTS, INITIAL_PAGES } from './initialData';
import { CURRENT_SCHEMA_VERSION, MigrationService, RawStorageData } from './migrationService';
import { BackupService } from './backupService';
export { BackupService } from './backupService';
export { MigrationService, CURRENT_SCHEMA_VERSION } from './migrationService';
export { FileStorageService } from './fileStorageService';

// v2 storage keys (clean state without default sample items)
const KEYS = {
  PROJECTS: 'blankspace_v2_projects',
  FOLDERS: 'blankspace_v2_folders',
  DOCUMENTS: 'blankspace_v2_documents',
  PAGES: 'blankspace_v2_pages',
  ACTIVE_PROJECT: 'blankspace_v2_active_project_id',
  INITIALIZED: 'blankspace_v2_initialized',
  SCHEMA_VERSION: 'blankspace_schema_version',
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

function safeLocalStorageSet(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`LocalStorage save error for key "${key}":`, err);
    return false;
  }
}

export interface StorageOperationResult {
  success: boolean;
  error?: string;
}

async function persistItem<T>(key: string, value: T): Promise<StorageOperationResult> {
  if (value === undefined || value === null) {
    return { success: false, error: `Cannot save undefined or null value for key "${key}"` };
  }

  // 1. Try IndexedDB
  try {
    await set(key, value);
    return { success: true };
  } catch (idbErr: any) {
    console.warn(`IndexedDB save failed for "${key}", attempting localStorage fallback:`, idbErr);
    
    // 2. Fallback to LocalStorage
    const lsSuccess = safeLocalStorageSet(key, value);
    if (lsSuccess) {
      return { success: true };
    }

    const errorMsg = idbErr?.message || 'Storage write failed on both IndexedDB and LocalStorage';
    console.error(`Storage critical error for "${key}":`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

export const StorageService = {
  async init(): Promise<{
    projects: Project[];
    folders: Folder[];
    documents: Document[];
    pages: DocumentPage[];
    activeProjectId: string | null;
    schemaVersion: number;
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
      let schemaVersion = (await get<number>(KEYS.SCHEMA_VERSION)) || 1;

      // If first run on v2, initialize with completely empty state
      if (!isInitialized) {
        projects = INITIAL_PROJECTS; // []
        folders = INITIAL_FOLDERS;   // []
        documents = INITIAL_DOCUMENTS; // []
        pages = INITIAL_PAGES;       // []
        activeProjectId = null;
        schemaVersion = CURRENT_SCHEMA_VERSION;

        await set(KEYS.PROJECTS, projects);
        await set(KEYS.FOLDERS, folders);
        await set(KEYS.DOCUMENTS, documents);
        await set(KEYS.PAGES, pages);
        await set(KEYS.ACTIVE_PROJECT, null);
        await set(KEYS.INITIALIZED, true);
        await set(KEYS.SCHEMA_VERSION, schemaVersion);

        safeLocalStorageSet(KEYS.PROJECTS, projects);
        safeLocalStorageSet(KEYS.INITIALIZED, true);
        safeLocalStorageSet(KEYS.SCHEMA_VERSION, schemaVersion);
      } else {
        // Run migration pipeline if current schema is older than latest
        if (schemaVersion < CURRENT_SCHEMA_VERSION) {
          console.log(`[StorageService] Schema upgrade required: v${schemaVersion} -> v${CURRENT_SCHEMA_VERSION}`);
          const rawData: RawStorageData = {
            schemaVersion,
            projects: projects || [],
            folders: folders || [],
            documents: documents || [],
            pages: pages || [],
            activeProjectId: activeProjectId ?? null,
          };

          // 1. Create safety snapshot before migration
          const preMigrationSnapshot = BackupService.createSnapshot(
            rawData.projects,
            rawData.folders,
            rawData.documents,
            rawData.pages,
            rawData.activeProjectId,
            schemaVersion
          );
          BackupService.saveAutoSnapshot(preMigrationSnapshot, 'blankspace_backup_pre_migration');

          // 2. Execute migrations
          const { data: migratedData } = await MigrationService.runMigrations(rawData, schemaVersion);

          // 3. Persist migrated data
          projects = migratedData.projects;
          folders = migratedData.folders;
          documents = migratedData.documents;
          pages = migratedData.pages;
          schemaVersion = migratedData.schemaVersion;

          await persistItem(KEYS.PROJECTS, projects);
          await persistItem(KEYS.FOLDERS, folders);
          await persistItem(KEYS.DOCUMENTS, documents);
          await persistItem(KEYS.PAGES, pages);
          await persistItem(KEYS.SCHEMA_VERSION, schemaVersion);
        }
      }

      const finalProjects = projects || [];
      const finalFolders = folders || [];
      const finalDocs = documents || [];
      const finalPages = pages || [];

      // Create an automatic recovery snapshot on startup
      const startupSnapshot = BackupService.createSnapshot(
        finalProjects,
        finalFolders,
        finalDocs,
        finalPages,
        null,
        schemaVersion
      );
      BackupService.saveAutoSnapshot(startupSnapshot);

      return {
        projects: finalProjects,
        folders: finalFolders,
        documents: finalDocs,
        pages: finalPages,
        activeProjectId: null, // 최초 진입 시 항상 홈 화면(프로젝트 목록 화면)으로 진입
        schemaVersion,
      };
    } catch (e) {
      console.warn('IndexedDB error, falling back to safe local state', e);
      return {
        projects: safeLocalStorageGet(KEYS.PROJECTS, []),
        folders: safeLocalStorageGet(KEYS.FOLDERS, []),
        documents: safeLocalStorageGet(KEYS.DOCUMENTS, []),
        pages: safeLocalStorageGet(KEYS.PAGES, []),
        activeProjectId: null,
        schemaVersion: safeLocalStorageGet(KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION),
      };
    }
  },

  async saveProjects(projects: Project[]): Promise<StorageOperationResult> {
    return persistItem(KEYS.PROJECTS, projects);
  },

  async saveFolders(folders: Folder[]): Promise<StorageOperationResult> {
    return persistItem(KEYS.FOLDERS, folders);
  },

  async saveDocuments(documents: Document[]): Promise<StorageOperationResult> {
    return persistItem(KEYS.DOCUMENTS, documents);
  },

  async savePages(pages: DocumentPage[]): Promise<StorageOperationResult> {
    return persistItem(KEYS.PAGES, pages);
  },

  async saveActiveProjectId(id: string | null): Promise<StorageOperationResult> {
    return persistItem(KEYS.ACTIVE_PROJECT, id);
  },

  async saveSchemaVersion(version: number): Promise<StorageOperationResult> {
    return persistItem(KEYS.SCHEMA_VERSION, version);
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
