import {
  WorldMapDocData,
  MapElement,
  TerritoryPolygon,
} from '../../../../types/mapFactions';

export const DEFAULT_MAP_URL =
  'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1600&auto=format&fit=crop';

export const INITIAL_MAP_ELEMENTS: MapElement[] = [
  {
    id: 'elem-1',
    name: '성령 제국 아르카디아',
    type: 'country',
    description: '빛의 성령을 섬기는 대륙 최강의 제국. 중앙 대륙 전역을 다스림.',
    imageUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300&auto=format&fit=crop',
    x: 42,
    y: 38,
    size: 'lg',
    visible: true,
    color: '#EF4444',
  },
  {
    id: 'elem-2',
    name: '은빛 십자 기사단',
    type: 'faction',
    description: '제국 변경과 성역을 수호하는 독립 정예 기사단.',
    imageUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    x: 35,
    y: 58,
    size: 'md',
    visible: true,
    color: '#8B5CF6',
  },
  {
    id: 'elem-3',
    name: '황혼의 안개숲',
    type: 'region',
    description: '고대 정령들과 마수들이 서식하는 미지의 수림 지대.',
    imageUrl:
      'https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=300&auto=format&fit=crop',
    x: 68,
    y: 32,
    size: 'md',
    visible: true,
    color: '#10B981',
  },
  {
    id: 'elem-4',
    name: '고대 천공 제단',
    type: 'location',
    description: '태고의 마법 공학 유적이 잠들어 있는 부유 바위 지대.',
    imageUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=300&auto=format&fit=crop',
    x: 74,
    y: 65,
    size: 'sm',
    visible: true,
    color: '#3B82F6',
  },
];

export const INITIAL_TERRITORIES: TerritoryPolygon[] = [
  {
    id: 'terr-1',
    name: '제국 중앙 직할령',
    factionId: 'elem-1',
    factionName: '성령 제국 아르카디아',
    points: [
      { x: 30, y: 24 },
      { x: 55, y: 22 },
      { x: 60, y: 46 },
      { x: 44, y: 55 },
      { x: 26, y: 42 },
    ],
    strokeColor: '#8B5CF6',
    strokeWidth: 2.5,
    strokeStyle: 'solid',
    fillColor: '#8B5CF6',
    fillOpacity: 0.22,
    description: '황제가 직접 통치하는 제국의 핵심 영토 및 행정 구역.',
    visible: true,
  },
  {
    id: 'terr-2',
    name: '남부 기사단 수호령',
    factionId: 'elem-2',
    factionName: '은빛 십자 기사단',
    points: [
      { x: 22, y: 52 },
      { x: 45, y: 56 },
      { x: 48, y: 78 },
      { x: 25, y: 76 },
    ],
    strokeColor: '#3B82F6',
    strokeWidth: 2,
    strokeStyle: 'dashed',
    fillColor: '#3B82F6',
    fillOpacity: 0.18,
    description: '은빛 십자 기사단이 방어선을 구축하고 있는 남부 경계 영역.',
    visible: true,
  },
];

export const INITIAL_MAP_DATA: WorldMapDocData = {
  mapImageUrl: DEFAULT_MAP_URL,
  elements: INITIAL_MAP_ELEMENTS,
  territories: INITIAL_TERRITORIES,
  settings: {
    showElementLabels: true,
    showTerritoryLabels: true,
    showGrid: false,
    defaultMarkerSize: 'md',
  },
  updatedAt: Date.now(),
};

// 구버전 및 기존 데이터 마이그레이션 함수
export function convertLegacyToWorldMap(raw: any): WorldMapDocData {
  if (!raw) return INITIAL_MAP_DATA;

  // 1. 이미 신규 데이터 포맷인 경우
  if (Array.isArray(raw.elements) && Array.isArray(raw.territories)) {
    return {
      mapImageUrl: raw.mapImageUrl || DEFAULT_MAP_URL,
      mapImageWidth: raw.mapImageWidth,
      mapImageHeight: raw.mapImageHeight,
      elements: raw.elements,
      territories: raw.territories,
      settings: {
        showElementLabels: raw.settings?.showElementLabels ?? true,
        showTerritoryLabels: raw.settings?.showTerritoryLabels ?? true,
        showGrid: raw.settings?.showGrid ?? false,
        defaultMarkerSize: raw.settings?.defaultMarkerSize ?? 'md',
      },
      updatedAt: raw.updatedAt || Date.now(),
    };
  }

  // 2. 구버전 WorldMapEditor 포맷 (mapImageUrl + markers)
  if (Array.isArray(raw.markers)) {
    const elements: MapElement[] = raw.markers.map((m: any, idx: number) => ({
      id: m.id || `elem-${idx + 1}`,
      name: m.name || '마커',
      type: (m.type as any) || 'region',
      description: m.description || '',
      imageUrl: m.imageUrl,
      targetDocId: m.targetDocId,
      x: typeof m.x === 'number' ? m.x : 50,
      y: typeof m.y === 'number' ? m.y : 50,
      size: 'md',
      visible: true,
    }));

    return {
      mapImageUrl: raw.mapImageUrl || DEFAULT_MAP_URL,
      elements: elements.length > 0 ? elements : INITIAL_MAP_ELEMENTS,
      territories: INITIAL_TERRITORIES,
      settings: {
        showElementLabels: true,
        showTerritoryLabels: true,
        showGrid: false,
        defaultMarkerSize: 'md',
      },
      updatedAt: Date.now(),
    };
  }

  // 3. 구버전 WorldRegionData 포맷 (regions + factions)
  if (Array.isArray(raw.regions)) {
    const elements: MapElement[] = raw.regions.map((r: any, idx: number) => ({
      id: r.id || `reg-${idx + 1}`,
      name: r.name || '지역',
      type: 'region',
      description: r.desc || '',
      imageUrl: r.imageUrl,
      x: 25 + (idx % 3) * 25,
      y: 30 + Math.floor(idx / 3) * 25,
      size: 'md',
      visible: true,
    }));

    return {
      mapImageUrl: DEFAULT_MAP_URL,
      elements,
      territories: INITIAL_TERRITORIES,
      settings: {
        showElementLabels: true,
        showTerritoryLabels: true,
        showGrid: false,
        defaultMarkerSize: 'md',
      },
      updatedAt: Date.now(),
    };
  }

  return INITIAL_MAP_DATA;
}
