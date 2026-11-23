import { get, set } from 'idb-keyval';
import { Project, Folder, Document, DocumentPage, UserTemplate, DesignPresetItem } from '../types';
import { INITIAL_PROJECTS, INITIAL_FOLDERS, INITIAL_DOCUMENTS, INITIAL_PAGES } from './initialData';

const KEYS = {
  PROJECTS: 'blankspace_v2_projects',
  FOLDERS: 'blankspace_v2_folders',
  DOCUMENTS: 'blankspace_v2_documents',
  PAGES: 'blankspace_v2_pages',
  USER_TEMPLATES: 'blankspace_v2_user_templates',
  DESIGN_PRESETS: 'blankspace_v2_design_presets',
  DEFAULT_TEMPLATE_OVERRIDES: 'blankspace_v2_default_template_overrides',
  INITIALIZED: 'blankspace_v2_initialized',
};

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
  } catch {
    return false;
  }
}

async function persistItem<T>(key: string, value: T): Promise<{ success: boolean; error?: string }> {
  try {
    await set(key, value);
    return { success: true };
  } catch (err: any) {
    const lsOk = safeLocalStorageSet(key, value);
    if (lsOk) return { success: true };
    return { success: false, error: err?.message || '저장 실패' };
  }
}

export const StorageService = {
  async init(): Promise<{
    projects: Project[];
    folders: Folder[];
    documents: Document[];
    pages: DocumentPage[];
    userTemplates: UserTemplate[];
    designPresets: DesignPresetItem[];
    defaultTemplateOverrides: Record<string, string>;
  }> {
    try {
      const isInitialized = await get<boolean>(KEYS.INITIALIZED);
      let projects = await get<Project[]>(KEYS.PROJECTS);
      let folders = await get<Folder[]>(KEYS.FOLDERS);
      let documents = await get<Document[]>(KEYS.DOCUMENTS);
      let pages = await get<DocumentPage[]>(KEYS.PAGES);
      const userTemplates = (await get<UserTemplate[]>(KEYS.USER_TEMPLATES)) || [];
      const designPresets = (await get<DesignPresetItem[]>(KEYS.DESIGN_PRESETS)) || [];
      const defaultTemplateOverrides =
        (await get<Record<string, string>>(KEYS.DEFAULT_TEMPLATE_OVERRIDES)) || {};

      if (!isInitialized) {
        projects = INITIAL_PROJECTS;
        folders = INITIAL_FOLDERS;
        documents = INITIAL_DOCUMENTS;
        pages = INITIAL_PAGES;

        await set(KEYS.PROJECTS, projects);
        await set(KEYS.FOLDERS, folders);
        await set(KEYS.DOCUMENTS, documents);
        await set(KEYS.PAGES, pages);
        await set(KEYS.INITIALIZED, true);
      }

      return {
        projects: projects || [],
        folders: folders || [],
        documents: documents || [],
        pages: pages || [],
        userTemplates,
        designPresets,
        defaultTemplateOverrides,
      };
    } catch {
      return {
        projects: safeLocalStorageGet(KEYS.PROJECTS, INITIAL_PROJECTS),
        folders: safeLocalStorageGet(KEYS.FOLDERS, INITIAL_FOLDERS),
        documents: safeLocalStorageGet(KEYS.DOCUMENTS, INITIAL_DOCUMENTS),
        pages: safeLocalStorageGet(KEYS.PAGES, INITIAL_PAGES),
        userTemplates: safeLocalStorageGet(KEYS.USER_TEMPLATES, []),
        designPresets: safeLocalStorageGet(KEYS.DESIGN_PRESETS, []),
        defaultTemplateOverrides: safeLocalStorageGet(KEYS.DEFAULT_TEMPLATE_OVERRIDES, {}),
      };
    }
  },

  saveProjects: (projects: Project[]) => persistItem(KEYS.PROJECTS, projects),
  saveFolders: (folders: Folder[]) => persistItem(KEYS.FOLDERS, folders),
  saveDocuments: (documents: Document[]) => persistItem(KEYS.DOCUMENTS, documents),
  savePages: (pages: DocumentPage[]) => persistItem(KEYS.PAGES, pages),
  saveUserTemplates: (list: UserTemplate[]) => persistItem(KEYS.USER_TEMPLATES, list),
  saveDesignPresets: (list: DesignPresetItem[]) => persistItem(KEYS.DESIGN_PRESETS, list),
  saveDefaultTemplateOverrides: (map: Record<string, string>) =>
    persistItem(KEYS.DEFAULT_TEMPLATE_OVERRIDES, map),
};
