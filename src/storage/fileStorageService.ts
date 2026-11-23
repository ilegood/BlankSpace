import { createStore, get, set, del, entries } from 'idb-keyval';

const fileStore = createStore('blankspace_files_db', 'file_objects');

export interface StoredFile {
  id: string;
  data: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: number;
}

export const FileStorageService = {
  async saveFile(
    fileId: string,
    dataUrl: string,
    mimeType = 'application/octet-stream'
  ): Promise<{ success: boolean; uri: string; error?: string }> {
    try {
      if (!dataUrl || !fileId) {
        return { success: false, uri: '', error: 'Invalid fileId or dataUrl' };
      }

      const fileRecord: StoredFile = {
        id: fileId,
        data: dataUrl,
        mimeType,
        sizeBytes: dataUrl.length,
        createdAt: Date.now(),
      };

      await set(fileId, fileRecord, fileStore);
      return { success: true, uri: `blankspace-file://${fileId}` };
    } catch (err: any) {
      return { success: false, uri: '', error: err?.message || 'Failed to save file' };
    }
  },

  async getFile(fileId: string): Promise<string | null> {
    try {
      const record = await get<StoredFile>(fileId, fileStore);
      return record ? record.data : null;
    } catch {
      return null;
    }
  },

  async deleteFile(fileId: string): Promise<void> {
    try {
      await del(fileId, fileStore);
    } catch {
      // ignore
    }
  },

  async resolveFileUrl(uriOrUrl: string | undefined | null): Promise<string> {
    if (!uriOrUrl) return '';
    if (uriOrUrl.startsWith('blankspace-file://')) {
      const fileId = uriOrUrl.replace('blankspace-file://', '').trim();
      const loaded = await this.getFile(fileId);
      return loaded || '';
    }
    return uriOrUrl;
  },

  async getStats(): Promise<{ count: number; totalSizeBytes: number }> {
    try {
      const allEntries = await entries<string, StoredFile>(fileStore);
      let totalBytes = 0;
      for (const [, item] of allEntries) {
        totalBytes += item?.sizeBytes || 0;
      }
      return { count: allEntries.length, totalSizeBytes: totalBytes };
    } catch {
      return { count: 0, totalSizeBytes: 0 };
    }
  },
};
