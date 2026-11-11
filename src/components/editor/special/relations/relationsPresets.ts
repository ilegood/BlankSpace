import {
  CharacterRelationsDocData,
  RelationCharacter,
  RelationItem,
  AnchorPosition,
  DEFAULT_RELATION_LEGENDS,
} from '../../../../types/relations';

export const INITIAL_CHARACTERS: RelationCharacter[] = [
  {
    id: 'char-tanjiro',
    name: '탄지로',
    imageUrl:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&auto=format&fit=crop',
    color: '#EF4444',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    borderColor: '#DC2626',
    showName: true,
  },
  {
    id: 'char-nezuko',
    name: '네즈코',
    imageUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    color: '#EC4899',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    borderColor: '#DB2777',
    showName: true,
  },
  {
    id: 'char-zenitsu',
    name: '젠이츠',
    imageUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop',
    color: '#F59E0B',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    borderColor: '#D97706',
    showName: true,
  },
  {
    id: 'char-inosuke',
    name: '이노스케',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    color: '#0EA5E9',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    borderColor: '#0284C7',
    showName: true,
  },
  {
    id: 'char-giyu',
    name: '기유',
    imageUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
    color: '#3B82F6',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    borderColor: '#2563EB',
    showName: true,
  },
  {
    id: 'char-shinobu',
    name: '시노부',
    imageUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop',
    color: '#8B5CF6',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    borderColor: '#7C3AED',
    showName: true,
  },
  {
    id: 'char-rengoku',
    name: '렌고쿠',
    imageUrl:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop',
    color: '#EA580C',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    borderColor: '#C2410C',
    showName: true,
  },
  {
    id: 'char-mitsuri',
    name: '미츠리',
    imageUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop',
    color: '#F43F5E',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    borderColor: '#E11D48',
    showName: true,
  },
  {
    id: 'char-muichiro',
    name: '무이치로',
    imageUrl:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&auto=format&fit=crop',
    color: '#14B8A6',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    borderColor: '#0D9488',
    showName: true,
  },
  {
    id: 'char-sanemi',
    name: '사네미',
    imageUrl:
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=300&auto=format&fit=crop',
    color: '#10B981',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    borderColor: '#059669',
    showName: true,
  },
  {
    id: 'char-obanai',
    name: '오바나이',
    imageUrl:
      'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=300&auto=format&fit=crop',
    color: '#6366F1',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    borderColor: '#4F46E5',
    showName: true,
  },
  {
    id: 'char-gyomei',
    name: '교메이',
    imageUrl:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=300&auto=format&fit=crop',
    color: '#78350F',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    borderColor: '#92400E',
    showName: true,
  },
];

export const INITIAL_RELATIONS: RelationItem[] = [
  {
    id: 'rel-tanjiro-nezuko',
    sourceId: 'char-tanjiro',
    targetId: 'char-nezuko',
    relationType: '가족 및 보호',
    label: '가족',
    direction: 'bidirectional',
    color: '#F43F5E',
    emotionAtoB: '무조건적인 보호와 신뢰',
    colorAtoB: '#F43F5E',
    emotionBtoA: '가장 의지하는 가족',
    colorBtoA: '#F43F5E',
    style: 'solid',
    strokeWidth: 3.5,
    curvature: -15,
    legendId: 'leg-affection',
    showLabel: false,
  },
  {
    id: 'rel-tanjiro-zenitsu',
    sourceId: 'char-tanjiro',
    targetId: 'char-zenitsu',
    relationType: '동료',
    label: '동료',
    direction: 'bidirectional',
    color: '#10B981',
    emotionAtoB: '믿을 수 있는 동료',
    colorAtoB: '#10B981',
    emotionBtoA: '항상 의지하는 친구',
    colorBtoA: '#3B82F6',
    gradient: { fromColor: '#10B981', toColor: '#3B82F6' }, // 생각이 다를 때 그라데이션
    style: 'solid',
    strokeWidth: 3,
    curvature: 20,
    legendId: 'leg-friendly',
    showLabel: false,
  },
  {
    id: 'rel-tanjiro-inosuke',
    sourceId: 'char-tanjiro',
    targetId: 'char-inosuke',
    relationType: '라이벌',
    label: '라이벌',
    direction: 'bidirectional',
    color: '#F97316',
    emotionAtoB: '함께 성장하는 좋은 라이벌',
    colorAtoB: '#10B981',
    emotionBtoA: '넘어서고 싶은 상대',
    colorBtoA: '#F97316',
    gradient: { fromColor: '#10B981', toColor: '#F97316' }, // 생각이 다를 때 그라데이션
    style: 'solid',
    strokeWidth: 3,
    curvature: 15,
    legendId: 'leg-rival',
    showLabel: false,
  },
  {
    id: 'rel-tanjiro-giyu',
    sourceId: 'char-tanjiro',
    targetId: 'char-giyu',
    relationType: '신뢰',
    label: '신뢰',
    direction: 'bidirectional',
    color: '#3B82F6',
    emotionAtoB: '깊은 존경과 감사',
    colorAtoB: '#3B82F6',
    emotionBtoA: '촉망받는 후배',
    colorBtoA: '#10B981',
    gradient: { fromColor: '#3B82F6', toColor: '#10B981' },
    style: 'solid',
    strokeWidth: 3,
    curvature: 10,
    legendId: 'leg-trust',
    showLabel: false,
  },
  {
    id: 'rel-tanjiro-shinobu',
    sourceId: 'char-tanjiro',
    targetId: 'char-shinobu',
    relationType: '우호',
    label: '우호',
    direction: 'bidirectional',
    color: '#10B981',
    style: 'solid',
    strokeWidth: 3,
    curvature: -15,
    legendId: 'leg-friendly',
    showLabel: false,
  },
  {
    id: 'rel-tanjiro-gyomei',
    sourceId: 'char-tanjiro',
    targetId: 'char-gyomei',
    relationType: '복잡한 관계',
    label: '복잡한 관계',
    direction: 'bidirectional',
    color: '#6B7280',
    style: 'dashed',
    strokeWidth: 2.5,
    curvature: 0,
    legendId: 'leg-complex',
    showLabel: false,
  },
];

export const INITIAL_RELATIONS_DATA: CharacterRelationsDocData = {
  characters: INITIAL_CHARACTERS,
  relations: INITIAL_RELATIONS,
  legends: DEFAULT_RELATION_LEGENDS,
  legendSettings: {
    visible: true,
    x: 28,
    y: 28,
    orientation: 'vertical',
  },
  settings: {
    canvasBackground: '#FAFAFD',
    showGrid: true,
    zoom: 100,
    defaultNodeShape: 'circle',
  },
};

export const PROFILE_RADIUS = 44; // 88px 기준

export function getNodeDimensions(shape?: string, size?: number) {
  const s = size || 88;
  return { width: s, height: s, radius: s / 2 };
}

export interface NodePosition {
  x: number;
  y: number;
  angle: number;
}

/**
 * 캐릭터 목록이 늘어나거나 줄어들 때 완벽한 도넛 형태로 자동 균등 배치
 */
export function calculateDonutPositions(
  characters: RelationCharacter[],
  centerX: number,
  centerY: number,
  radiusOverride?: number
): Map<string, NodePosition> {
  const map = new Map<string, NodePosition>();
  const count = characters.length;
  if (count === 0) return map;

  if (count === 1) {
    map.set(characters[0].id, { x: centerX, y: centerY, angle: 0 });
    return map;
  }

  const nodeSize = 88;
  const desiredArcSpacing = nodeSize + 48;
  const computedRadius = Math.round((count * desiredArcSpacing) / (2 * Math.PI));
  const radius = radiusOverride || Math.max(220, Math.min(520, computedRadius));

  characters.forEach((char, index) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * index) / count;
    const x = Math.round(centerX + radius * Math.cos(angle));
    const y = Math.round(centerY + radius * Math.sin(angle));
    map.set(char.id, { x, y, angle });
  });

  return map;
}

export const calculateCircularPositions = calculateDonutPositions;

export function getAnchorCoordinates(
  pos: { x: number; y: number },
  anchor: AnchorPosition,
  shape?: string,
  size?: number
): { x: number; y: number } {
  const { radius } = getNodeDimensions(shape, size);
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

export function getProfileEdgePoints(
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  fromAnchor?: AnchorPosition,
  toAnchor?: AnchorPosition,
  fromShape?: string,
  toShape?: string,
  customCurvature?: number,
  fromSize?: number,
  toSize?: number
): {
  start: { x: number; y: number };
  end: { x: number; y: number };
  ctrl: { x: number; y: number };
  mid: { x: number; y: number };
} {
  let startX = fromPos.x;
  let startY = fromPos.y;
  let endX = toPos.x;
  let endY = toPos.y;

  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const fromDims = getNodeDimensions(fromShape, fromSize);
  const toDims = getNodeDimensions(toShape, toSize);

  if (fromAnchor) {
    const pt = getAnchorCoordinates(fromPos, fromAnchor, fromShape, fromSize);
    startX = pt.x;
    startY = pt.y;
  } else if (dist > 0) {
    startX = fromPos.x + (dx / dist) * fromDims.radius;
    startY = fromPos.y + (dy / dist) * fromDims.radius;
  }

  if (toAnchor) {
    const pt = getAnchorCoordinates(toPos, toAnchor, toShape, toSize);
    endX = pt.x;
    endY = pt.y;
  } else if (dist > 0) {
    endX = toPos.x - (dx / dist) * toDims.radius;
    endY = toPos.y - (dy / dist) * toDims.radius;
  }

  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  const normX = -dy / (dist || 1);
  const normY = dx / (dist || 1);
  const curveAmount =
    customCurvature !== undefined
      ? customCurvature
      : Math.min(28, Math.max(12, dist * 0.06));

  const ctrlX = midX + normX * curveAmount;
  const ctrlY = midY + normY * curveAmount;

  const curveMidX = 0.25 * startX + 0.5 * ctrlX + 0.25 * endX;
  const curveMidY = 0.25 * startY + 0.5 * ctrlY + 0.25 * endY;

  return {
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
    ctrl: { x: ctrlX, y: ctrlY },
    mid: { x: curveMidX, y: curveMidY },
  };
}

export function convertLegacyToRelations(raw: any): CharacterRelationsDocData {
  if (!raw) return INITIAL_RELATIONS_DATA;

  if (Array.isArray(raw.characters) && Array.isArray(raw.relations)) {
    return {
      ...raw,
      legends: raw.legends || DEFAULT_RELATION_LEGENDS,
      legendSettings: raw.legendSettings || {
        visible: true,
        x: 28,
        y: 28,
        orientation: 'vertical',
      },
    } as CharacterRelationsDocData;
  }

  return INITIAL_RELATIONS_DATA;
}
