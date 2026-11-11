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

  // 캐릭터 출처
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
  relationType: string;        // 대표 관계 유형
  color: string;               // 대표 선 색상
  style: LineStyle;            // 실선, 점선
  strokeWidth: number;         // 선 두께
  direction?: RelationDirection;

  // A -> B 개별 설정 (A의 생각 및 범례)
  legendIdAtoB?: string;
  emotionAtoB?: string;
  colorAtoB?: string;

  // B -> A 개별 설정 (B의 생각 및 범례)
  legendIdBtoA?: string;
  emotionBtoA?: string;
  colorBtoA?: string;

  // 다를 때 A 색상 -> B 색상 그라데이션
  gradient?: GradientColorStop;

  // 하위 호환 필드
  legendId?: string;
  label?: string;
  showLabel?: boolean;
  memo?: string;
  sourceAnchor?: AnchorPosition;
  targetAnchor?: AnchorPosition;
  curvature?: number;
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

// 기본 범례: 적대적(빨강), 우호적(파랑) 2종
export const DEFAULT_RELATION_LEGENDS: RelationLegendItem[] = [
  {
    id: 'leg-hostile',
    name: '적대적',
    color: '#EF4444',
    style: 'solid',
    strokeWidth: 3.5,
  },
  {
    id: 'leg-friendly',
    name: '우호적',
    color: '#3B82F6',
    style: 'solid',
    strokeWidth: 3.5,
  },
];

export const RELATION_TYPE_PRESETS = [
  { type: '적대적', color: '#EF4444' },
  { type: '우호적', color: '#3B82F6' },
];
