// 캐릭터 관계도 데이터 타입 정의

export type AnchorPosition = 'north' | 'east' | 'south' | 'west';

export type NodeShape = 'circle';
export type RelationDirection =
  | 'bidirectional'       // 양방향 (A <-> B)
  | 'source-to-target'   // 단방향 (A -> B)
  | 'target-to-source'   // 단방향 (B -> A)
  | 'none'               // 무방향
  | 'undirected';

export type LineStyle = 'solid' | 'dashed' | 'dotted';

export interface GradientColorStop {
  fromColor: string;
  toColor: string;
  startColor?: string;
  endColor?: string;
}

export interface RelationCharacter {
  id: string;
  name: string;
  role?: string;
  affiliation?: string;
  imageUrl?: string;           // base64 또는 URL
  color?: string;              // 테두리 대표 색상
  borderColor?: string;

  // 위치 및 초상화 디자인 (원형만 지원)
  x?: number;
  y?: number;
  size?: number;               // 원형 초상화 지름 (기본 88px)
  borderWidth?: number;        // 테두리 굵기 (기본 4px)
  shape?: 'circle';            // 원형 고정
  showName?: boolean;          // 이름 표시 on/off

  // 캐릭터 출처 (연동 여부)
  source?: 'custom' | 'character-sheet';
  sourceDocumentId?: string;
  sourceDocumentTitle?: string;
}

// 관계 범례 항목 정의
export interface RelationLegendItem {
  id: string;
  name: string;
  color: string;
  gradient?: GradientColorStop;
  style: LineStyle;
  strokeWidth: number;
}

export interface RelationItem {
  id: string;
  sourceId: string;            // 캐릭터 A
  targetId: string;            // 캐릭터 B
  legendId?: string;           // 연동된 범례 항목 ID
  relationType: string;        // 관계 유형 (예: "신뢰", "라이벌", "동료")
  label?: string;              // 관계 라벨
  color: string;               // 대표 색상
  gradient?: GradientColorStop; // A-B 생각이 다를 때 그라데이션
  style: LineStyle;            // 실선, 점선
  strokeWidth: number;         // 선 두께
  direction?: RelationDirection;
  
  // A와 B의 서로에 대한 생각 및 각자의 색상
  emotionAtoB?: string;        // A가 B에 대한 생각
  colorAtoB?: string;          // A의 감정 색상
  emotionBtoA?: string;        // B가 A에 대한 생각
  colorBtoA?: string;          // B의 감정 색상

  memo?: string;               // 세부 설명/메모
  sourceAnchor?: AnchorPosition;
  targetAnchor?: AnchorPosition;
  curvature?: number;
  showLabel?: boolean;
}

export interface CharacterRelationsDocData {
  characters: RelationCharacter[];
  relations: RelationItem[];
  legends?: RelationLegendItem[];
  legendSettings?: {
    visible: boolean;
    x: number;
    y: number;
    orientation?: 'vertical' | 'horizontal';
  };
  settings?: {
    canvasBackground?: string;
    showGrid?: boolean;
    zoom?: number;
    pan?: { x: number; y: number };
    defaultNodeShape?: 'circle';
  };
}

// 깔끔하고 보편적인 기본 6종 범례 프리셋
export const DEFAULT_RELATION_LEGENDS: RelationLegendItem[] = [
  {
    id: 'leg-trust',
    name: '신뢰',
    color: '#3B82F6',
    style: 'solid',
    strokeWidth: 3.5,
  },
  {
    id: 'leg-friendly',
    name: '우호',
    color: '#10B981',
    style: 'solid',
    strokeWidth: 3,
  },
  {
    id: 'leg-affection',
    name: '호감',
    color: '#F43F5E',
    style: 'solid',
    strokeWidth: 3,
  },
  {
    id: 'leg-rival',
    name: '경쟁 / 라이벌',
    color: '#F97316',
    style: 'solid',
    strokeWidth: 3,
  },
  {
    id: 'leg-hostile',
    name: '경계 / 적대',
    color: '#8B5CF6',
    style: 'solid',
    strokeWidth: 3,
  },
  {
    id: 'leg-complex',
    name: '복잡한 관계',
    color: '#6B7280',
    style: 'dashed',
    strokeWidth: 2.5,
  },
];

export const RELATION_TYPE_PRESETS = [
  { type: '신뢰', color: '#3B82F6' },
  { type: '우호', color: '#10B981' },
  { type: '호감', color: '#F43F5E' },
  { type: '경쟁 / 라이벌', color: '#F97316' },
  { type: '경계 / 적대', color: '#8B5CF6' },
  { type: '복잡한 관계', color: '#6B7280' },
];
