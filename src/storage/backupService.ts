import { Project, Folder, Document, DocumentPage } from '../types';
import { CURRENT_SCHEMA_VERSION, StorageSnapshot } from './migrationService';
import { StorageService } from './index';

const BACKUP_STORAGE_KEY_LATEST = 'blankspace_backup_auto_latest';
const BACKUP_STORAGE_KEY_PRE_RESTORE = 'blankspace_backup_pre_restore';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  snapshot?: StorageSnapshot;
}

export const BackupService = {
  /**
   * Build a complete in-memory snapshot of all current workspace data
   */
  createSnapshot(
    projects: Project[],
    folders: Folder[],
    documents: Document[],
    pages: DocumentPage[],
    activeProjectId: string | null = null,
    schemaVersion: number = CURRENT_SCHEMA_VERSION
  ): StorageSnapshot {
    return {
      appName: 'BlankSpace',
      schemaVersion,
      exportedAt: new Date().toISOString(),
      projects: JSON.parse(JSON.stringify(projects)),
      folders: JSON.parse(JSON.stringify(folders)),
      documents: JSON.parse(JSON.stringify(documents)),
      pages: JSON.parse(JSON.stringify(pages)),
      activeProjectId,
    };
  },

  /**
   * Save an automated recovery snapshot to localStorage
   */
  saveAutoSnapshot(snapshot: StorageSnapshot, key = BACKUP_STORAGE_KEY_LATEST): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(snapshot));
      return true;
    } catch (err) {
      console.warn('[BackupService] Failed to save local auto snapshot:', err);
      return false;
    }
  },

  /**
   * Retrieve the latest local recovery snapshot
   */
  getAutoSnapshot(key = BACKUP_STORAGE_KEY_LATEST): StorageSnapshot | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return this.validateBackupData(raw).isValid ? parsed : null;
    } catch {
      return null;
    }
  },

  /**
   * Export workspace snapshot as a downloadable .json file
   */
  exportToFile(snapshot: StorageSnapshot, customFileName?: string): void {
    const jsonStr = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const defaultName = `blankspace-backup-${dateStr}-${timeStr}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = customFileName || defaultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Validate uploaded backup JSON string
   */
  validateBackupData(jsonString: string): ValidationResult {
    if (!jsonString || typeof jsonString !== 'string') {
      return { isValid: false, error: '유효한 JSON 문자열이 아닙니다.' };
    }

    try {
      const data = JSON.parse(jsonString);

      if (!data || typeof data !== 'object') {
        return { isValid: false, error: '백업 데이터 구조가 올바르지 않습니다.' };
      }

      // Check app signature
      if (data.appName && data.appName !== 'BlankSpace') {
        return { isValid: false, error: 'BlankSpace 백업 파일이 아닙니다.' };
      }

      // Check required array fields
      if (!Array.isArray(data.projects)) {
        return { isValid: false, error: '프로젝트 목록(projects)이 올바르지 않습니다.' };
      }
      if (!Array.isArray(data.folders)) {
        return { isValid: false, error: '폴더 목록(folders)이 올바르지 않습니다.' };
      }
      if (!Array.isArray(data.documents)) {
        return { isValid: false, error: '문서 목록(documents)이 올바르지 않습니다.' };
      }
      if (!Array.isArray(data.pages)) {
        return { isValid: false, error: '페이지 목록(pages)이 올바르지 않습니다.' };
      }

      return {
        isValid: true,
        snapshot: data as StorageSnapshot,
      };
    } catch (err: any) {
      return {
        isValid: false,
        error: `JSON 파싱 오류: ${err?.message || '알 수 없는 오류'}`,
      };
    }
  },

  /**
   * Safely restore workspace from a validated snapshot
   * Automatically creates a pre-restore backup first!
   */
  async restoreFromSnapshot(
    snapshot: StorageSnapshot,
    currentProjects: Project[],
    currentFolders: Folder[],
    currentDocuments: Document[],
    currentPages: DocumentPage[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Create emergency pre-restore snapshot
      const preRestoreSnapshot = this.createSnapshot(
        currentProjects,
        currentFolders,
        currentDocuments,
        currentPages,
        null
      );
      this.saveAutoSnapshot(preRestoreSnapshot, BACKUP_STORAGE_KEY_PRE_RESTORE);

      // 2. Persist to storage
      const pRes = await StorageService.saveProjects(snapshot.projects);
      const fRes = await StorageService.saveFolders(snapshot.folders);
      const dRes = await StorageService.saveDocuments(snapshot.documents);
      const pgRes = await StorageService.savePages(snapshot.pages);
      const aRes = await StorageService.saveActiveProjectId(snapshot.activeProjectId);

      if (!pRes.success || !fRes.success || !dRes.success || !pgRes.success || !aRes.success) {
        throw new Error('스토리지 저장 중 오류가 발생했습니다.');
      }

      // 3. Update auto latest backup
      this.saveAutoSnapshot(snapshot);

      return { success: true };
    } catch (err: any) {
      console.error('[BackupService] Restore failed:', err);
      return { success: false, error: err?.message || '백업 복원에 실패했습니다.' };
    }
  },
};

