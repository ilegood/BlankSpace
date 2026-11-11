import { createStore, get, set, del, keys, entries } from 'idb-keyval';

// Dedicated IndexedDB Store for large binary / media / base64 items
const fileStore = createStore('blankspace_files_db', 'file_objects');

export interface StoredFile {
  id: string;
  data: string; // Base64 data URL
  mimeType: string;
  sizeBytes: number;
  createdAt: number;
}

export const FileStorageService = {
  /**
   * Save an image or media asset to dedicated IndexedDB object store
   * @param fileId unique file identifier
   * @param dataUrl base64 data URL (e.g. data:image/png;base64,...)
   * @returns protocol URI e.g. "blankspace-file://<fileId>"
   */
  async saveFile(
    fileId: string,
    dataUrl: string,
    mimeType = 'image/png'
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
      console.error('[FileStorageService] saveFile failed:', err);
      return { success: false, uri: '', error: err?.message || 'Failed to save file' };
    }
  },

  /**
   * Retrieve stored file data URL by fileId
   */
  async getFile(fileId: string): Promise<string | null> {
    try {
      const record = await get<StoredFile>(fileId, fileStore);
      return record ? record.data : null;
    } catch (err) {
      console.warn(`[FileStorageService] Failed to load file ${fileId}:`, err);
      return null;
    }
  },

  /**
   * Delete stored file
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await del(fileId, fileStore);
    } catch (err) {
      console.warn(`[FileStorageService] Failed to delete file ${fileId}:`, err);
    }
  },

  /**
   * Universal URL resolver:
   * - If URI starts with "blankspace-file://<fileId>", resolves from IndexedDB file store
   * - If URI is standard http/https/data:, returns as-is
   */
  async resolveFileUrl(uriOrUrl: string | undefined | null): Promise<string> {
    if (!uriOrUrl) return '';

    if (uriOrUrl.startsWith('blankspace-file://')) {
      const fileId = uriOrUrl.replace('blankspace-file://', '').trim();
      const loaded = await this.getFile(fileId);
      return loaded || '';
    }

    return uriOrUrl;
  },

  /**
   * Get total count and size of files currently stored
   */
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

