import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Project, Folder, Document, DocumentPage } from '../types';

export interface WorkspaceDataPayload {
  projects: Project[];
  folders: Folder[];
  documents: Document[];
  pages: DocumentPage[];
  activeProjectId: string | null;
  schemaVersion?: number;
}

export const CloudWorkspaceService = {
  /**
   * Supabase 클라우드에서 해당 유저의 워크스페이스 데이터를 가져옵니다.
   */
  async loadWorkspace(userId: string): Promise<WorkspaceDataPayload | null> {
    if (!isSupabaseConfigured || !userId) return null;

    try {
      const { data, error } = await supabase
        .from('user_workspaces')
        .select('data')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('[CloudWorkspace] Load error:', error);
        return null;
      }

      if (data && data.data) {
        return data.data as WorkspaceDataPayload;
      }

      return null;
    } catch (err) {
      console.error('[CloudWorkspace] Unexpected load error:', err);
      return null;
    }
  },

  /**
   * Supabase 클라우드에 해당 유저의 워크스페이스 데이터를 업로드/저장(upsert)합니다.
   */
  async saveWorkspace(userId: string, payload: WorkspaceDataPayload): Promise<boolean> {
    if (!isSupabaseConfigured || !userId) return false;

    try {
      const { error } = await supabase
        .from('user_workspaces')
        .upsert({
          user_id: userId,
          data: payload,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('[CloudWorkspace] Save error:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[CloudWorkspace] Unexpected save error:', err);
      return false;
    }
  },
};

