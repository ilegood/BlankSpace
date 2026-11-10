// 지도 및 세력(Map & Factions) 템플릿 데이터 모델

export type MapElementType = 'country' | 'region' | 'faction' | 'location';

// 1. 지도 위 배치 요소 (마커 및 카드)
export interface MapElement {
  id: string;
  name: string;
  type: MapElementType;
  description: string;
  imageUrl?: string;
  targetDocId?: string;       // 연결된 Blankspace 문서 ID
  targetDocTitle?: string;    // 연결된 문서 제목 캐시
  memo?: string;              // 추가 기획 메모
  x: number;                  // 지도 이미지 기준 백분율 (0 ~ 100%)
  y: number;                  // 지도 이미지 기준 백분율 (0 ~ 100%)
  size?: 'sm' | 'md' | 'lg';  // 마커 크기
  visible: boolean;           // 표시/숨기기
  color?: string;             // 커스텀 포인트 색상
}

// 2. 세력 영토 경계선 다각형 (Polygon)
export interface TerritoryPolygon {
  id: string;
  name: string;               // 영역 이름 (예: "성령 제국 직할령", "동부 완충지대")
  factionId?: string;         // 소속 세력 요소 ID (선택 사항)
  factionName?: string;       // 소속 세력 명칭
  points: { x: number; y: number }[]; // 백분율 좌표 배열 (0 ~ 100%)
  strokeColor: string;        // 경계선 색상 (예: '#8B5CF6')
  strokeWidth: number;        // 경계선 두께
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  fillColor: string;          // 영역 내부 채우기 색상
  fillOpacity: number;        // 내부 투명도 (0.0 ~ 1.0, 0이면 채우지 않음)
  description?: string;       // 영역 설명
  targetDocId?: string;       // 관련 문서 연결
  targetDocTitle?: string;
  visible: boolean;           // 표시 여부
}

// 3. 지도 설정
export interface MapSettings {
  showElementLabels: boolean;
  showTerritoryLabels: boolean;
  showGrid: boolean;
  defaultMarkerSize: 'sm' | 'md' | 'lg';
}

// 4. 전체 지도 및 세력 문서 데이터
export interface WorldMapDocData {
  mapImageUrl: string;
  mapImageWidth?: number;
  mapImageHeight?: number;
  elements: MapElement[];
  territories: TerritoryPolygon[];
  settings: MapSettings;
  updatedAt: number;
}
