export type CanvasElementType =
  | 'image'
  | 'heading'
  | 'text'
  | 'info-field'
  | 'status-chart'
  | 'container'
  | 'divider';

export interface CanvasElementStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  opacity?: number;
  padding?: number;
  boxShadow?: string;
}

export interface InfoItem {
  id: string;
  label: string;
  value: string;
}

export interface StatItem {
  id: string;
  label: string;
  value: string;
  numValue?: number;
}

export interface CanvasElementContent {
  // 1. 이미지
  imageUrl?: string;
  alt?: string;
  aspectRatio?: boolean;

  // 2. 제목 / 텍스트
  text?: string;
  placeholder?: string;

  // 3. 정보 항목 (Key-Value)
  infoItems?: InfoItem[];
  layoutDirection?: 'horizontal' | 'vertical';

  // 4. 스테이터스
  stats?: StatItem[];
  statDisplayType?: 'card' | 'bar';

  // 5. 구분선
  orientation?: 'horizontal' | 'vertical';
  lineStyle?: 'solid' | 'dashed' | 'dotted';
}

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotate?: number;
  style?: CanvasElementStyle;
  content: CanvasElementContent;
}

export interface CanvasDocumentData {
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  elements: CanvasElement[];
}
