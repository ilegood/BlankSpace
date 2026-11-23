export type TemplateCategoryType = 'character' | 'world' | 'planning' | 'design' | 'general';

export type DocKind = 'template' | 'blank' | 'freeform' | 'visual';

export interface Project {
  id: string;
  name: string;
  description?: string;
  coverColor?: string;
  coverImage?: string;
  avatarImage?: string;
  isFavorite?: boolean;
  deletedAt?: number | null;
  order?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  projectId: string;
  parentFolderId: string | null;
  name: string;
  description?: string;
  coverColor?: string;
  coverImage?: string;
  order: number;
  deletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface Document {
  id: string;
  projectId: string;
  folderId: string | null;
  title: string;
  description?: string;
  icon?: string;
  tags?: string[];
  templateType: string;
  category: TemplateCategoryType;
  docKind?: DocKind;
  coverColor?: string;
  coverImage?: string;
  isFavorite?: boolean;
  designPresetId?: string;
  order: number;
  deletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentPage {
  id: string;
  documentId: string;
  parentPageId?: string | null;
  title: string;
  content: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: TemplateCategoryType;
  docKind: DocKind;
  iconName: string;
  defaultTitle: string;
  defaultContent?: string;
  supportsDesignPreset?: boolean;
  hidden?: boolean;
}

export interface UserTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategoryType;
  baseTemplateType: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export type CanvasCardType =
  // 공통 16종
  | 'image-card'
  | 'gallery-card'
  | 'narrative-card'
  | 'detail-card'
  | 'tag-card'
  | 'quote-card'
  | 'table-card'
  | 'palette-card'
  | 'video-card'
  | 'audio-card'
  | 'memo-card'
  | 'file-card'
  | 'checklist-card'
  | 'external-link-card'
  | 'section-heading'
  | 'link-preview-card'
  // 캐릭터 특화 3종
  | 'profile-card'
  | 'stat-card'
  | 'relationship-card'
  // 세계관 특화 3종
  | 'hierarchy-card'
  | 'category-list-card'
  | 'zone-card'
  // 캐릭터/세계관 공용 1종
  | 'chronicle-card'
  // 게임 기획서 전용 4종
  | 'swot-card'
  | 'rule-card'
  | 'formula-card'
  | 'difficulty-curve-card'
  // 모델링 시트 전용 2종
  | 'turnaround-card'
  | 'texture-map-card'
  // 애니메이션 시트 전용 2종
  | 'animation-card'
  | 'frame-strip-card';

export interface CanvasCardItem {
  id: string;
  type: CanvasCardType;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  collapsible?: boolean;
  collapsed?: boolean;
  style?: {
    backgroundColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    padding?: number;
    fontSize?: number;
  };
  data: Record<string, any>;
}

export interface DesignPresetItem {
  id: string;
  templateType: string;
  name: string;
  description: string;
  isBuiltin?: boolean;
  swatches: string[];
  fontLabel: string;
  layoutMap?: Record<string, { x: number; y: number; w: number; h: number }>;
  fontFamily?: 'sans' | 'serif' | 'mono';
  accentColor?: string;
  cardBg?: string;
  borderRadius?: number;
}

export type ViewMode = 'grid' | 'list';
export type SortOption = 'updated-desc' | 'created-desc' | 'name-asc' | 'custom';
export type NavSection =
  | 'main'
  | 'favorites'
  | 'recent'
  | 'trash'
  | 'search'
  | 'settings'
  | 'help';
