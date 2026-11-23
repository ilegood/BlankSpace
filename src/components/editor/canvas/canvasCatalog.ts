import { CanvasCardItem, CanvasCardType, DesignPresetItem } from '../../../types';
import { generateId } from '../../../utils/id';

export interface CatalogComponentDef {
  type: CanvasCardType;
  label: string;
  group: 'common' | 'character' | 'world' | 'planning' | 'modeling' | 'animation';
  defaultW: number;
  defaultH: number;
  defaultData: Record<string, any>;
}

export const COMMON_CATALOG: CatalogComponentDef[] = [
  {
    type: 'image-card',
    label: '이미지 카드',
    group: 'common',
    defaultW: 260,
    defaultH: 200,
    defaultData: { imageUrl: '', caption: '캡션' },
  },
  {
    type: 'gallery-card',
    label: '이미지 갤러리',
    group: 'common',
    defaultW: 280,
    defaultH: 210,
    defaultData: { images: [{ id: 'g1', url: '' }, { id: 'g2', url: '' }, { id: 'g3', url: '' }] },
  },
  {
    type: 'narrative-card',
    label: '서술 카드',
    group: 'common',
    defaultW: 320,
    defaultH: 180,
    defaultData: { subtitle: '소제목', text: '서술 내용을 입력하세요.' },
  },
  {
    type: 'section-heading',
    label: '섹션 제목',
    group: 'common',
    defaultW: 560,
    defaultH: 76,
    defaultData: { heading: '제목', subheading: '소제목' },
  },
  {
    type: 'detail-card',
    label: '세부사항 카드',
    group: 'common',
    defaultW: 280,
    defaultH: 170,
    defaultData: {
      items: [
        { id: 'd1', label: '항목 1', value: '값' },
        { id: 'd2', label: '항목 2', value: '값' },
        { id: 'd3', label: '항목 3', value: '값' },
      ],
    },
  },
  {
    type: 'tag-card',
    label: '태그 카드',
    group: 'common',
    defaultW: 250,
    defaultH: 110,
    defaultData: { tags: ['태그 1', '태그 2', '태그 3'] },
  },
  {
    type: 'checklist-card',
    label: '체크리스트 카드',
    group: 'common',
    defaultW: 280,
    defaultH: 165,
    defaultData: {
      items: [
        { id: 'c1', text: '항목 1', done: true },
        { id: 'c2', text: '항목 2', done: false },
        { id: 'c3', text: '항목 3', done: false },
      ],
    },
  },
  {
    type: 'file-card',
    label: '파일 첨부 카드',
    group: 'common',
    defaultW: 280,
    defaultH: 155,
    defaultData: {
      files: [
        { id: 'f1', name: '파일명 1', size: '크기' },
        { id: 'f2', name: '파일명 2', size: '크기' },
      ],
    },
  },
  {
    type: 'external-link-card',
    label: '외부 링크 카드',
    group: 'common',
    defaultW: 270,
    defaultH: 120,
    defaultData: { url: 'https://example.com', title: '링크 제목', domain: '도메인' },
  },
  {
    type: 'table-card',
    label: '표 카드',
    group: 'common',
    defaultW: 340,
    defaultH: 175,
    defaultData: {
      headers: ['열 1', '열 2', '열 3'],
      rows: [
        ['값', '값', '값'],
        ['값', '값', '값'],
      ],
    },
  },
  {
    type: 'quote-card',
    label: '인용 카드',
    group: 'common',
    defaultW: 280,
    defaultH: 145,
    defaultData: { quote: '기억에 남는 대사나 인용문을 입력하세요.', source: '출처' },
  },
  {
    type: 'palette-card',
    label: '컬러 팔레트',
    group: 'common',
    defaultW: 280,
    defaultH: 120,
    defaultData: { colors: ['#6A5ACD', '#9A8FE6', '#D9D5EC', '#F6F5FB', '#1B1B1F'] },
  },
  {
    type: 'video-card',
    label: '동영상 카드',
    group: 'common',
    defaultW: 280,
    defaultH: 175,
    defaultData: { videoUrl: '' },
  },
  {
    type: 'audio-card',
    label: '오디오 카드',
    group: 'common',
    defaultW: 270,
    defaultH: 125,
    defaultData: { fileName: '파일 이름', duration: '0:00', audioUrl: '' },
  },
  {
    type: 'memo-card',
    label: '메모 카드',
    group: 'common',
    defaultW: 260,
    defaultH: 140,
    defaultData: { text: '빠른 메모를 남겨보세요.' },
  },
  {
    type: 'link-preview-card',
    label: '연결 미리보기 카드',
    group: 'common',
    defaultW: 260,
    defaultH: 175,
    defaultData: { targetDocId: '', targetDocTitle: '연결된 문서 이름', docLabel: '지도' },
  },
];

export const SPECIAL_CATALOG: Record<string, CatalogComponentDef[]> = {
  'character-sheet': [
    {
      type: 'profile-card',
      label: '프로필 카드',
      group: 'character',
      defaultW: 250,
      defaultH: 285,
      defaultData: { name: '캐릭터 이름', nickname: '별명', imageUrl: '', summary: '' },
    },
    {
      type: 'stat-card',
      label: '스탯 카드',
      group: 'character',
      defaultW: 300,
      defaultH: 200,
      defaultData: {
        mode: 'bar',
        stats: [
          { id: 's1', label: '스탯 1', value: 80 },
          { id: 's2', label: '스탯 2', value: 55 },
          { id: 's3', label: '스탯 3', value: 65 },
        ],
      },
    },
    {
      type: 'relationship-card',
      label: '관계 요약 카드',
      group: 'character',
      defaultW: 270,
      defaultH: 160,
      defaultData: {
        items: [
          { id: 'r1', targetDocId: 'doc-char-b', name: 'Character B', relation: '관계 이름' },
          { id: 'r2', targetDocId: '', name: 'Character C', relation: '관계 이름' },
        ],
      },
    },
    {
      type: 'chronicle-card',
      label: '연표 카드',
      group: 'character',
      defaultW: 260,
      defaultH: 190,
      defaultData: {
        events: [
          { id: 'e1', time: '시점 1', title: '사건 이름' },
          { id: 'e2', time: '시점 2', title: '사건 이름' },
          { id: 'e3', time: '시점 3', title: '사건 이름' },
        ],
      },
    },
  ],
  'world-sheet': [
    {
      type: 'hierarchy-card',
      label: '계층 구조 카드',
      group: 'world',
      defaultW: 280,
      defaultH: 205,
      defaultData: {
        items: [
          { id: 'h1', label: '상위 항목', level: 0 },
          { id: 'h2', label: '하위 항목 1', level: 1 },
          { id: 'h3', label: '하위 항목 2', level: 1 },
          { id: 'h4', label: '세부 항목', level: 2 },
        ],
      },
    },
    {
      type: 'category-list-card',
      label: '분류 목록 카드',
      group: 'world',
      defaultW: 280,
      defaultH: 205,
      defaultData: {
        categories: [
          { id: 'cat1', name: '분류 1', items: ['항목 · 설명', '항목 · 설명'] },
          { id: 'cat2', name: '분류 2', items: ['항목 · 설명'] },
        ],
      },
    },
    {
      type: 'zone-card',
      label: '구역 카드',
      group: 'world',
      defaultW: 280,
      defaultH: 145,
      defaultData: {
        zoneTitle: '구역 제목',
        places: [
          { id: 'p1', label: 'A', linkedDocId: 'doc-char-a' },
          { id: 'p2', label: 'B', linkedDocId: 'doc-world-sheet' },
          { id: 'p3', label: 'C', linkedDocId: '' },
        ],
      },
    },
    {
      type: 'chronicle-card',
      label: '연표 카드',
      group: 'world',
      defaultW: 260,
      defaultH: 190,
      defaultData: {
        events: [
          { id: 'e1', time: '시점 1', title: '사건 이름' },
          { id: 'e2', time: '시점 2', title: '사건 이름' },
          { id: 'e3', time: '시점 3', title: '사건 이름' },
        ],
      },
    },
  ],
  'game-design-system': [
    {
      type: 'swot-card',
      label: 'SWOT 카드',
      group: 'planning',
      defaultW: 360,
      defaultH: 215,
      defaultData: { strength: '', weakness: '', opportunity: '', threat: '' },
    },
    {
      type: 'rule-card',
      label: '규칙 카드',
      group: 'planning',
      defaultW: 310,
      defaultH: 175,
      defaultData: { ruleName: '규칙 이름', condition: '조건', result: '결과', exception: '예외' },
    },
    {
      type: 'formula-card',
      label: '공식 카드',
      group: 'planning',
      defaultW: 310,
      defaultH: 215,
      defaultData: {
        formulaText: '결과 = 변수 A × 변수 B',
        varA: 10,
        varARange: '1~100',
        varB: 1.5,
        varBRange: '0.5~3',
        stepValues: [12, 20, 32, 46, 62, 78],
      },
    },
    {
      type: 'difficulty-curve-card',
      label: '난이도 곡선 카드',
      group: 'planning',
      defaultW: 360,
      defaultH: 235,
      defaultData: {
        xAxisLabel: '단계',
        yAxisLabel: '난이도',
        actualSource: 'formula',
        linkedFormulaId: '',
        points: [
          { step: 1, actual: 12, target: 10 },
          { step: 2, actual: 20, target: 22 },
          { step: 3, actual: 32, target: 40 },
          { step: 4, actual: 46, target: 52 },
          { step: 5, actual: 62, target: 66 },
          { step: 6, actual: 78, target: 83 },
        ],
      },
    },
  ],
  'design-modeling-sheet': [
    {
      type: 'turnaround-card',
      label: '턴어라운드 카드',
      group: 'modeling',
      defaultW: 410,
      defaultH: 205,
      defaultData: {
        views: [
          { id: 'v1', label: '앞면', url: '' },
          { id: 'v2', label: '측면', url: '' },
          { id: 'v3', label: '후면', url: '' },
          { id: 'v4', label: '3/4', url: '' },
        ],
      },
    },
    {
      type: 'texture-map-card',
      label: '텍스처 맵 카드',
      group: 'modeling',
      defaultW: 660,
      defaultH: 205,
      defaultData: {
        displayMode: 'row',
        maps: [
          { id: 'm1', name: 'Base Color', resolution: '2048 × 2048', fileName: 'base_color.png', color: '#8C94A6' },
          { id: 'm2', name: 'Normal', resolution: '2048 × 2048', fileName: 'normal.png', color: '#787BFF' },
          { id: 'm3', name: 'Roughness', resolution: '2048 × 2048', fileName: 'roughness.png', color: '#A3A3A3' },
          { id: 'm4', name: 'Metallic', resolution: '2048 × 2048', fileName: 'metallic.png', color: '#ECECEF' },
          { id: 'm5', name: 'AO', resolution: '2048 × 2048', fileName: 'ao.png', color: '#6E6E74' },
          { id: 'm6', name: 'Height', resolution: '2048 × 2048', fileName: 'height.png', color: '#C8C8CE' },
        ],
      },
    },
  ],
  'design-animation-sheet': [
    {
      type: 'animation-card',
      label: '애니메이션 카드',
      group: 'animation',
      defaultW: 215,
      defaultH: 255,
      defaultData: { name: '대기', frames: 24, durationSec: 1.0, loop: true, memo: '' },
    },
    {
      type: 'frame-strip-card',
      label: '프레임 스트립 카드',
      group: 'animation',
      defaultW: 680,
      defaultH: 120,
      defaultData: { frameCount: 7 },
    },
  ],
};

export function createCardFromDef(def: CatalogComponentDef, x = 32, y = 32): CanvasCardItem {
  return {
    id: generateId('card'),
    type: def.type,
    title: def.label,
    x,
    y,
    w: def.defaultW,
    h: def.defaultH,
    collapsible: true,
    collapsed: false,
    style: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 13 },
    data: JSON.parse(JSON.stringify(def.defaultData)),
  };
}

export function getInitialCardsForTemplate(templateType: string): CanvasCardItem[] {
  if (templateType === 'character-sheet') {
    return [
      {
        id: 'card-profile',
        type: 'profile-card',
        title: '프로필 카드',
        x: 24,
        y: 24,
        w: 235,
        h: 310,
        collapsible: false,
        data: { name: '캐릭터 이름', nickname: '별명', imageUrl: '' },
      },
      {
        id: 'card-stats',
        type: 'stat-card',
        title: '스탯 카드',
        x: 278,
        y: 24,
        w: 290,
        h: 175,
        collapsible: true,
        data: {
          mode: 'bar',
          stats: [
            { id: 's1', label: '스탯 1', value: 80 },
            { id: 's2', label: '스탯 2', value: 55 },
            { id: 's3', label: '스탯 3', value: 65 },
          ],
        },
      },
      {
        id: 'card-narrative',
        type: 'narrative-card',
        title: '서술 카드',
        x: 278,
        y: 215,
        w: 290,
        h: 155,
        collapsible: true,
        data: { subtitle: '', text: '캐릭터의 배경 스토리와 성격 특징을 서술하세요.' },
      },
      {
        id: 'card-tags',
        type: 'tag-card',
        title: '태그 카드',
        x: 586,
        y: 24,
        w: 245,
        h: 105,
        collapsible: false,
        data: { tags: ['태그 1', '태그 2'] },
      },
      {
        id: 'card-rel',
        type: 'relationship-card',
        title: '관계 요약 카드',
        x: 586,
        y: 145,
        w: 245,
        h: 165,
        collapsible: false,
        data: {
          items: [
            { id: 'r1', targetDocId: 'doc-char-b', name: 'Character B', relation: '관계 이름' },
            { id: 'r2', targetDocId: '', name: 'Character C', relation: '관계 이름' },
          ],
        },
      },
    ];
  }

  if (templateType === 'world-sheet') {
    return [
      {
        id: 'w-img',
        type: 'image-card',
        title: '이미지 카드',
        x: 24,
        y: 24,
        w: 265,
        h: 195,
        data: { imageUrl: '', caption: '' },
      },
      {
        id: 'w-nar',
        type: 'narrative-card',
        title: '서술 카드',
        x: 306,
        y: 24,
        w: 290,
        h: 195,
        data: { subtitle: '', text: '세계관의 핵심 배경과 물리/마법 법칙을 설명합니다.' },
      },
      {
        id: 'w-tag',
        type: 'tag-card',
        title: '태그 카드',
        x: 614,
        y: 24,
        w: 225,
        h: 100,
        data: { tags: ['태그 1', '태그 2'] },
      },
      {
        id: 'w-link',
        type: 'link-preview-card',
        title: '연결 미리보기 카드',
        x: 614,
        y: 140,
        w: 225,
        h: 165,
        data: { targetDocId: '', targetDocTitle: '지도 문서 열기', docLabel: '지도' },
      },
      {
        id: 'w-hier',
        type: 'hierarchy-card',
        title: '계층 구조 카드',
        x: 24,
        y: 236,
        w: 265,
        h: 205,
        data: {
          items: [
            { id: 'h1', label: '상위 항목', level: 0 },
            { id: 'h2', label: '하위 항목 1', level: 1 },
            { id: 'h3', label: '하위 항목 2', level: 1 },
            { id: 'h4', label: '세부 항목', level: 2 },
          ],
        },
      },
      {
        id: 'w-zone',
        type: 'zone-card',
        title: '구역 카드',
        x: 306,
        y: 236,
        w: 290,
        h: 120,
        data: {
          zoneTitle: '구역',
          places: [
            { id: 'p1', label: 'A', linkedDocId: 'doc-char-a' },
            { id: 'p2', label: 'B', linkedDocId: 'doc-world-sheet' },
            { id: 'p3', label: 'C', linkedDocId: '' },
          ],
        },
      },
      {
        id: 'w-cat',
        type: 'category-list-card',
        title: '분류 목록 카드',
        x: 306,
        y: 372,
        w: 290,
        h: 165,
        data: {
          categories: [
            { id: 'cat1', name: '분류 1', items: ['항목 · 설명', '항목 · 설명'] },
          ],
        },
      },
    ];
  }

  if (templateType === 'game-design-system') {
    return [
      {
        id: 'g-sec',
        type: 'section-heading',
        title: '섹션 제목',
        x: 24,
        y: 20,
        w: 800,
        h: 68,
        data: { heading: '시스템 개요', subheading: '' },
      },
      {
        id: 'g-swot',
        type: 'swot-card',
        title: 'SWOT 카드',
        x: 24,
        y: 102,
        w: 390,
        h: 210,
        data: { strength: '핵심 강점', weakness: '보완점', opportunity: '차별화 기회', threat: '위험 요소' },
      },
      {
        id: 'g-rule',
        type: 'rule-card',
        title: '규칙 카드',
        x: 432,
        y: 102,
        w: 390,
        h: 170,
        data: { ruleName: '규칙 이름', condition: '조건', result: '결과', exception: '예외' },
      },
      {
        id: 'g-formula',
        type: 'formula-card',
        title: '공식 카드',
        x: 432,
        y: 286,
        w: 390,
        h: 200,
        data: {
          formulaText: '결과 = 변수 A × 변수 B',
          varA: 10,
          varARange: '1~100',
          varB: 1.5,
          varBRange: '0.5~3',
          stepValues: [12, 20, 32, 46, 62, 78],
        },
      },
      {
        id: 'g-curve',
        type: 'difficulty-curve-card',
        title: '난이도 곡선 카드',
        x: 24,
        y: 326,
        w: 390,
        h: 225,
        data: {
          xAxisLabel: '단계',
          yAxisLabel: '난이도',
          actualSource: 'formula',
          linkedFormulaId: 'g-formula',
          points: [
            { step: 1, actual: 12, target: 10 },
            { step: 2, actual: 20, target: 22 },
            { step: 3, actual: 32, target: 40 },
            { step: 4, actual: 46, target: 52 },
            { step: 5, actual: 62, target: 66 },
          ],
        },
      },
    ];
  }

  if (templateType === 'design-modeling-sheet') {
    return [
      {
        id: 'm-sec',
        type: 'section-heading',
        title: '섹션 제목',
        x: 24,
        y: 20,
        w: 790,
        h: 66,
        data: { heading: '모델 이름', subheading: '' },
      },
      {
        id: 'm-turn',
        type: 'turnaround-card',
        title: '턴어라운드 카드',
        x: 24,
        y: 100,
        w: 470,
        h: 195,
        data: {
          views: [
            { id: 'v1', label: '앞면', url: '' },
            { id: 'v2', label: '측면', url: '' },
            { id: 'v3', label: '후면', url: '' },
            { id: 'v4', label: '3/4', url: '' },
          ],
        },
      },
      {
        id: 'm-detail',
        type: 'detail-card',
        title: '세부사항 카드',
        x: 512,
        y: 100,
        w: 300,
        h: 112,
        data: {
          items: [
            { id: 'd1', label: '폴리곤 수', value: '값' },
            { id: 'd2', label: '소프트웨어', value: '값' },
          ],
        },
      },
      {
        id: 'm-pal',
        type: 'palette-card',
        title: '컬러 팔레트',
        x: 512,
        y: 220,
        w: 300,
        h: 104,
        data: { colors: ['#6A5ACD', '#9A8FE6', '#D9D5EC', '#1B1B1F'] },
      },
      {
        id: 'm-tex',
        type: 'texture-map-card',
        title: '텍스처 맵 카드',
        x: 24,
        y: 318,
        w: 788,
        h: 195,
        data: {
          displayMode: 'row',
          maps: [
            { id: 'm1', name: 'Base Color', resolution: '2048 × 2048', fileName: 'base_color.png', color: '#8C94A6' },
            { id: 'm2', name: 'Normal', resolution: '2048 × 2048', fileName: 'normal.png', color: '#787BFF' },
            { id: 'm3', name: 'Roughness', resolution: '2048 × 2048', fileName: 'roughness.png', color: '#A3A3A3' },
            { id: 'm4', name: 'Metallic', resolution: '2048 × 2048', fileName: 'metallic.png', color: '#ECECEF' },
            { id: 'm5', name: 'AO', resolution: '2048 × 2048', fileName: 'ao.png', color: '#6E6E74' },
            { id: 'm6', name: 'Height', resolution: '2048 × 2048', fileName: 'height.png', color: '#C8C8CE' },
          ],
        },
      },
      {
        id: 'm-file',
        type: 'file-card',
        title: '파일 첨부 카드',
        x: 24,
        y: 528,
        w: 384,
        h: 120,
        data: {
          files: [
            { id: 'f1', name: 'model.fbx', size: '크기' },
            { id: 'f2', name: 'texture.png', size: '크기' },
          ],
        },
      },
      {
        id: 'm-check',
        type: 'checklist-card',
        title: '체크리스트 카드',
        x: 426,
        y: 528,
        w: 386,
        h: 120,
        data: {
          items: [
            { id: 'c1', text: '블로킹', done: true },
            { id: 'c2', text: '하이폴리', done: false },
            { id: 'c3', text: '리토폴', done: false },
          ],
        },
      },
    ];
  }

  if (templateType === 'design-animation-sheet') {
    return [
      {
        id: 'a-sec',
        type: 'section-heading',
        title: '섹션 제목',
        x: 24,
        y: 20,
        w: 780,
        h: 66,
        data: { heading: '캐릭터 이름 · 애니메이션', subheading: '' },
      },
      {
        id: 'a-1',
        type: 'animation-card',
        title: '애니메이션 카드',
        x: 24,
        y: 100,
        w: 248,
        h: 245,
        data: { name: '대기', frames: 24, durationSec: 1.0, loop: true },
      },
      {
        id: 'a-2',
        type: 'animation-card',
        title: '애니메이션 카드',
        x: 290,
        y: 100,
        w: 248,
        h: 245,
        data: { name: '이동', frames: 16, durationSec: 0.7, loop: true },
      },
      {
        id: 'a-3',
        type: 'animation-card',
        title: '애니메이션 카드',
        x: 556,
        y: 100,
        w: 248,
        h: 245,
        data: { name: '공격', frames: 18, durationSec: 0.6, loop: false },
      },
      {
        id: 'a-strip',
        type: 'frame-strip-card',
        title: '프레임 스트립 카드',
        x: 24,
        y: 362,
        w: 780,
        h: 115,
        data: { frameCount: 7 },
      },
      {
        id: 'a-check',
        type: 'checklist-card',
        title: '체크리스트 카드',
        x: 24,
        y: 492,
        w: 780,
        h: 120,
        data: {
          items: [
            { id: 'c1', text: '대기 완료', done: true },
            { id: 'c2', text: '이동', done: false },
            { id: 'c3', text: '공격', done: false },
          ],
        },
      },
    ];
  }

  return [];
}

export const BUILTIN_DESIGN_PRESETS: Record<string, DesignPresetItem[]> = {
  'character-sheet': [
    {
      id: 'default',
      templateType: 'character-sheet',
      name: '기본',
      description: '프로필 왼쪽, 서술 아래',
      isBuiltin: true,
      swatches: ['#FFFFFF', '#6A5ACD', '#EBE8F5'],
      fontLabel: '글꼴: 기본 산세리프',
      fontFamily: 'sans',
    },
    {
      id: 'profile-focus',
      templateType: 'character-sheet',
      name: '프로필 중심형',
      description: '프로필을 크게, 스탯·태그를 나란히',
      isBuiltin: true,
      swatches: ['#FFFFFF', '#5A49B8', '#ECE9FA'],
      fontLabel: '글꼴: 기본 산세리프',
      fontFamily: 'sans',
    },
    {
      id: 'narrative-focus',
      templateType: 'character-sheet',
      name: '서술 중심형',
      description: '긴 설정 글에 가장 넓은 자리',
      isBuiltin: true,
      swatches: ['#FAF9FE', '#3B365E', '#D9D5EC'],
      fontLabel: '글꼴: 세리프 계열',
      fontFamily: 'serif',
    },
  ],
  'world-sheet': [
    {
      id: 'default',
      templateType: 'world-sheet',
      name: '기본',
      description: '배너 이미지를 위에, 계층·구역은 아래에',
      isBuiltin: true,
      swatches: ['#FFFFFF', '#6A5ACD', '#EBE8F5'],
      fontLabel: '글꼴: 기본 산세리프',
      fontFamily: 'sans',
    },
    {
      id: 'map-focus',
      templateType: 'world-sheet',
      name: '지도 중심형',
      description: '지도를 크게 보여 주고 구역을 바로 아래에',
      isBuiltin: true,
      swatches: ['#FFFFFF', '#1F4B6E', '#DDEAE4'],
      fontLabel: '글꼴: 기본 산세리프',
      fontFamily: 'sans',
    },
    {
      id: 'lorebook',
      templateType: 'world-sheet',
      name: '설정집형',
      description: '작은 이미지와 정보 요약, 서술을 가장 넓게',
      isBuiltin: true,
      swatches: ['#FCF9F2', '#7B4F2C', '#E8DAC8'],
      fontLabel: '글꼴: 세리프 계열',
      fontFamily: 'serif',
    },
  ],
  'game-design-system': [
    {
      id: 'default',
      templateType: 'game-design-system',
      name: '기본',
      description: '제목과 서술 뒤에 규칙과 공식을 나란히',
      isBuiltin: true,
      swatches: ['#FFFFFF', '#6A5ACD', '#EBE8F5'],
      fontLabel: '글꼴: 기본 산세리프',
      fontFamily: 'sans',
    },
    {
      id: 'overview-first',
      templateType: 'game-design-system',
      name: '개요 우선형',
      description: 'SWOT과 일정으로 전체 그림을 먼저',
      isBuiltin: true,
      swatches: ['#FFFFFF', '#26583E', '#DFF0E7'],
      fontLabel: '글꼴: 기본 산세리프',
      fontFamily: 'sans',
    },
    {
      id: 'numeric-focus',
      templateType: 'game-design-system',
      name: '수치 중심형',
      description: '공식과 곡선, 표를 크게 놓은 밸런스 문서용',
      isBuiltin: true,
      swatches: ['#FFFFFF', '#1B1B1F', '#E6E3F0'],
      fontLabel: '글꼴: 숫자가 보기 좋은 고정폭 느낌',
      fontFamily: 'mono',
    },
  ],
};
