import {
  CharacterRelationsDocData,
  RelationCharacter,
  RelationItem,
  AnchorPosition,
  DEFAULT_RELATION_LEGENDS,
} from '../../../../types/relations';

export const INITIAL_CHARACTERS: RelationCharacter[] = [
  {
    id: 'char-liam',
    name: 'Liam',
    imageUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    showName: true,
  },
  {
    id: 'char-emma',
    name: 'Emma',
    imageUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    showName: true,
  },
  {
    id: 'char-noah',
    name: 'Noah',
    imageUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    showName: true,
  },
  {
    id: 'char-olivia',
    name: 'Olivia',
    imageUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    showName: true,
  },
  {
    id: 'char-lucas',
    name: 'Lucas',
    imageUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    showName: true,
  },
  {
    id: 'char-sophia',
    name: 'Sophia',
    imageUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300&auto=format&fit=crop',
    shape: 'circle',
    size: 88,
    borderWidth: 4,
    showName: true,
  },
];

export const INITIAL_RELATIONS: RelationItem[] = [
  {
    id: 'rel-liam-emma',
    sourceId: 'char-liam',
    targetId: 'char-emma',
    relationType: '우호적 / 적대적',
    direction: 'bidirectional',
    color: '#3B82F6',
    legendIdAtoB: 'leg-friendly',
    emotionAtoB: '우호적',
    colorAtoB: '#3B82F6',
    legendIdBtoA: 'leg-hostile',
    emotionBtoA: '적대적',
    colorBtoA: '#EF4444',
    gradient: { fromColor: '#3B82F6', toColor: '#EF4444' },
    style: 'solid',
    strokeWidth: 3.5,
    curvature: 15,
  },
  {
    id: 'rel-noah-olivia',
    sourceId: 'char-noah',
    targetId: 'char-olivia',
    relationType: '우호적',
    direction: 'bidirectional',
    color: '#3B82F6',
    legendIdAtoB: 'leg-friendly',
    emotionAtoB: '우호적',
    colorAtoB: '#3B82F6',
    legendIdBtoA: 'leg-friendly',
    emotionBtoA: '우호적',
    colorBtoA: '#3B82F6',
    style: 'solid',
    strokeWidth: 3.5,
    curvature: -15,
  },
  {
    id: 'rel-lucas-sophia',
    sourceId: 'char-lucas',
    targetId: 'char-sophia',
    relationType: '적대적',
    direction: 'bidirectional',
    color: '#EF4444',
    legendIdAtoB: 'leg-hostile',
    emotionAtoB: '적대적',
    colorAtoB: '#EF4444',
    legendIdBtoA: 'leg-hostile',
    emotionBtoA: '적대적',
    colorBtoA: '#EF4444',
    style: 'solid',
    strokeWidth: 3.5,
    curvature: 10,
  },
  {
    id: 'rel-liam-noah',
    sourceId: 'char-liam',
    targetId: 'char-noah',
    relationType: '우호적',
    direction: 'bidirectional',
    color: '#3B82F6',
    legendIdAtoB: 'leg-friendly',
    emotionAtoB: '우호적',
    colorAtoB: '#3B82F6',
    legendIdBtoA: 'leg-friendly',
    emotionBtoA: '우호적',
    colorBtoA: '#3B82F6',
    style: 'solid',
    strokeWidth: 3.5,
    curvature: -10,
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
