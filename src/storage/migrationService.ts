import { Project, Folder, Document, DocumentPage } from '../types';

export const CURRENT_SCHEMA_VERSION = 2;

export interface StorageSnapshot {
  schemaVersion: number;
  exportedAt: string;
  appName: string;
  projects: Project[];
  folders: Folder[];
  documents: Document[];
  pages: DocumentPage[];
  activeProjectId: string | null;
}

export interface RawStorageData {
  schemaVersion: number;
  projects: Project[];
  folders: Folder[];
  documents: Document[];
  pages: DocumentPage[];
  activeProjectId: string | null;
}

export interface MigrationStep {
  version: number;
  description: string;
  migrate: (data: RawStorageData) => Promise<RawStorageData> | RawStorageData;
}

/**
 * Migration registry.
 * Whenever the schema changes, define a new MigrationStep here.
 */
const MIGRATIONS: MigrationStep[] = [
  {
    version: 2,
    description: 'Ensure all pages have documentId, order, and sanitized content. Ensure documents have category & templateType.',
    migrate: (data) => {
      // 1. Sanitize pages
      const sanitizedPages = data.pages.map((p, idx) => {
        return {
          ...p,
          title: p.title || `페이지 ${idx + 1}`,
          content: p.content ?? '',
          order: typeof p.order === 'number' ? p.order : idx,
          createdAt: p.createdAt || Date.now(),
          updatedAt: p.updatedAt || Date.now(),
        };
      });

      // 2. Sanitize documents & migrate character-dialogue to planning category
      const sanitizedDocs = data.documents.map((d, idx) => {
        let finalCategory = d.category || 'general';
        if (d.templateType === 'character-dialogue') {
          finalCategory = 'planning';
        }
        return {
          ...d,
          title: d.title || '제목 없는 문서',
          templateType: d.templateType || 'general-blank',
          category: finalCategory,
          isFavorite: !!d.isFavorite,
          order: typeof d.order === 'number' ? d.order : idx,
          createdAt: d.createdAt || Date.now(),
          updatedAt: d.updatedAt || Date.now(),
        };
      });

      return {
        ...data,
        schemaVersion: 2,
        documents: sanitizedDocs,
        pages: sanitizedPages,
      };
    },
  },
];

export const MigrationService = {
  getCurrentVersion(): number {
    return CURRENT_SCHEMA_VERSION;
  },

  async runMigrations(
    data: RawStorageData,
    fromVersion: number = 1
  ): Promise<{ data: RawStorageData; appliedCount: number }> {
    let currentData = { ...data };
    let appliedCount = 0;

    const applicableMigrations = MIGRATIONS.filter(
      (m) => m.version > fromVersion && m.version <= CURRENT_SCHEMA_VERSION
    ).sort((a, b) => a.version - b.version);

    for (const step of applicableMigrations) {
      console.log(`[Migration] Running migration to v${step.version}: ${step.description}`);
      try {
        currentData = await step.migrate(currentData);
        currentData.schemaVersion = step.version;
        appliedCount++;
      } catch (err) {
        console.error(`[Migration] Failed migrating to v${step.version}:`, err);
        throw new Error(`Migration to v${step.version} failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    currentData.schemaVersion = CURRENT_SCHEMA_VERSION;
    return { data: currentData, appliedCount };
  },
};

