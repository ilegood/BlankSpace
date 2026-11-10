// 캐릭터 관계도 데이터 타입 정의

export type AnchorPosition = 'north' | 'east' | 'south' | 'west';

export interface RelationCharacter {
  id: string;
  name: string;
  role?: string;
  imageUrl?: string;
  description?: string;
  color?: string;
}

export interface RelationItem {
  id: string;
  sourceId: string; // 캐릭터 A
  targetId: string; // 캐릭터 B
  relationType: string; // 관계 유형
  color: string; // 관계선 색상
  style: 'solid' | 'dashed'; // 선 스타일
  strokeWidth: number; // 선 두께 (1.5 ~ 6)
  emotionAtoB: string; // A -> B 감정
  emotionBtoA: string; // B -> A 감정
  memo?: string; // 세부 메모 (댓글 아이콘 표시 기준)
  sourceAnchor?: AnchorPosition; // 시작 앵커 지점
  targetAnchor?: AnchorPosition; // 도착 앵커 지점
}

export interface CharacterRelationsDocData {
  characters: RelationCharacter[];
  relations: RelationItem[];
  settings?: {
    canvasBackground?: string;
    showGrid?: boolean;
    zoom?: number;
  };
}

// 기본 관계 유형 프리셋
export interface RelationTypePreset {
  id: string;
  name: string;
  color: string;
  style: 'solid' | 'dashed';
  description: string;
}

export const RELATION_TYPE_PRESETS: RelationTypePreset[] = [
  {
    id: 'love',
    name: '호감 및 애정',
    color: '#EC4899',
    style: 'solid',
    description: '서로에게 호감이나 애정을 느끼는 관계',
  },
  {
    id: 'trust',
    name: '신뢰 및 우호',
    color: '#8B5CF6',
    style: 'solid',
    description: '서로를 신뢰하고 우호적인 동료 관계',
  },
  {
    id: 'interest',
    name: '관심 및 호기심',
    color: '#0EA5E9',
    style: 'solid',
    description: '흥미를 가지고 관찰하거나 의식하는 관계',
  },
  {
    id: 'conflict',
    name: '갈등 및 대립',
    color: '#EF4444',
    style: 'solid',
    description: '목표나 성향 차이로 대립하는 라이벌/적대 관계',
  },
  {
    id: 'distance',
    name: '거리감 및 무관심',
    color: '#64748B',
    style: 'dashed',
    description: '서로에게 무관심하거나 거리를 두는 관계',
  },
  {
    id: 'custom',
    name: '기타 / 사용자 정의',
    color: '#10B981',
    style: 'solid',
    description: '특수한 서사적 관계',
  },
];

