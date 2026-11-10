import {
  CharacterRelationsDocData,
  RelationCharacter,
  RelationItem,
  AnchorPosition,
} from '../../../../types/relations';

export const INITIAL_CHARACTERS: RelationCharacter[] = [
  {
    id: 'char-arzen',
    name: '아르젠',
    role: '신입 기사',
    imageUrl:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&auto=format&fit=crop',
    description: '빛의 검술을 계승한 청년 기사. 동료를 위해 목숨을 건다.',
    color: '#8B5CF6',
  },
  {
    id: 'char-kyle',
    name: '카일',
    role: '천재 마법사',
    imageUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    description: '고대 비전 마법을 연구하는 냉철한 지략가.',
    color: '#0EA5E9',
  },
  {
    id: 'char-seira',
    name: '세이라',
    role: '성역의 사제',
    imageUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop',
    description: '자비로운 마음 뒤에 숨겨진 비밀을 간직한 사제.',
    color: '#EC4899',
  },
  {
    id: 'char-ruin',
    name: '루인',
    role: '그림자 암살자',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    description: '어둠의 길드 출신이지만 아르젠에게 빚을 졌다.',
    color: '#EF4444',
  },
];

export const INITIAL_RELATIONS: RelationItem[] = [
  {
    id: 'rel-arzen-seira',
    sourceId: 'char-arzen',
    targetId: 'char-seira',
    relationType: '호감 및 애정',
    color: '#EC4899',
    style: 'solid',
    strokeWidth: 3,
    emotionAtoB: '깊은 신뢰와 호감, 지켜주고 싶은 마음',
    emotionBtoA: '유일하게 마음을 기댈 수 있는 안식처',
    memo: '과거 사원 붕괴 사건 때 아르젠이 세이라를 구출하며 싹튼 감정.',
    sourceAnchor: 'east',
    targetAnchor: 'west',
  },
  {
    id: 'rel-arzen-kyle',
    sourceId: 'char-arzen',
    targetId: 'char-kyle',
    relationType: '신뢰 및 우호',
    color: '#8B5CF6',
    style: 'solid',
    strokeWidth: 2.5,
    emotionAtoB: '믿음직한 참모이자 전우',
    emotionBtoA: '생각보다 행동이 앞서지만 등을 맡길 수 있는 동료',
    memo: '전술적인 이견으로 자주 다투지만 결과적으로 항상 뜻을 모은다.',
    sourceAnchor: 'north',
    targetAnchor: 'south',
  },
  {
    id: 'rel-kyle-seira',
    sourceId: 'char-kyle',
    targetId: 'char-seira',
    relationType: '관심 및 호기심',
    color: '#0EA5E9',
    style: 'solid',
    strokeWidth: 2.5,
    emotionAtoB: '그녀가 숨기고 있는 성역의 고대 기록에 대한 호기심',
    emotionBtoA: '지나치게 파고들지 않기를 바라는 조심스러움',
    memo: '고대 마법서 해독 작업을 함께 진행 중.',
    sourceAnchor: 'east',
    targetAnchor: 'north',
  },
  {
    id: 'rel-arzen-ruin',
    sourceId: 'char-arzen',
    targetId: 'char-ruin',
    relationType: '갈등 및 대립',
    color: '#EF4444',
    style: 'dashed',
    strokeWidth: 2.5,
    emotionAtoB: '방심할 수 없지만 과거의 은혜로 감싸는 중',
    emotionBtoA: '위선자라고 비난하면서도 눈을 뗄 수 없는 상대',
    memo: '길드의 암살 타겟이었으나 실패 후 기사단에 합류.',
    sourceAnchor: 'south',
    targetAnchor: 'west',
  },
];

export const INITIAL_RELATIONS_DATA: CharacterRelationsDocData = {
  characters: INITIAL_CHARACTERS,
  relations: INITIAL_RELATIONS,
  settings: {
    canvasBackground: '#17171D',
    showGrid: true,
    zoom: 100,
  },
};

// 원형 프로필 반지름 (픽셀)
export const PROFILE_RADIUS = 36; // 직경 72px

// 캐릭터 원형 배치 좌표 계산 유틸리티
export interface NodePosition {
  x: number;
  y: number;
  angle: number; // radian
}

export function calculateCircularPositions(
  characters: RelationCharacter[],
  centerX: number,
  centerY: number
): Map<string, NodePosition> {
  const map = new Map<string, NodePosition>();
  const count = characters.length;
  if (count === 0) return map;

  // 캐릭터 수에 따른 원의 반지름 계산 (도넛 직경 최적화)
  let radius = 220;
  if (count <= 3) radius = 180;
  else if (count <= 5) radius = 220;
  else if (count <= 7) radius = 260;
  else if (count <= 9) radius = 300;
  else radius = Math.min(420, 320 + (count - 9) * 16);

  characters.forEach((char, index) => {
    // 12시 방향(-PI/2)부터 시작하여 시계 방향으로 균등 배치
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / count;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    map.set(char.id, { x, y, angle });
  });

  return map;
}

// 4개 앵커 지점 좌표 계산
export function getAnchorCoordinates(
  pos: { x: number; y: number },
  anchor: AnchorPosition,
  radius: number = PROFILE_RADIUS
): { x: number; y: number } {
  switch (anchor) {
    case 'north':
      return { x: pos.x, y: pos.y - radius };
    case 'east':
      return { x: pos.x + radius, y: pos.y };
    case 'south':
      return { x: pos.x, y: pos.y + radius };
    case 'west':
      return { x: pos.x - radius, y: pos.y };
  }
}

// 두 프로필 사이의 최적 연결점 계산 (선분이 원형 테두리와 만나는 점)
export function getProfileEdgePoints(
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  fromAnchor?: AnchorPosition,
  toAnchor?: AnchorPosition
): { start: { x: number; y: number }; end: { x: number; y: number }; ctrl: { x: number; y: number }; mid: { x: number; y: number } } {
  let startX = fromPos.x;
  let startY = fromPos.y;
  let endX = toPos.x;
  let endY = toPos.y;

  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (fromAnchor) {
    const pt = getAnchorCoordinates(fromPos, fromAnchor);
    startX = pt.x;
    startY = pt.y;
  } else if (dist > 0) {
    startX = fromPos.x + (dx / dist) * PROFILE_RADIUS;
    startY = fromPos.y + (dy / dist) * PROFILE_RADIUS;
  }

  if (toAnchor) {
    const pt = getAnchorCoordinates(toPos, toAnchor);
    endX = pt.x;
    endY = pt.y;
  } else if (dist > 0) {
    endX = toPos.x - (dx / dist) * PROFILE_RADIUS;
    endY = toPos.y - (dy / dist) * PROFILE_RADIUS;
  }

  // 부드러운 곡선 처리를 위한 컨트롤 포인트 (중심점 방향으로 살짝 곡률 적용)
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  // 두 프로필의 수직 벡터로 완만한 곡선 생성 (거리가 가까울수록 더 완만하게)
  const normX = -dy / (dist || 1);
  const normY = dx / (dist || 1);
  const curveAmount = Math.min(30, Math.max(12, dist * 0.08));

  const ctrlX = midX + normX * curveAmount;
  const ctrlY = midY + normY * curveAmount;

  // 2차 베지어 곡선의 중간 지점 (t=0.5)
  const curveMidX = 0.25 * startX + 0.5 * ctrlX + 0.25 * endX;
  const curveMidY = 0.25 * startY + 0.5 * ctrlY + 0.25 * endY;

  return {
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
    ctrl: { x: ctrlX, y: ctrlY },
    mid: { x: curveMidX, y: curveMidY },
  };
}

// 구버전 ReactFlow 데이터 호환 마이그레이션 함수
export function convertLegacyToRelations(raw: any): CharacterRelationsDocData {
  if (!raw) return INITIAL_RELATIONS_DATA;

  // 이미 신규 포맷인 경우
  if (Array.isArray(raw.characters) && Array.isArray(raw.relations)) {
    return raw as CharacterRelationsDocData;
  }

  // 구버전 ReactFlow { nodes, edges } 포맷 변환
  if (Array.isArray(raw.nodes)) {
    const characters: RelationCharacter[] = raw.nodes.map((n: any, idx: number) => ({
      id: n.id || `char-${idx + 1}`,
      name: n.data?.name || `캐릭터 ${idx + 1}`,
      role: n.data?.role || '',
      imageUrl: n.data?.imageUrl || '',
      description: '',
      color: '#8B5CF6',
    }));

    const relations: RelationItem[] = Array.isArray(raw.edges)
      ? raw.edges.map((e: any, idx: number) => ({
          id: e.id || `rel-${idx + 1}`,
          sourceId: e.source,
          targetId: e.target,
          relationType: e.data?.relationType || e.data?.label || '동료',
          color: e.data?.sourceEmotion === 'love' ? '#EC4899' : '#8B5CF6',
          style: (e.data?.dashed ? 'dashed' : 'solid') as 'solid' | 'dashed',
          strokeWidth: Number(e.data?.strokeWidth) || 2.5,
          emotionAtoB: e.data?.emotionAtoB || '호감',
          emotionBtoA: e.data?.emotionBtoA || '신뢰',
          memo: e.data?.memo || '',
        }))
      : [];

    return {
      characters,
      relations,
      settings: {
        canvasBackground: '#17171D',
        showGrid: true,
        zoom: 100,
      },
    };
  }

  return INITIAL_RELATIONS_DATA;
}

