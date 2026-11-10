export interface Project {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  avatarImage?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  projectId: string;
  parentFolderId: string | null;
  name: string;
  coverImage?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export type TemplateCategoryType = 'character' | 'world' | 'planning' | 'design' | 'general';

export interface Document {
  id: string;
  projectId: string;
  folderId: string | null;
  title: string;
  templateType: string;
  category: TemplateCategoryType;
  coverImage?: string;
  isFavorite?: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentPage {
  id: string;
  documentId: string;
  parentPageId?: string | null;
  title: string;
  content: string; // HTML or Markdown or structured JSON
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: TemplateCategoryType;
  iconName: string;
  defaultTitle: string;
  defaultContent?: string;
}

export type FilterType = 'all' | 'folder' | 'document';
export type ViewMode = 'grid' | 'list';
export type SortOption = 'custom' | 'updated-desc' | 'created-desc' | 'name-asc';

