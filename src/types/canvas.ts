export type CanvasElementType =
  // 1. 의미 있는 단위의 캐릭터 시트 구성 요소
  | 'character-image'       // 캐릭터 이미지 (프레임, 자르기 등)
  | 'name-badge'             // 이름 요소 (복수 필드 지원)
  | 'info-card'              // 공통 정보 카드 (기본/상세 통합)
  | 'narrative-card'         // 서술형 상세 정보 카드 (성격, 배경, 외형 등)
  | 'keyword-card'           // 카테고리 & 키워드 카드 (태그/표)
  | 'radar-chart'            // 능력치 레이더 차트 (3~8축)
  | 'relationship-card'      // 관계 요약 카드
  | 'quote-card'             // 대표 대사 카드
  | 'memo-card'              // 메모 카드
  // 2. 구버전 및 기본 호환 타입
  | 'image'
  | 'heading'
  | 'text'
  | 'info-field'
  | 'status-chart'
  | 'container'
  | 'divider';

// 그라데이션 설정
export interface CanvasGradient {
  enabled: boolean;
  startColor: string;
  endColor: string;
  direction: 'to-b' | 'to-r' | 'to-br' | 'to-tr';
}

// 배경 패턴 설정
export interface CanvasPattern {
  type: 'none' | 'dots' | 'grid';
  color: string;
  size: number;
  gap: number;
}

// 캔버스 요소 스타일
export interface CanvasElementStyle {
  backgroundColor?: string;
  gradient?: CanvasGradient;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  opacity?: number;
  padding?: number;
  gap?: number;
  boxShadow?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
}

// 1. 이름 필드 (복수 필드 지원)
export interface NameField {
  id: string;
  label: string;       // 예: "이름", "본명", "칭호", "코드네임", "영문명"
  value: string;       // 예: "카일", "카일 아르젠", "새벽의 기사"
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  isPrimary?: boolean;
}

// 2. 공통 정보 카드 항목
export interface InfoCardItem {
  id: string;
  label: string;       // 예: "나이", "소속", "신장", "생일", "무기"
  value: string;       // 예: "19세", "노바 기사단", "168cm", "10월 14일"
}

// 3. 키워드/태그 항목
export interface KeywordTag {
  id: string;
  text: string;        // 예: "원칙주의", "원소검술", "냉정"
  color?: string;
}

// 4. 레이더 차트 축
export interface RadarAxis {
  id: string;
  label: string;       // 예: "공격력", "방어력", "민첩성", "지능", "마력"
  value: number;       // 수치 (0 ~ maxValue)
}

// 5. 관계 요약 항목
export interface RelationshipItem {
  id: string;
  name: string;        // 대상 인물명
  relation: string;    // 관계 유형 (동료, 라이벌, 스승, 가족 등)
  description: string; // 한줄 설명
  avatarUrl?: string;
}

// 구버전 호환용 인터페이스
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

// 구성 요소 콘텐츠 데이터 모델
export interface CanvasElementContent {
  // 공통 제목
  title?: string;

  // 1. 이미지
  imageUrl?: string;
  alt?: string;
  aspectRatio?: boolean;

  // 2. 이름 요소 (Name Badge)
  nameFields?: NameField[];

  // 3. 공통 정보 카드 (Info Card)
  infoCardItems?: InfoCardItem[];
  infoDisplayMode?: 'list-vertical' | 'list-horizontal' | 'grid-2col' | 'table';

  // 4. 서술형 상세 정보 카드 (Narrative Card)
  narrativeText?: string;
  placeholder?: string;

  // 5. 키워드 카드 (Keyword Card)
  tags?: KeywordTag[];
  tagDisplayMode?: 'chips' | 'table';

  // 6. 능력치 레이더 차트 (Radar Chart)
  radarAxes?: RadarAxis[];
  radarMaxValue?: number;
  radarColor?: string;
  radarFillOpacity?: number;

  // 7. 관계 요약 카드 (Relationship Card)
  relationships?: RelationshipItem[];

  // 8. 대표 대사 카드 (Quote Card)
  quoteText?: string;
  quoteSituation?: string;
  quoteStyle?: 'modern' | 'speech-bubble' | 'classic';

  // 9. 메모 카드 (Memo Card)
  memoContent?: string;

  // 10. 구버전 호환 필드
  text?: string;
  infoItems?: InfoItem[];
  layoutDirection?: 'horizontal' | 'vertical';
  stats?: StatItem[];
  statDisplayType?: 'card' | 'bar';
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
  backgroundColor?: string;
  gradient?: CanvasGradient;
  pattern?: CanvasPattern;
  elements: CanvasElement[];
}

export interface CustomCharacterTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  canvasData: CanvasDocumentData;
}
