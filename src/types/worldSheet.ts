// 세계관 시트(World Sheet) 템플릿 데이터 모델

export type WorldSheetItemType =
  | 'detail-card'       // 세부사항 카드 (키-값 쌍)
  | 'category-card'     // 카테고리 카드 (키워드/태그)
  | 'narrative-card'    // 서술형 카드 (상세 서술 텍스트)
  | 'memo-card'         // 메모 카드 (아이디어/메모)
  | 'location-intro'    // 추가 항목 1: 지역 소개
  | 'image-gallery'     // 추가 항목 2: 이미지 / 레퍼런스
  | 'linked-documents'; // 추가 항목 3: 관련 문서 연결

// 1. 세부사항 카드 내부 항목
export interface WorldDetailItem {
  id: string;
  label: string; // 예: "장르", "테마", "시대 배경", "문명 수준"
  value: string; // 예: "하이 판타지", "고대 마법 문명과 신화", "중세 판타지", "마법 공학"
}

// 2. 카테고리 카드 내부 태그
export interface WorldCategoryTag {
  id: string;
  text: string;  // 예: "엘프", "드워프", "정령", "고대 용족"
  color?: string;
}

// 3. 지역 소개 내부 항목
export interface WorldLocationItem {
  id: string;
  name: string;              // 지역 이름 (예: "아르카디아 성도")
  imageUrl?: string;         // 대표 이미지 URL
  summary: string;           // 한 줄 소개
  features: string;          // 주요 특징 (지형, 기후, 대표 명소 등)
  linkedDocId?: string;      // 관련 지역 및 장소 문서 연결 ID
  linkedDocTitle?: string;   // 캐싱된 문서 제목
}

// 4. 이미지 레퍼런스 내부 항목
export interface WorldReferenceImage {
  id: string;
  imageUrl: string;          // 이미지 URL
  caption: string;           // 이미지에 대한 간단한 설명
  tag?: string;              // 분류 (풍경, 건축 양식, 색감, 랜드마크 등)
}

// 공통 카드 래퍼
export interface WorldSheetItem {
  id: string;
  type: WorldSheetItemType;
  title: string;             // 카드 제목 (사용자가 자유롭게 이름 변경 가능)
  order: number;             // 정렬 순서

  // 유형별 데이터 필드
  detailItems?: WorldDetailItem[];
  categoryTags?: WorldCategoryTag[];
  narrativeText?: string;
  memoContent?: string;
  memoTheme?: 'yellow' | 'purple' | 'blue' | 'green' | 'pink';
  locations?: WorldLocationItem[];
  images?: WorldReferenceImage[];
  linkedDocIds?: string[];
}

// 전체 세계관 시트 문서 데이터
export interface WorldSheetDocData {
  worldName: string;         // 세계관 이름 (예: "에르제니아")
  oneLineIntro: string;      // 세계관 한 줄 소개
  coverImageUrl?: string;    // 세계관 대표 커버 이미지
  items: WorldSheetItem[];   // 자유롭게 추가/삭제/정렬 가능한 카드 목록
  updatedAt: number;
}

