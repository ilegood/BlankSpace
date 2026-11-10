import {
  WorldSheetDocData,
  WorldSheetItem,
} from '../../../../types/worldSheet';

export const INITIAL_WORLD_SHEET_DATA: WorldSheetDocData = {
  worldName: '에르제니아',
  oneLineIntro: '고대 마법 문명의 유적과 태고의 정령이 숨 쉬는 광대한 판타지 세계',
  coverImageUrl:
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
  items: [
    {
      id: 'item-detail-1',
      type: 'detail-card',
      title: '세계관 기본 정보',
      order: 1,
      detailItems: [
        { id: 'dt-1', label: '장르', value: '하이 판타지 / 서사시' },
        { id: 'dt-2', label: '시대 배경', value: '신화 이후 제3시대 (마법 공학과 왕국의 번영기)' },
        { id: 'dt-3', label: '문명 수준', value: '마나 스톤 기반의 중세-마법 복합 문명' },
        { id: 'dt-4', label: '세계 규모', value: '3개 대륙, 2개 대양 및 부유도 군락' },
      ],
    },
    {
      id: 'item-narrative-1',
      type: 'narrative-card',
      title: '세계관 개요 및 기원',
      order: 2,
      narrativeText:
        '태초에 다섯 정령의 숨결에서 태어난 에르제니아 대륙은 수천 년 동안 마법과 조화를 이루며 번영했습니다.\n\n그러나 백 년 전 일어난 \'대균열\' 사건으로 인해 고대 마법 유적들이 깨어나고, 대륙 곳곳에서 불안정한 마나의 격류가 흐르기 시작했습니다. 현재 각 왕국과 세력은 미지의 고대 힘을 차지하기 위해 새로운 동맹과 갈등의 기로에 서 있습니다.',
    },
    {
      id: 'item-category-1',
      type: 'category-card',
      title: '주요 종족 및 기원',
      order: 3,
      categoryTags: [
        { id: 'tag-1', text: '인간 왕족 및 시민', color: '#8B5CF6' },
        { id: 'tag-2', text: '하이 엘프', color: '#10B981' },
        { id: 'tag-3', text: '드워프 대장장이', color: '#F59E0B' },
        { id: 'tag-4', text: '정령술사', color: '#3B82F6' },
        { id: 'tag-5', text: '태고의 용족', color: '#EC4899' },
      ],
    },
    {
      id: 'item-location-1',
      type: 'location-intro',
      title: '대표 지역 소개',
      order: 4,
      locations: [
        {
          id: 'loc-1',
          name: '성도 아르카디아',
          imageUrl:
            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop',
          summary: '중앙 대륙의 중심에 위치한 거대한 백색 성벽의 제국 수도',
          features: '대마법 학회 본원, 성령의 대성당, 공중 회랑',
        },
        {
          id: 'loc-2',
          name: '황혼의 안개숲',
          imageUrl:
            'https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=400&auto=format&fit=crop',
          summary: '빛과 어둠이 교차하며 고대 정령들이 은신하는 신비로운 수림',
          features: '세계수의 뿌리, 몽환의 반딧불 습지, 출입 통제 구역',
        },
      ],
    },
    {
      id: 'item-gallery-1',
      type: 'image-gallery',
      title: '세계관 비주얼 레퍼런스',
      order: 5,
      images: [
        {
          id: 'img-1',
          imageUrl:
            'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
          caption: '제국 수도 아르카디아의 주 회랑 및 마법 첨탑',
          tag: '건축 양식',
        },
        {
          id: 'img-2',
          imageUrl:
            'https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=600&auto=format&fit=crop',
          caption: '안개숲 깊은 곳에 남아있는 정령의 제단',
          tag: '풍경 & 무드',
        },
        {
          id: 'img-3',
          imageUrl:
            'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
          caption: '남부 무역항의 황혼 풍경과 고대 등대',
          tag: '풍경 & 무드',
        },
      ],
    },
    {
      id: 'item-linked-1',
      type: 'linked-documents',
      title: '관련 설정 문서',
      order: 6,
      linkedDocIds: [],
    },
    {
      id: 'item-memo-1',
      type: 'memo-card',
      title: '세계관 기획 메모',
      order: 7,
      memoContent:
        '마나 스톤의 고갈 위험성을 다룬 서브 플롯을 메인 시나리오 2장에 배치할 예정. 고대 유적 수호자와의 조우 연출 검토 필요.',
      memoTheme: 'yellow',
    },
  ],
  updatedAt: Date.now(),
};

export function convertLegacyToWorldSheet(raw: any): WorldSheetDocData {
  if (!raw) return INITIAL_WORLD_SHEET_DATA;

  // 1. 이미 신규 포맷(items 배열)인 경우
  if (Array.isArray(raw.items)) {
    return {
      worldName: raw.worldName || '에르제니아',
      oneLineIntro: raw.oneLineIntro || '',
      coverImageUrl: raw.coverImageUrl || INITIAL_WORLD_SHEET_DATA.coverImageUrl,
      items: raw.items,
      updatedAt: raw.updatedAt || Date.now(),
    };
  }

  // 2. 구버전 WorldRegionData 포맷인 경우 마이그레이션
  if (raw.worldName || raw.worldSummary || raw.regions) {
    const items: WorldSheetItem[] = [];
    let order = 1;

    // 세부사항 카드
    if (raw.worldType || raw.worldScale) {
      items.push({
        id: `migrated-detail-${order}`,
        type: 'detail-card',
        title: '세계관 기본 정보',
        order: order++,
        detailItems: [
          { id: 'dt-1', label: '세계 유형', value: raw.worldType || '판타지 대륙' },
          { id: 'dt-2', label: '세계 규모', value: raw.worldScale || '3개 대륙' },
        ],
      });
    }

    // 서술형 카드
    if (raw.worldSummary) {
      items.push({
        id: `migrated-narrative-${order}`,
        type: 'narrative-card',
        title: '세계관 개요',
        order: order++,
        narrativeText: raw.worldSummary,
      });
    }

    // 지역 소개
    if (Array.isArray(raw.regions) && raw.regions.length > 0) {
      items.push({
        id: `migrated-loc-${order}`,
        type: 'location-intro',
        title: '대표 지역 소개',
        order: order++,
        locations: raw.regions.map((r: any, idx: number) => ({
          id: r.id || `loc-${idx}`,
          name: r.name || '지역명',
          imageUrl: r.imageUrl || '',
          summary: r.desc || '',
          features: r.location ? `위치: ${r.location}` : '',
        })),
      });
    }

    // 카테고리 카드 (기존 세력 데이터)
    if (Array.isArray(raw.factions) && raw.factions.length > 0) {
      items.push({
        id: `migrated-cat-${order}`,
        type: 'category-card',
        title: '주요 세력 키워드',
        order: order++,
        categoryTags: raw.factions.map((f: any, idx: number) => ({
          id: f.id || `tag-${idx}`,
          text: f.name || '세력명',
          color: '#8B5CF6',
        })),
      });
    }

    // 관련 문서 연결 기본 추가
    items.push({
      id: `migrated-link-${order}`,
      type: 'linked-documents',
      title: '관련 설정 문서',
      order: order++,
      linkedDocIds: [],
    });

    return {
      worldName: raw.worldName || '에르제니아',
      oneLineIntro: raw.worldSummary ? raw.worldSummary.slice(0, 60) + '...' : '',
      coverImageUrl: INITIAL_WORLD_SHEET_DATA.coverImageUrl,
      items: items.length > 0 ? items : INITIAL_WORLD_SHEET_DATA.items,
      updatedAt: Date.now(),
    };
  }

  // 3. 기타 마크다운 등인 경우
  return INITIAL_WORLD_SHEET_DATA;
}
