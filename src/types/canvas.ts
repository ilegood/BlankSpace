export type CanvasElementType =
  // A. 공통 컴포넌트 (13종)
  | 'image-card'            // 1) 이미지 카드
  | 'gallery-card'          // 2) 이미지 갤러리
  | 'text-card'             // 3) 텍스트 카드
  | 'narrative-card'        // 4) 서술 카드
  | 'detail-card'           // 5) 세부사항 카드
  | 'tag-card'              // 6) 태그 카드
  | 'quote-card'            // 7) 인용 카드
  | 'table-card'            // 8) 표 카드
  | 'palette-card'          // 9) 컬러 팔레트
  | 'doc-link-card'         // 10) 문서 링크 카드
  | 'video-card'            // 11) 동영상 카드
  | 'audio-card'            // 12) 오디오 카드
  | 'memo-card'             // 13) 메모 카드

  // B. 캐릭터 특화 컴포넌트 (3종)
  | 'profile-card'          // 14) 프로필 카드
  | 'stat-card'             // 15) 스탯 카드
  | 'relationship-card'     // 16) 관계 요약 카드

  // C. 세계관 특화 컴포넌트 (3종)
  | 'hierarchy-card'        // 17) 계층 구조 카드
  | 'category-list-card'    // 18) 분류 목록 카드
  | 'zone-card'             // 19) 구역 카드

  // D. 레이아웃 요소 (4종)
  | 'section-heading'       // 20) 섹션 제목
  | 'divider'               // 21) 구분선
  | 'spacer'                // 22) 여백
  | 'group-container'       // 23) 그룹 컨테이너

  // 기존 호환성 유지용 별칭
  | 'character-image'
  | 'name-badge'
  | 'info-card'
  | 'keyword-card'
  | 'radar-chart'
  | 'image'
  | 'heading'
  | 'text'
  | 'info-field'
  | 'status-chart'
  | 'container';

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
  color?: string;      // 관계 상태 배지 색상
  avatarUrl?: string;
  documentId?: string; // 연결된 내부 캐릭터 문서 ID
  documentTitle?: string;
}

// 6. 컬러 팔레트 항목
export interface PaletteColorItem {
  id: string;
  color: string;       // 예: "#8B5CF6"
  label?: string;       // 예: "메인", "서브", "포인트", "피부톤"
}

// 7. 갤러리 이미지 항목
export interface GalleryImageItem {
  id: string;
  url: string;
  caption?: string;
  alt?: string;
  tag?: string;
}

// 8. 스탯 항목
export interface StatCardItem {
  id: string;
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
}

// 9. 계층 구조 항목
export interface HierarchyItem {
  id: string;
  label: string;
  description?: string;
  parentId?: string | null;
  isOpen?: boolean;
}

// 10. 분류 목록 항목
export interface CategoryGroupItem {
  id: string;
  name: string;
  description?: string;
  items: { id: string; text: string; subText?: string }[];
}

// 11. 구역 카드 장소 항목 (내부 문서 연결 지원)
export interface ZoneLocationItem {
  id: string;
  name: string;
  icon?: string;
  imageUrl?: string;
  summary?: string;
  features?: string;
  documentId?: string;
  documentTitle?: string;
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

  // 10. 컬러 팔레트 카드 (Palette Card)
  paletteColors?: PaletteColorItem[];
  paletteShape?: 'circle' | 'rounded' | 'square';
  showPaletteHex?: boolean;

  // 11. 이미지 캡션 및 비율
  caption?: string;

  // 12. 이미지 갤러리 (Gallery Card)
  galleryImages?: GalleryImageItem[];

  // 13. 표 카드 (Table Card)
  tableHeaders?: string[];
  tableRows?: string[][];

  // 14. 문서 링크 카드 (Doc Link Card)
  targetDocumentId?: string;
  targetDocumentTitle?: string;

  // 15. 동영상 및 오디오 카드
  videoUrl?: string;
  audioUrl?: string;
  audioFileName?: string;

  // 16. 프로필 카드 (Profile Card)
  profileImageUrl?: string;
  profileName?: string;
  profileNickname?: string;
  profileSummary?: string;

  // 17. 스탯 카드 (Stat Card)
  statMode?: 'number' | 'bar' | 'radar';
  statItems?: StatCardItem[];

  // 18. 계층 구조 카드 (Hierarchy Card)
  hierarchyItems?: HierarchyItem[];

  // 19. 분류 목록 카드 (Category List Card)
  categoryGroups?: CategoryGroupItem[];

  // 20. 구역 카드 (Zone Card)
  zoneLocations?: ZoneLocationItem[];

  // 21. 여백 (Spacer)
  spacerHeight?: number;

  // 22. 구버전 호환 필드
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
