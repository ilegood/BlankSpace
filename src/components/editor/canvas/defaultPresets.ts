import { CanvasDocumentData, CanvasElement, CustomCharacterTemplate } from '../../../types/canvas';

// 1. 기본 템플릿: 클래식 RPG 영웅 시트 (의미 있는 단위 컴포넌트 구성)
export const DEFAULT_CHARACTER_CANVAS: CanvasDocumentData = {
  canvasWidth: 920,
  canvasHeight: 860,
  zoom: 100,
  backgroundColor: '#FFFFFF',
  elements: [
    // 1. 캐릭터 이미지 (프레임)
    {
      id: 'el-char-img',
      type: 'character-image',
      x: 36,
      y: 36,
      width: 290,
      height: 440,
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
        imageUrl:
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
        alt: '캐릭터 일러스트',
      },
    },

    // 2. 이름 요소 (복수 필드 지원)
    {
      id: 'el-char-name',
      type: 'name-badge',
      x: 346,
      y: 36,
      width: 538,
      height: 80,
      zIndex: 2,
      style: {
        backgroundColor: '#FAFBFD',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        nameFields: [
          {
            id: 'nf-1',
            label: '이름',
            value: '아르젠 (Arjen)',
            fontSize: 24,
            fontWeight: 'bold',
            color: '#1E293B',
            isPrimary: true,
          },
          {
            id: 'nf-2',
            label: '칭호',
            value: '새벽의 검사',
            fontSize: 13,
            fontWeight: '600',
            color: '#7C3AED',
          },
          {
            id: 'nf-3',
            label: '코드명',
            value: 'NOVA-07',
            fontSize: 12,
            fontWeight: '500',
            color: '#64748B',
          },
        ],
      },
    },

    // 3. 대표 대사 카드
    {
      id: 'el-char-quote',
      type: 'quote-card',
      x: 346,
      y: 128,
      width: 538,
      height: 64,
      zIndex: 2,
      style: {
        backgroundColor: '#FBFBFF',
        borderColor: '#EDE9FE',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
      },
      content: {
        title: '대표 대사',
        quoteText: '언젠가, 이 선택이 옳았다고 믿고 싶어.',
        quoteSituation: '과거의 결정을 회상하며',
      },
    },

    // 4. 공통 정보 카드 (Key-Value 통합)
    {
      id: 'el-char-info',
      type: 'info-card',
      x: 346,
      y: 204,
      width: 290,
      height: 272,
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
        title: '기본 정보',
        infoDisplayMode: 'grid-2col',
        infoCardItems: [
          { id: 'inf-1', label: '소속', value: '노바 기사단' },
          { id: 'inf-2', label: '나이', value: '19세' },
          { id: 'inf-3', label: '신장', value: '168cm' },
          { id: 'inf-4', label: '체중', value: '54kg' },
          { id: 'inf-5', label: '생일', value: '10월 14일' },
          { id: 'inf-6', label: '출신', value: '에테리아 대륙' },
          { id: 'inf-7', label: '주무기', value: '에테르 블레이드' },
          { id: 'inf-8', label: '역할', value: '돌격 전위대' },
        ],
      },
    },

    // 5. 능력치 레이더 차트 (5축)
    {
      id: 'el-char-radar',
      type: 'radar-chart',
      x: 648,
      y: 204,
      width: 236,
      height: 272,
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
        title: '전투 능력치',
        radarMaxValue: 100,
        radarColor: '#8B5CF6',
        radarFillOpacity: 0.35,
        radarAxes: [
          { id: 'ra-1', label: '공격력', value: 78 },
          { id: 'ra-2', label: '민첩성', value: 92 },
          { id: 'ra-3', label: '지능', value: 85 },
          { id: 'ra-4', label: '체력', value: 70 },
          { id: 'ra-5', label: '마력', value: 96 },
        ],
      },
    },

    // 6. 카테고리 및 키워드 카드
    {
      id: 'el-char-keywords',
      type: 'keyword-card',
      x: 36,
      y: 488,
      width: 290,
      height: 196,
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
        title: '성격 및 키워드',
        tagDisplayMode: 'chips',
        tags: [
          { id: 'tag-1', text: '원칙주의자' },
          { id: 'tag-2', text: '검술의 천재' },
          { id: 'tag-3', text: '과묵함' },
          { id: 'tag-4', text: '책임감' },
          { id: 'tag-5', text: '과거의 상처' },
          { id: 'tag-6', text: '단호한 결단력' },
          { id: 'tag-7', text: '동료애' },
        ],
      },
    },

    // 7. 서술형 상세 정보 카드 (성격, 배경 스토리)
    {
      id: 'el-char-narrative',
      type: 'narrative-card',
      x: 346,
      y: 488,
      width: 538,
      height: 196,
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
        title: '배경 스토리 및 특징',
        narrativeText:
          '노바 기사단 소속의 신입 기사. 뛰어난 재능으로 주목받고 있지만, 과거의 사건으로 인해 쉽사리 타인에게 마음을 열지 않는다.\n\n검술과 원소 마법의 융합에 능하며 고대 유적 탐사 임무를 맡고 있다. 겉으로는 냉철해 보이지만 맡은 임무와 동료에 대한 헌신은 누구보다 강하다.',
      },
    },

    // 8. 컬러 팔레트 카드
    {
      id: 'el-char-palette',
      type: 'palette-card',
      x: 36,
      y: 700,
      width: 848,
      height: 120,
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
        title: '캐릭터 컬러 팔레트',
        showPaletteHex: true,
        paletteColors: [
          { id: 'cp-1', color: '#6D28D9', label: '눈동자' },
          { id: 'cp-2', color: '#A855F7', label: '망토' },
          { id: 'cp-3', color: '#267B54', label: '의상(메인)' },
          { id: 'cp-4', color: '#6EE7B7', label: '포인트' },
          { id: 'cp-5', color: '#F7F6F2', label: '안감/장비' },
        ],
      },
    },
  ],
};

// 2. 모던 프로필 프리셋 (관계 요약 & 메모 카드 포함)
export const MODERN_PROFILE_CANVAS: CanvasDocumentData = {
  canvasWidth: 960,
  canvasHeight: 740,
  zoom: 100,
  backgroundColor: '#FFFFFF',
  elements: [
    {
      id: 'mod-img',
      type: 'character-image',
      x: 40,
      y: 40,
      width: 260,
      height: 320,
      zIndex: 2,
      style: {
        borderRadius: 24,
        borderColor: '#E2E8F0',
        borderWidth: 1,
        objectFit: 'cover',
      },
      content: {
        imageUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop',
        alt: '프로필 사진',
      },
    },
    {
      id: 'mod-name',
      type: 'name-badge',
      x: 320,
      y: 40,
      width: 600,
      height: 76,
      zIndex: 2,
      style: {
        backgroundColor: '#FAFBFD',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
      },
      content: {
        nameFields: [
          { id: 'f-1', label: '이름', value: '카일 (Kyle)', fontSize: 22, fontWeight: 'bold', color: '#0F172A', isPrimary: true },
          { id: 'f-2', label: '소속/직책', value: '비공정 연합 수석 항해사', fontSize: 13, fontWeight: '500', color: '#6366F1' },
        ],
      },
    },
    {
      id: 'mod-quote',
      type: 'quote-card',
      x: 320,
      y: 126,
      width: 600,
      height: 60,
      zIndex: 2,
      style: {
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
      },
      content: {
        title: '좌우명',
        quoteText: '바람이 불지 않는다면 노를 저으면 그만이지.',
      },
    },
    {
      id: 'mod-info',
      type: 'info-card',
      x: 320,
      y: 196,
      width: 290,
      height: 250,
      zIndex: 2,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
      },
      content: {
        title: '신상 명세',
        infoDisplayMode: 'table',
        infoCardItems: [
          { id: 'i-1', label: '성별', value: '남성' },
          { id: 'i-2', label: '연령', value: '23세' },
          { id: 'i-3', label: '혈액형', value: 'O형' },
          { id: 'i-4', label: '특기', value: '기상 예측, 활강' },
        ],
      },
    },
    {
      id: 'mod-relation',
      type: 'relationship-card',
      x: 620,
      y: 196,
      width: 300,
      height: 250,
      zIndex: 2,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
      },
      content: {
        title: '주요 인물 관계',
        relationships: [
          { id: 'rel-1', name: '아르젠', relation: '오랜 친구', description: '생사를 함께 넘나든 든든한 전우' },
          { id: 'rel-2', name: '선장 엘릭', relation: '상관 / 은인', description: '방황하던 자신을 거두어 준 스승' },
        ],
      },
    },
    {
      id: 'mod-memo',
      type: 'memo-card',
      x: 40,
      y: 380,
      width: 260,
      height: 320,
      zIndex: 2,
      style: {
        backgroundColor: '#FEFCE8',
        borderColor: '#FEF08A',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '메모 (비고)',
        memoContent: '• 고소공포증이 전혀 없음\n• 매운 음식을 극도로 꺼림\n• 동생에게 보낼 선물을 항상 품에 지니고 다님',
      },
    },
    {
      id: 'mod-narrative',
      type: 'narrative-card',
      x: 320,
      y: 460,
      width: 600,
      height: 240,
      zIndex: 2,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
      },
      content: {
        title: '성격 및 특이사항',
        narrativeText:
          '항상 여유롭고 능청스러운 태도를 유지하지만, 위기 상황에서는 번개같은 직관으로 올바른 판단을 내린다. 하늘을 날 때 가장 자유로움을 느낀다.',
      },
    },
  ],
};

// 3. 미니멀 비주얼 프리셋 (카드 형태 레이아웃)
export const MINIMAL_VISUAL_CANVAS: CanvasDocumentData = {
  canvasWidth: 840,
  canvasHeight: 600,
  zoom: 100,
  backgroundColor: '#FFFFFF',
  elements: [
    {
      id: 'min-img',
      type: 'character-image',
      x: 40,
      y: 40,
      width: 340,
      height: 520,
      zIndex: 2,
      style: {
        borderRadius: 12,
        borderColor: '#E2E8F0',
        borderWidth: 1,
        objectFit: 'cover',
      },
      content: {
        imageUrl:
          'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=600&auto=format&fit=crop',
        alt: '캐릭터 포스터',
      },
    },
    {
      id: 'min-name',
      type: 'name-badge',
      x: 410,
      y: 40,
      width: 390,
      height: 80,
      zIndex: 2,
      style: {
        backgroundColor: '#FAFBFD',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
      },
      content: {
        nameFields: [
          { id: 'f-1', label: '캐릭터', value: '루나 (Luna)', fontSize: 24, fontWeight: 'bold', color: '#1E1B4B', isPrimary: true },
          { id: 'f-2', label: '직업', value: '별빛 아스트롤로저', fontSize: 13, color: '#6366F1' },
        ],
      },
    },
    {
      id: 'min-quote',
      type: 'quote-card',
      x: 410,
      y: 132,
      width: 390,
      height: 60,
      zIndex: 2,
      style: {
        backgroundColor: '#EEF2FF',
        borderColor: '#E0E7FF',
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
      },
      content: {
        title: '대표 대사',
        quoteText: '별들이 가리키는 길에는 거짓이 없어요.',
      },
    },
    {
      id: 'min-info',
      type: 'info-card',
      x: 410,
      y: 204,
      width: 390,
      height: 180,
      zIndex: 2,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
      },
      content: {
        title: '상세 정보',
        infoDisplayMode: 'grid-2col',
        infoCardItems: [
          { id: 'm-1', label: '종족', value: '하프 엘프' },
          { id: 'm-2', label: '속성', value: '성휘(星輝)' },
          { id: 'm-3', label: '별자리', value: '은빛 올빼미자리' },
          { id: 'm-4', label: '소지품', value: '천구의 고리' },
        ],
      },
    },
    {
      id: 'min-keywords',
      type: 'keyword-card',
      x: 410,
      y: 396,
      width: 390,
      height: 164,
      zIndex: 2,
      style: {
        backgroundColor: '#FFFFFF',
        borderColor: '#ECEEF3',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
      },
      content: {
        title: '핵심 키워드',
        tagDisplayMode: 'chips',
        tags: [
          { id: 't-1', text: '신비주의' },
          { id: 't-2', text: '천문학' },
          { id: 't-3', text: '지혜' },
          { id: 't-4', text: '온화함' },
        ],
      },
    },
  ],
};

// 기본 내장 프리셋 목록
export const BUILTIN_TEMPLATES: { id: string; name: string; description: string; canvasData: CanvasDocumentData }[] = [
  {
    id: 'preset-classic-rpg',
    name: '클래식 RPG 영웅 시트',
    description: '대형 일러스트, 5축 레이더 차트, 기본 정보 및 배경 스토리를 갖춘 표준 캐릭터 시트',
    canvasData: DEFAULT_CHARACTER_CANVAS,
  },
  {
    id: 'preset-modern-profile',
    name: '모던 프로필 시트',
    description: '인물 관계도, 테이블형 정보, 포스트잇 메모를 포함한 현대적이고 세련된 프로필 레이아웃',
    canvasData: MODERN_PROFILE_CANVAS,
  },
  {
    id: 'preset-minimal-visual',
    name: '미니멀 캐릭터 카드',
    description: '포스터형 비주얼과 컴팩트한 키워드 중심의 심플한 캐릭터 카드',
    canvasData: MINIMAL_VISUAL_CANVAS,
  },
];

// 이전 버전 데이터 호환 및 업그레이드 변환기
export const convertOldDataToCanvas = (raw: any): CanvasDocumentData => {
  if (raw && Array.isArray(raw.elements)) {
    // 이미 elements 배열이 있는 경우: 기존 elements 중 구형 타입을 신규 의미 있는 타입으로 승격/유지
    const convertedElements = raw.elements.map((el: CanvasElement) => {
      // 1. image -> character-image 변환
      if (el.type === 'image') {
        return {
          ...el,
          type: 'character-image',
          content: {
            ...el.content,
            imageUrl: el.content.imageUrl || '',
            alt: el.content.alt || '캐릭터 일러스트',
          },
        };
      }
      // 2. heading -> name-badge 변환 (이름 요소)
      if (el.type === 'heading') {
        const text = el.content.text || '캐릭터 이름';
        return {
          ...el,
          type: 'name-badge',
          content: {
            nameFields: [
              {
                id: `nf-${el.id}`,
                label: '이름',
                value: text,
                fontSize: el.style?.fontSize || 24,
                fontWeight: el.style?.fontWeight || 'bold',
                color: el.style?.color || '#1E293B',
                isPrimary: true,
              },
            ],
          },
        };
      }
      // 3. info-field -> info-card 변환 (공통 정보 카드)
      if (el.type === 'info-field') {
        return {
          ...el,
          type: 'info-card',
          content: {
            title: el.content.title || '기본 정보',
            infoDisplayMode: el.content.infoDisplayMode || 'grid-2col',
            infoCardItems:
              el.content.infoCardItems ||
              (el.content.infoItems ? el.content.infoItems.map((it) => ({ id: it.id, label: it.label, value: it.value })) : []),
          },
        };
      }
      // 4. status-chart -> radar-chart 변환
      if (el.type === 'status-chart') {
        const stats = el.content.stats || [];
        const radarAxes = stats.map((st, idx) => ({
          id: `ra-${idx}`,
          label: st.label,
          value: st.numValue || (st.value === 'S' ? 95 : st.value === 'A' ? 85 : st.value === 'B' ? 70 : 50),
        }));
        return {
          ...el,
          type: 'radar-chart',
          content: {
            title: '능력치 레이더 차트',
            radarMaxValue: 100,
            radarColor: '#8B5CF6',
            radarFillOpacity: 0.35,
            radarAxes: radarAxes.length >= 3 ? radarAxes : [
              { id: '1', label: '힘', value: 75 },
              { id: '2', label: '민첩', value: 85 },
              { id: '3', label: '지능', value: 80 },
              { id: '4', label: '체력', value: 70 },
              { id: '5', label: '마력', value: 90 },
            ],
          },
        };
      }
      return el;
    });

    return {
      canvasWidth: raw.canvasWidth || 920,
      canvasHeight: raw.canvasHeight || 720,
      zoom: raw.zoom || 100,
      backgroundColor: raw.backgroundColor || '#FFFFFF',
      gradient: raw.gradient,
      pattern: raw.pattern,
      elements: convertedElements,
    };
  }

  // 완전 이전 버전 원시 데이터 객체인 경우
  return DEFAULT_CHARACTER_CANVAS;
};
