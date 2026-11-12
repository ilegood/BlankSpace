import { CanvasDocumentData, CanvasElement, CustomCharacterTemplate } from '../../../../types/canvas';

// ============================================================================
// 세계관 시트(World Sheet) 기본 캔버스 프리셋 (기획서 3항 10종 기본 컴포넌트)
// ============================================================================
export const DEFAULT_WORLD_CANVAS: CanvasDocumentData = {
  canvasWidth: 1120,
  canvasHeight: 1420,
  zoom: 100,
  backgroundColor: '#FFFFFF',
  elements: [
    // ------------------------------------------------------------------------
    // [좌측 컬럼] 비주얼, 기본 정보, 태그, 자유 메모
    // ------------------------------------------------------------------------
    // 1. 세계관 대표 이미지
    {
      id: 'el-world-img',
      type: 'character-image',
      x: 36,
      y: 36,
      width: 380,
      height: 270,
      zIndex: 2,
      style: {
        padding: 0,
        borderRadius: 12,
        borderColor: '#E2E8F0',
        borderWidth: 1,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        objectFit: 'cover',
      },
      content: {
        title: '세계관 대표 이미지',
        imageUrl:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
        alt: '부유하는 천공 군도 아스트랄리아 컨셉 아트',
      },
    },

    // 2. 세계관 기본 정보 카드
    {
      id: 'el-world-info',
      type: 'info-card',
      x: 36,
      y: 326,
      width: 380,
      height: 380,
      zIndex: 2,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      },
      content: {
        title: '세계관 기본 정보',
        infoDisplayMode: 'list-vertical',
        infoCardItems: [
          { id: 'wi-1', label: '세계관 이름', value: '아스트랄리아 (Astralia)' },
          { id: 'wi-2', label: '영문 이름', value: 'The Realm of Astralia' },
          { id: 'wi-3', label: '한 줄 소개', value: '부유석 섬들과 에테르 마법이 공존하는 천공 세계' },
          { id: 'wi-4', label: '장르', value: '하이 판타지 / 스팀펑크' },
          { id: 'wi-5', label: '시대적 배경', value: '대붕괴 이후 320년 (부유 문명 중기)' },
          { id: 'wi-6', label: '세계의 규모', value: '7대 부유 공국 및 30여 개 독립 군도' },
          { id: 'wi-7', label: '주요 키워드', value: '에테르 결정, 비행선, 고대 유적, 마도 공학' },
        ],
      },
    },

    // 컬러 팔레트 카드
    {
      id: 'el-world-palette',
      type: 'palette-card',
      x: 36,
      y: 726,
      width: 380,
      height: 125,
      zIndex: 2,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      },
      content: {
        title: '세계관 대표 컬러 팔레트',
        showPaletteHex: true,
        paletteColors: [
          { id: 'wp-1', color: '#6D28D9', label: '마력 핵' },
          { id: 'wp-2', color: '#A855F7', label: '천공' },
          { id: 'wp-3', color: '#267B54', label: '부유 군도' },
          { id: 'wp-4', color: '#6EE7B7', label: '비행선' },
          { id: 'wp-5', color: '#F7F6F2', label: '구름 안개' },
        ],
      },
    },

    // 9. 태그 및 키워드 카드
    {
      id: 'el-world-tags',
      type: 'keyword-card',
      x: 36,
      y: 871,
      width: 380,
      height: 170,
      zIndex: 2,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      },
      content: {
        title: '태그 및 키워드',
        tagDisplayMode: 'chips',
        tags: [
          { id: 'wt-1', text: '하이 판타지', color: '#8B5CF6' },
          { id: 'wt-2', text: '스팀펑크', color: '#F59E0B' },
          { id: 'wt-3', text: '부유 군도', color: '#3B82F6' },
          { id: 'wt-4', text: '에테르 기관', color: '#10B981' },
          { id: 'wt-5', text: '비행선 무역', color: '#6366F1' },
          { id: 'wt-6', text: '고대 유적 탐사', color: '#EC4899' },
          { id: 'wt-7', text: '미지의 독무', color: '#64748B' },
        ],
      },
    },

    // 10. 자유 메모 카드
    {
      id: 'el-world-memo',
      type: 'memo-card',
      x: 36,
      y: 1061,
      width: 380,
      height: 380,
      zIndex: 2,
      style: {
        backgroundColor: '#FEF9C3',
        borderColor: '#FDE047',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      },
      content: {
        title: '자유 메모 & 미정 설정',
        memoContent:
          '• 남부 미개척 부유섬 군락에 고대 에테르 거인의 잔해가 매장되어 있다는 전설 추가 검토 필요\n• 제4공국 비행선 항로 관세 및 공적(하늘 해적) 연합의 세력권 지도 구체화\n• 지표면 독무 속에서 올라오는 미지의 침공 생명체 명칭 확정하기\n• 에테르 정제소 독점권을 둘러싼 귀족 가문 간의 암투 전개 구상',
      },
    },

    // ------------------------------------------------------------------------
    // [우측 컬럼] 개요, 역사, 구조, 종족, 사회, 규칙
    // ------------------------------------------------------------------------
    // 3. 세계관 개요 카드
    {
      id: 'el-world-overview',
      type: 'narrative-card',
      x: 436,
      y: 36,
      width: 648,
      height: 195,
      zIndex: 2,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      },
      content: {
        title: '세계관 개요',
        narrativeText:
          '대지의 심장이 파괴된 "대붕괴(Cataclysm)" 사건 이후, 지표면은 독성 안개로 뒤덮이고 인류는 하늘로 솟아오른 거대한 부유석 섬들 위로 터전을 옮겼습니다.\n\n살아남은 문명은 희귀 마력 광물인 "에테르 결정"을 정제하여 증기 기관과 결합한 마도공학 문명을 꽃피웠으며, 현재는 하늘을 누비는 비행선 무역과 고대 유적 발굴을 둘러싼 공국 간의 치열한 암투가 벌어지고 있습니다.',
      },
    },

    // 4. 역사 및 배경 카드
    {
      id: 'el-world-history',
      type: 'narrative-card',
      x: 436,
      y: 251,
      width: 648,
      height: 200,
      zIndex: 2,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      },
      content: {
        title: '역사 및 배경',
        narrativeText:
          '• **신화와 태초의 황금기**: 태초의 거인들이 에테르의 샘을 중심으로 거대한 지상 통일 제국을 건설함.\n• **대붕괴 (대재앙)**: 320년 전 에테르 핵 과부하 폭주로 대륙이 산산조각 나며 파편들이 공중으로 부유.\n• **부유 개척 시대**: 비행선 부유 추진 기관의 발명과 함께 흩어진 생존 군도들이 7대 공국 연합을 창설.\n• **현재의 상황**: 중심 에테르 광맥의 고갈 징후와 함께, 지표면 독무 속에서 기괴한 변이 생명체들이 상공으로 올라오기 시작함.',
      },
    },

    // 5. 세계의 구조 카드
    {
      id: 'el-world-structure',
      type: 'narrative-card',
      x: 436,
      y: 471,
      width: 648,
      height: 190,
      zIndex: 2,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      },
      content: {
        title: '세계의 구조 및 공간',
        narrativeText:
          '• **상층권 (하이 헤븐)**: 고도 4,000m 이상의 청명한 하늘 영역. 7대 공국의 최고위 왕족과 마도 원로들의 궁전 위치.\n• **중층권 (군도대 / 미들 아일스)**: 고도 1,500m ~ 3,000m의 주 거주 구역. 비행선 정박항, 상업 지구, 농경 부유섬 밀집.\n• **하층권 (그레이 클라우드)**: 지표면 독무 바로 위 어두운 경계선. 범죄 조직 요새와 에테르 불법 채굴 시설 암약.\n• **심연의 지표면 (어비스)**: 짙은 독무로 차단된 미답의 옛 지상 폐허.',
      },
    },

    // 6. 종족 및 생명체 카드
    {
      id: 'el-world-races',
      type: 'info-card',
      x: 436,
      y: 681,
      width: 648,
      height: 220,
      zIndex: 2,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      },
      content: {
        title: '종족 및 주요 생명체',
        infoDisplayMode: 'list-vertical',
        infoCardItems: [
          { id: 'rc-1', label: '인류 (에테리얼)', value: '마도 공학 기술과 비행선 항해술에 능하며 7대 공국 인구의 대다수를 차지' },
          { id: 'rc-2', label: '실피드 (천익족)', value: '가벼운 골격과 날개를 지닌 선주민, 기류와 바람의 원소 마법을 다룸' },
          { id: 'rc-3', label: '드워프 (철공 연맹)', value: '지하 암반 채굴과 증기 기관 제작의 대가로 부유섬 고정 앵커를 설계' },
          { id: 'rc-4', label: '에테르 비스트', value: '고농도 마력 방사선에 의해 변이된 비행 야수들로 항로 비행선들의 최대 위협' },
        ],
      },
    },

    // 7. 사회 및 문화 카드
    {
      id: 'el-world-society',
      type: 'info-card',
      x: 436,
      y: 921,
      width: 648,
      height: 220,
      zIndex: 2,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      },
      content: {
        title: '사회 및 문화 체계',
        infoDisplayMode: 'list-vertical',
        infoCardItems: [
          { id: 'sc-1', label: '정치 체계', value: '7대 부유 공국 연합 의회 (공국별 대귀족 가문의 과두 정권)' },
          { id: 'sc-2', label: '경제 및 산업', value: '에테르 결정 정제 독점권, 비행선 화물 무역 및 고대 유물 경매 시장' },
          { id: 'sc-3', label: '종교 및 신앙', value: '하늘의 영원한 숨결을 섬기는 "아이테르 성단 교회"' },
          { id: 'sc-4', label: '기술 수준', value: '19세기 빅토리아풍 증기 문명과 고대 마도 연금술이 융합된 마도스팀 테크' },
        ],
      },
    },

    // 8. 세계의 규칙 카드
    {
      id: 'el-world-rules',
      type: 'narrative-card',
      x: 436,
      y: 1161,
      width: 648,
      height: 180,
      zIndex: 2,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      },
      content: {
        title: '세계의 규칙 및 제약',
        narrativeText:
          '• **부유석의 물리 법칙**: 모든 부유섬은 중심부에 내장된 "에테르 코어"의 질량과 회전수에 비례하여 체공 고도가 유지된다.\n• **마법의 대가**: 에테르 마력을 과도하게 시전하면 시전자의 혈관과 신경이 에테르 결정으로 굳어지는 "결정화 병"이 진행된다.\n• **국제 절대 금기**: 전쟁 중 상대 공국의 부유 코어를 파괴하여 섬을 지표면 독무 속으로 추락시키는 행위는 즉결 사형에 처해진다.',
      },
    },
  ],
};

// ============================================================================
// 사용자 정의 템플릿 저장소 키
// ============================================================================
export const WORLD_TEMPLATE_STORAGE_KEY = 'blankspace_custom_world_templates';

// ============================================================================
// 내장 세계관 프리셋 목록
// ============================================================================
export const WORLD_BUILTIN_TEMPLATES: CustomCharacterTemplate[] = [
  {
    id: 'tpl-world-default',
    name: '천공 판타지 & 스팀펑크 시트',
    description: '10종 기본 컴포넌트(이미지, 기본정보, 개요, 역사, 구조, 종족, 사회, 규칙, 태그, 메모) 완비 템플릿',
    createdAt: 1700000000000,
    canvasData: DEFAULT_WORLD_CANVAS,
  },
  {
    id: 'tpl-world-scifi',
    name: '사이버펑크 & SF 성간 세계관 시트',
    description: '행성계, 메가코프 세력, 사이버네틱스 규칙, 테크놀로지 계층 구조에 특화된 템플릿',
    createdAt: 1700000001000,
    canvasData: {
      ...DEFAULT_WORLD_CANVAS,
      backgroundColor: '#0F172A',
      elements: DEFAULT_WORLD_CANVAS.elements.map((el) => {
        if (el.id === 'el-world-info') {
          return {
            ...el,
            content: {
              ...el.content,
              title: '행성계 & 세계관 기본 정보',
              infoCardItems: [
                { id: 'wi-1', label: '행성/성계명', value: '네오-바빌론 제3성구' },
                { id: 'wi-2', label: '문명 등급', value: '카르다쇼프 1.8단계' },
                { id: 'wi-3', label: '주요 메가코프', value: '신디케이트 다이내믹스, 사이버코어' },
                { id: 'wi-4', label: '시대적 배경', value: '서기 2184년 (포스트 사이버워)' },
                { id: 'wi-5', label: '지배 체제', value: '기업 연합 최고이사회' },
              ],
            },
          };
        }
        return el;
      }),
    },
  },
];

// ============================================================================
// 기존 구버전 데이터 호환용 마이그레이션 함수 (데이터 유실 방지)
// ============================================================================
export function convertOldDataToWorldCanvas(oldData: any): CanvasDocumentData {
  if (!oldData) return DEFAULT_WORLD_CANVAS;

  // 이미 CanvasDocumentData 규격인 경우
  if (Array.isArray(oldData.elements)) {
    return {
      canvasWidth: oldData.canvasWidth || 1120,
      canvasHeight: oldData.canvasHeight || 1420,
      zoom: oldData.zoom || 100,
      backgroundColor: oldData.backgroundColor || '#FFFFFF',
      gradient: oldData.gradient,
      pattern: oldData.pattern,
      elements: oldData.elements,
    };
  }

  // Older versions stored a plain text page or a raw list of world-sheet items.
  if (typeof oldData === 'string') {
    if (!oldData.trim()) return DEFAULT_WORLD_CANVAS;
    return {
      canvasWidth: 1120,
      canvasHeight: 700,
      zoom: 100,
      backgroundColor: '#FFFFFF',
      elements: [{
        id: 'migrated-world-text', type: 'narrative-card', x: 36, y: 36, width: 720, height: 240, zIndex: 1,
        style: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12 },
        content: { title: '이전 세계관 내용', narrativeText: oldData },
      }],
    };
  }

  let items = Array.isArray(oldData) ? oldData : oldData.items;
  if (!Array.isArray(items) && (oldData.worldName || oldData.worldSummary || Array.isArray(oldData.regions))) {
    items = [];
    if (oldData.worldSummary) {
      items.push({ id: 'legacy-world-summary', type: 'narrative-card', title: '세계관 개요', narrativeText: oldData.worldSummary, order: 1 });
    }
    if (Array.isArray(oldData.regions) && oldData.regions.length > 0) {
      items.push({
        id: 'legacy-world-regions', type: 'location-intro', title: '대표 지역 소개', order: 2,
        locations: oldData.regions.map((region: any, index: number) => ({
          id: region.id || `legacy-region-${index}`,
          name: region.name || '지역명',
          imageUrl: region.imageUrl,
          summary: region.summary || region.desc || '',
          features: region.features || region.location || '',
          linkedDocId: region.linkedDocId || region.documentId,
          linkedDocTitle: region.linkedDocTitle,
        })),
      });
    }
    if (Array.isArray(oldData.factions) && oldData.factions.length > 0) {
      items.push({
        id: 'legacy-world-factions', type: 'category-card', title: '주요 세력', order: 3,
        categoryTags: oldData.factions.map((faction: any, index: number) => ({
          id: faction.id || `legacy-faction-${index}`,
          text: faction.name || faction.title || '세력명',
          color: faction.color || '#8B5CF6',
        })),
      });
    }
  }
  if (!Array.isArray(items)) return DEFAULT_WORLD_CANVAS;

  const orderedItems = items
    .map((item: any, index: number) => ({ item, index }))
    .sort((a: { item: any; index: number }, b: { item: any; index: number }) =>
      (typeof a.item?.order === 'number' ? a.item.order : a.index) -
      (typeof b.item?.order === 'number' ? b.item.order : b.index)
    )
    .map(({ item }: { item: any; index: number }) => item);

  const elements: CanvasElement[] = [];
  const baseStyle = { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12 };
  let order = 0;
  let currentY = 36;
  const addElement = (
    item: any,
    type: CanvasElement['type'],
    content: CanvasElement['content'],
    height = 200,
    suffix = '',
    style: CanvasElement['style'] = baseStyle
  ) => {
    const stableItemId = String(item?.id || order);
    elements.push({
      id: `migrated-${stableItemId}${suffix}`,
      type,
      x: 436,
      y: currentY,
      width: 648,
      height,
      zIndex: order + 3,
      style: style ? { ...style } : undefined,
      content,
    });
    currentY += height + 20;
    order += 1;
  };

  const coverImageUrl = oldData.coverImageUrl;
  if (coverImageUrl) {
    elements.push({
      id: 'migrated-img', type: 'character-image', x: 36, y: 36, width: 380, height: 270, zIndex: 1,
      style: { borderRadius: 12, objectFit: 'cover' },
      content: { imageUrl: coverImageUrl, alt: oldData.worldName || '세계관 이미지' },
    });
  }

  const infoItems = [
    ['세계관 이름', oldData.worldName],
    ['영문 이름', oldData.worldEnglishName],
    ['한 줄 소개', oldData.oneLineIntro || oldData.oneLineSummary],
    ['장르', oldData.genre || oldData.worldType],
    ['시대적 배경', oldData.era],
    ['세계 규모', oldData.scale || oldData.worldScale],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (infoItems.length) {
    elements.push({
      id: 'migrated-info', type: 'info-card', x: 36, y: coverImageUrl ? 326 : 36, width: 380, height: 340, zIndex: 2,
      style: { ...baseStyle },
      content: {
        title: '세계관 기본 정보', infoDisplayMode: 'list-vertical',
        infoCardItems: infoItems.map(([label, value], idx) => ({ id: `m-info-${idx}`, label: String(label), value: String(value) })),
      },
    });
  }

  orderedItems.forEach((item: any, idx: number) => {
    if (!item || typeof item !== 'object') {
      addElement({ id: idx }, 'narrative-card', { title: '이전 설정', narrativeText: String(item ?? '') });
      return;
    }
    const title = item.title || '설정 카드';
    switch (item.type) {
      case 'detail-card':
        addElement(item, 'detail-card', {
          title, infoDisplayMode: 'list-vertical',
          infoCardItems: (item.detailItems || []).map((detail: any, detailIdx: number) => ({
            id: detail.id || `m-${item.id || idx}-detail-${detailIdx}`,
            label: detail.label || '항목', value: detail.value || '',
          })),
        });
        break;
      case 'category-card':
        addElement(item, 'tag-card', {
          title, tags: (item.categoryTags || []).map((tag: any, tagIdx: number) => ({
            id: tag.id || `m-${item.id || idx}-tag-${tagIdx}`, text: tag.text || '', color: tag.color,
          })),
        });
        break;
      case 'narrative-card':
        addElement(item, 'narrative-card', { title, narrativeText: item.narrativeText || item.content || '' });
        break;
      case 'memo-card': {
        const memoColors: Record<string, string> = {
          yellow: '#FEF9C3', purple: '#F3E8FF', blue: '#E0F2FE', green: '#DCFCE7', pink: '#FCE7F3',
        };
        addElement(item, 'memo-card', { title, memoContent: item.memoContent || '' }, 180, '', {
          ...baseStyle, backgroundColor: memoColors[item.memoTheme] || '#FEF9C3',
        });
        break;
      }
      case 'location-intro':
        addElement(item, 'zone-card', {
          title,
          zoneLocations: (item.locations || []).map((location: any, locIdx: number) => ({
            id: location.id || `m-${item.id || idx}-location-${locIdx}`,
            name: location.name || '', icon: location.icon, imageUrl: location.imageUrl,
            summary: location.summary || '', features: location.features || '',
            documentId: location.linkedDocId, documentTitle: location.linkedDocTitle,
          })),
        }, 200);
        break;
      case 'image-gallery':
        addElement(item, 'gallery-card', {
          title,
          galleryImages: (item.images || []).map((image: any, imageIdx: number) => ({
            id: image.id || `m-${item.id || idx}-image-${imageIdx}`,
            url: image.imageUrl || '', caption: image.caption || '', tag: image.tag,
          })),
        }, 260);
        break;
      case 'linked-documents': {
        const linkedDocIds = Array.isArray(item.linkedDocIds) ? item.linkedDocIds : [];
        if (linkedDocIds.length === 0) {
          addElement(item, 'doc-link-card', { title, targetDocumentId: '', targetDocumentTitle: '' }, 120);
        } else {
          linkedDocIds.forEach((documentId: string, linkIdx: number) => {
            addElement(item, 'doc-link-card', { title, targetDocumentId: documentId }, 120, `-${linkIdx}`);
          });
        }
        break;
      }
      default:
        addElement(item, 'narrative-card', {
          title, narrativeText: item.narrativeText || item.memoContent || (typeof item.content === 'string' ? item.content : ''),
        });
    }
  });

  if (items.length === 0 && !coverImageUrl && !oldData.worldName && !oldData.oneLineIntro) return DEFAULT_WORLD_CANVAS;
  return {
    canvasWidth: Math.max(1120, 436 + 648 + 36),
    canvasHeight: Math.max(700, currentY + 60),
    zoom: 100,
    backgroundColor: '#FFFFFF',
    elements,
  };
}

